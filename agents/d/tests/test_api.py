from fastapi.testclient import TestClient

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
    assert body["collection"] == "skinner_reserved"
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


def _respond_payload(safety_level: str = "S0") -> dict:
    return {
        "user_text": "我总是刷手机拖延，完全开始不了学习",
        "note_content": "手机通常放在桌上。",
        "profile_digest": "希望改善学习启动。",
        "history": [{"role": "user", "content": "每晚都拖到很迟"}],
        "safety_level": safety_level,
        "intents": ["改变拖延"],
        "topics": ["手机", "学习"],
    }


def test_respond_s3_is_deterministic_and_no_rag() -> None:
    client = TestClient(app)

    first = client.post("/respond", json=_respond_payload("S3"))
    second = client.post("/respond", json=_respond_payload("S3"))

    assert first.status_code == 200
    assert first.json() == second.json()
    assert first.json()["agent_id"] == "D"
    assert first.json()["skills"] == ["安全支持"]
    assert first.json()["sources"] == []
    assert first.json()["degraded"] is False


def test_respond_without_key_uses_skinner_offline_template(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    client = TestClient(app)

    response = client.post("/respond", json=_respond_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["agent_id"] == "D"
    assert "ABC行为分析" in body["skills"]
    assert "[重构刺激环境]" in body["response"]
    assert body["sources"] == []
    assert body["degraded"] is True
