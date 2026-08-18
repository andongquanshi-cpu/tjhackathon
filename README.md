# INSIDE OUT · 21 天正念训练营（MVP）

微距黑客松 pro 第五组。基于「小愈」IP 的 21 天正念产品：每日便签记录 → 四个心理学流派多视角回应 → 多轮深聊 → 对话沉淀进用户心理画像 → 阶段 AI 总结。

## 产品闭环

```
小愈引导 → 初始测评（5 维量表）→ 每日便签 → 四流派评论 → 选择流派深聊 → 画像更新 → 阶段总结
```

- 小愈本体：正念/ACT 整合视角的引导者 🌱
- 四位流派导师（与落地页设计保持一致）：
  - 西格蒙德·弗洛伊德（精神分析）：关注无意识冲突、早期经验与重复出现的关系模式，帮助用户理解情绪和行为的来处。
  - 卡尔·罗杰斯（人本主义）：以共情、真诚和无条件积极关注为核心，先让用户感到被理解，再陪伴其发现自身成长力量。
  - 阿尔伯特·班杜拉（社会认知理论）：关注观察学习、自我效能感以及个人、行为与环境的交互，帮助用户看见可学习、可行动的改变路径。
  - B.F. 斯金纳（行为主义）：关注可观察行为、环境刺激与行为后果，通过识别强化模式和设计小步练习，促进具体行为改变。
- 画像蒸馏：每次深聊后，AI 将对话提炼为结构化画像增量（核心议题/认知模式/优势/维度变化）

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript + Tailwind CSS v4
- 数据层：本地 JSON 文件存储（`.data/db.json`），MVP 够用，后续可换 SQLite/Postgres
- AI 层：四个独立 FastAPI 导师服务 + OpenAI-compatible 模型；Next.js 负责安全前置、四路并发和单路降级

## 快速开始

```bash
npm install
cp .env.example .env.local   # 填入 AI_API_KEY
npm run dev
# 打开 http://localhost:3000
```

首次运行（`DEMO_MODE=1`）自动写入演示便签数据（不包含任何 mock AI 内容，四流派评论/对话均由真实 LLM 生成）。

## 配置（.env.local）

```env
AI_BASE_URL=https://api.deepseek.com/v1   # 兼容 OpenAI 协议，可换成其他厂商
AI_API_KEY=sk-xxx
AI_MODEL=deepseek-chat
AGENT_A_URL=http://127.0.0.1:8101
AGENT_B_URL=http://127.0.0.1:8102
AGENT_C_URL=http://127.0.0.1:8103
AGENT_D_URL=http://127.0.0.1:8104
AGENT_TIMEOUT_MS=20000
DEMO_MODE=1
```

- A/B/C/D 固定对应弗洛伊德、罗杰斯、班杜拉、斯金纳，端口依次为 8101–8104。
- A、C 使用各自 RAG；B 在合格人本文献入库前为 no-rag；D 只调用斯金纳 Skill。B/D 中遗留的精神分析语料已隔离，不参与 `/respond`。
- 任一服务未配置、超时或返回错误时，只降级该导师到 Next.js 通用模型或本地模板，不阻断其他三路。
- S3 危机输入会在 Next.js 共享安全层短路，不进入四导师自由生成；S1/S2 会传给导师服务作为回应约束。

四个 Python 服务分别在 `agents/a`、`agents/b`、`agents/c`、`agents/d` 下启动。各目录先复制 `.env.example` 为 `.env` 并安装其依赖，再运行：

```bash
uvicorn src.api.main:app --host 127.0.0.1 --port 8101  # A
uvicorn src.api.main:app --host 127.0.0.1 --port 8102  # B
uvicorn src.api.main:app --host 127.0.0.1 --port 8103  # C
uvicorn src.api.main:app --host 127.0.0.1 --port 8104  # D
```

> 安全提醒：`.env.local` 已在 .gitignore 中，不会提交；请勿把 API key 发到公开仓库或群里。

## 目录结构

```
app/
  page.tsx               # 落地页：小愈引导
  assessment/            # 初始测评（10 题 / 5 维）
  journal/               # 便签本：写便签 + 历史列表
  notes/[id]/            # 便签详情：四流派评论 + 深聊
  profile/               # 心理画像：雷达图 + 维度 + 议题/模式/优势 + 变化轨迹
  summary/               # 阶段性 AI 总结（Day 7/14/21）
  api/                   # 接口：assessment / notes / comments / chat / profile / summary / reset
lib/
  personas.ts            # 小愈 + 四流派人格（system prompt + 安全红线）
  input-analysis.ts      # 共享安全等级、意图、主题与短输入补全
  external-agents.ts     # 四导师 HTTP 契约、超时与返回校验
  agents.ts              # 四路编排 / 单导师深聊 / 降级 / 画像蒸馏
  assessment.ts          # 量表与计分
  store.ts               # JSON 文件存储
  seed.ts                # 演示种子数据（仅便签，无 mock AI 内容）
components/
  RadarChart.tsx         # 纯 SVG 雷达图（无额外依赖）
  NoteView.tsx           # 便签详情交互（评论卡片 + 聊天面板）
```

## 已知边界（MVP）

- 单用户本地存储，无登录/多人数据；演示可点「清空数据 / 载入演示数据」
- 测评量表为产品化简化版，非临床量表；AI 不诊断、不替代医生（persona 内含安全红线与危机引导）
- 单机 JSON 存储会保存便签和对话原文；生产部署前需补充账号隔离、加密、保留期限与删除机制
- 画像蒸馏在 LLM 模式下由模型产出 JSON，启发式兜底；极端情况下维度变化以兜底为准
- 圆桌会并发调用四个导师服务，注意模型与向量检索用量
## 开发注意事项

- 不要同时运行 
ext build 和 
ext dev：两者共用 .next 目录，build 会破坏正在运行的 dev server（表现为路由 500 / Cannot find module）。需要构建时先停掉 dev server。
- 日志文件（*.log）已加入 .gitignore，不会提交。
