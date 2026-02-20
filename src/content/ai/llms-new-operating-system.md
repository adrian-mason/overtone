---
title: "LLMs Are Not Just Models"
subtitle: "They're the New Operating System"
description: "Distilling Andrej Karpathy's framework — dual-file architecture, three-stage training, System 1/2 cognition, and the LLM-as-OS thesis — into a technical argument about where large language models are heading."
date: 2026-02-20
featured: true
tags: ["LLM", "AI", "Karpathy"]
---

*Based on Andrej Karpathy's "[1hr Talk] Intro to Large Language Models"*

---

Andrej Karpathy doesn't just explain how large language models work — he reframes what they *are*. In his landmark talk "Intro to Large Language Models," Karpathy argues that LLMs are not sophisticated autocomplete engines. They are the kernel of a new computing paradigm. This post distills that argument, traces the technical layers beneath it, and explores where it leads.

---

## Two Files, One Mind

At the physical level, a large language model is startlingly minimal. Any frontier model — GPT, Claude, Llama — essentially consists of just two files: a **parameters file** and a **run file**. That's it. The parameters file holds billions of floating-point weights (Llama-2-70B's weighs around 140GB), each number the product of months of optimization across trillions of tokens. The run file, by contrast, can be implemented in under 500 lines of C. It defines the Transformer architecture and tells the hardware how to use those weights to generate text.

This two-file abstraction has a profound implication: once you have the weights, you can run the model anywhere — disconnected from the internet, on local hardware, entirely under your control. The intelligence is in the numbers, not in the cloud.

---

## From Raw Data to Helpful Assistant: Three Stages of Becoming

Training an LLM is not a single act — it's a layered process. Karpathy outlines three stages, each building on the last.

**Pre-training** is the most expensive and computationally intensive phase. The model consumes internet-scale text — books, code, papers, forums — and learns to predict the next token. Llama-3's training run illustrates the scale: 15 trillion tokens, 16,000 H100 GPUs, 400 teraflops of throughput. What emerges is a "base model" with vast factual knowledge but no conversational instincts — it completes documents rather than answers questions.

**Supervised Fine-Tuning (SFT)** bridges that gap. Using roughly 100,000 human-written question-and-answer pairs, developers teach the model to behave like an assistant — to respond helpfully, decline inappropriate requests, and maintain coherent logic across a conversation.

**RLHF (Reinforcement Learning from Human Feedback)** is where alignment happens. Human evaluators compare model outputs and rank them by accuracy, safety, and helpfulness. A reward model learns to simulate those preferences, and the LLM is fine-tuned to maximize that reward signal. The result is not just a safer model — it's a demonstrably better reasoner on complex tasks.

---

## System 1 vs. System 2: The Next Leap in Machine Thinking

Karpathy borrows Daniel Kahneman's dual-process theory to describe a crucial limitation — and a coming breakthrough. Current LLMs operate in **System 1** mode: they generate each token sequentially, with equal computational effort per step. Solving "2+2" and proving a theorem take the same amount of "thinking time." Fast, but brittle.

**System 2** is deliberate, step-by-step reasoning. OpenAI's o1 and o2 models are the first serious attempt at this: before producing a final answer, they run internal chain-of-thought computations, explore multiple solution paths, and self-correct when they detect errors. Crucially, extending inference-time compute — letting the model "think longer" — produces performance gains that follow the same power-law curves as adding more training data. This opens a new dimension of scaling: not just bigger models, but deeper thinking.

---

## The LLM OS: A New Architecture of Intelligence

Here is where Karpathy's thesis becomes most radical. He proposes treating LLMs not as applications, but as the **kernel of a new operating system**. The analogy maps cleanly:

The **context window** is RAM — it holds everything the model is currently "thinking about." **RAG (Retrieval-Augmented Generation)** is the file system — pulling in external knowledge on demand. **Tool integrations** — web search, code execution, API calls via protocols like MCP — are the peripherals and I/O layer. The LLM coordinates all of it, translating natural language intent into structured action.

This architecture has already evolved into **multi-agent systems**. Complex tasks — say, building a software feature from scratch — are decomposed and distributed: one agent designs the architecture, another writes code, another runs tests, another audits for security. They work in parallel, cross-checking each other's outputs. The single monolithic model gives way to a coordinated swarm.

---

## Security in the Age of the LLM OS

With increased power comes a new attack surface. The threats LLMs face aren't traditional code vulnerabilities — they're linguistic and structural.

**Jailbreaking** attempts to bypass safety alignment through clever prompting — roleplay scenarios, encoded instructions, semantic sleight of hand. **Prompt injection**, especially its indirect variant, is more insidious: malicious instructions hidden inside web pages or documents can hijack an LLM agent's behavior mid-task, causing it to exfiltrate data or perform unauthorized actions without the user's awareness.

**Data poisoning** operates at the training level. By inserting maliciously crafted samples with specific trigger phrases into open-source training datasets, attackers can embed backdoors that remain dormant under normal conditions but activate when triggered. As LLMs become critical infrastructure, these supply-chain threats demand the same rigor we apply to securing traditional software pipelines.

---

## Conclusion: The Ghost Is Learning to Think

Karpathy once described early LLMs as "summoning a spirit from the internet" — vast, knowledgeable, but fundamentally uncontrolled. The trajectory he outlines is toward something different: a system that reasons carefully, acts through tools, coordinates with other agents, and aligns its behavior with human values.

The shift from predicting the next token to orchestrating complex workflows is not a matter of adding more parameters. It requires rethinking what training means, what inference means, and what it means for a machine to "think." Karpathy's framework — dual-file architecture, three-stage training, System 1 / System 2 cognition, LLM-as-OS — gives us the vocabulary to ask those questions clearly. And in a domain moving this fast, asking the right questions is half the work.

---

*Source: Andrej Karpathy, "[1hr Talk] Intro to Large Language Models"*
*https://www.youtube.com/watch?v=7xTGNNLPyMI*

<!-- zh -->

*本文基于 Andrej Karpathy 演讲《大型语言模型入门》整理与扩展*

---

卡帕西在他那场极具影响力的演讲《大型语言模型入门》里，做的不只是一次技术科普，而是一次认知重塑。他的核心论点是：大型语言模型不是一个功能强大的文字接龙工具，而是新一代计算范式的操作系统内核。这篇文章将沿着他的思路，一层层拆解这个论点背后的技术逻辑，并试图看清它所指向的未来。

---

## 两个文件，一个"心智"

在物理层面，一个大型语言模型的构成出人意料地简洁：一个参数文件，加上一个运行文件。参数文件存储着数以亿计的浮点权重——Llama-2-70B 的参数文件大约 140GB，每一个数值都是在海量语料上训练数月的结晶。运行文件则相反，精简到几乎可以用不到 500 行 C 代码实现，它定义了 Transformer 架构，并规定了如何用那些权重来生成文字。

这个"双文件"的抽象有一个深刻的含义：只要拿到权重，你就可以在任何地方运行这个模型——断网、本地、完全自主。智能藏在那些数字里，而不在云端。

---

## 从原始语料到智能助手：炼成的三个阶段

训练一个大型语言模型，不是一次性完成的，而是层层递进的过程。卡帕西将其归纳为三个阶段，每一个阶段都在前者的基础上继续塑造模型的能力与性格。

**预训练**是成本最高、算力消耗最密集的阶段。模型在互联网级别的语料上学习预测"下一个词"。Llama-3 的训练规模可以给你一个直观的感受：15 万亿个 Token，16,000 块 H100 GPU。最终得到的"基座模型"知识渊博，但不会对话——它的本能是续写文本，而不是回答问题。

**监督微调**填补了这个空白。开发者用约 10 万条人工编写的对话样本，教会模型如何像助手一样行事：好好回答问题、拒绝不当请求、在对话中保持逻辑连贯。

**人类反馈强化学习（RLHF）**是对齐真正发生的地方。人类评估者对模型生成的多个候选答案进行排序，奖励模型从中学习人类的偏好，LLM 再通过强化学习不断优化自己的生成策略。结果不只是更安全的模型——在复杂推理任务上，它也会变得更好。

---

## 系统 1 与系统 2：机器思维的下一次跨越

卡帕西借用了丹尼尔·卡尼曼的双过程理论，来描述当前 LLM 的一个关键局限——以及即将到来的突破。现有的大多数模型运行在**系统 1** 模式下：逐个生成 Token，每一步计算量固定。回答"2+2"和证明一个数学定理，消耗的"思考时间"是相同的。这种模式很高效，但很脆弱。

**系统 2** 则是缓慢、审慎、具备推理链条的过程。OpenAI 的 o1 系列模型是迄今为止最认真的一次尝试：在给出最终答案之前，模型会进行内部的思维链运算，探索不同路径，并在发现错误时自我修正。更关键的是，延长推理时间所带来的性能提升，遵循着与增加训练算力相似的幂律增长。这开辟了 AI 扩展的新维度：不只是更大的模型，而是更深入的思考。

---

## LLM 操作系统：一种新的智能架构

这是卡帕西论点中最具颠覆性的部分。他提出，LLM 不应被视为一个应用程序，而应被视为新一代操作系统的**内核**。这个类比相当精准：

**上下文窗口**是内存，保存着模型当前处理的全部信息。**RAG**（检索增强生成）是文件系统，按需从外部知识库调取资料。**工具集成**——网页搜索、代码执行、通过 MCP 协议调用外部 API——是外设和 I/O 层。LLM 居于中枢，将自然语言的意图翻译成具体的行动。

这个架构已经进化成了**多智能体系统**。复杂任务——比如从零开始开发一个软件功能——会被拆解并分配：一个智能体负责架构设计，一个负责写代码，一个负责测试，一个负责安全审计。它们并行工作，互相校验。单一的超级模型，让位于协作的智能体集群。

---

## LLM 操作系统时代的安全挑战

权力越大，攻击面也越大。LLM 面临的威胁不是传统的代码漏洞，而是语言层面和结构层面的。

**越狱攻击**试图通过精心构造的提示词绕过安全对齐，常见手法包括角色扮演场景、编码指令、语义混淆。**提示词注入**，尤其是间接注入，则更为隐蔽：藏在网页或文档中的恶意指令，可以在任务执行过程中劫持 LLM 智能体的行为，让它在用户毫无察觉的情况下窃取数据或执行未授权操作。

**数据投毒**则发生在训练层面。攻击者在开源训练数据集中掺入带有特定触发词的恶意样本，从而在模型中埋下暗门——平时表现正常，一旦遇到触发信号便会暴露恶意行为。随着 LLM 逐渐成为关键基础设施，这类供应链威胁需要与保护传统软件流水线同等严肃的对待。

---

## 结语：那个"幽灵"正在学会思考

卡帕西曾将早期的 LLM 描述为"从互联网中召唤出的幽灵"——知识渊博，却根本无法掌控。他所描绘的演进轨迹，指向的是截然不同的东西：一个能够深思熟虑地推理、通过工具采取行动、与其他智能体协同工作、并将自身行为与人类价值观对齐的系统。

从"预测下一个词"到"协调复杂工作流"，这个跨越不是靠堆砌更多参数实现的。它需要重新思考训练意味着什么、推理意味着什么，以及机器"思考"究竟意味着什么。卡帕西的框架——双文件架构、三阶段训练、系统 1 与系统 2 的认知模型、LLM 即操作系统——为我们提供了一套清晰的语言来追问这些问题。而在这个高速演进的领域里，提出正确的问题，本身就是工作的一半。

---

*来源：Andrej Karpathy，《大型语言模型入门》*
*https://www.youtube.com/watch?v=7xTGNNLPyMI*
