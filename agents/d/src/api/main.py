"""FastAPI application: health, ingest, and hybrid retrieval for Agents."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException

from src.api.schemas import (
    HealthResponse,
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
    RespondRequest,
    RespondResponse,
    RetrievalItem,
)
from src.config import Settings, get_settings
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


def _environment_context(payload: RespondRequest) -> str:
    """Compress bounded note/history context for the behavioral skill."""

    parts: list[str] = [
        f"安全等级：{payload.safety_level}（S1降低任务负担；S2只设计一个安全的小动作，并建议连接现实支持）"
    ]
    if payload.profile_digest:
        parts.append(f"用户摘要：{payload.profile_digest[:1000]}")
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
