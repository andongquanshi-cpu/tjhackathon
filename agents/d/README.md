# Agent D：斯金纳行为主义

微距黑客松 Pro 第五组（[micro-enging](https://github.com/jinjinnan83-ui/micro-enging)）

当前主服务是斯金纳行为主义回应 Agent。`POST /respond` 封装
`src/skills/skinner_skill.py` 的 `generate_skinner_response`，将用户问题转为可观察行为、
环境刺激、强化程序和可控性评估。长笔记与近期历史会被截断压缩为
`environment_context`。未配置 OpenAI key 时使用现有本地行为模板。

这是行为支持工具，**不是心理治疗或诊断工具**。`/respond` 当前为 **no-RAG**：
返回 `sources=[]`、`degraded=true`。

## 旧语料隔离状态

仓库中的 `data/`、`src/retrieval/`、`src/ingestion/` 和
`.cursor/skills/psychoanalysis-dialogue/` 是误复制的旧精神分析资产，仅为兼容旧
`/query`、`/ingest` 而保留。它们不会被 `/respond` 导入或调用，也不是 Agent D 的依据。

## 旧库容（仅隔离保留）

本地已索引 **645** 条切片（`data/processed/chunks.jsonl` 与 `data/qdrant_storage` 一致）。

| 流派 | 切片约数 | 代表内容 |
|---|---:|---|
| 精神分析 | 251 | 弗洛伊德结构模型、俄狄浦斯、移情；霍妮基本焦虑；自我心理学；动力取向疗效综述 |
| 客体关系 | 127 | 克莱因位置与投射性认同；温尼科特抱持/过渡客体；TFP |
| 自体心理学 | 61 | 科胡特自体客体；抑郁症视角综述 |
| 关系精神分析 | 56 | 关系学派综述；Sullivan 人际/主体间 |
| 个体心理学 | 49 | 阿德勒个体心理学 |
| 心智化 | 48 | MBT 与边缘型人格综述 |
| 分析心理学 | 48 | 荣格集体无意识、原型；荣格治疗疗效研究 |
| 拉康派 | 5 | 镜像阶段、三界、父亲之名 |

原始文献在 `data/raw/`（PDF + 理论笔记）。两份扫描 PDF 抽不出正文，未入库。

## 目录

```
data/raw/                 原始文献与理论笔记
data/processed/           chunks.jsonl、BM25 语料、入库报告
data/qdrant_storage/      本地嵌入式 Qdrant（645 向量）
src/ingestion/            解析、元数据、切块
src/vectorstore/          Qdrant 集合管理
src/retrieval/            混合检索 + BGE rerank
src/api/                  FastAPI：/respond（主接口）及隔离的旧接口
src/skills/skinner_skill.py 斯金纳行为工程回应（no-RAG）
scripts/                  入库与构建脚本
.cursor/skills/psychoanalysis-dialogue/   对话 Skill（先检索再开口）
```

每条切片带 `author`、`school`、`core_concepts`、`source_document`。

## 环境

- Python 3.10+
- 可选：Docker（远程 Qdrant）。未启动 Docker 时，自动回落到 `data/qdrant_storage/`

```bash
git clone https://github.com/jinjinnan83-ui/micro-enging.git
cd micro-enging
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

可选启动独立 Qdrant：

```bash
docker compose up -d
```

## 旧入库流程（隔离）

仓库已包含切好的切片和本地向量库，克隆后一般不必重跑。新增 `data/raw/` 文件后再构建：

```bash
python -m scripts.build_knowledge_base
```

只预览切块：

```bash
python -m src.ingestion.chunking --path data/raw/freud_structural_model.md
```

## 旧检索流程（隔离）

快速 BM25（对话默认）：

```bash
.venv/bin/python .cursor/skills/psychoanalysis-dialogue/scripts/query_kb.py "投射性认同" --top-n 5
```

按流派过滤：

```bash
.venv/bin/python .cursor/skills/psychoanalysis-dialogue/scripts/query_kb.py "父亲之名" --school 拉康派
```

`--school` 可选：`精神分析` `拉康派` `客体关系` `分析心理学` `自体心理学` `关系精神分析` `个体心理学` `心智化`

混合检索（稠密向量 + BM25 + BGE 重排，较慢）：

```bash
python -m src.retrieval.hybrid_engine query "死本能" --top-n 5
# 或
.venv/bin/python .cursor/skills/psychoanalysis-dialogue/scripts/query_kb.py "死本能" --hybrid
```

## API

```bash
uvicorn src.api.main:app --reload --port 8104
```

- `POST /respond`：统一 Agent 请求/响应；S3 直接返回确定性安全响应
- `GET /health`
- `POST /query`、`POST /ingest`：仅旧兼容接口，不供 Agent D `/respond` 使用

## 对话 Skill

运行时以 `src/skills/skinner_skill.py` 为准。旧 `psychoanalysis-dialogue` Skill 已隔离，
不应由 Agent D 使用。

## 测试

```bash
.venv/bin/python -m pytest tests -q
```

## 技术栈

LlamaIndex · Qdrant · FastAPI · `bge-large-zh-v1.5` · `bge-reranker-v2-m3` · rank_bm25
