# INSIDE OUT · 21 天正念训练营（MVP）

微距黑客松 Pro 第五组。基于「小愈」IP 的 21 天正念产品：六维测评建档 → 每日便签与引导 → 四流派圆桌回应 → 选择导师深聊 → 会话反馈与画像沉淀 → 阶段总结。

## 产品闭环

```
落地页 / 主界面 → 六维测评（24 题）→ 12 型人格画像
       ↓
每日便签（心情天气）→ 四流派圆桌评论 → 选择流派深聊 → 结束圆桌生成反馈
       ↓
画像更新（议题 / 模式 / 优势）→ 小愈深度分析 → 21 天日历与阶段总结
```

### 角色与视角

- **小愈**：正念 / ACT 整合视角的引导者，贯穿测评、主界面、反馈与深度分析
- **四位流派导师**（落地页与圆桌一致）：
  - **西格蒙德·弗洛伊德**（精神分析）：无意识冲突、早期经验与重复模式
  - **卡尔·罗杰斯**（人本主义）：共情、真诚与无条件积极关注
  - **阿尔伯特·班杜拉**（社会认知理论）：自我效能、观察学习与积极自我认识
  - **B.F. 斯金纳**（行为主义）：可观察行为、环境反馈与小步练习

### 主要页面

| 路径 | 说明 |
|---|---|
| `/` | 落地页：品牌场景、四位导师热区、快捷进入圆桌 |
| `/assessment` | 六维心理量表（24 题：情景题 + Likert） |
| `/profile` | 心理画像：12 型人格、六维雷达、三轴合成、议题 / 模式 / 优势 |
| `/profile/analysis` | 小愈深度分析（基于测评结果的个性化解读） |
| `/journal` | 主界面：写便签、每日纸卷任务、正念工具入口 |
| `/notes/[id]` | 便签详情：四流派圆桌、导师深聊、结束生成反馈 |
| `/notes/[id]/feedback` | 会话反馈单：心情、谈话摘要、建议、小愈寄语 |
| `/calendar` | 21 天训练日历与每日足迹 |
| `/calendar/[day]` | 单日详情：导单进度、便签与反馈 |
| `/practice/meditation` | 正念冥想（支持 OSS 视频） |
| `/practice/breathing` | 呼吸练习 |
| `/summary` | 阶段性 AI 总结（Day 7 / 14 / 21） |

## 六维测评与 12 型人格

基于 V4 量表文档（`8.16/六维心理量表_完整文档V4.md`）：

- **六个维度**（每维 4–20 分）：自我认同、依恋风格、情感外露、行动力、现实主义、理性思考
- **三根合成轴**：自稳 / 外求 · 冲锋 / 运筹 · 炽热 / 温和 / 冷静
- **12 型人格**：明星、老板、孤独的狼、演讲家、观察者、思考者、勇追梦、老好人、宝剑哥、小戏精、纠结者、小蘑菇

六维分数**只由测评锁定**；圆桌深聊只会沉淀核心议题、认知模式、优势与时间线，不会改分。

## 技术栈

- **前端**：Next.js 15（App Router）+ React 19 + TypeScript + Tailwind CSS v4 + GSAP
- **数据层**：本地 JSON 文件存储（`.data/db.json`），MVP 够用，后续可换 SQLite / Postgres
- **AI 层**：四个独立 FastAPI 导师服务 + OpenAI-compatible 模型；Next.js 负责安全前置、四路并发和单路降级

## 快速开始

```bash
cd micro-enging
npm install
cp .env.example .env.local   # 填入 AI_API_KEY
npm run dev
# 打开 http://localhost:3000
```

首次运行（`DEMO_MODE=1`）自动写入演示便签数据（不包含 mock AI 内容，四流派评论 / 对话均由真实 LLM 生成）。

落地页提供「模拟首次登陆 / 载入演示数据 / 清空数据」演示按钮；本地昵称存在浏览器 `localStorage`，与服务端画像分离。

## 配置（`.env.local`）

```env
AI_BASE_URL=https://api.deepseek.com/v1   # 兼容 OpenAI 协议，可换其他厂商
AI_API_KEY=sk-xxx
AI_MODEL=deepseek-chat

# 四导师 FastAPI 服务（未配置或单路不可用时，该导师自动回退到通用模型 / 本地模板）
AGENT_A_URL=http://127.0.0.1:8101
AGENT_B_URL=http://127.0.0.1:8102
AGENT_C_URL=http://127.0.0.1:8103
AGENT_D_URL=http://127.0.0.1:8104
AGENT_TIMEOUT_MS=20000

DEMO_MODE=1

# 正念冥想视频（OSS https 地址；签名链写 .env.local，勿提交仓库）
# NEXT_PUBLIC_MEDITATION_VIDEO_URL=https://your-bucket.oss-cn-beijing.aliyuncs.com/meditation/xiaoyu.mp4
# NEXT_PUBLIC_MEDITATION_POSTER_URL=

# 可选：JSON 数据存储目录（默认 <项目根>/.data）
# DATA_DIR=
```

- A / B / C / D 固定对应弗洛伊德、罗杰斯、班杜拉、斯金纳，端口依次为 8101–8104
- A、C 使用各自 RAG；B 在合格人本文献入库前为 no-rag；D 只调用斯金纳 Skill
- 任一服务未配置、超时或返回错误时，只降级该导师，不阻断其他三路
- S3 危机输入会在 Next.js 共享安全层短路；S1 / S2 会传给导师服务作为回应约束

四个 Python 服务在 `agents/a`–`agents/d` 下启动。各目录先复制 `.env.example` 为 `.env` 并安装依赖，再运行：

```bash
uvicorn src.api.main:app --host 127.0.0.1 --port 8101  # A · 弗洛伊德
uvicorn src.api.main:app --host 127.0.0.1 --port 8102  # B · 罗杰斯
uvicorn src.api.main:app --host 127.0.0.1 --port 8103  # C · 班杜拉
uvicorn src.api.main:app --host 127.0.0.1 --port 8104  # D · 斯金纳
```

> 安全提醒：`.env.local` 已在 `.gitignore` 中，不会提交；请勿把 API key 发到公开仓库或群里。

## 目录结构

```
app/
  page.tsx                    # 落地页
  assessment/                 # 六维测评 + 结果页
  journal/                    # 主界面
  notes/[id]/                 # 便签圆桌 / 深聊 / 反馈
  profile/                    # 心理画像 + 小愈深度分析
  calendar/                   # 21 天日历
  practice/                   # 正念冥想、木鱼祈愿、呼吸练习、心理微课堂
  summary/                    # 阶段总结
  api/
    assessment/               # 提交测评、生成画像
    notes/                    # 便签 CRUD、评论、深聊、反馈
    profile/                  # 画像读取、小愈分析
    guides/[day]/progress/    # 每日纸卷任务进度
    summary/                  # 阶段总结生成
    reset/                    # 演示数据重置
lib/
  six-dim/                    # 量表元数据、题目、计分、12 型人格
  personas.ts                 # 小愈 + 四流派人格（system prompt + 安全红线）
  mentors.ts                  # 导师展示文案（落地页 / 对话卡）
  moods.ts                    # 便签心情天气（阴 → 晴）
  calendar.ts                 # 21 天日历构建
  practice.ts                 # 正念工具与每日导单跳转
  input-analysis.ts           # 共享安全等级、意图、主题与短输入补全
  external-agents.ts          # 四导师 HTTP 契约、超时与返回校验
  agents.ts                   # 四路编排 / 单导师深聊 / 降级 / 画像蒸馏
  feedback.ts                 # 圆桌结束后的结构化反馈单
  portrait-analysis.ts        # 小愈深度画像解读
  prompts.ts                  # 21 天引导语与每日纸卷
  store.ts                    # JSON 文件存储
  seed.ts                     # 演示种子数据（仅便签，无 mock AI 内容）
components/
  HomeLanding.tsx             # 落地页场景与导师热区
  NoteView.tsx                # 圆桌评论 + 深聊 + 反馈入口
  ProfileView.tsx             # 画像总览（雷达图 + 维度 + 议题）
  ProfileAnalysisView.tsx     # 小愈深度分析页
  ArcCarousel.tsx             # 圆桌导师弧形轮播
  MentorMeetPanel.tsx         # 主界面导师见面板
  PersonaPortrait.tsx         # 12 型人格立绘
  RadarChart.tsx              # 纯 SVG 六维雷达图
agents/
  a/ b/ c/ d/                 # 四导师 FastAPI + RAG / Skill 服务
public/
  landing/                    # 落地页场景与导师切图
  personas/                   # 12 型人格立绘
  moods/                      # 心情天气图标
  mentors/                    # 导师头像与对话卡
scripts/
  crop_personas.py            # 问卷立绘裁剪脚本
  knock-black.js              # 图片去底辅助
```

## 已知边界（MVP）

- 单用户本地存储，无账号体系；演示可点「清空数据 / 载入演示数据」
- 测评量表为产品化简化版，非临床量表；AI 不诊断、不替代医生（persona 内含安全红线与危机引导）
- 单机 JSON 存储会保存便签和对话原文；生产部署前需补充账号隔离、加密、保留期限与删除机制
- 画像蒸馏在 LLM 模式下由模型产出 JSON，启发式兜底；极端情况下以兜底为准
- 圆桌会并发调用四个导师服务，注意模型与向量检索用量
- 心理微课堂每次随机推一张概念卡，重新进入会换一张；内容为通俗介绍，非诊断

## 开发注意事项

- 不要同时运行 `next build` 和 `next dev`：两者共用 `.next` 目录，build 会破坏正在运行的 dev server（表现为路由 500 / Cannot find module）。需要构建时先停掉 dev server。
- 日志文件（`*.log`）已加入 `.gitignore`，不会提交。
- 类型检查：`npm run typecheck`
