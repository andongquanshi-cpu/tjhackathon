from fastapi.testclient import TestClient

import src.api.main as api_main
from src.api.main import app, get_app_settings
from src.config import Settings
from src.retrieval.hybrid import RetrievalHit


class FakeChain:
    def query(self, question: str, school=None, author=None, top_n=None, rerank=True):
        return [
            RetrievalHit(
                text="近端目标和可见的掌握经验能逐步增强自我效能。",
                score=0.92,
                metadata={
                    "author": "Albert Bandura",
                    "school": "自我效能",
                    "source_document": "bandura_mastery_proximal.md",
                },
                source="rerank",
            )
        ]


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
            "user_text": "我总觉得自己写不出来",
            "note_content": "论文开头已经拖了三天。",
            "safety_level": "S2",
            "history": [{"role": "user", "content": "一打开文档就想逃"}],
            "intents": ["开始任务"],
            "topics": ["拖延"],
        },
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    body = response.json()
    assert body["agent_id"] == "C"
    assert body["degraded"] is True
    assert body["safety_level"] == "S2"
    assert body["sources"][0]["source"] == "bandura_mastery_proximal.md"
    assert "微步骤" in body["skills"]
    assert 120 <= len(body["response"]) <= 220


def test_tired_input_returns_pause_without_retrieval(monkeypatch) -> None:
    monkeypatch.setattr(api_main, "get_chain", lambda: (_ for _ in ()).throw(AssertionError("must not retrieve")))
    response = TestClient(app).post("/respond", json={"user_text": "我累了", "needs_pause": True})
    assert response.json()["skills"] == ["fatigue-pause-detection"]
    assert response.json()["sources"] == []
