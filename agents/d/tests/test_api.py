from fastapi.testclient import TestClient

from src.api.main import app


def test_health_reports_knowledge_disabled() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["knowledge"] == "disabled"


def test_knowledge_endpoints_are_not_exposed() -> None:
    client = TestClient(app)

    assert client.post("/query", json={"query": "test"}).status_code == 404
    assert client.post("/ingest", json={}).status_code == 404


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


def test_tired_input_returns_pause_only() -> None:
    client = TestClient(app)
    response = client.post("/respond", json={"user_text": "我累了，不想说了", "needs_pause": True})
    body = response.json()
    assert body["skills"] == ["fatigue-pause-detection"]
    assert "不继续分析" in body["response"]
    assert "练习" in body["response"]
