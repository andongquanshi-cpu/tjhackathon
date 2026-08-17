"""FastAPI application: health, ingest, and hybrid retrieval for Agents."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException

from src.api.schemas import (
    HealthResponse,
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
    RespondRequest,
    RespondResponse,
    ResponseSource,
    RetrievalItem,
)
from src.config import Settings, get_settings

SAFETY_RESPONSE = (
    "我很在意你现在的安全。请先远离可能伤害自己或他人的物品和地点，立即联系当地急救电话、"
    "危机热线，或请一位可信任的人来到你身边陪伴。如果危险正在发生，请马上拨打当地紧急电话；"
    "你不需要独自承担这一刻。"
)
ROLE_NAME = "班杜拉·自我效能教练"
PAUSE_RESPONSE = "我听见你累了。我们先停在这里，不继续分析，也不做任何练习。你不需要回复；等你想回来时，我们再从这里继续。"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = get_settings()
    yield


app = FastAPI(
    title="Bandura Knowledge Base",
    description="Agent-callable RAG API: hybrid search (dense + BM25) + BGE rerank.",
    version="0.1.0",
    lifespan=lifespan,
)


def get_chain():
    from src.retrieval.chain import RetrievalChain

    if not getattr(app.state, "chain", None):
        app.state.chain = RetrievalChain(get_app_settings())
    return app.state.chain


def get_store():
    from src.vectorstore.qdrant_manager import QdrantStoreManager

    if not getattr(app.state, "store", None):
        app.state.store = QdrantStoreManager(get_app_settings())
    return app.state.store


def get_app_settings() -> Settings:
    return getattr(app.state, "settings", None) or get_settings()


def _retrieval_query(payload: RespondRequest) -> str:
    text = payload.user_text.strip()
    if len(text) < 20 and payload.note_content:
        return f"{text}\n相关笔记：{payload.note_content.strip()[:500]}"
    return text


def _select_skills(payload: RespondRequest) -> list[str]:
    combined = " ".join(
        [payload.user_text, *payload.intents, *payload.topics]
    ).lower()
    skills: list[str] = []
    if any(word in combined for word in ("不行", "做不到", "没信心", "害怕", "焦虑")):
        skills.append("效能重构")
    if any(word in combined for word in ("太差", "意志力", "天生", "总是失败")):
        skills.append("可控归因")
    if any(word in combined for word in ("别人", "同学", "同事", "榜样", "参考")):
        skills.append("替代经验")
    if any(word in combined for word in ("开始", "完成", "拖延", "任务", "写", "做")):
        skills.append("微步骤")
    return skills[:3] or ["效能重构", "微步骤"]


def _retrieve_sources(payload: RespondRequest) -> list[ResponseSource]:
    hits = get_chain().query(question=_retrieval_query(payload), top_n=2, rerank=True)
    sources: list[ResponseSource] = []
    for hit in hits[:2]:
        metadata = dict(getattr(hit, "metadata", {}) or {})
        source = (
            metadata.get("source_document")
            or metadata.get("file_name")
            or getattr(hit, "source", "knowledge_base")
        )
        sources.append(
            ResponseSource(source=str(source), text=str(hit.text), metadata=metadata)
        )
    return sources


def _offline_response(payload: RespondRequest) -> str:
    detail = payload.user_text.strip().replace("\n", " ")[:42]
    return (
        f"你正把“{detail}”当成能力判决，但这更可能是路径还没拆开，不是你不行。"
        "先把掌控权抢回来：给自己十分钟，只写下这件事最小的下一动作，并完成一个能留下证据的小步骤；"
        "时间到就停。许多同样卡住的人，靠的也不是突然有信心，而是先拿到一次可见的成功试次。"
        "拿下这一仗后，你就有新证据判断下一步，不必再让“做不到”替你下结论。"
    )


def _chat_completion(
    payload: RespondRequest,
    sources: list[ResponseSource],
    settings: Settings,
    skills: list[str],
) -> str:
    context = "\n\n".join(
        f"[来源 {index}] {item.text}" for index, item in enumerate(sources, start=1)
    ) or "本次未检索到直接相关条目。"
    history = "\n".join(
        f"{item.role}: {item.content}" for item in payload.history[-6:]
    )
    user_context = (
        f"用户原话：{payload.user_text}\n"
        f"笔记：{payload.note_content or ''}\n"
        f"用户摘要：{payload.profile_digest or ''}\n"
        f"跨会话用户记忆：{payload.shared_memory or ''}\n"
        f"安全等级：{payload.safety_level}（S1减少任务；S2只给一个低负担动作，并建议连接可信任的人和专业支持）\n"
        f"意图：{', '.join(payload.intents)}；主题：{', '.join(payload.topics)}\n"
        f"近期对话：\n{history}\n\n本轮选用技能：{', '.join(skills)}\n"
        f"知识库材料：\n{context}"
    )
    base_url = settings.openai_base_url.strip() or "https://api.openai.com/v1"
    response = httpx.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
        json={
            "model": settings.openai_model,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你是班杜拉取向的自我效能教练。用中文回复，严格控制在120-220个中文字。"
                        "只按本轮选用技能自然组织回复，不强制四种方法全部出现；打气必须有可执行依据。"
                        "若给微步骤，只给一个能在5-15分钟完成且有可见证据的动作。不诊断、不空喊口号，"
                        "不粘贴或虚构来源。"
                    ),
                },
                {"role": "user", "content": user_context},
            ],
        },
        timeout=20.0,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    if not isinstance(content, str) or not content.strip():
        raise ValueError("LLM returned an empty response")
    content = content.strip()
    if not 120 <= len(content) <= 220:
        raise ValueError("LLM response length is outside 120-220 characters")
    return content


@app.post("/respond", response_model=RespondResponse)
def respond(
    payload: RespondRequest,
    settings: Settings = Depends(get_app_settings),
) -> RespondResponse:
    if payload.needs_pause:
        return RespondResponse(agent_id="C", role_name=ROLE_NAME, response=PAUSE_RESPONSE,
            skills=["fatigue-pause-detection"], sources=[], degraded=False,
            safety_level=payload.safety_level)
    if payload.safety_level == "S3":
        return RespondResponse(
            agent_id="C",
            role_name=ROLE_NAME,
            response=SAFETY_RESPONSE,
            skills=["安全优先响应"],
            sources=[],
            degraded=False,
            safety_level=payload.safety_level,
        )

    skills = _select_skills(payload)
    try:
        sources = _retrieve_sources(payload)
    except Exception:  # noqa: BLE001 - conversational endpoint must stay available
        return RespondResponse(
            agent_id="C",
            role_name=ROLE_NAME,
            response=_offline_response(payload),
            skills=skills,
            sources=[],
            degraded=True,
            safety_level=payload.safety_level,
        )

    if not settings.openai_api_key:
        return RespondResponse(
            agent_id="C",
            role_name=ROLE_NAME,
            response=_offline_response(payload),
            skills=skills,
            sources=sources,
            degraded=True,
            safety_level=payload.safety_level,
        )

    try:
        answer = _chat_completion(payload, sources, settings, skills)
        degraded = False
    except Exception:  # noqa: BLE001 - fall back on network/provider failures
        answer = _offline_response(payload)
        degraded = True
    return RespondResponse(
        agent_id="C",
        role_name=ROLE_NAME,
        response=answer,
        skills=skills,
        sources=sources,
        degraded=degraded,
        safety_level=payload.safety_level,
    )


@app.get("/health", response_model=HealthResponse)
def health(
    store=Depends(get_store),
    settings: Settings = Depends(get_app_settings),
) -> HealthResponse:
    try:
        points = store.count()
        qdrant_status = "up"
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"Qdrant unavailable: {exc}") from exc
    return HealthResponse(
        status="ok",
        qdrant=qdrant_status,
        collection=settings.qdrant_collection,
        points=points,
    )


@app.post("/query", response_model=QueryResponse)
def query_knowledge_base(
    payload: QueryRequest,
    chain=Depends(get_chain),
) -> QueryResponse:
    """Agent function: retrieve Bandura passages with optional school/author filters."""
    hits = chain.query(
        question=payload.query,
        school=payload.school,
        author=payload.author,
        top_n=payload.top_n,
        rerank=payload.rerank,
    )
    return QueryResponse(
        query=payload.query,
        results=[RetrievalItem(**hit.as_dict()) for hit in hits],
    )


@app.post("/ingest", response_model=IngestResponse)
def ingest_documents(
    payload: IngestRequest,
    settings: Settings = Depends(get_app_settings),
) -> IngestResponse:
    """Parse, chunk (with metadata), and upsert files from data/raw or a given path."""
    from src.ingestion.pipeline import IngestionPipeline

    source = payload.path or str(settings.data_raw_dir)
    pipeline = IngestionPipeline(settings)
    chunks = pipeline.ingest_path(source)
    return IngestResponse(
        ingested_chunks=len(chunks),
        collection=settings.qdrant_collection,
    )


@app.get("/collections/{name}")
def collection_info(
    name: str,
    store=Depends(get_store),
) -> dict[str, Any]:
    if name != store.collection:
        raise HTTPException(status_code=404, detail="Unknown collection")
    return {"name": name, "points": store.count()}
