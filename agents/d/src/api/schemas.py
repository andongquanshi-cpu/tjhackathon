"""Request / response models for Agent function calling and REST clients."""

from typing import Any, Literal

from pydantic import BaseModel, Field


SafetyLevel = Literal["S0", "S1", "S2", "S3"]


class HistoryMessage(BaseModel):
    role: str
    content: str


class RespondRequest(BaseModel):
    user_text: str = Field(..., min_length=1)
    note_content: str | None = None
    profile_digest: str | None = None
    shared_memory: str | None = None
    history: list[HistoryMessage] = Field(default_factory=list)
    safety_level: SafetyLevel = "S0"
    intents: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    needs_pause: bool = False


class ResponseSource(BaseModel):
    source: str
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class RespondResponse(BaseModel):
    agent_id: Literal["D"]
    role_name: str
    response: str
    skills: list[str] = Field(default_factory=list)
    sources: list[ResponseSource] = Field(default_factory=list)
    degraded: bool
    safety_level: SafetyLevel


class QueryRequest(BaseModel):
    query: str = Field(..., description="精神分析问题或概念，例如：拉康的镜像阶段")
    school: str | None = Field(None, description="流派过滤：Freud / Lacan / Jung 等")
    author: str | None = Field(None, description="作者过滤")
    top_n: int | None = Field(5, ge=3, le=5, description="BGE 重排后返回 3-5 条")
    rerank: bool = Field(True, description="是否使用 BGE reranker")


class RetrievalItem(BaseModel):
    text: str
    score: float
    source: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class QueryResponse(BaseModel):
    query: str
    results: list[RetrievalItem]


class IngestRequest(BaseModel):
    path: str | None = Field(
        None,
        description="相对或绝对路径。默认读取 data/raw/",
    )


class IngestResponse(BaseModel):
    ingested_chunks: int
    collection: str


class HealthResponse(BaseModel):
    status: str
    qdrant: str
    collection: str
    points: int
