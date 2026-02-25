---
title: "The File System Is the New Database"
subtitle: "How I Built a Personal OS for AI Agents"
zh_title: "文件系统就是新型数据库"
zh_subtitle: "我如何为 AI 智能体构建个人操作系统"
description: "A deep dive into Personal Brain OS — a Git-based file system that gives AI assistants persistent context, voice, memory, and relationships. Why context engineering beats prompt engineering."
date: 2026-02-25T09:00:00
featured: false
tags: ["AI", "Context Engineering", "Productivity", "Agent"]
---

> *Based on Muratcan Koylan's thread — Context Engineer at [Sully.ai](https://sully.ai)*

Every AI conversation starts the same way. You explain who you are. You explain what you're working on. You paste in your style guide. You re-describe your goals. You give the same context you gave yesterday, and the day before, and the day before that. Then, 40 minutes in, the model forgets your voice and starts writing like a press release.

I got tired of this. So I built a system to fix it.

I call it **Personal Brain OS** — a file-based personal operating system that lives inside a Git repository. Clone it, open it in Cursor or Claude Code, and the AI assistant has everything: my voice, my brand, my goals, my contacts, my content pipeline, my research, my failures. No database, no API keys, no build step. Just 80+ files in Markdown, YAML, and JSONL that both humans and language models read natively.

I'm sharing the full architecture, the design decisions, and the mistakes so you can build your own version. Not a copy of mine — yours. The patterns transfer. Take what fits, ignore what doesn't, and ship something that makes your AI actually useful instead of generically helpful.

---

## 1. The Core Problem: Context, Not Prompts

Most people think the bottleneck with AI assistants is prompting. Write a better prompt, get a better answer. That's true for single interactions. It falls apart when you want an AI to operate *as you* across dozens of tasks over weeks and months.

### The Attention Budget

Language models have a finite context window, and not all of it is created equal. Dumping everything you know into a system prompt isn't just wasteful — it actively degrades performance. Every token you add competes for the model's attention.

Our brains work similarly. When someone briefs you for 15 minutes before a meeting, you remember the first thing they said and the last thing they said. The middle blurs. Language models have the same **U-shaped attention curve**, except theirs is mathematically measurable. Token position affects recall probability. Knowing this changes how you design information architecture for AI systems.

Instead of writing one massive system prompt, I split Personal OS into **11 isolated modules**. When I ask the AI to write a blog post, it loads my voice guide and brand files. When I ask it to prepare for a meeting, it loads my contact database and interaction history. The model never sees network data during a content task, and never sees content templates during a meeting prep task.

### Progressive Disclosure

This is the architectural pattern that makes the whole system work. Instead of loading all 80+ files at once, the system uses three levels:

- **Level 1 — Routing:** A lightweight `SKILL.md` that's always loaded. It tells the AI which module is relevant — "this is a content task, load the brand module" or "this is a network task, load the contacts."
- **Level 2 — Module Context:** Files like `CONTENT.md`, `OPERATIONS.md`, and `NETWORK.md` — 40–100 lines each, with file inventories, workflow sequences, and an `<instructions>` block with behavioral rules for that domain. Load only when that module is needed.
- **Level 3 — Raw Data:** JSONL logs, YAML configs, research documents — loaded only when the task specifically requires them. The AI reads contacts line by line from JSONL rather than parsing the entire file.

Three levels, maximum two hops to any piece of information.

### The Agent Instruction Hierarchy

Three layers of instructions scope how the AI behaves at different granularities:

**`CLAUDE.md` — Repository level:** The onboarding document. Every AI tool reads it first and gets the full map of the project.

**`AGENT.md` — Brain level:** Contains seven core rules and a decision table that maps common requests to exact action sequences. The AI reads "User says 'send email to Z'" and immediately sees: Step 1, look up contact in HubSpot. Step 2, verify email address. Step 3, send via Gmail. No ambiguity, no hallucinated workflows.

**Module-level files:** Each directory has its own instruction file. `OPERATIONS.md` defines priority levels (P0: do today, P1: this week, P2: this month, P3: backlog) so the agent triages tasks consistently — because the system is codified, not implied.

When everything lives in one system prompt, rules contradict each other. By scoping rules to their domain, you eliminate conflicts and give the agent clear, non-overlapping guidance. You can also update one module's rules without risking regression in another.

---

## 2. The File System as Memory

One of the most counterintuitive decisions: no database. No vector store. No retrieval system except Cursor or Claude Code's native features. Just files on disk, versioned with Git.

### Format-Function Mapping

Every file format was chosen for a specific reason:

**JSONL for logs** — append-only by design, stream-friendly (the agent reads line by line without parsing the entire file), and every line is self-contained valid JSON. JSONL's append-only nature prevents a category of bugs where an agent accidentally overwrites historical data. I've seen this happen with regular JSON — the agent writes the whole file, and you lose three months of contact history. With JSONL, the agent can only add lines. Deletion is done by marking entries as `"status": "archived"`, which preserves the full history for pattern analysis.

**YAML for configs** — handles hierarchical data cleanly, supports comments, and is readable by both humans and machines without the noise of JSON brackets. The comment support means I can annotate my goals file with context the agent reads but that doesn't pollute the data structure.

**Markdown for narrative** — LLMs read it natively, it renders everywhere, and it produces clean diffs in Git.

The full inventory: **11 JSONL files** (posts, contacts, interactions, bookmarks, ideas, metrics, experiences, decisions, failures, engagement, meetings), **6 YAML files** (goals, values, learning, circles, rhythms, heuristics), and **50+ Markdown files** (voice guides, research, templates, drafts, todos). Every JSONL file starts with a schema line: `{"_schema": "contact", "_version": "1.0", "_description": "..."}`. The agent always knows the structure before reading the data.

### Episodic Memory

Most "second brain" systems store facts. Mine stores **judgment** as well. The `memory/` module contains three append-only logs:

- `experiences.jsonl` — key moments with emotional weight scores from 1–10
- `decisions.jsonl` — key decisions with reasoning, alternatives considered, and outcomes tracked
- `failures.jsonl` — what went wrong, root cause, and prevention steps

Facts tell the agent what happened. Episodic memory tells the agent what *mattered*, what I'd do differently, and how I think about tradeoffs. When the agent encounters a decision similar to one I've logged, it references my past reasoning instead of generating generic advice.

When I was deciding whether to accept a $250K investment offer or join Sully.ai as Context Engineer, the decision log captured both options, the reasoning for each, and the outcome. If a similar career tradeoff comes up again, the agent doesn't give me generic career advice. It references how I actually think: "Learning > Impact > Revenue > Growth" is my priority order. "Can I touch everything? Will I learn at the edge of my capability? Do I respect the founders?" is my company-joining framework. The failures log is the most valuable — it encodes pattern recognition that took real pain to acquire.

### Cross-Module References

The system uses a flat-file relational model. `contact_id` in `interactions.jsonl` points to entries in `contacts.jsonl`. `pillar` in `ideas.jsonl` maps to content pillars defined in `identity/brand.md`. Bookmarks feed content ideas. Post metrics feed weekly reviews. The modules are isolated for loading, but connected for reasoning.

"Prepare for my meeting with Sarah" triggers a lookup chain: find Sarah in contacts → pull her interactions → check pending todos involving her → compile a brief. Three files chained together. No loading the entire system.

---

## 3. The Skill System: Teaching AI How to Do Your Work

Files store knowledge. Skills encode process. I built Agent Skills following the Anthropic Agent Skills standard — structured instructions that tell the AI how to perform specific tasks with quality gates baked in.

### Auto-Loading vs. Manual Invocation

**Reference skills** (`voice-guide`, `writing-anti-patterns`) set `user-invocable: false` in their YAML frontmatter. The agent injects them automatically whenever the task involves writing. I never invoke them — they activate silently, every time.

**Task skills** (`/write-blog`, `/topic-research`, `/content-workflow`) set `disable-model-invocation: true`. The agent can't trigger them on its own. I type the slash command, and the skill becomes the agent's complete instruction set for that task.

When I type `/write-blog context engineering for marketing teams`, five things happen automatically: the voice guide loads, the anti-patterns load, the blog template loads (7-section structure with word count targets), the persona folder is checked for audience profiles, and the research folder is checked for existing topic research. One slash command triggers a full context assembly. The skill file references the source module — it never duplicates content. Single source of truth.

### The Voice System

My voice is encoded as structured data. The voice profile rates five attributes on a 1–10 scale:

| Attribute | Score |
|---|---|
| Formal / Casual | 6 |
| Serious / Playful | 4 |
| Technical / Simple | 7 |
| Reserved / Expressive | 6 |
| Humble / Confident | 7 |

The anti-patterns file contains **50+ banned words** across three tiers, banned openings, structural traps (forced rule of three, copula avoidance, excessive hedging), and a hard limit of **one em-dash per paragraph**.

Most people describe their voice with adjectives like "professional but approachable." That's useless for an AI. A 7 on the Technical/Simple scale tells the model exactly where to land. The banned word list is even more powerful — it's easier to define what you're NOT than what you are. The agent checks every draft against the anti-patterns list and rewrites anything that triggers it. The result is content that sounds like me because the guardrails prevent it from sounding like AI.

Every content template includes voice checkpoints every 500 words. The blog template has a **4-pass editing process** built in: structure edit (does the hook grab?), voice edit (banned words scan + sentence rhythm check), evidence edit (claims sourced?), and a read-aloud test. The quality gates are part of the skill, not something added after the fact.

### Templates as Structured Scaffolds

Five content templates define the structure for different content types:

- **Long-form blog:** 7 sections (Hook, Core Concept, Framework, Practical Application, Failure Modes, Getting Started, Closing) with word count targets totaling 2,000–3,500 words
- **Thread:** 11-post structure with hook, deep-dive, results, and CTA
- **Research:** 4 phases — landscape mapping, technical deep-dive, evidence collection, and gap analysis

The research template outputs to `knowledge/research/[topic].md` with an Evidence Bank: statistics, quotes, case studies, and papers each cited with source and date, graded HIGH/MEDIUM/LOW on reliability. That research document then feeds into the blog template's outline stage. **The output of one skill becomes the input of the next.** The pipeline builds on itself.

---

## 4. The Operating System: How I Actually Use This Daily

### The Content Pipeline

Seven stages: Idea → Research → Outline → Draft → Edit → Publish → Promote.

Ideas are captured to `ideas.jsonl` with a scoring system — each idea rated 1–5 on alignment with positioning, unique insight, audience need, timeliness, and effort-versus-impact. **Proceed if total score hits 15 or higher.** Research outputs to the knowledge module. Drafts go through four editing passes. Published content gets logged to `posts.jsonl` with platform, URL, and engagement metrics. Promotion uses the thread template to create an X announcement and a LinkedIn adaptation.

I batch content creation on Sundays: 3–4 hours, target output of 3–4 posts drafted and outlined.

### The Personal CRM

Contacts organized into four circles with different maintenance cadences: inner (weekly), active (bi-weekly), network (monthly), dormant (quarterly reactivation). Each contact record has `can_help_with` and `you_can_help_with` fields that enable introduction matching — cross-referencing these fields surfaces mutually valuable intros. Interactions are logged with sentiment tracking (positive, neutral, needs_attention) so relationship health is visible at a glance.

Specialized groups in `circles.yaml` — founders, investors, ai_builders, creators, mentors, mentees — each have explicit relationship development strategies. For AI builders: share useful content, collaborate on open source, provide tool feedback, amplify their work. For mentors: bring specific questions, update on progress from previous advice, look for ways to add value back. These are operational instructions the agent follows when I ask "Who should I reach out to this week?"

### Automation Chains

Five scripts handle recurring workflows. The **Sunday weekly review** runs three in sequence: `metrics_snapshot.py` updates the numbers, `stale_contacts.py` flags relationships, `weekly_review.py` generates a summary document with completed-versus-planned, metrics trends, and next week's priorities. Not cron jobs — I trigger them with `npm run weekly-review` or ask the agent to run them.

The review isn't a report — it's the starting point for next week's planning. The automation creates a feedback loop: goals drive content, content drives metrics, metrics drive reviews, reviews drive goals.

---

## 5. What I Got Wrong — and What I'd Do Differently

**Over-engineered schemas.** My initial JSONL schemas had 15+ fields per entry. Most were empty. Agents struggle with sparse data — they try to fill in fields or comment on the absence. I cut schemas to 8–10 essential fields and added optional fields only when I actually had data for them. Simpler schemas, better agent behavior.

**The voice guide was too long.** Version one of `tone-of-voice.md` was 1,200 lines. The agent would start strong, then drift by paragraph four as the voice instructions fell into the lost-in-middle zone. I restructured it to front-load the most distinctive patterns (signature phrases, banned words, opening patterns) in the first 100 lines, with extended examples further down. The critical rules need to be at the top, not buried in the middle.

**Module boundaries matter more than you think.** I initially had identity and brand in one module. The agent would load my entire bio when it only needed my banned words list. Splitting them into two modules cut token usage for voice-only tasks by **40%**. Every module boundary is a loading decision. Get them wrong and you load too much or too little.

**Append-only is non-negotiable.** I lost three months of post engagement data early on because an agent rewrote `posts.jsonl` instead of appending to it. JSONL's append-only pattern isn't just a convention — it's a safety mechanism. The agent can add data. It cannot destroy data. This is the most important architectural decision in the system.

---

## 6. The Results and the Principle Behind Them

The real result is simpler than any metric. I open Cursor or Claude Code, start a conversation, and the AI already knows who I am, how I write, what I'm working on, and what I care about. It writes in my voice because my voice is encoded as structured data. It follows my priorities because my goals are in a YAML file it reads before suggesting what to work on. It manages my relationships because my contacts and interactions are in files it can query.

The principle behind all of it: **this is context engineering, not prompt engineering.**

Prompt engineering asks "how do I phrase this question better?" Context engineering asks "what information does this AI need to make the right decision, and how do I structure that information so the model actually uses it?"

The shift is from optimizing individual interactions to designing information architecture. It's the difference between writing a good email and building a good filing system. One helps you once. The other helps you every time.

The entire system fits in a Git repository. Clone it to any machine, point any AI tool at it, and the operating system is running. Zero dependencies. Full portability. And because it's Git, every change is versioned, every decision is traceable, and nothing is ever truly lost.

---

*Framework: [Agent Skills for Context Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) — 8,000+ GitHub stars, cited in academic research alongside Anthropic.*

<!-- zh -->

> *基于 Muratcan Koylan 的长推文 — [Sully.ai](https://sully.ai) Context Engineer*

每次和 AI 对话都从同一个地方开始：你解释自己是谁，粘贴风格指南，重新描述你的目标，把昨天说过的背景再说一遍。然后，大约 40 分钟后，模型忘记了你的语气，开始用新闻通稿的腔调写东西。

我受够了。于是我构建了一个系统来解决这个问题。

我把它叫做 **Personal Brain OS**——一个基于文件的个人操作系统，完整地住在一个 Git 仓库里。克隆下来，在 Cursor 或 Claude Code 里打开，AI 助理就拥有了你的全部：你的语气、你的品牌、你的目标、你的联系人、你的内容流水线、你的研究资料、你踩过的坑。没有数据库，没有 API Key，没有构建步骤。只是 80+ 个 Markdown、YAML 和 JSONL 文件——人和语言模型都能直接读。

我把完整的架构、设计决策和错误全部公开，目的是让你构建属于自己的版本——不是我的复制品，是你的。底层模式可以迁移，具体模块会因人而异。拿走适合你的，忽略不合适的，然后交付一个让 AI 真正有用、而不只是泛泛而谈的系统。

---

## 一、核心问题：上下文，不是提示词

大多数人认为 AI 助理的瓶颈在于提示词——把提示写得更好，就能得到更好的回答。在单次交互里这是对的。但当你想让 AI 跨越数周、数月、以你的方式完成几十项任务时，这个假设就站不住脚了。

### 注意力预算

语言模型的上下文窗口是有限的，而且并非每个位置的权重都相同。把你知道的所有东西一股脑塞进系统提示，不仅是浪费——还会主动降低性能。每多加一个 token，就多一个与模型争夺注意力的竞争者。

我们的大脑工作方式类似。如果有人在会议前用 15 分钟给你做情况简报，你会记得他说的第一件事和最后一件事，中间的内容往往模糊了。语言模型也有同样的 **U 形注意力曲线**——只不过它们的曲线是可以数学测量的。Token 的位置直接影响召回概率。理解这一点，会彻底改变你为 AI 系统设计信息架构的方式。

我没有写一个巨大的系统提示，而是把 Personal OS 拆分成了 **11 个相互隔离的模块**。当我要求 AI 写博客时，它加载我的语气指南和品牌文件。当我让它准备一场会议时，它加载联系人数据库和互动历史。模型在处理内容任务时永远不会看到通讯录数据，在准备会议时永远不会看到内容模板。

### 渐进式披露 (Progressive Disclosure)

这是让整个系统运转起来的核心架构模式。不是一次性加载 80+ 个文件，而是分三个层级：

- **第一级 — 路由层：** 始终加载的轻量 `SKILL.md`，告诉 AI 当前任务涉及哪个模块——"这是内容任务，加载品牌模块"或"这是通讯录任务，加载联系人"。
- **第二级 — 模块上下文：** `CONTENT.md`、`OPERATIONS.md`、`NETWORK.md` 等文件——各 40–100 行，包含文件清单、工作流序列和 `<instructions>` 块，只在该模块被激活时加载。
- **第三级 — 原始数据：** JSONL 日志、YAML 配置、研究文档——只在任务明确需要时加载。AI 逐行读取 JSONL 中的联系人，而不是解析整个文件。

三层结构，访问任何信息最多两跳。

### 智能体指令层级体系

三层指令对 AI 的行为进行不同粒度的约束：

**`CLAUDE.md` — 仓库级：** 入职文档，所有 AI 工具第一个读它，获得整个项目的全局地图。

**`AGENT.md` — 大脑级：** 包含七条核心规则和一张决策表，将常见请求映射到精确的操作序列。AI 读到"用户说'给 Z 发邮件'"时，立即知道：第一步，在 HubSpot 查联系人；第二步，核实邮箱地址；第三步，通过 Gmail 发送。没有歧义，没有幻觉出来的工作流。

**模块级文件：** 每个目录都有自己的指令文件。`OPERATIONS.md` 定义优先级（P0：今天做，P1：本周，P2：本月，P3：待办积压），让智能体用你的标准来分配任务——因为这套标准被明确写下来了，而不是隐式假设的。

把所有规则放在一个系统提示里，规则就会互相矛盾。把规则限定在各自的域里，你就消除了冲突，给了智能体清晰、不重叠的指引。更新一个模块的规则也不会影响另一个模块的行为。

---

## 二、文件系统作为记忆

最反直觉的决策之一：不用数据库，不用向量存储，不用任何检索系统——只用 Cursor 或 Claude Code 的原生能力。磁盘上的文件，用 Git 做版本管理。

### 格式即功能

每种文件格式的选择都有明确理由：

**JSONL 用于日志**——天然追加写入，流式友好（逐行读取，无需解析整个文件），每行都是独立有效的 JSON。JSONL 的追加写入特性防范了一类高危 bug：智能体误覆盖历史数据。我亲历过用普通 JSON 文件时的惨痛——智能体重写了整个文件，三个月的联系人历史消失了。用 JSONL，智能体只能添加行，删除操作通过标记 `"status": "archived"` 完成，完整历史永远保留。

**YAML 用于配置**——干净处理层级数据，支持注释，人机都可读，没有 JSON 花括号的噪音。注释支持让我可以在目标文件里加入上下文批注，智能体会读取，但不污染数据结构本身。

**Markdown 用于叙述性内容**——所有 LLM 天然擅长解析，可在任何地方渲染，Git diff 也干净。

完整清单：**11 个 JSONL 文件**（posts、contacts、interactions、bookmarks、ideas、metrics、experiences、decisions、failures、engagement、meetings），**6 个 YAML 文件**（goals、values、learning、circles、rhythms、heuristics），**50+ 个 Markdown 文件**（语气指南、研究资料、模板、草稿、待办事项）。每个 JSONL 文件都以 schema 行开头：`{"_schema": "contact", "_version": "1.0", "_description": "..."}`，智能体在读数据之前就已经知道结构。

### 情节式记忆 (Episodic Memory)

大多数"第二大脑"系统只存储事实。我的系统同时存储**判断力**。`memory/` 模块包含三个只追加写入的日志：

- `experiences.jsonl`——关键时刻，带情感权重评分（1–10）
- `decisions.jsonl`——关键决策，含推理过程、备选方案和追踪的结果
- `failures.jsonl`——出了什么问题，根本原因，以及预防措施

事实告诉智能体发生了什么，情节式记忆告诉智能体什么是*重要的*、我会如何做不同的选择、以及我怎样权衡取舍。当智能体遇到类似我记录过的决策时，它会参考我过去的推理，而不是生成泛泛的建议。

举个例子：当我在考虑是接受 25 万美元的投资、还是加入 Sully.ai 担任 Context Engineer 时，决策日志记录了两个选项、各自的推理和最终结果。如果以后再遇到类似的职业取舍，智能体不会给我通用的职业建议，它会参考我真实的决策框架：我的优先级顺序是"学习 > 影响 > 收入 > 成长"，我加入公司的判断标准是"我能参与每个环节吗？我会在能力边界处学习吗？我尊重创始人吗？"

失败日志是最有价值的——它编码了用真实代价换来的模式识别。

### 跨模块引用

系统采用平面文件关系模型。`interactions.jsonl` 里的 `contact_id` 指向 `contacts.jsonl` 里的条目，`ideas.jsonl` 里的 `pillar` 映射到 `identity/brand.md` 里定义的内容支柱。书签滋养内容创意，发帖指标滋养每周复盘。模块在加载时是隔离的，在推理时是连通的。

"帮我准备和 Sarah 的会议"会触发一条查找链：在联系人中找到 Sarah → 拉取她的互动历史 → 检查与她相关的待办事项 → 汇总成简报。三个文件串联，不需要加载整个系统。

---

## 三、技能系统：教 AI 如何做你的工作

文件存储知识，技能编码流程。我按照 Anthropic Agent Skills 标准构建了 Agent Skills——结构化指令，告诉 AI 如何完成特定任务，质量门控内置其中。

### 自动加载与手动调用

**引用型技能**（`voice-guide`、`writing-anti-patterns`）在 YAML 元数据中设置 `user-invocable: false`。只要任务涉及写作，智能体就自动注入它们。我从不主动调用，它们静默激活，每次都是。

**任务型技能**（`/write-blog`、`/topic-research`、`/content-workflow`）设置 `disable-model-invocation: true`。智能体无法自行触发，我输入斜杠命令，技能就成为该任务的完整指令集。

当我输入 `/write-blog context engineering for marketing teams` 时，五件事自动发生：语气指南加载、反模式列表加载、博客模板加载（7 节结构含字数目标）、persona 文件夹检查受众画像、research 文件夹检查已有的话题研究。一条斜杠命令触发完整的上下文组装。技能文件本身说"读取 `brand/tone-of-voice.md`"——引用来源，从不复制内容。唯一来源原则。

### 语气系统

我的语气被编码为结构化数据。语气画像用 1–10 的量表对五个维度打分：

| 维度 | 分数 |
|---|---|
| 正式 / 随意 | 6 |
| 严肃 / 轻松 | 4 |
| 技术 / 通俗 | 7 |
| 内敛 / 表达 | 6 |
| 谦逊 / 自信 | 7 |

反模式文件包含 **50+ 个禁用词**（分三个层级）、禁用的开头方式、结构性陷阱（强制三段论、过度回避系动词、过度使用模糊措辞）以及一个硬性限制：**每段最多一个破折号**。

大多数人用形容词描述自己的语气："专业但亲和"。这对 AI 毫无用处。"技术/通俗"打 7 分，模型立刻知道该在哪里落笔。禁用词列表更强大——定义你*不是什么*比定义你*是什么*容易得多。智能体对每份草稿做反模式检查，触发任何条目就重写。结果是内容听起来像我，因为护栏阻止了它听起来像 AI。

每个内容模板每 500 字都有一个语气检查点。博客模板内置了 **4 遍编辑流程**：结构编辑（开头有没有抓住人？）、语气编辑（禁用词扫描 + 句子节奏检查）、证据编辑（观点有来源支撑吗？）和朗读测试。质量门控是技能的一部分，不是事后添加的。

### 模板作为结构化脚手架

五个内容模板为不同内容类型定义结构：

- **长篇博客：** 7 节结构（开篇钩子、核心概念、框架、实践应用、失效模式、上手指南、收尾），字数目标合计 2,000–3,500 字
- **长推线程：** 11 条结构，包含钩子、深度展开、结果和 CTA
- **研究报告：** 4 个阶段——全景图谱、技术深潜、证据收集、空白分析

研究模板输出到 `knowledge/research/[topic].md`，包含证据库（统计数据、引用、案例研究、论文——各附来源和日期）以及按 HIGH/MEDIUM/LOW 评级的来源可信度。这份研究文档随后成为博客模板提纲阶段的输入。**一个技能的输出是下一个技能的输入。** 流水线自我增长。

---

## 四、操作系统：我如何在日常中使用它

### 内容流水线

七个阶段：创意 → 研究 → 提纲 → 草稿 → 编辑 → 发布 → 推广。

创意被捕获进 `ideas.jsonl`，配有评分系统——每个创意在五个维度打 1–5 分：与定位的契合度、独特洞见、受众需求、时效性、投入产出比。**总分 15 分及以上才推进。** 研究输出到知识模块，草稿经过四遍编辑，发布的内容记录进 `posts.jsonl`（含平台、URL 和互动指标），推广阶段用线程模板生成 X 帖子和 LinkedIn 适配版本。

我把内容创作批量安排在周日：3–4 小时，目标产出 3–4 篇草稿和提纲。

### 个人 CRM

联系人按四个圈层组织，各有不同的维护节奏：核心圈（每周）、活跃圈（每两周）、网络圈（每月）、休眠圈（每季度重激活）。每条联系人记录有 `can_help_with` 和 `you_can_help_with` 字段，交叉比对这两个字段可以发现互利的引荐机会。互动按情感倾向记录（positive、neutral、needs_attention），关系健康状况一目了然。

`circles.yaml` 里有专项分组——founders、investors、ai_builders、creators、mentors、mentees——各有明确的关系发展策略。对 AI 构建者：分享有价值的内容、在开源项目上协作、提供工具反馈、放大他们的工作。对导师：带着具体问题来、汇报上次建议的落地进展、寻找回馈价值的机会。这些都是智能体在我问"本周我该联系谁？"时遵循的操作指令。

### 自动化链

五个脚本处理周期性工作流。**周日复盘**依次运行三个脚本：`metrics_snapshot.py` 更新数字，`stale_contacts.py` 标记需要维护的关系，`weekly_review.py` 生成汇总文档，包含计划完成对比、指标趋势和下周优先事项。这不是定时任务——我用 `npm run weekly-review` 触发，或者直接让智能体运行。

复盘不是报告，而是下周计划的起点。自动化创建了一个反馈闭环：目标驱动内容，内容驱动指标，指标驱动复盘，复盘驱动目标。

---

## 五、我犯的错，以及我会怎么重来

**过度设计了 schema。** 初版 JSONL schema 每条记录有 15+ 个字段，大多数都是空的。智能体处理稀疏数据时会表现怪异——它们会尝试填充空字段或对字段的缺失发表评论。我把 schema 削减到 8–10 个核心字段，只在确实有数据时才加可选字段。schema 越简单，智能体表现越好。

**语气指南太长了。** `tone-of-voice.md` 第一版有 1,200 行。智能体一开始表现很好，但到第四段开始漂移，因为语气指令已经落入"中间迷失区"。我重新整理，把最具辨识度的模式（标志性短语、禁用词、开头方式）放在前 100 行，详细示例放在后面。关键规则必须在最前面，不能埋在中间。

**模块边界比你想象的重要。** 我最初把 identity 和 brand 放在一个模块里。智能体在只需要禁用词列表时，会加载我的整个个人简介。把它们拆成两个模块后，纯语气任务的 token 用量降低了 **40%**。每个模块边界都是一个加载决策，搞错了就会加载太多或太少。

**追加写入是不可谈判的底线。** 我曾经因为一个智能体重写了 `posts.jsonl` 而不是追加写入，丢失了三个月的发帖互动数据。JSONL 的追加写入不只是惯例——它是一个安全机制。智能体可以添加数据，不能销毁数据。这是系统里最重要的一个架构决策。

---

## 六、成果与背后的原则

真正的成果比任何指标都简单。我打开 Cursor 或 Claude Code，开始对话，AI 已经知道我是谁、我怎么写东西、我在做什么、我在乎什么。它用我的语气写东西，因为我的语气被编码成了结构化数据。它遵循我的优先级，因为我的目标在一个 YAML 文件里，而它在提建议之前就读了那个文件。它管理我的关系，因为我的联系人和互动记录都在它能查询的文件里。

这背后的原则：**这是上下文工程，不是提示词工程。**

提示词工程问的是"我怎么把这个问题表达得更好？"上下文工程问的是"这个 AI 需要什么信息才能做出正确决策，我如何组织这些信息让模型真正能用到它？"

这是从优化单次交互到设计信息架构的转变。就像写一封好邮件和建立一套好的归档系统的区别——前者帮你一次，后者每次都帮你。

整个系统装在一个 Git 仓库里。克隆到任何机器，把任何 AI 工具指向它，操作系统就运行起来了。零依赖，完全可移植。而且因为是 Git，每一次变更都有版本，每一个决策都可追溯，没有什么是真正失去的。

---

*框架开源地址：[Agent Skills for Context Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) — GitHub 8,000+ Stars，已被学术研究与 Anthropic 相关论文并列引用。*
