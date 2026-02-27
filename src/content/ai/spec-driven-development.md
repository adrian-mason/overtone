---
title: "What Spec-Driven Development Gets Wrong"
subtitle: "And How to Fix It"
zh_title: "规格驱动开发究竟错在哪里"
zh_subtitle: "以及如何真正修好它"
description: "Spec-driven development fails for the same reason all documentation-first initiatives fail: maintenance falls entirely on humans. Augment Code's Intent changes that by making both humans and agents responsible for keeping the spec honest."
date: 2026-02-26T09:00:00
featured: false
tags: ["AI", "Engineering", "Agent"]
---

> *Based on Augment Code's thread [@augmentcode](https://x.com/augmentcode/status/2025993446633492725)*

There's one piece of documentation you can trust 100%.

The code itself.

Not the design doc. Not the changelog. Not the README, the architecture diagram, or the onboarding wiki. Every one of those becomes stale almost the moment it's written — and stale documentation isn't just useless. In the age of coding agents, it's actively dangerous.

---

## The Documentation Problem Nobody Has Solved

We've been trying to solve documentation drift for decades. We've tried process. We've tried tooling. We've tried making it a team value and a cultural norm. None of it has stuck. And the reason is simple: we keep asking humans to do something humans reliably won't do.

Engineers are built for bursts. Write the doc, ship the feature, move on. Keeping a written artifact in sync with a changing system is continuous, invisible work that competes with everything else on a given day — and it loses that competition almost every time. The updating isn't rewarded, isn't visible, and isn't the interesting part. So it doesn't happen.

---

## Why Spec-Driven Development Has the Same Problem

The promise of spec-driven development (SDD) is compelling: instead of just pasting prompts into a chat window and hoping for the best, you write down what you want *before* you unleash coding agents. You give them a plan. Obviously better.

But a spec is a document. And we just established what happens to documents.

The difference with SDD is what's at stake. A stale design doc misleads the next engineer who reads it. A stale spec misleads agents that don't know any better. They'll execute a plan that no longer matches reality — confidently, without flagging that anything is wrong. The agent doesn't have enough context to know the ground has shifted. It just builds.

Every documentation-first initiative in software history has failed for the same reason: it asked developers to do continuous maintenance work that nobody sees and nobody rewards. SDD will fail for the exact same reason — unless the agents do their share of the maintenance.

---

## The Question That Changed the Design

When the team at Augment Code started building **Intent**, the question they kept circling was: *what if the spec wasn't something you maintained? What if it maintained itself?*

The answer they landed on is deceptively simple.

**The spec isn't a human artifact or an agent artifact. Both sides read from it and write to it.**

That single design decision changes everything about how the workflow operates.

---

## How Intent Actually Works

You describe what you want to build. A coordinator agent reads your codebase, drafts a spec, and breaks it into tasks. You look at it, edit it, approve before anything runs. Then agents go to work — and as they work, they write back to the spec: what they found, what changed, what constraints they hit that weren't in the plan.

You can pause at any point, rewrite part of the spec, and agents pick up from the new state.

Think about what happens when you hand a task to a good junior engineer. You give them the ticket, they go off and work on it, and when they discover the API doesn't support pagination the way the ticket assumed, they update the ticket themselves. They don't wait for you to notice something is off. They don't just build the wrong thing. They come back and say: "this assumption was wrong, here's what I did instead, here's why." You review their update and either approve or push back.

That's the relationship Intent is designed to create between the developer and the spec. The ticket stays honest because both sides are maintaining it.

---

## Getting the Granularity Right

The junior engineer analogy goes further than you'd expect. A good junior doesn't narrate every line of code — they surface the decisions that change direction: "I found an existing auth context, so I wired into that instead of creating a new one." That's the signal. That's what you want from agents too.

Getting this granularity right turns out to be one of the genuinely hard design problems in the system. Too much and the spec becomes noise you learn to ignore. Too little and you're back to guessing what happened. The goal is a signal-to-noise ratio that mirrors a good engineering teammate: surfacing the things that matter, not everything.

---

## A Concrete Example

You write: "Add a dark mode toggle to the settings page that respects system preferences."

The coordinator reads your codebase, drafts a spec with three subtasks: add the toggle component, wire it to a preference store, update the CSS variables.

You scan it, notice it missed the bit about persisting the choice across sessions, and add a line.

You approve.

Agents pick up the work.

Fifteen minutes later, one of them has updated the spec: "Found an existing theme context provider in the codebase. Wired into that instead of creating a new store."

You review the code change — clearly grouped by agent and task.

The spec now reflects what was actually built, not what was originally planned. And nobody had to remember to update it.

---

## The Principle

If agents can write code, they can update the plan.

The problem with every previous attempt at spec-first or documentation-first development was the maintenance burden. It fell entirely on humans, it was invisible, and it didn't scale. The insight behind Intent is that the maintenance burden can be shared — and that agents are actually better positioned to handle the mechanical part of it, because they're the ones closest to what actually changed.

This doesn't mean specs become self-sufficient. Human judgment is still in the loop at every meaningful decision point: approving the initial plan, reviewing agent updates, catching when an agent's "found an existing thing, used that" actually deserves more scrutiny. The human doesn't disappear. They just stop being responsible for remembering to update a document.

That's the small shift that might finally make spec-driven development work.

---

*Augment Code builds AI coding tools for professional software engineers working with large codebases. Intent is their approach to multi-agent spec-driven development.*

<!-- zh -->

> *基于 Augment Code 的长推文 [@augmentcode](https://x.com/augmentcode/status/2025993446633492725)*

有一种文档是你可以 100% 信任的。

代码本身。

不是设计文档，不是 Changelog，不是 README，不是架构图，不是入职 Wiki。所有这些东西几乎在写完的瞬间就开始过期——而过期的文档不只是没用，在 AI 编程 Agent 时代，它是主动有害的。

---

## 一个几十年都没解决的问题

我们试过流程管控，试过工具约束，试过把写文档变成团队文化和价值观。都没用。原因很简单：我们一直在要求人类去做人类不会可靠地坚持做的事情。

工程师是"冲刺型"动物——写好文档、交付功能、继续前进。让一个文字产物与持续变化的系统保持同步，是一种连续性的、隐形的工作，它每天都在跟其他所有事情竞争——而且几乎每次都输。更新文档没有奖励，没有可见度，也不是有趣的部分。所以它就不发生了。

---

## 规格驱动开发 (SDD) 有同样的病

SDD 的承诺很诱人：与其把提示词粘贴进聊天窗口、祈祷结果还行，不如在放出 AI Agent 之前先把你想要什么写下来，给它们一个计划。明显比盲飞好。

但规格（spec）是一个文档。而我们刚刚确认了文档的命运。

SDD 和普通文档的区别在于风险的量级。一份过期的设计文档会误导下一个碰巧读到它的工程师。一份过期的 spec 会误导不知情的 Agent——它们会信心满满地执行一个已经不符合现实的计划，而且不会标记任何异常。Agent 没有足够的上下文去判断地基已经移动了，它只管建。

软件历史上每一次"文档先行"的运动都因为同一个原因失败：它要求开发者去做一种没人看到、没人奖励的持续维护工作。SDD 会以完全一样的方式失败——除非 Agent 也承担起维护的责任。

---

## 改变设计的那个问题

Augment Code 在构建 **Intent** 时，团队反复思考的问题是：*如果规格不是你维护的东西，而是它自己维护自己呢？*

他们最终落地的答案出乎意料地简单。

**规格不是人的产物，也不是 Agent 的产物。双方都从它这里读，也都向它写。**

这一个设计决策，改变了整个工作流的运作方式。

---

## Intent 实际上怎么工作

你描述你想构建什么。一个协调 Agent 读取你的代码库，起草一份规格，把它拆分成一组任务。你看一遍，编辑，在任何东西开始运行之前先审批。然后 Agent 开始工作——在工作过程中，它们把发现的情况写回规格：找到了什么、哪里变了、遇到了哪些计划之外的约束。

你可以在任意时刻暂停，重写规格的某个部分，Agent 从新的状态继续。

想象一下把任务交给一个好的初级工程师时会发生什么。你给他 ticket，他去做，当他发现 API 不支持 ticket 里假设的分页方式时，他自己更新 ticket。他不会等你发现哪里不对。他不会直接把错误的东西建出来。他回来说："这个假设是错的，我改成了这样，原因是这个。"你审阅他的更新，要么批准，要么提出异议。

这就是 Intent 想要在开发者和规格之间建立的关系。ticket 保持诚实，因为双方都在维护它。

---

## 粒度：一个被低估的设计难题

初级工程师的类比比你想象的更深刻。一个好的初级不会叙述每一行代码——他只会把改变方向的决策浮出水面："我找到了一个已有的 auth context，所以我直接接进去，没有新建一个。"这才是信号。这也是你希望从 Agent 那里得到的东西。

把这个粒度调到位，是系统里真正有趣的设计难题之一。太多了，规格变成噪音，你学会忽略它。太少了，你又回到猜测发生了什么的状态。目标是一个信噪比，让它像一个好的工程团队成员：浮出重要的事情，不是所有事情。

---

## 一个具体的例子

你写道："给设置页面加一个深色模式开关，尊重系统偏好。"

协调 Agent 读取你的代码库，起草了一份规格，包含三个子任务：添加开关组件、接入偏好存储、更新 CSS 变量。

你扫了一遍，发现它漏掉了"跨会话持久化用户选择"这一条，补了一行。

你审批。

Agent 开始工作。

15 分钟后，其中一个 Agent 已经更新了规格："在代码库里找到了已有的 theme context provider，接入了那个，没有新建存储。"

你审阅代码变更——清晰地按 Agent 和任务分组。

规格现在反映的是实际构建的内容，不是最初计划的内容。没有任何人需要记得去更新它。

---

## 背后的原则

如果 Agent 能写代码，它们就能更新计划。

之前所有"规格优先"或"文档优先"尝试的问题，在于维护负担完全压在人身上，它不可见，它不规模化。Intent 背后的洞见是：维护负担可以共同承担——而且 Agent 实际上更适合处理其中的机械性部分，因为它们离真正发生变化的地方最近。

这不意味着规格变得自给自足。人类的判断仍然在每个有意义的决策节点上参与：审批初始计划、审阅 Agent 的更新、判断某个 Agent 的"找到了已有的东西，用了那个"是否值得更仔细审视。人并没有消失，他们只是不再负责记得去更新一个文档了。

这个小小的转变，或许正是让规格驱动开发真正奏效的那把钥匙。

---

*Augment Code 为面向专业软件工程师和大型代码库的 AI 编程工具。Intent 是他们在多智能体规格驱动开发上的答案。*
