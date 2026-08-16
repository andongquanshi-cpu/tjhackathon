from fastapi.testclient import TestClient

import src.api.main as api_main
from src.api.main import app, get_app_settings, get_chain, get_store
from src.config import Settings
from src.retrieval.hybrid import RetrievalHit


class FakeStore:
    collection = "psychoanalysis"

    def count(self) -> int:
        return 2


class FakeChain:
    def query(self, question: str, school=None, author=None, top_n=None, rerank=True):
        return [
            RetrievalHit(
                text="无意识通过梦与口误返回。",
                score=0.91,
                metadata={
                    "author": "Sigmund Freud",
                    "school": school or "Freud",
                    "source_document": "freud_unconscious.md",
                    "concepts": ["unconscious"],
                },
                source="rerank",
            )
        ]


def test_health_endpoint_reports_qdrant_and_collection() -> None:
    app.dependency_overrides[get_store] = lambda: FakeStore()
    app.dependency_overrides[get_app_settings] = lambda: Settings()
    client = TestClient(app)

    response = client.get("/health")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["collection"] == "psychoanalysis"
    assert body["points"] == 2


def test_query_endpoint_returns_agent_friendly_payload() -> None:
    app.dependency_overrides[get_chain] = lambda: FakeChain()
    client = TestClient(app)

    response = client.post(
        "/query",
        json={"query": "什么是无意识？", "school": "Freud", "rerank": True},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "什么是无意识？"
    assert body["results"][0]["metadata"]["school"] == "Freud"
    assert body["results"][0]["source"] == "rerank"


def test_respond_s3_is_deterministic_and_skips_persona(monkeypatch) -> None:
    monkeypatch.setattr(
        api_main,
        "get_chain",
        lambda: (_ for _ in ()).throw(AssertionError("S3 must not retrieve")),
    )
    client = TestClient(app)

    first = client.post(
        "/respond",
        json={"user_text": "我现在可能会伤害自己", "safety_level": "S3"},
    )
    second = client.post(
        "/respond",
        json={"user_text": "另一段高风险输入", "safety_level": "S3"},
    )

    assert first.status_code == 200
    assert first.json()["response"] == second.json()["response"]
    assert first.json()["skills"] == ["安全优先响应"]
    assert first.json()["sources"] == []
    assert first.json()["degraded"] is False


def test_respond_without_key_uses_role_fallback_and_no_network(monkeypatch) -> None:
    monkeypatch.setattr(api_main, "get_chain", lambda: FakeChain())
    app.dependency_overrides[get_app_settings] = lambda: Settings(openai_api_key="")
    client = TestClient(app)

    response = client.post(
        "/respond",
        json={
            "user_text": "又梦到了",
            "note_content": "我站在一扇一直打不开的门前。",
            "safety_level": "S1",
            "history": [{"role": "user", "content": "最近常做同一个梦"}],
            "intents": ["理解梦境"],
            "topics": ["重复"],
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    body = response.json()
    assert body["agent_id"] == "A"
    assert body["degraded"] is True
    assert body["safety_level"] == "S1"
    assert body["sources"][0]["source"] == "freud_unconscious.md"
    assert body["response"].endswith("？")
