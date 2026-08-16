"""Carl Rogers person-centered response skill (no RAG)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from urllib.request import Request, urlopen


ROGERS_SYSTEM_PROMPT = """
你以卡尔·罗杰斯的人本主义、以人为中心立场回应。你的任务不是治疗、诊断或替用户作决定。
先准确共情地反映用户正在经历的事实与感受，确认这些感受在其处境中可以被理解，并保持
无条件积极关注。用温和、非评判的语言澄清用户此刻最重要的体验或内在冲突。
不要套用精神分析概念，不解释潜意识，不调用外部语料。除非用户明确要求建议，否则不要
抢跑给方案；优先用一个开放而具体的问题，帮助用户更贴近自己的体验。
只返回 JSON：{"response": "中文回复", "skills": ["技能标签", ...]}。
技能标签只能从“共情反映、情绪确认、无条件积极关注、体验澄清”中选择。
""".strip()


@dataclass(frozen=True)
class RogersResult:
    response: str
    skills: list[str]
    degraded: bool


def _offline_response(user_text: str) -> RogersResult:
    text = user_text.strip()
    if any(word in text for word in ("焦虑", "担心", "害怕", "紧张")):
        reflection = "我听见你正承受着不少担心和紧绷，似乎很难真正放松下来。"
    elif any(word in text for word in ("难过", "伤心", "委屈", "失落")):
        reflection = "我听见这件事让你很难过，也带着一些不容易被看见的委屈。"
    elif any(word in text for word in ("生气", "愤怒", "烦", "讨厌")):
        reflection = "我听见你心里有很强的不满和烦躁，这些感受正在提醒你某些重要的需要。"
    elif any(word in text for word in ("迷茫", "不知道", "纠结", "矛盾")):
        reflection = "听起来你正处在一种不确定和拉扯里，还没有一个让自己踏实的答案。"
    else:
        reflection = "我听见你很认真地在面对这段经历，而它对你并不轻松。"

    excerpt = text if len(text) <= 80 else f"{text[:77]}……"
    response = (
        f"{reflection}当你说“{excerpt}”时，这份感受本身值得被认真接住，"
        "你不需要立刻证明自己对不对，也不必马上把它解决。"
        "如果暂时把外界的期待放到一边，此刻最希望被理解的那部分是什么？"
    )
    return RogersResult(
        response=response,
        skills=["共情反映", "情绪确认", "无条件积极关注", "体验澄清"],
        degraded=True,
    )


def _endpoint(base_url: str) -> str:
    base_url = base_url.rstrip("/")
    if base_url.endswith("/chat/completions"):
        return base_url
    if base_url.endswith("/v1"):
        return f"{base_url}/chat/completions"
    return f"{base_url}/v1/chat/completions"


def _llm_config() -> tuple[str, str, str]:
    """Read process env first, then the project's pydantic `.env` settings."""

    try:
        from src.config import get_settings

        settings = get_settings()
        settings_key = settings.openai_api_key
        settings_url = settings.openai_base_url
        settings_model = settings.openai_model
    except (ImportError, AttributeError):
        settings_key, settings_url, settings_model = "", "", "gpt-4o-mini"
    return (
        os.getenv("OPENAI_API_KEY", "").strip() or settings_key,
        os.getenv("OPENAI_BASE_URL", "").strip()
        or settings_url
        or "https://api.openai.com",
        os.getenv("OPENAI_MODEL", "").strip() or settings_model or "gpt-4o-mini",
    )


def generate_rogers_response(user_text: str, context: str | None = None) -> RogersResult:
    """Generate a person-centered response; safely fall back when LLM is unavailable."""

    api_key, base_url, model = _llm_config()
    if not api_key:
        return _offline_response(user_text)

    body = {
        "model": model,
        "temperature": 0.4,
        "messages": [
            {"role": "system", "content": ROGERS_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {"user_text": user_text, "context": context},
                    ensure_ascii=False,
                ),
            },
        ],
        "response_format": {"type": "json_object"},
    }
    request = Request(
        _endpoint(base_url),
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=60) as response:  # noqa: S310
            raw = json.loads(response.read().decode("utf-8"))
        content = raw["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        response_text = str(parsed["response"]).strip()
        skills = [
            skill
            for skill in parsed.get("skills", [])
            if skill in {"共情反映", "情绪确认", "无条件积极关注", "体验澄清"}
        ]
        if not response_text:
            raise ValueError("empty response")
        return RogersResult(
            response=response_text,
            skills=skills or ["共情反映", "体验澄清"],
            degraded=False,
        )
    except (OSError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        return _offline_response(user_text)
