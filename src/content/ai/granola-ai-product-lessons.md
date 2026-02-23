---
title: "Building AI Products People Actually Love"
subtitle: "Lessons from Granola"
zh_title: "打造真正让人爱用的 AI 产品"
zh_subtitle: "从 Granola 学到的事"
description: "How Granola's philosophy of restraint, radical simplicity, and augmentation over replacement created a meeting tool users call life-changing."
date: 2026-02-20T09:30:00
featured: false
tags: ["AI", "Product", "Startup"]
---

In a market crowded with AI-powered meeting tools, one product has quietly earned a reputation that most startups can only dream of: users calling it *life-changing*. Granola, a note-taking app built for the age of AI meetings, has become a quiet favorite among Silicon Valley's most demanding knowledge workers. In a recent interview, CEO Chris Pedregal pulled back the curtain on the thinking that shaped the product — and it turns out, the real lessons have less to do with technology than with philosophy.

---

## I. Vision: From Meeting Recorder to "Tool for Thought"

The first and most fundamental question in AI product design is deceptively simple: should AI *replace* humans, or *augment* them? Granola has a clear answer rooted in intellectual history. The product draws direct inspiration from Douglas Engelbart's 1950s vision of "augmenting human intelligence" — the idea that the highest purpose of computing is not to make humans obsolete, but to make them more capable. Think less WALL-E, more Iron Man's JARVIS.

Apps like Otter and Fireflies have existed for nearly a decade. They record meetings and spit out transcripts. Granola decided from day one that this was the wrong goal. Instead of becoming a "meeting archive," Granola set out to build a context-aware AI workspace — a genuine second brain that helps knowledge workers offload low-level cognitive tasks so they can focus on what actually matters: thinking, deciding, and acting.

---

## II. Design Philosophy: Radical Simplicity and the Invisible Product

In the current AI landscape, shipping features is easy. The hard part is knowing what *not* to build. Granola's design philosophy can be summarized in one word: restraint. Most competing tools join video calls as a visible "bot" — a little avatar that announces itself in the participant list. This generates viral word-of-mouth, sure. But it also creates a social awkwardness; attendees feel watched, and privacy concerns surface immediately. Granola made the counterintuitive call to kill the bot entirely, running silently in the background instead.

Their benchmark for reliability is not another AI tool — it's Apple Notes. The simplest, most invisible, most dependable piece of software on any Mac. That's the bar Granola holds itself to. This meant building an experience that works equally well in Zoom, Google Meet, WhatsApp calls, and even fully offline, in-person meetings. The moment you have to think about whether the tool is working, the tool has already failed.

Perhaps the most striking expression of this philosophy came after a year of private beta testing. Granola's team listened to hundreds of hours of user feedback — and then cut 50% of the product's features and UI. Not added. *Cut*. They understood that in a world of complex, high-stakes work, people don't need a control panel full of buttons. They need something simple, focused, and almost magical in how smoothly it fits into their workflow.

---

## III. Go-to-Market: Strategic Patience and Precision Targeting

The conventional startup wisdom is "ship fast, learn fast." Granola deliberately did the opposite. Before any public launch, the team spent a full year in stealth mode, refining the product in private. The reasoning is sharp: release too early to tens of thousands of users, and you'll spend all your time triaging bugs you already know about. You burn engineering cycles on noise instead of signal. In a crowded category, the team believed that showing up with something *polished and genuinely surprising* was worth the wait.

Their cold-start strategy was equally deliberate. Rather than trying to appeal to everyone, Granola chose venture capitalists as their very first user cohort. The logic is elegant: VCs have highly repetitive, structured meetings — term sheet reviews, portfolio check-ins, LP updates. Their use cases are easy to optimize for, and their feedback is precise. Once Granola had cracked that audience, they graduated to a harder one: founders. People with chaotic, high-stakes, wildly varied meeting schedules. If you can satisfy a demanding founder, you can almost certainly satisfy anyone else.

There's also a quieter strategic insight buried in the company's geography. Granola is a Silicon Valley product — built for American knowledge workers, funded in the American tech ecosystem — but the team is based in London. This is geographic arbitrage by design. London keeps them away from the noise and groupthink of the Valley's AI echo chamber while giving them access to world-class European engineering and design talent. Distance, it turns out, can be a competitive advantage.

---

## IV. The Tech Stack: Hiding Complexity, Building Trust

Granola doesn't try to build its own foundation model. Instead, it runs on the best third-party LLMs available — OpenAI, Anthropic, and others — and invests its engineering energy where it matters most: prompt engineering, context management, and user experience. This is a deliberate bet: rather than racing to build proprietary AI infrastructure, they're racing to understand their users better than anyone else.

The intelligence of the system is largely invisible to users. When a VC and a founder are in the same meeting, Granola doesn't generate a single generic summary — it generates separate notes tailored to each person's perspective, responsibilities, and likely follow-up actions. The model selection, prompt structure, and personalization logic are entirely hidden. This is not a dashboard; it's a tool that thinks for itself, on your behalf.

On privacy, Granola has drawn a firm line: no audio or video is ever stored. This single design decision dramatically reduces the product's perceived intrusiveness and builds the kind of trust that's impossible to buy with marketing. However, Granola does retain meeting transcripts — and this is by design too. AI hallucinates. Users need to be able to verify the source when something in a summary doesn't look right. The transcript is the receipts.

Perhaps the most technically ambitious decision Granola has made is their refusal to rely solely on RAG (Retrieval-Augmented Generation) for complex, cross-meeting queries. RAG is cheaper and faster, but it fails at nuanced questions like "across all my meetings this year, where have I been unclear in my explanations?" Answering that requires understanding context holistically, not retrieving fragments. So Granola absorbs the higher inference cost and stuffs entire bodies of meeting history into long-context windows. Their reasoning: build for the capabilities of AI a year from now, not today.

---

## Conclusion: The Most Beloved AI Products Are the Quietest

Granola's story is ultimately a story about restraint in an industry obsessed with maximalism. The product that became "life-changing" for its users didn't get there by shipping more features, raising bigger rounds, or moving faster. It got there by being *more careful* — about what to build, who to build it for, when to release it, and above all, whose interests it was truly serving.

In the AI era, the best products are not necessarily the most feature-rich. They are the ones that disappear into your workflow so completely that you forget they're there — until the day they're not, and everything feels a little harder. Tools that augment rather than replace. Tools that earn trust through what they *don't* do as much as what they do. Granola is a compelling case that in the race to build AI products people love, the winner might just be whoever learns first to get out of the way.

---

*Source: Based on a video interview with Granola CEO Chris Pedregal. Watch the original conversation [here](https://youtu.be/IcbuTTVUY7M?si=DISl_RVHxg9O9pWn).*

<!-- zh -->

在竞争激烈的 AI 会议工具赛道中，有一款产品悄然赢得了大多数创业公司可望而不可即的口碑：用户们称它「改变了自己的生活」。这款产品叫 Granola——一款专为 AI 时代知识工作者打造的会议笔记应用，在硅谷技术圈内广受好评。在一次深度访谈中，CEO Chris Pedregal 分享了塑造这款产品的核心理念。读完你会发现，真正值得学习的，与其说是技术，不如说是一种思维方式。

---

## 一、产品愿景：从「会议记录器」到「思维工具」

打造 AI 产品时，最根本的命题其实很简单：AI 应该「替代」人，还是「增强」人？Granola 给出了一个有思想渊源的答案。他们深受 20 世纪 50 年代先驱 Douglas Engelbart「增强人类智能」理念的启发——计算机最崇高的使命，不是让人类变得多余，而是让人类变得更强大。不是《机器人总动员》里那些退化的人类，而是钢铁侠身边的贾维斯。

像 Otter、Fireflies 这样的会议录音工具已经存在近十年，它们录制会议、生成文字稿。Granola 从一开始就拒绝走这条路。他们的目标不是成为一个「会议存档库」，而是打造一个具备上下文感知能力的 AI 工作空间——一个真正的「第二大脑」，帮助知识工作者把低价值的认知负担外包出去，从而把精力集中在真正重要的事情上：思考、决策、行动。

---

## 二、设计哲学：极致极简，让产品「隐形」

在 AI 产品泛滥的今天，堆砌功能易如反掌，难的是知道「什么不该做」。Granola 的设计哲学可以用一个词概括：克制。市面上大多数竞品都会以「机器人（Bot）」的形式自动加入视频会议，在参会列表里亮出自己的存在。这固然有利于口碑传播，但也会带来一种微妙的不适感——与会者意识到自己正在被记录，隐私顾虑随之浮现。Granola 做出了一个反直觉的决定：彻底抛弃 Bot 模式，让产品在后台静默运行。

他们衡量可靠性的标准，不是某款 AI 竞品，而是苹果备忘录——那款你从不担心它会崩溃、随时随地都能用的软件。这是 Granola 给自己设定的标杆。这意味着产品必须在 Zoom、Google Meet、WhatsApp，乃至线下实体会议中都保持一致的体验。一旦你开始担心「工具是否正常工作」，这个工具就已经失败了。

这一哲学最令人印象深刻的体现，发生在一年内测结束之后。团队听取了大量用户反馈，然后做了一件出人意料的事：砍掉了 50% 的功能和界面。不是新增，而是删减。他们深知，在繁忙而高压的工作日常中，用户需要的不是塞满按钮的控制台，而是一个简单、专注、用起来有魔力的工具。

---

## 三、市场策略：战略性隐忍与精准破圈

「快速发布、快速试错」是创业圈的主流信条。Granola 偏偏反其道而行之。在公开发布前，他们在隐身状态下打磨了整整一年。理由很有说服力：过早发布给数万名用户，换来的只是大量关于团队早已知晓的明显缺陷的反馈，白白消耗工程资源。在这个竞争喧嚣的市场中，带着一个**令人惊艳、完成度更高的产品**出现，才是脱颖而出的更好策略。

他们的冷启动策略同样经过深思熟虑。Granola 没有试图一开始就取悦所有人，而是选择「风险投资人（VC）」作为第一批种子用户。逻辑很优雅：VC 的会议频繁且高度程式化——条款审查、被投企业跟进、LP 汇报——场景易于针对性优化，反馈也足够精准。拿下 VC 群体后，他们又转向了更难搞定的「创业者（Founders）」——一群日程混乱、会议类型五花八门、要求极高的用户。能满足最挑剔的创业者，基本就能向下兼容其他所有职业。

Granola 的地理选择也藏着一层鲜为人知的战略智慧。这是一家具有「硅谷 DNA」、专为美国市场设计的产品，却把总部设在英国伦敦。这是有意为之的地理套利：远离硅谷 AI 圈过度喧嚣的「风暴中心」，同时得以吸纳欧洲顶尖的工程与设计人才。距离，有时也是一种竞争优势。

---

## 四、技术路径：隐藏复杂性，建立信任

Granola 没有执迷于自研基础模型，而是直接采用市场上最先进的第三方大语言模型（OpenAI、Anthropic 等），将工程精力集中在真正能建立壁垒的地方：提示词优化、上下文管理与用户体验。这是一个清醒的赌注：与其和大厂赛跑去构建 AI 底层基础设施，不如比任何人都更深刻地理解自己的用户。

系统的「聪明」对用户来说几乎是透明的。当一位 VC 和一位创业者同处一场会议，Granola 不会生成一份通用摘要，而是根据每个人的身份、职责和后续行动，分别生成完全匹配各自视角的笔记。模型选择、提示词结构、个性化逻辑——这些复杂性全部被藏了起来。这不是一个仪表盘，而是一个会替你思考的工具。

在隐私问题上，Granola 划定了清晰的红线：绝不保存任何会议的音频或视频。这一个设计决策，从根本上降低了产品的侵入感，建立起营销买不来的信任。但 Granola 保留了会议文字转录——这同样是有意为之。AI 会产生幻觉，用户必须能随时查阅原始出处进行核对。文字记录是最终的「证据底本」。

Granola 在技术上最具野心的决策，是拒绝仅依赖 RAG（检索增强生成）来处理复杂的跨会议查询。RAG 更便宜、更快速，但面对「我在哪些场合解释得不够清晰？」这类需要整体理解的问题时力不从心——碎片化检索给不出这样的洞察。因此，Granola 不惜承担高昂的推理成本，将大量会议记录直接塞入模型的长上下文窗口中。他们的逻辑是：为一年后的 AI 能力和成本曲线开发产品，而不是为今天。

---

## 结语：最受喜爱的 AI 产品，往往是最安静的那个

Granola 的故事，本质上是一个关于「克制」的故事，发生在一个痴迷于「多多益善」的行业里。这款被用户称为「改变生活」的产品，不是靠堆砌功能、融更多的钱、或更快地推进得来的。它靠的是更审慎——对构建什么、为谁构建、何时发布，以及最重要的，究竟在为谁服务，保持清醒的判断。

在 AI 时代，最优秀的产品未必是功能最丰富的。而是那些能无缝融入你的工作流、让你几乎忘记它存在的工具——直到有一天它不在了，你才发现一切都变得有点费劲。它们增强人而非替代人，靠「不做什么」赢得信任，和靠「做了什么」同样重要。Granola 给出了一个令人信服的答案：在打造备受喜爱的 AI 产品这场竞赛中，最终胜出的，也许是那个最先学会「退到幕后」的人。

---

*来源：基于 Granola CEO Chris Pedregal 的视频访谈，[点击此处](https://youtu.be/IcbuTTVUY7M?si=DISl_RVHxg9O9pWn)观看原视频。*
