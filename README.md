# 愈星乡 · 21 天正念训练营（MVP）

微距黑客松 pro 第五组。基于「小愈」IP 的 21 天正念产品：每日便签记录 → 四个心理学流派多视角回应 → 多轮深聊 → 对话沉淀进用户心理画像 → 阶段 AI 总结。

## 产品闭环

```
小愈引导 → 初始测评（5 维量表）→ 每日便签 → 四流派评论 → 选择流派深聊 → 画像更新 → 阶段总结
```

- 小愈本体：正念/ACT 整合视角的引导者 🌱
- 四个流派衍生形态：
  - 小愈·暖（人本主义）
  - 小愈·镜（精神分析 / 心理动力学）
  - 小愈·思（认知行为）
  - 小愈·叙（后现代主义 · 叙事疗法/焦点解决）
- 画像蒸馏：每次深聊后，AI 将对话提炼为结构化画像增量（核心议题/认知模式/优势/维度变化），不存原始对话，省 token、保护隐私

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript + Tailwind CSS v4
- 数据层：本地 JSON 文件存储（`.data/db.json`），MVP 够用，后续可换 SQLite/Postgres
- AI 层：DeepSeek（OpenAI 兼容协议），配置见下

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
DEMO_MODE=1
```

- 已配置 key：四流派评论、深聊、画像蒸馏、阶段总结全部走真实 LLM
- 未配置 key：自动退回内置模板兜底（仅保证流程不中断，演示前请务必配置）

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
  agents.ts              # 评论生成 / 深聊 / 画像蒸馏（LLM + 兜底）
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
- 21 天为结构化日程（day 字段），暂无日历/打卡 UI；可随时补充
- 画像蒸馏在 LLM 模式下由模型产出 JSON，启发式兜底；极端情况下维度变化以兜底为准
- 并发调用四流派评论会产生 4 次 LLM 请求，注意 API 用量
## 开发注意事项

- 不要同时运行 
ext build 和 
ext dev：两者共用 .next 目录，build 会破坏正在运行的 dev server（表现为路由 500 / Cannot find module）。需要构建时先停掉 dev server。
- 日志文件（*.log）已加入 .gitignore，不会提交。
