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
ROLE_NAME = "弗洛伊德·精神分析倾听者"
A_SKILLS = ["接住具体细节", "精神分析轻转译", "开放式提问"]
PAUSE_RESPONSE = "我听见你累了。我们先停在这里，不继续分析，也不做任何练习。你不需要回复；等你想回来时，我们再从这里继续。"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = get_settings()
    yield


app = FastAPI(
    title="Psychoanalysis Knowledge Base",
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
    detail = payload.user_text.strip().replace("\n", " ")[:52]
    return (
        f"你提到“{detail}”，我先听见的是这件事里那个很具体、也许反复牵动你的部分。"
        "从精神分析的角度，它未必需要立刻被归成一个结论，更像是在提醒我们：某种感受或愿望正借这句话寻找位置。"
        "这不是诊断，我们可以先贴着你的原话停一停。此刻最让你难以移开注意的，是其中哪一个瞬间？"
    )


def _chat_completion(
    payload: RespondRequest,
    sources: list[ResponseSource],
    settings: Settings,
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
        f"安全等级：{payload.safety_level}（S1减少追问；S2不深挖，并建议连接可信任的人和专业支持）\n"
        f"意图：{', '.join(payload.intents)}；主题：{', '.join(payload.topics)}\n"
        f"近期对话：\n{history}\n\n知识库材料：\n{context}"
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
                        "你是弗洛伊德取向的精神分析倾听者，不是医生。用中文回复，控制在"
                        "120-220 个中文字：先接住用户话中的一个具体细节；只借知识库材料"
                        "做一句轻转译并回到用户原话；不诊断、不训诫、不布置作业；结尾只留"
                        "一个开放问题。不要粘贴或虚构来源。"
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
        return RespondResponse(agent_id="A", role_name=ROLE_NAME, response=PAUSE_RESPONSE,
            skills=["fatigue-pause-detection"], sources=[], degraded=False,
            safety_level=payload.safety_level)
    if payload.safety_level == "S3":
        return RespondResponse(
            agent_id="A",
            role_name=ROLE_NAME,
            response=SAFETY_RESPONSE,
            skills=["安全优先响应"],
            sources=[],
            degraded=False,
            safety_level=payload.safety_level,
        )

    try:
        sources = _retrieve_sources(payload)
    except Exception:  # noqa: BLE001 - conversational endpoint must stay available
        sources = []
        return RespondResponse(
            agent_id="A",
            role_name=ROLE_NAME,
            response=_offline_response(payload),
            skills=A_SKILLS,
            sources=sources,
            degraded=True,
            safety_level=payload.safety_level,
        )

    if not settings.openai_api_key:
        return RespondResponse(
            agent_id="A",
            role_name=ROLE_NAME,
            response=_offline_response(payload),
            skills=A_SKILLS,
            sources=sources,
            degraded=True,
            safety_level=payload.safety_level,
        )

    try:
        answer = _chat_completion(payload, sources, settings)
        degraded = False
    except Exception:  # noqa: BLE001 - fall back on network/provider failures
        answer = _offline_response(payload)
        degraded = True
    return RespondResponse(
        agent_id="A",
        role_name=ROLE_NAME,
        response=answer,
        skills=A_SKILLS,
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
    except Exception as exc:  # noqa: BLE001 — surface connectivity for operators
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
    """Agent function: retrieve psychoanalytic passages with optional school/author filters."""
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
