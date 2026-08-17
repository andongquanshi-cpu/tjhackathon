"""FastAPI application: health, ingest, and hybrid retrieval for Agents."""

from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI

from src.api.schemas import (
    RespondRequest,
    RespondResponse,
)
from src.config import get_settings
from src.skills.skinner_skill import (
    SkinnerOutput,
    generate_skinner_offline_response,
    generate_skinner_response,
    skinner_llm_configured,
)


SAFETY_RESPONSE = (
    "你现在的安全最重要。请立即远离可能造成伤害的物品或场所，前往有其他人在的地方，"
    "并联系一位可信任的人陪着你。如果存在即时危险，请拨打 120/110 或前往最近急诊；"
    "中国大陆也可拨打 12356。不要只依赖这段回复。"
)
PAUSE_RESPONSE = "我听见你累了。我们先停在这里，不继续分析，也不做任何练习。你不需要回复；等你想回来时，我们再从这里继续。"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = get_settings()
    yield


app = FastAPI(
    title="Agent D · Skinner Behaviorism",
    description="Behavioral response API. /respond is isolated from the legacy RAG.",
    version="0.2.0",
    lifespan=lifespan,
)


def _environment_context(payload: RespondRequest) -> str:
    """Compress bounded note/history context for the behavioral skill."""

    parts: list[str] = [
        f"安全等级：{payload.safety_level}（S1降低任务负担；S2只设计一个安全的小动作，并建议连接现实支持）"
    ]
    if payload.profile_digest:
        parts.append(f"用户摘要：{payload.profile_digest[:1000]}")
    if payload.shared_memory:
        parts.append(f"跨会话用户记忆：{payload.shared_memory[:2000]}")
    if payload.note_content:
        parts.append(f"相关笔记：{payload.note_content[:2000]}")
    if payload.history:
        history = "\n".join(
            f"{item.role}: {item.content[:500]}" for item in payload.history[-8:]
        )
        parts.append(f"近期环境与行为线索：\n{history}")
    if payload.intents:
        parts.append(f"当前意图：{', '.join(payload.intents[:10])}")
    if payload.topics:
        parts.append(f"当前主题：{', '.join(payload.topics[:10])}")
    return "\n\n".join(parts)[:6000]


def _skill_tags(result: SkinnerOutput) -> list[str]:
    tags = ["ABC行为分析", "刺激控制", "强化程序", "可控性评估"]
    if result.helplessness_risk != "low":
        tags.append("反无助塑形")
    return tags


@app.post("/respond", response_model=RespondResponse)
def respond(payload: RespondRequest) -> RespondResponse:
    """Wrap the Skinner skill without entering the legacy retrieval chain."""

    if payload.needs_pause:
        return RespondResponse(agent_id="D", role_name="B.F. 斯金纳·行为塑形教练",
            response=PAUSE_RESPONSE, skills=["fatigue-pause-detection"], sources=[],
            degraded=False, safety_level=payload.safety_level)
    if payload.safety_level == "S3":
        return RespondResponse(
            agent_id="D",
            role_name="B. F. 斯金纳·行为机制工程师",
            response=SAFETY_RESPONSE,
            skills=["安全支持"],
            sources=[],
            degraded=False,
            safety_level="S3",
        )
    context = _environment_context(payload)
    configured = skinner_llm_configured()
    try:
        result = generate_skinner_response(payload.user_text, environment_context=context)
        degraded = not configured
    except (OSError, RuntimeError, ValueError):
        result = generate_skinner_offline_response(
            payload.user_text,
            environment_context=context,
        )
        degraded = True
    return RespondResponse(
        agent_id="D",
        role_name="B. F. 斯金纳·行为机制工程师",
        response=result.agent_response,
        skills=_skill_tags(result),
        sources=[],
        degraded=degraded,
        safety_level=payload.safety_level,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "knowledge": "disabled"}
