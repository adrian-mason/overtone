---
title: "Why Your Brain Is the Worst Trading System Ever Built"
zh_title: "你的大脑，是这套交易系统里最危险的变量"
description: "Lessons from Robert Carver's Systematic Trading, Part One: the cognitive biases that sabotage discretionary traders, and why rules beat gut feelings."
date: 2026-03-08T10:00:00
featured: false
tags:
  - Systematic Trading
  - Behavioral Finance
  - Trading Psychology
  - Quantitative Finance
  - Reading
---


There is a peculiar kind of pain in reading a behavioral finance book. Not the abstract pain of difficult mathematics, but the specific, squirming discomfort of recognizing universal patterns. Investors who hold losing positions far too long, waiting for a stock to recover so they can exit "without a loss." Investors who cut their winners early, locking in a tidy gain only to watch the stock triple. Anyone who has participated in markets will find these descriptions uncomfortably familiar.

This is the experience of reading Chapter 1 of Robert Carver's *Systematic Trading* (2015). It is less like a finance textbook and more like a mirror.

I want to be clear upfront: nothing in this post constitutes financial advice, and nothing should be read as a recommendation to trade any asset. Carver's framework is what I am studying and distilling here — his arguments, his evidence, his proposed solutions. Whether any of this applies to your situation requires your own judgment and ideally a qualified financial professional. Markets involve real risk of permanent capital loss.

This is the first in a series of posts working through *Systematic Trading*. This one covers Part One (Chapters 1 and 2): why human brains are unreliable trading systems, and what Carver proposes instead.

---

## The Disposition Effect Has a Name, and It's Been Measured

Carver opens with behavioral finance, and he doesn't soften the findings.

The core phenomenon has been studied rigorously. Shefrin and Statman published "The disposition to sell winners too early and ride losers too long" in the *Journal of Finance* in 1985 — giving the name "disposition effect" to something traders had observed intuitively for decades. Terence Odean confirmed it empirically in 1998 with "Are Investors Reluctant To Realize Their Losses?" (again, *Journal of Finance*): yes, measurably, demonstrably reluctant. Odean and Barber (1998) added another finding — individual investors also overtrade, generating excess transaction costs that drag on returns systematically.

The mechanism, per Carver's reading of the behavioral finance literature (he leans heavily on Kahneman's *Thinking, Fast and Slow* and Hersh Shefrin's *Beyond Greed and Fear*), is Prospect Theory. People do not evaluate gains and losses symmetrically. The pain of a £100 loss is psychologically larger than the pleasure of a £100 gain. This asymmetry has a predictable consequence: investors irrationally prefer to hold losing positions (avoiding the psychological realization of a loss) and sell winning positions too early (locking in the good feeling before it can be taken away).

Carver calls the most stubborn version of this "get-evenitis" — the compulsion to hold a loser until you can exit at breakeven. It is emotionally coherent. It is financially destructive.

What makes Chapter 1 uncomfortable is that Carver does not present these as tendencies of unsophisticated investors. He presents them as tendencies of humans — including, implicitly, everyone reading the book. Cognitive biases do not spare people who know about them. Knowing the name of your bias does not reliably stop you from acting on it.

---

## Overconfidence Is the One Bias Everyone Thinks Applies to Other People

The disposition effect is one strand. Carver's Chapter 1 catalogs others.

Overconfidence is pervasive in investing. Odean and Barber's research on individual investor behavior found that heavy traders (those who traded most frequently) significantly underperformed light traders — not because they were picking worse stocks, but because they generated more transaction costs while believing they had an informational edge worth acting on. The confidence was not supported by outcomes.

Anchoring is subtler. Investors anchor to the price they paid for a stock, to a 52-week high, to an arbitrary round number. These anchors have no rational connection to future value, but they shape decisions. A stock "feels" cheap at £4.00 if you bought it at £6.00, even if nothing about its underlying business has changed.

Loss aversion compounds everything. Because losses loom larger psychologically than gains, investors take actions to avoid realizing losses that make no sense from an expected-value standpoint. They hold on. They average down. They mentally reclassify investments as "long-term" once they've moved against them.

Carver's core argument in Chapter 1 is not that humans are irrational in their daily lives — it's that financial markets are a specific environment where human intuitions evolved to be especially unhelpful. The feedback loops are slow and noisy. The signals are buried in randomness. And the emotional salience of money activates exactly the biases that cause the most damage.

---

## What Simple Algorithms Do Better Than You

The antidote Carver proposes is not becoming more disciplined or more emotionally controlled. He is skeptical that exhortations to "be more systematic" actually work for most people in the heat of a drawdown. Instead, he argues for rules — pre-committed, explicit, mechanical rules that remove the decision from the human brain at the moment the human brain is least trustworthy.

This is the transition from Chapter 1 to Chapter 2, and it's worth sitting with. The claim is not that algorithms are smarter than humans. It's that algorithms don't have a nervous system. They do not feel the pain of a loss. They don't experience "get-evenitis." They execute the same rule at £3.00 as they did at £6.00, because the rule says to execute at that signal, not because of where the price used to be.

Carver cites research showing that simple algorithms consistently outperform human experts in structured prediction tasks — not just in finance, but across medicine, psychology, and other domains. The literature on this goes back decades. Humans override their own rules at the worst moments. Algorithms, by definition, do not.

He is careful about what "outperform" means here. He does not claim that any algorithm beats the best discretionary managers. He argues that most discretionary decisions made by most investors, most of the time, are worse than what a simple rule would produce — primarily because of the biases cataloged in Chapter 1. The rule is not smarter. It is simply immune to the most common failure mode.

---

## The Three Archetypes (and Where You Probably Sit)

One of the practical contributions of *Systematic Trading* is that Carver does not assume every reader is, or wants to be, a fully automated quant. Chapter 2 introduces three distinct investor archetypes, and the rest of the book is largely organized around them:

**The Staunch Systems Trader** is fully algorithmic. Both the forecasting and the risk management are rule-based. This trader never makes discretionary overrides — the algorithm decides when to enter, when to exit, how much to hold, and when to adjust. Carver spent years managing portfolios this way at AHL, a systematic hedge fund. The Sharpe ratio ceiling for a well-diversified, fully systematic approach, in Carver's estimation, is around 1.0 in live trading — a figure that sounds modest until you consider how few strategies sustain it.

**The Semi-Automatic Trader** retains discretion over the *what* — what to trade, whether a macro thesis makes sense — but uses systematic rules for the *how much* and the *when to exit*. Position sizing and stop-loss discipline are mechanical. The view that crude oil is overvalued remains the trader's own judgment; the rule determines how large the position is and at what loss level it gets cut. This hybrid approach can work well for traders with genuine informational or analytical edge, while protecting against the emotional failures that destroy position sizing and risk management.

**The Asset Allocating Investor** makes no attempt to forecast individual prices. The goal is to hold a well-diversified portfolio of asset classes — equities, bonds, inflation-linked assets, maybe commodities — and rebalance mechanically. No leverage, no individual stock picking, no attempt to time the market. The framework here is about building a stable, risk-aware allocation and sticking to it. Carver treats this as a legitimate and often underrated approach for most individual investors.

Carver is honest that the Sharpe ratio ceiling differs significantly across these three types. For a semi-automatic trader, a realistic maximum is around 0.50. For an asset allocating investor, more like 0.40. These are not failures — they reflect what is achievable without the infrastructure and diversification available to a systematic hedge fund trading dozens of futures markets globally.

The most useful question the book poses early: which of these are you actually trying to be? The mismatch between aspiration and method is a significant source of underperformance. Someone who believes they are a Staunch Systems Trader but routinely overrides their rules is neither systematic nor discretionary — they have the worst properties of both.

---

## What "Systematic" Is Not

It is worth being precise about one thing Carver distinguishes carefully: systematic does not mean automated, and it does not mean quantitative in the narrow sense of using complex models.

A written policy — "I will cut any position that falls 20% from my cost, no exceptions" — is a systematic rule. Executed by a human, manually, it is still systematic in Carver's sense because it removes the in-the-moment decision. The behavioral finance problem is not that humans are executing rules — it's that they're making decisions under emotional pressure at exactly the moments when their judgment is most compromised.

The goal of systematization, in Carver's framing, is to push as many of those decisions as possible to a calm, unemotional moment — when you're writing the rule, not when you're watching your portfolio move against you in real time.

---

## The Ground This Series Will Cover

Part One of *Systematic Trading* establishes why discretion fails and what the alternative looks like in principle. The remaining parts of the book get into the mechanical details: how to construct forecasts that are comparable across assets, how to build portfolios that aren't secretly placing concentrated bets, how to size positions based on volatility rather than arbitrary percentages of capital, and how to calculate the exact number of contracts to hold.

Those are the subjects for subsequent posts in this series. Part Two of the book — the "Toolbox" — contains some of the most counterintuitive material: a demolition of Markowitz portfolio optimization and an argument that pencil-and-paper "handcrafting" often produces safer portfolios. That's where we're headed.

For now, Chapter 1's contribution is diagnostic. If you've ever held a losing position well past the point your original thesis was invalidated, or felt the specific frustration of selling a winner too early and watching it run further — Carver's book starts with the uncomfortable proposition that these are not discipline failures. They are the expected outputs of a human brain operating in an environment it wasn't built for.

The question is what to do about it. That's where Chapter 2, and the rest of the book, begins.

---

*This is Part One of an ongoing series on Robert Carver's* Systematic Trading. *Nothing here is financial advice. All references to Carver's framework, data, and conclusions are drawn from the source text. Investing involves the real risk of permanent capital loss.*


<!-- zh -->


先说清楚：这篇文章不是投资建议。我是在研读 Robert Carver 的《Systematic Trading》，把书中的框架和论据整理出来，供自己和有兴趣的读者参考。Carver 本人也会说——任何人告诉你某个策略"一定赚钱"，你应该立刻合上书走人。

这是这本书的系列笔记第一篇，专注于第一部分（第一、二章）。

---

## 一面不舒服的镜子

Carver 在第一章用了大量行为金融学研究，把"直觉为什么不可靠"说得清清楚楚。读完之后的感受不是"原来如此"，而是一种近乎冒汗的认出感——他描述的那些偏误模式，任何参与过市场的人都会觉得太熟悉了。

这不是一本给交易员的书。准确地说，这是一本给所有参与市场的人的书：从纯被动的资产配置者，到每天盯盘的主动操盘手。Carver 的核心论点只有一句话：**人脑天生不适合做交易决策，规则比直觉可靠。**

---

## 三类读者，一套框架

Carver 在全书开头就明确了他的受众，分成三种类型。这个分类很重要，因为他后续给出的建议会因类型不同而有所差异。

**资产配置型投资者 (Asset Allocating Investor)**：不主动预测市场走向，通常不用杠杆，目标是用系统化方法维持一个高度分散的风险平价组合——比如一篮子 ETF。他们不试图"打败市场"，而是试图避免被自己打败。

**半自动交易者 (Semi-Automatic Trader)**：有自己的主观判断和市场观点，但将系统框架专门用于仓位管理、风险控制和追踪止损。简单说：主观看方向，系统管风险。

**纯系统交易者 (Staunch Systems Trader)**：全程算法化，用规则预测方向，用规则管理风险，覆盖多个资产类别。人的角色是设计系统，而不是做交易决策。

这三类并无高下之分。Carver 的框架是模块化的，像汽车零部件一样可以按需组合。但他有一个预设立场：无论你属于哪种类型，**在系统能覆盖的地方，就不要让人脑插手。**

---

## 第一章：大脑的七种失误

Carver 引用了大量行为金融学研究，逐一拆解人类在投资中的系统性错误。这些不是性格缺陷，而是大脑的默认设置。

**处置效应 (Disposition Effect)**

这是最有文献支持的一个偏误。Shefrin 和 Statman 在 1985 年的《金融学期刊》论文中首次命名并记录了这个现象：投资者倾向于过早卖出盈利的仓位，同时过长持有亏损的仓位。Terence Odean 在 1998 年的后续研究进一步证实：即使考虑税务因素，散户卖掉的赢家随后表现依然好过留下的输家。

换句话说：我们本能地做的，恰好是应该反过来做的。

**"扳平强迫症" (Get-Evenitis)**

Carver 用这个词描述一种极为普遍的心理：不愿在亏损状态下平仓，因为平仓意味着把"浮亏"变成"实亏"，心理上从"还有救"变成"彻底输了"。结果就是持有输家越来越久，等待一个永远可能不会来的"回本"机会。

**过度自信与锚定效应**

Kahneman 在《Thinking, Fast and Slow》中详细描述了这两种偏误。投资者往往对自己的判断过度自信，同时将注意力不成比例地锚定在买入价或近期高点，而非当前的客观信息。一旦一个价格在脑中"锚定"，后续的所有判断都会被它扭曲。

**过度交易**

Odean 和 Barber 1998 年的研究表明，散户交易越频繁，业绩越差——不是因为判断力差，而是因为交易成本在蚕食利润。人脑对"做点什么"有一种本能渴望，而市场并不奖励这种渴望。

Carver 的结论是：这些偏误不是例外，而是规律。专业训练能部分缓解，但无法根除。即便是有几十年经验的基金经理，在压力下也会退回到本能反应。

---

## 第二章：规则为什么赢

承认大脑有缺陷是第一步。Carver 接下来要回答的问题是：规则化系统在什么意义上"更好"？

**简单规则 vs. 人类专家**

Carver 引用了大量心理学文献，结论令人不安：在有足够历史数据的领域，简单的统计规则几乎总是优于经验丰富的人类专家。不是有时候，不是在某些情况下——是几乎总是。

原因很简单：规则不会疲劳，不会情绪化，不会因为最近一笔大亏而改变行为。它严格执行自己的逻辑，哪怕在最难熬的市场环境下。

**系统化的真正价值不是预测，而是承诺**

这是 Carver 的一个核心洞察，我认为也是全书最值得反复咀嚼的观点。

很多人以为"系统化交易"是在说：我的算法比你的直觉更能预测市场。错了。Carver 明确说，没有人能可靠地预测市场，系统也不例外。

规则化系统的真正优势在于：它是一种**承诺机制 (Commitment Device)**。当你预先写好规则，你就把"未来的自己"约束住了。当市场崩盘、恐慌蔓延、你的手在颤抖的时候，规则代替你做决定——而那个决定通常比你在恐慌中做的决定要好得多。

**从全裁量到全系统的光谱**

Carver 把投资方式描述为一个连续的光谱，两端分别是：

- **纯裁量型**：完全依赖个人判断，没有任何规则约束
- **纯系统型**：完全依赖预设规则，人不介入执行层面

他认为光谱的两个极端都有问题。纯裁量型会充分暴露于所有行为偏误；而纯系统型虽然理论上最一致，但要求极高的技术门槛，且在规则失效时没有任何缓冲。

对大多数个人投资者而言，合理的位置在光谱的中间偏右：**主观判断用于大方向，系统规则用于执行和风险管理**。

这正是他的"半自动交易者"原型的核心逻辑。

---

## 一个关于期望值的严肃提醒

Carver 在第一章就给出了一个令很多人不舒服的数字：**一个现实中能维持的、高度分散的系统化期货组合，其夏普比率 (Sharpe Ratio) 上限大约是 1.0。**

对于半自动交易者，现实的上限是 0.5。对于资产配置者，是 0.4。

如果你的回测显示夏普比率 2.0、3.0，甚至更高——Carver 的建议是：对这个结果保持高度怀疑。几乎可以确定，这要么是过度拟合历史数据，要么是策略隐藏着"负偏度"风险（表面收益稳定，但藏着小概率的灾难性损失）。

这不是泼冷水，这是在帮你校准期望值。一个年化夏普 0.5 的策略，在 10 年复利下能产生相当可观的超额回报——前提是你能在回撤期间坚持住，而不是在最难熬的时候放弃它。

---

## 下一篇：工具箱与框架

这是系列笔记的第一篇，专注于 Carver 关于"为什么"的论述——为什么人脑不可靠，为什么规则更好，为什么期望要保持克制。

后续几篇会进入这本书更具操作性的部分：如何构建预测、如何分配仓位、如何设定风险目标，以及 Carver 对 Markowitz 优化器和 Kelly 准则的批判——那些部分同样充满反直觉的结论。

如果你也在研究系统化投资，欢迎在评论区交流读书心得。

---

*本文为读书笔记，仅呈现 Robert Carver《Systematic Trading》的框架与论据，不构成任何投资建议。投资有风险，决策需谨慎。*
