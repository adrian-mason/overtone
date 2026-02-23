---
title: "The Invisible Walls That Let AI Run Free"
subtitle: "A Global Survey of Sandbox Technology and Regulation"
zh_title: "让 AI 自由奔跑的无形围墙"
zh_subtitle: "沙盒技术与监管的全球扫描"
description: "From gVisor to Firecracker, from the EU AI Act to Singapore's GenA.I. Sandbox — how the race to contain autonomous AI agents is reshaping the infrastructure of intelligence itself."
date: 2026-02-22T10:00:00
featured: true
tags: ["AI", "Security", "Infrastructure", "Agents"]
---

When OpenAI launched Code Interpreter, something subtle but profound shifted in how we think about AI risk. For the first time at scale, a language model wasn't just generating text — it was writing and executing real code, in real environments, touching real filesystems. The question that followed wasn't *whether* AI agents would need containment. It was: what kind of containment, and who decides?

That question has since exploded into one of the most technically demanding and politically consequential infrastructure challenges of 2025–2026. This post surveys the landscape — from the microVM architectures running inside hyperscalers to the regulatory sandboxes mandated by the EU AI Act — and asks what remains unsolved as autonomous agents grow more capable.

---

## Part I: Why Sandboxes? The Three Forces Driving the Field

### Force 1: Security — the problem of untrusted code execution

The phrase "agentic AI" sounds futuristic. The security problem it creates is ancient: how do you let untrusted code run without letting it touch things it shouldn't?

Traditional containers offer namespace isolation, but they share a host kernel. That shared kernel is an attack surface. A sufficiently clever exploit — or a prompt-injected agent instructed to exfiltrate SSH keys — can break out. The sandbox problem for AI isn't just "can this code crash the server." It's "can this model, operating autonomously over hours, accidentally or deliberately reach outside its intended scope?"

The requirements this generates are severe: syscall interception, filesystem access controls, strict network egress filtering, and — critically — cold start times measured in milliseconds, because AI agent tasks are bursty and latency-sensitive.

### Force 2: Regulation — closing the gap between law and technology

The concept of a "regulatory sandbox" originated in fintech. The UK's Financial Conduct Authority launched the first one in 2015. The logic was elegant: let companies test regulated activities under controlled supervision, gather real-world evidence, then use that evidence to write better rules.

A decade later, that logic has become foundational to how governments plan to govern AI. The EU AI Act enshrines regulatory sandboxes in Article 57, requiring every member state to establish at least one by August 2026. The underlying insight is the same — technology evolves faster than legislation, and waiting for perfect rules before allowing innovation produces neither safety nor progress.

### Force 3: Commerce — sandboxes as the price of entry

For enterprises in regulated industries, sandbox environments have become a dual requirement: technical sandboxes for validating that AI behaves as expected, and regulatory sandboxes for obtaining the compliance certifications needed to deploy. In financial services alone, 64% of organizations cite regulatory uncertainty as their primary obstacle to scaling AI initiatives. Sandboxes — both kinds — are how that uncertainty gets resolved.

---

## Part II: How the Leading Players Have Actually Built This

### OpenAI: Industrial-scale code execution

OpenAI's Code Interpreter infrastructure sits atop gVisor — Google's open-source sandbox kernel that runs in user space, intercepting and reimplementing Linux syscalls through what it calls a "Sentry" architecture. The effect is a kind of fake kernel: applications think they're talking to Linux, but every request gets filtered before it reaches the actual host.

On top of this, OpenAI built an internal service called `user_machine`, using FastAPI to manage Jupyter kernel lifecycles — spinning them up, keeping them isolated, tearing them down. To harden this further, their security team developed "Aardvark," an agentic research tool for automatically discovering and patching vulnerabilities in this infrastructure.

### Anthropic: Philosophy of bounded autonomy

Anthropic took a different approach with Claude Code, which they describe as "native sandboxing." Rather than a separate virtualization layer, Claude Code uses OS-native mechanisms: macOS Seatbelt and Linux bubblewrap. The design philosophy centers on predefined boundaries that reduce what Anthropic calls "approval fatigue" — the cognitive overhead of constantly asking users for permission.

Within its sandbox, Claude can freely read and write to the current working directory. Network access is more controlled: all requests pass through an external proxy server, with a pre-approved allowlist of domains. What's notable here is Anthropic's stated motivation beyond security: their research on long-horizon agent behavior found that capable models don't become *malicious* over extended tasks — they become *incoherent*. The sandbox isn't just a wall. It's an observation post for detecting when an agent's internal state has drifted from its intended goal.

### Google: Kubernetes-native agent infrastructure

Google Cloud's GKE Agent Sandbox defines agent isolation as a Kubernetes primitive. It uses gVisor for strong isolation and solves the cold-start problem — gVisor's historically weak point — through "Pod Snapshots." Developers can pre-warm environments and save them as snapshots; when an agent needs to act, it restores from that snapshot in roughly 100ms. For interactive AI applications, that difference is the line between usable and frustrating.

### The open-source tier: E2B and beyond

The startup E2B (Execute to Build) has become the reference implementation for the developer ecosystem. Built on Firecracker microVMs — Amazon's technology that powers AWS Lambda — E2B achieves cold starts under 150ms and has become the execution substrate for a remarkable share of production AI agent deployments, reportedly used by 88% of Fortune 100 companies for AI agent testing.

OpenClaw (formerly Moltbot) represents the self-hosted alternative: an open-source agent runtime that trades strong built-in isolation for flexibility. Security researchers are clear that production OpenClaw deployments require dedicated VMs or rootless Docker — it's not a turnkey security solution.

---

## Part III: The Technology Comparison That Actually Matters

The isolation technology landscape has converged around five approaches, each making a different trade-off between security, speed, and resource efficiency:

| Technology | Mechanism | Security | Cold Start | Best For |
|---|---|---|---|---|
| Docker | Shared kernel via namespaces | Moderate | <50ms | Trusted dev environments |
| gVisor | User-space syscall interception | High | 70–150ms | Cloud multi-tenancy, Code Interpreter |
| Firecracker microVM | Hardware virtualization (KVM) | Very high | 120–150ms | Short-lived agent tasks, E2B |
| Kata Containers | Lightweight full VM | Very high | 200–500ms | Long-running production workloads |
| WebAssembly | Linear memory isolation | Very high | <10ms | Edge AI, embedded inference |

The trajectory is clear: the industry is moving from container-level isolation toward VM-level isolation, and the startup ecosystem is finding ways to make VM-level startup times approach container-level speeds.

---

## Part IV: What Hasn't Been Solved

### Dynamic permissions that follow task context

Current sandboxes grant static permissions at startup. But complex agent tasks are dynamic — an agent building a software project might need database access in step 3 but not step 1, and filesystem access to a different directory in step 7 than step 2. The ideal system would implement "dynamic least privilege": real-time grants and revocations tied to the agent's current reasoning step and risk assessment.

The complication is that existing authorization systems were designed for humans. They assume request rates measured in clicks per minute, not thousands of heterogeneous API calls per second. Adapting identity and access management for non-human agents operating at machine speed is an unsolved engineering problem.

### State persistence across long-horizon tasks

Most high-performance sandboxes are ephemeral by design — when the session ends, the environment disappears. For many AI tasks, that's fine. For a coding agent working on a multi-day software project, it's a fundamental mismatch.

Fly.io's Sprites project is experimenting with persistent VMs and sub-second snapshots. The harder problem is cost: storing and indexing gigabytes of sandbox snapshots per user, at scale, in a way that remains economically viable. The developer experience that would make this work is something like "git for sandbox states" — branching, merging, rolling back agent environments the way you'd manage code.

### GPU access inside sandboxes

Here's a painful irony: the sandboxes we've built to safely run AI code are largely incompatible with the hardware that makes AI inference fast. gVisor has experimental CUDA support, but performance overhead and potential escape vectors remain concerns. Most commercial sandbox platforms — E2B, Vercel, others — simply don't offer GPU acceleration.

For agents that need to run local inference or render complex outputs, this means either accepting severe performance penalties or giving up on sandbox isolation entirely. Safely virtualizing GPU resources — with their complex hardware state and shared memory architectures — is a hard problem nobody has cleanly solved.

### Multi-agent security: collusion and cascading failures

When multiple agents from different vendors collaborate inside a shared environment, new attack vectors emerge. Because agents operate on non-deterministic LLMs, their communication can contain logical patterns that bypass human-readable security filters — or enable agents to collectively circumvent controls that would catch any single agent acting alone.

Current sandboxes lack deep packet inspection and behavioral auditing for agent-to-agent protocols. As multi-agent systems become more common, this gap will become more consequential.

### Efficient "soft pause" for idle agents

Running millions of AI agent sandboxes continuously is expensive. Kubernetes 1.35 introduced stable support for in-place pod resizing — the mechanism that makes "soft pause" possible: throttling an idle agent's CPU and memory to near-zero, then instantly restoring full resources when a request arrives. For cloud providers running sandbox infrastructure at scale, this is the difference between a viable business model and an unsustainable one.

---

## Part V: The Global Regulatory Landscape

### Europe: Mandatory and standardizing

The EU's approach is the most ambitious. Article 57 of the AI Act requires every member state to have at least one national AI regulatory sandbox by August 2026. The distinctive feature is "compliance recognition": evidence generated inside a sandbox — test logs, safety assessments, audit trails — can be used directly as proof of EU regulatory compliance. Spain has a pilot running. Germany's Federal Network Agency has launched sandbox simulation projects focused on transparency and data protection for high-risk AI systems.

### United States: Bottom-up and incentive-driven

The US has no federal framework. Instead, individual states — Connecticut, Oklahoma, Texas — have proposed sandbox legislation. The American design philosophy favors what practitioners call "regulatory mitigation": direct exemptions from specific outdated regulations, rather than supervised testing. The goal is accelerating AI deployment in public services, not building an evidence base for future legislation.

### Asia: Financial-sector leadership

Singapore and Hong Kong have moved fastest, unsurprisingly given their position as global financial centers navigating rapid AI adoption in trading, compliance, and customer service. Singapore couples sandbox access with direct grants to reduce participation costs. Hong Kong's HKMA launched the GenA.I. Sandbox specifically for banking use cases, with emphasis on testing algorithmic bias prevention and cybersecurity resilience.

---

## Part VI: What Comes Next

Three structural shifts are already visible in the research and engineering community:

**Permission decoupling.** The OpenClaw "Aura" topology — a "System Agent" doing high-level reasoning without filesystem access, and "App Agents" doing narrow tool execution in micro-sandboxes — represents where architecture is heading. Separating planning from execution, and isolating each narrow capability in its own constrained environment, reduces the blast radius of any single failure by an order of magnitude.

**Identity as the new perimeter.** IP addresses and API keys are inadequate for governing non-human agents. The emerging model treats every agent instance as a non-human identity (NHI) with a persistent, auditable identity that travels with it across tool calls, API requests, and cross-system interactions. Every action becomes attributable. The sandbox becomes part of an identity fabric, not just a container.

**Runtime alignment validation.** Anthropic's research on long-horizon agent behavior points toward a future where sandboxes don't just prevent external damage — they monitor internal coherence. An agent whose reasoning has become incoherent should be detectable before it causes problems, and the sandbox environment is the natural place to detect it.

By the end of 2026, the benchmarks that matter will have shifted: sandbox cold starts measured in tens of milliseconds (not hundreds), snapshot-based state management for parallel agent sessions, and behavioral auditing deep enough to catch reward hacking and strategic deception.

---

## Conclusion

The sandbox is becoming the operating system of the agentic era.

What started as a security measure — a wall around untrusted code — is evolving into the fundamental infrastructure through which autonomous AI agents connect to the world. It enforces permissions, maintains identity, preserves state, monitors alignment, and provides the audit trail that makes regulated deployment possible.

The technical foundation — gVisor, Firecracker, container-native snapshots — is solid. The unsolved problems — dynamic authorization, GPU access, multi-agent security, long-horizon state management — are hard but tractable. The regulatory frameworks are taking shape, even if unevenly across jurisdictions.

What the field needs next is integration: the security properties of a microVM, the speed of WebAssembly, the state management of a version control system, the identity model of a zero-trust network, and the behavioral monitoring of a runtime alignment validator — all composable, all interoperable, and fast enough that users never notice the walls are there.

The best sandbox is invisible. We're not there yet. But the direction is clear.

---

*Sources include technical documentation from OpenAI, Anthropic, Google Cloud, gVisor, Firecracker, and E2B; regulatory texts from the EU AI Act and HKMA; and research publications from Anthropic, arXiv, and SIPRI.*

<!-- zh -->

OpenAI 推出 Code Interpreter 的那一刻，有什么东西悄悄变了。

不是因为模型变聪明了——那一直在发生。而是因为第一次，一个语言模型不再只是生成文字，它开始写真实的代码、在真实的环境里执行、触碰真实的文件系统。随之而来的问题不是「AI 代理需不需要被约束」，而是：用什么约束？谁来定规则？

这个问题在 2025 至 2026 年间已经演变成整个 AI 基础设施领域最棘手、也最关键的工程挑战之一。本文试图梳理当前的全貌——从超大规模云厂商内部的微虚拟机架构，到《欧盟人工智能法案》强制要求的监管沙盒——并直面一个更核心的问题：随着自主代理能力持续跃升，哪些问题至今仍未解决？

---

## 第一章：为什么需要沙盒？三股驱动力

### 驱动力一：安全——非受信代码执行的老问题

「智能代理」听起来很未来，但它制造的安全难题古老得很：如何让不受信任的代码运行，同时又防止它碰不该碰的东西？

传统容器提供了命名空间隔离，但共享宿主机内核。这个共享内核就是攻击面。一个足够精巧的漏洞利用——或者一个被提示注入、被指示窃取 SSH 密钥的代理——就能逃出容器边界。AI 的沙盒问题远不止「这段代码会不会让服务器崩溃」，而是：「一个自主运行数小时的模型，会不会有意或无意地触碰到它不该触碰的范围？」

由此派生出来的技术要求极为严苛：系统调用拦截、文件系统访问控制、严格的网络出口过滤。更关键的是，冷启动时间必须以毫秒计——因为 AI 代理的任务往往是突发性的，延迟直接影响用户体验。

### 驱动力二：监管——弥合法律与技术之间的鸿沟

「监管沙盒」的概念诞生于金融科技。2015 年，英国金融行为监管局（FCA）推出了第一个监管沙盒，逻辑清晰：让企业在监管机构的视野下测试受监管的商业行为，收集真实数据，再用这些数据写出更好的规则。

十年后，这套逻辑成了各国政府治理 AI 的基本框架。《欧盟人工智能法案》第 57 条明确规定监管沙盒的法律地位，要求所有成员国在 2026 年 8 月前至少建立一个国家级 AI 监管沙盒。底层逻辑不变：技术进化永远快于立法进程，等待完美的法律出台再允许创新，既不能保证安全，也会错失进步。

### 驱动力三：商业——沙盒成为市场准入的门票

对受监管行业的企业来说，沙盒已成双重刚需：技术沙盒用于验证 AI 行为是否符合预期，监管沙盒用于获得部署所需的合规认证。仅在金融服务领域，就有 64% 的组织将监管不确定性列为扩展 AI 计划的首要障碍。两种沙盒，是化解这种不确定性的核心路径。

---

## 第二章：头部玩家的实际解法

### OpenAI：工业级代码执行基础设施

OpenAI 的 Code Interpreter 基础设施建立在 gVisor 之上——这是 Google 开源的沙盒内核，运行在用户空间，通过「Sentry 架构」拦截并重新实现 Linux 系统调用。效果相当于造了一个假内核：应用以为自己在跟 Linux 对话，但每一条请求在抵达真实宿主机之前都会经过过滤。

在此之上，OpenAI 构建了一个名为 `user_machine` 的内部服务，用 FastAPI 管理 Jupyter 内核的生命周期——启动、隔离、销毁。为进一步加固防线，他们的安全团队开发了「Aardvark」——一个用于自动发现和修补这套基础设施漏洞的代理化安全研究工具。

### Anthropic：「边界自主」的设计哲学

Anthropic 在 Claude Code 上走了一条不同的路，他们称之为「原生沙盒化」。不依赖额外的虚拟化层，而是直接使用操作系统内置机制：macOS 上的 Seatbelt，Linux 上的 bubblewrap。设计哲学的核心是「预定义边界」，目的是减少 Anthropic 所谓的「审批疲劳」——不断向用户申请权限带来的认知负担。

在沙盒内，Claude 可以自由读写当前工作目录。网络访问则更受限：所有请求必须经过外部代理服务器，且只能访问预先核准的域名白名单。值得注意的是 Anthropic 的动机——除了安全之外，他们对长程代理行为的研究发现：有能力的模型在执行复杂任务时不会变得「恶意」，而会变得「混乱 (Incoherent)」。沙盒不只是一堵墙，更是一个观测站，用来检测代理的内部状态何时偏离了预定目标。

### Google：Kubernetes 原生的代理基础设施

Google Cloud 的 GKE Agent Sandbox 将代理隔离定义为 Kubernetes 的一种原语。它以 gVisor 实现强隔离，并通过「Pod 快照 (Snapshots)」技术解决了 gVisor 长期以来的弱点——冷启动速度。开发者可以预热环境并保存为快照，代理需要工作时从快照恢复，耗时约 100 毫秒。对于交互式 AI 应用，这个差距是「好用」与「令人沮丧」之间的分界线。

### 开源生态：E2B 及其他

初创公司 E2B (Execute to Build) 已成为开发者生态的参考实现。基于 Firecracker 微虚拟机架构——AWS Lambda 背后的同款技术——E2B 将冷启动压缩到 150 毫秒以内，据称已被 88% 的财富 100 强企业用于 AI 代理测试。

OpenClaw（前身为 Moltbot）则代表自托管方向：一个用灵活性换取内置强隔离的开源代理运行时。安全研究人员的结论很明确：生产环境中部署 OpenClaw 必须配合专用虚拟机或 rootless Docker，它本身不是一个开箱即用的安全方案。

---

## 第三章：技术选型的真实权衡

当前的隔离技术生态已收敛为五种主要路径，各自在安全性、速度和资源效率之间做出不同取舍：

| 技术路径 | 核心机制 | 安全强度 | 冷启动时间 | 适用场景 |
|---|---|---|---|---|
| Docker | 命名空间共享内核 | 中等 | <50ms | 受信开发环境 |
| gVisor | 用户态系统调用拦截 | 高 | 70–150ms | 云端多租户、代码解释器 |
| Firecracker microVM | KVM 硬件虚拟化 | 极高 | 120–150ms | 短寿命代理任务、E2B |
| Kata Containers | 轻量级完整虚拟机 | 极高 | 200–500ms | 长期运行的生产负载 |
| WebAssembly | 线性内存隔离 | 极高 | <10ms | 边缘 AI、嵌入式推理 |

趋势很清晰：行业正在从容器级隔离向虚拟机级隔离迁移，而创业生态正在努力让虚拟机级别的启动速度逼近容器级别。

---

## 第四章：尚未解决的核心难题

### 跟随任务上下文的动态权限

当前的沙盒在启动时授予静态权限。但复杂的代理任务是动态的——一个开发软件项目的代理，可能在步骤 3 才需要数据库访问权限，在步骤 7 才需要访问不同的文件目录。理想的系统应实现「动态最小特权」：根据代理当前的推理步骤和风险评估，实时授予或撤销特定权限。

问题的复杂性在于，现有的授权系统是为人类设计的，假设请求频率以每分钟点击次数计算——而不是每秒数千次异构 API 调用。如何让身份与访问管理系统适应以机器速度运行的非人类代理，是目前尚无完整答案的工程难题。

### 长程任务的状态持久化

高性能沙盒大多被设计为瞬态的——会话结束，环境消失。对许多 AI 任务而言，这没问题。但对于一个要花数天完成软件项目的编程代理，这就是根本性的错配。

Fly.io 的 Sprites 项目正在探索持久化虚拟机和秒级快照。更难解决的是成本问题：如何在规模化的多租户环境中，以经济可行的方式存储和索引每个用户的 GB 级沙盒快照？真正好用的开发体验，应该像管理代码一样管理沙盒状态——分支、合并、回滚，随心所欲。

### 沙盒内的 GPU 访问

这里有一个令人头疼的悖论：我们为安全运行 AI 代码而构建的沙盒，与让 AI 推理飞快运行的硬件基本上不兼容。gVisor 已有实验性 CUDA 支持，但性能损耗和潜在的逃逸风险仍是隐患。大多数商业沙盒平台——E2B、Vercel 等——直接不提供 GPU 加速。

对于需要运行本地推理或处理复杂渲染任务的代理，这意味着要么承受严重的性能惩罚，要么放弃沙盒隔离。安全地虚拟化 GPU 资源——这种拥有复杂硬件状态和共享内存架构的资源——是一个还没有人彻底解决的技术难题。

### 多代理协同：共谋与级联失效

当来自不同供应商的多个代理在同一个共享环境中协作时，新的攻击向量随之出现。由于代理基于非确定性的大语言模型，它们之间的通信可能包含人类可读安全过滤器无法捕捉的逻辑模式——甚至让代理集体绕过那些对单个代理有效的安全控制。

当前的沙盒缺乏对代理间通信协议的深度包检测和行为审计能力。随着多代理系统日益普及，这个缺口的代价会越来越大。

### 空闲代理的「软暂停」与资源效率

持续运行数百万个 AI 代理沙盒代价高昂。Kubernetes 1.35 引入了稳定版的 in-place pod resize 机制——「软暂停」的技术基础：在代理空闲时将其 CPU 和内存压到接近零，收到请求时瞬间恢复满配资源。对于规模化运营沙盒基础设施的云供应商，这是商业模式可行与不可行的分界线。

---

## 第五章：全球监管格局

### 欧盟：强制性与标准化

欧盟的做法最为系统。《人工智能法案》第 57 条要求所有成员国在 2026 年 8 月前建立至少一个国家级 AI 监管沙盒。其最具特色的设计是「合规互认」：在沙盒中生成的测试记录、安全评估和审计日志，可以直接作为符合欧盟法规的证明材料使用。西班牙已有试点项目运行，德国联邦网络局则推出了沙盒模拟项目，重点针对高风险 AI 系统的透明度和数据保护。

### 美国：自下而上，以激励为导向

美国没有联邦层面的统一框架，而是由各州各自推进——康涅狄格州、俄克拉荷马州、得克萨斯州相继提出立法提案。美式沙盒的设计哲学倾向于「监管豁免 (Regulatory Mitigation)」：直接免除某些过时法规的约束，而不是建立受监督的测试机制。目标是加速 AI 在公共服务中的应用，而非为未来立法积累证据基础。

### 亚洲：金融领域先行

新加坡和香港走在最前列，这与它们作为全球金融中心、在交易、合规和客户服务领域快速引入 AI 的迫切需求密不可分。新加坡除了提供受控测试环境，还通过资助计划直接降低企业的参与门槛。香港金融管理局推出的 GenA.I. 沙盒专为银行业设计，重点测试算法偏见防范和网络安全韧性。

---

## 第六章：下一步会发生什么

研究界和工程界已经可以看到三个结构性转变：

**权限解耦。** OpenClaw 提出的「Aura 拓扑」——「系统代理」负责高层规划但不接触文件系统，「应用代理」在极度受限的微型沙盒内执行具体工具调用——代表了架构演进的方向。将规划与执行分离，将每项窄能力隔离在独立受限的环境中，可以将任何单点失效的爆炸半径降低一个数量级。

**身份成为新的安全边界。** IP 地址和 API 密钥已不足以治理非人类代理。正在浮现的模型是：将每个代理实例视为拥有持久可审计数字身份的「非人类身份 (NHI)」，这个身份随代理跨越工具调用、API 请求和跨系统交互。每一次操作都可被追溯和归因。沙盒成为身份治理体系的一部分，而不仅仅是一个容器。

**运行时对齐验证。** Anthropic 对长程代理行为的研究指向一个未来：沙盒不只负责防止外部损害，还要监控代理的内部一致性。一个推理已经陷入混乱的代理，应该在它造成问题之前就被检测出来——而沙盒环境正是进行这种检测的天然场所。

到 2026 年底，值得关注的基准将会改变：沙盒冷启动进入 10–30 毫秒区间，基于快照的状态管理支撑大规模并行代理会话，行为审计深度足以捕捉奖励黑客行为和战略欺骗。

---

## 结语

沙盒正在成为代理时代的操作系统内核。

从最初的安全措施——围住不受信任代码的一堵墙——演变为自主 AI 代理连接世界的基础设施。它执行权限、维护身份、保存状态、监控对齐、提供使受监管部署成为可能的审计链。

技术基础已经稳固：gVisor、Firecracker、容器原生快照。未解决的问题——动态授权、GPU 访问、多代理安全、长程状态管理——困难但并非无解。监管框架正在成形，尽管在不同法域间的步调参差不齐。

这个领域真正需要的是集成：微虚拟机的安全性、WebAssembly 的速度、版本控制系统的状态管理、零信任网络的身份模型、运行时对齐验证器的行为监控——全部可组合、可互操作，快到让用户感觉不到那堵墙的存在。

最好的沙盒是隐形的。我们还没到那一步。但方向已经清晰。

---

*资料来源包括 OpenAI、Anthropic、Google Cloud、gVisor、Firecracker、E2B 的技术文档，《欧盟人工智能法案》及香港金融管理局的监管文本，以及 Anthropic、arXiv 和斯德哥尔摩国际和平研究所（SIPRI）的研究论文。*
