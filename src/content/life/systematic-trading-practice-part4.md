---
title: "Three Ways to Be a Systematic Trader: Without Quitting Your Day Job — Lessons from Part Four"
zh_title: "系统化交易的三条路：你属于哪一种？"
description: "Robert Carver's Part Four presents three concrete archetypes — from simple ETF rebalancing to full automation — to help you find your systematic path."
date: 2026-03-08T10:00:00
featured: false
tags:
  - Systematic Trading
  - Asset Allocation
  - Risk Management
  - Personal Finance
  - Reading
---


Here's something Carver slips in almost offhandedly near the end of *Systematic Trading*: a retired teacher with a Vanguard account and a quarterly rebalancing calendar is, in the essential sense, practising systematic trading. The futures fund manager with six screens and seventeen automated rules is doing the same thing — just with more complexity layered on top.

Part Four is where the book stops being about theory and starts being about *you*. If you've read [Part 1](https://overtone-aql.pages.dev/life/systematic-trading-theory-part1), [Part 2](https://overtone-aql.pages.dev/life/systematic-trading-toolbox-part2), and [Part 3](https://overtone-aql.pages.dev/life/systematic-trading-framework-part3), you've absorbed Carver's case for why systematic beats discretionary, the mathematical architecture of forecasts and position sizing, and the full technical framework. Chapters 13 through 15 ask a narrower question: given all that, where do *you* fit?

One framing before we go further: nothing in this post, and nothing in Carver's book, constitutes investment advice. Every framework here is descriptive — a way of thinking about how systematic approaches work — not a prescription for what any specific person should do with their money. Carver makes this explicit throughout, and so do I.

---

## Most of the Benefit, Without the Bloomberg Terminal

Chapter 14 — the Asset Allocating Investor — is the one I'd hand to someone who just asked "should I be doing this?" It describes the simplest possible instantiation of systematic discipline: a portfolio of diversified ETFs, rules-based rebalancing, no borrowed capital, no futures.

The core insight Carver builds Chapter 14 around is that diversification is the only reliable free lunch, and you don't need derivatives to access it. An investor holding SPY (US equities), TLT (long-duration Treasuries), GLD (gold), and EFA (international developed equities) in roughly equal volatility-weighted allocations has already captured most of the structural benefit of the more complex systems described elsewhere in the book.

What makes it "systematic" isn't the instruments — it's the rules. Specifically:

- **Rebalancing triggers are pre-specified**, not reactive. You rebalance when allocations drift beyond a set threshold (Carver suggests something in the range of ±5–10% from target), not when you feel anxious about a news cycle.
- **Instrument selection is done once, deliberately.** You choose your ETF universe, document your reasoning, and don't revisit it because you read a compelling argument for a hot new sector fund.
- **There is no market timing.** The asset allocating investor makes no forecast about whether equities will outperform bonds next quarter. The system doesn't require that forecast to work.

The rebalancing rule is more powerful than it first appears. In a falling equity market, it forces purchases of equities and sales of whatever held up — the mechanical opposite of panic selling. In a rally, it reverses. This is disciplined contrarianism implemented as policy rather than character, which is a much more reliable form.

Carver walks through the volatility targeting calculation in Chapter 14: sizing each ETF so its *contribution to total portfolio volatility* is roughly equal, rather than allocating equal capital. In practice, this tends to overweight bonds relative to equities compared to a naive 60/40, because bonds are less volatile per dollar. Whether that's appropriate for any specific investor depends on time horizon, drawdown tolerance, and existing liabilities — all things Carver explicitly defers to the individual.

The risk he doesn't soften: long-only ETF portfolios can and do suffer substantial drawdowns. A volatility-targeted four-asset portfolio lost significantly in 2022 as equities and bonds fell simultaneously — a scenario that confounds naive diversification assumptions. Systematic rules don't prevent losses. They prevent the *additional* losses that come from abandoning a sensible allocation at exactly the wrong moment.

Capital requirements for this archetype are meaningful but not prohibitive. You need enough capital that fractional-share rounding doesn't distort your allocations, and enough patience to survive a sustained drawdown without abandoning the rules. The minimum isn't a number — it's a commitment.

---

## Rules for Sizing, Judgment for Picking

Chapter 13 introduces the Semi-Automatic Trader, and the distinction is subtle but important: this archetype applies the full systematic framework to *position management* while retaining discretion over *which instruments to trade*.

In practice: you decide (with qualitative judgment) that you want exposure to crude oil futures. The systematic rules then take over — how large a position, when to adjust it, how much total volatility it contributes to your portfolio. The "what" is discretionary; the "how much and when" is systematic.

Carver's argument for this hybrid approach is specific to where cognitive biases do the most damage. His case across Parts One and Two is that discretionary traders fail most severely in two places: sizing decisions (overconfidence leads to oversizing winners) and exit decisions (loss aversion leads to holding losers too long). Those are exactly the places the systematic rules govern. The instrument selection — which futures contract, which market — is less prone to those particular failure modes.

The Chapter 13 worked example is instructive. Carver takes a trader who has identified five futures markets they want to trade based on their own research, then demonstrates how to calculate the correct volatility-targeted size for each, the total portfolio risk, the rebalancing rules, and the position buffer. The trader's judgment determines the menu; the spreadsheet determines the serving sizes.

This is probably the most realistic archetype for someone who wants to apply systematic discipline to genuine market research rather than abandoning discretion entirely. The risk, which Carver names clearly: instrument selection remains a source of performance drag if it isn't itself disciplined. You haven't eliminated human bias from the process; you've contained it to one decision point. Whether that containment is sufficient depends on how honest you're willing to be about *why* you're selecting specific instruments at specific times.

Capital requirements here are driven by futures margins — similar to the Staunch Systems Trader but somewhat reduced if you're running a smaller, more concentrated portfolio. Time commitment is moderate: initial instrument research, then ongoing application of the systematic rules. Carver estimates a few hours per month for a small portfolio.

---

## The Full Stack: Where the Numbers Get Honest

Chapter 15 describes the Staunch Systems Trader, and this is where Carver is most candid about barriers to entry.

This archetype operates a fully automated system: multiple futures markets, multiple forecasting rules (typically several EWMAC variants at different speeds plus Carry), automated signal generation, automated position sizing, and — if built correctly — minimal human intervention during operation. The position sizing formula from Part Three applies simultaneously across all instruments. The Instrument Diversification Multiplier credits you for holding uncorrelated positions. The Forecast Diversification Multiplier rewards combining multiple rules: Carver's calibration tables show FDM values of ~1.35 for six forecasts, meaning a diversified system can size positions 35% larger at the same volatility budget.

The constraints Carver refuses to minimise:

**Capital.** For a meaningful futures portfolio — four to six instruments with real diversification — his calculations suggest you need roughly $150,000–$250,000 at a 25% annual volatility target to hold even one contract in each instrument without distorting the position sizing logic. The E-mini S&P 500 alone requires approximately $20,000–$30,000 of capital per contract at that target. Undercapitalised accounts face a hard choice: sacrifice diversification (fewer instruments) or sacrifice proper sizing. Carver's explicit recommendation is to sacrifice diversification first — set your IDM to 1.0 and accept the concentration rather than the leverage distortion.

**Complexity.** Building and maintaining an automated system is genuine software engineering: continuous futures construction, price data cleaning, roll calendar management, position reconciliation, live monitoring. Carver spent years doing this professionally at AHL. He does not pretend the technical barrier is low.

**The no-override rule.** In Chapter 15, Carver returns to what is probably the hardest part operationally: the system will sometimes generate positions that feel wrong. It will hold losing trades longer than feels comfortable. It will enter positions when the news is alarming. The rule is absolute — you override the system to fix bugs in the rules, never to second-guess the current signal. The discipline required to enforce this alone, without an institutional risk committee keeping you honest, is psychologically demanding in ways that backtesting cannot capture.

The chapter is aspirational, but Carver earns that aspiration by being completely honest about what it costs.

---

## Which Trader Are You, Really?

The comparison Carver's three archetypes invite isn't really about sophistication. It's about an honest accounting of three variables: time, capital, and the willingness to accept mechanical discipline over long periods.

| | Asset Allocating | Semi-Automatic | Staunch Systems |
|---|---|---|---|
| **Instruments** | ETFs (long-only) | Futures (selected) | Futures (multiple, systematic) |
| **Capital minimum** | Accessible | Medium (futures margin) | High ($150k+) |
| **Time commitment** | Hours per quarter | Hours per month | Hours per week (to build) |
| **Discretion retained** | Instrument selection (initial) | Instrument selection (ongoing) | None (rule changes only) |
| **Complexity** | Low | Medium | High |

There is no correct answer on this table. The asset allocating investor is not doing a simplified version of what the staunch systems trader does — they are doing the *same essential thing* (pre-specified rules, no in-flight overrides) at a scale appropriate for their situation.

The asset allocating chapter is the most immediately actionable path for most readers. A disciplined ETF portfolio with volatility-weighted allocations and rules-based rebalancing captures the essential systematic benefit — behavioural consistency under pressure, forced contrarianism, no market timing — without futures accounts, automated systems, or the capital requirements of Chapter 15. For someone working through this framework seriously, the question isn't whether to aspire to a full automated futures system someday. It's whether the additional complexity is justified relative to the already-substantial benefit available at the simpler end.

---

## What the Epilogue Actually Says

Carver's Epilogue is brief and, in the best sense, deflating. He does not close with triumphalism about systematic trading's superiority or predictions about future returns.

He acknowledges directly that trend-following alpha may be eroding as more capital pursues it. He thinks it remains positive; he does not claim certainty. He states plainly that no systematic system prevents large drawdowns — systematic discipline is about *surviving* them behaviourally, not about eliminating them statistically. He notes that the cognitive benefits of systematic trading (reduced emotional interference, consistent application of rules) are real and measurable, while the performance benefits over a well-executed discretionary approach are harder to demonstrate and depend heavily on the practitioner.

He ends, essentially, by saying: the value of a systematic approach is not that it produces superior returns, but that it removes the worst version of yourself from the decision loop. That's honest. That's also as good a reason as I've found in the trading literature to take this framework seriously.

Whether you end up managing a four-ETF rebalancing portfolio or building a multi-instrument automated futures system, Carver's argument is the same: define the rules before the market opens, execute them without interference, and change them only when you have a quantified reason — never in response to recent performance. The archetype you choose determines the complexity. The discipline required is identical.

---

*This series covers Robert Carver's* Systematic Trading *(Harriman House, 2015). [Part 1](https://overtone-aql.pages.dev/life/systematic-trading-theory-part1) covers the case for systematic thinking. [Part 2](https://overtone-aql.pages.dev/life/systematic-trading-toolbox-part2) covers the technical toolkit. [Part 3](https://overtone-aql.pages.dev/life/systematic-trading-framework-part3) covers the full quantitative framework. Nothing in this series constitutes investment advice.*


<!-- zh -->


**免责声明：本文是对 Robert Carver《Systematic Trading》第四部分的学习笔记，不构成任何投资建议。书中框架仅供学习参考，投资有风险，决策需谨慎。**

读 Carver 这本书，前三部分建立了完整的理论框架——为什么要系统化、如何构建预测信号、如何做仓位管理。但很多读者的真实疑问是：**这和我有什么关系？**

第四部分正是回答这个问题的地方。

Carver 把潜在读者分成三类原型，每一类都有完整的实操案例。不是「你应该这样做」，而是「如果你是这种情况，框架的应用方式是这样的」。这个区分很重要——整本书的核心逻辑之一就是：**正确答案因人而异，但找到正确答案的方法是通用的**。

如果你还没读过前几篇：[第一篇](https://overtone-aql.pages.dev/life/systematic-trading-theory-part1)讲了系统化交易的理论基础，[第二篇](https://overtone-aql.pages.dev/life/systematic-trading-toolbox-part2)讲了预测信号的构建工具箱，[第三篇](https://overtone-aql.pages.dev/life/systematic-trading-framework-part3)讲了完整的持仓管理框架。第四部分不需要完全掌握前三部分的细节，但理解「波动率目标」和「预测信号」这两个核心概念会让阅读顺畅很多。

---

## 三种原型，三种生活方式

在进入每种原型之前，有一个值得先建立的直觉：**系统化程度不等于复杂程度**，也不等于更高的预期收益。

Carver 非常诚实地说，他无法保证哪种方式的绝对收益更高。他能说的是：每种方式对应着不同的时间投入、资本门槛、技术要求和心理难度。选择哪条路，首先是选择一种和自己生活相契合的方式——然后才是在这条路上把事情做对。

| | 半自动交易者 | 资产配置投资者 | 全自动系统交易者 |
|---|---|---|---|
| **时间投入** | 每周数小时 | 每季度数小时 | 建设期大量，维护期适中 |
| **资本门槛** | 中等（取决于期货合约） | 低（ETF 无最低限制） | 高（多品种，每品种最小合约） |
| **技术要求** | 中等 | 低 | 高 |
| **核心决策** | 人工选标的，系统管仓位 | 资产配置，系统管再平衡 | 全部系统化 |
| **主要风险来源** | 选股偏见残留 | 再平衡纪律崩溃 | 系统 bug / 数据问题 |

---

## 第十三章：半自动交易者

这个原型对应的读者是：**有自己的选股或择时判断，但认可系统化仓位管理的价值**。

Carver 对这个原型的定位很清晰：你保留了「选什么」的自主权，但把「选多少」的决定交给系统。这个分工的逻辑在于，人类的直觉在某些定性判断上可能有价值（比如理解一家公司的商业模式），但在「这个仓位应该占我总资本的 3% 还是 8%」这个问题上，人类判断几乎总是劣于简单的波动率加权算法。

**实操示例：Carver 的演示组合**

书中给出了一个示例，假设投资者手动选择了若干股票，但用系统化仓位管理来决定每只股票的实际仓位大小。核心公式是第三部分介绍的那个持仓计算：

```
N = (Capital × τ × forecast/10) / (multiplier × price × σ%)
```

对于股票而言，multiplier = 1，forecast 固定为 10（满仓信号），τ 设为你能接受的年化波动率目标（比如 20%）。这样每只股票的仓位就由它自己的波动率决定，而不是拍脑袋分配「每只 5 万」。

**关键洞察：系统化仓位管理的最大价值**

Carver 的数据显示，相比完全依赖直觉的仓位管理，即使仅仅引入波动率目标这一个改变，长期下来也能显著改善风险调整后收益——不是因为择时更准，而是因为**不再无意识地在高波动资产上超配**。

这个原型的主要陷阱：选标的的过程仍然是「系统之外」的环节，所有的认知偏差（过度自信、近期偏差、确认偏差）都集中在这里。Carver 没有说这部分能靠系统解决——他只是说，至少在仓位管理上别再犯额外的错误。

**适合谁**

这条路适合已经有成熟的基本面或技术分析框架、对自己的标的选择能力有一定信心，但希望在风险管理上更纪律化的投资者。时间投入相对适中，每周几小时用于分析，系统自动处理仓位调整。

---

## 第十四章：资产配置投资者

这是三种原型中**最容易落地、门槛最低**的一种。

对于大多数普通投资者而言，这一章是整本书最值得仔细读的部分。Carver 的核心论点：**通过简单的 ETF 组合加上纪律化的再平衡规则，可以捕获系统化交易框架大部分的收益优势，而不需要期货账户、杠杆，或者任何复杂的信号系统。**

**资产配置的逻辑**

Carver 建议的基础组合覆盖四类资产：

- 股票（如 SPY 覆盖美股）
- 债券（如 TLT 覆盖长期国债）
- 商品（如 GLD 覆盖黄金）
- 国际股票（如 EFA 覆盖发达市场）

每类资产按照**波动率贡献相等**的原则分配权重，而不是按照「我觉得哪个会涨」分配。这是框架的核心思想在最简版本中的体现：不预测方向，只管理风险。

**再平衡规则：缓冲区的价值**

最关键的实操细节：**不要在每次价格变动后立刻再平衡**。Carver 引入了「缓冲区」概念——只有当某个资产的实际权重偏离目标权重超过一定阈值（比如 ±5 个百分点）时，才触发再平衡。

这个规则看起来微不足道，但对长期收益的影响很实质：频繁再平衡的摩擦成本（手续费、税务事件、买卖价差）可以吃掉相当大比例的再平衡收益。Carver 的测算显示，季度再平衡加上合理缓冲区，比每月精确再平衡的净收益往往更高。

**多长时间做一次？**

书中建议：**每季度检查一次，只在超出缓冲区时才调整**。年度全面回顾一次资产配置比例。这把时间投入降到了极低的水平——对于有正职工作的投资者，这是完全可持续的。

**这条路的真实局限**

Carver 对这条路的局限同样诚实。纯 ETF 的资产配置投资者无法像期货交易者那样精细地控制波动率目标，也无法使用「携带收益 (carry)」这类信号。预期收益可能略低于完整的期货系统，但这个差距在大多数个人投资者的实际情况下（考虑到税务、复杂度、维护成本）可能并不显著。

**我读这一章的感受**

就学习而言，这一章是最立刻可以付诸实践的。「等比波动率分配 + 缓冲区再平衡」这两个原则，足以让一个普通的被动投资者在风险管理上比大多数主动选股者做得更好——不是因为更聪明，而是因为更纪律化。

---

## 第十五章：全自动系统交易者

这一章是全书框架的完整展示，也是门槛最高的一条路。

Carver 把全自动系统交易者定义为：**所有的交易决策——选标的、定信号、算仓位、执行交易——全部由预先定义好的规则完成，人不做任何实时干预**。

**资本门槛：比大多数人想象的要高**

Carver 给出了一个关键计算。要在 25% 年化波动率目标下持有 E-mini S&P 500 (ES) 的最小头寸（1 张合约），所需的最低资本大约在 $20,000–$30,000 之间。这是**单个品种**的最低要求。

要实现有意义的分散化（IDM 超过 1.5，即持有 4 个以上不相关品种），实际所需资本会在 $100,000–$200,000 量级，甚至更高。

这不是一个「少量资金就能开始」的策略。Carver 非常直接地说：**资金不足时，应该先降低分散化程度（把 IDM 设为 1.0），而不是用杠杆来弥补资本不足**。用杠杆在小账户上模拟大账户的多品种系统，是这个框架最反对的操作之一。

**系统复杂度：不只是代码**

全自动系统包含的环节：数据获取与清洗、连续合约构建（期货换月）、信号计算（EWMAC 变体 + Carry）、仓位计算、缓冲区检查、订单生成与执行、持仓监控与异常处理。

每个环节都有专门的失效模式。Carver 建议把系统维护当成一个「每季度的工程任务」——检查实际波动率是否与估计值匹配、持仓是否在模型目标的缓冲区内、换月成本是否被正确计入。

**最核心的纪律：不覆盖系统**

全书最反复强调的一条原则在这里体现得最彻底：**永远不要在实时交易中覆盖系统信号**。

Carver 做了一个重要区分：

> 如果你认为系统的规则有问题，在市场休市时修改规则。如果你只是「感觉」系统在某个时刻做了错误的决定，那就什么都不要做。

两者的区别是：前者是在修复 bug，后者是在用情绪覆盖逻辑。系统化交易的全部价值，在于把决策从情绪化的实时环境移到冷静的规则制定阶段。一旦在实时中覆盖，这个价值就部分消失了。

**适合谁**

全自动系统适合有足够资本（六位数以上）、有编程和量化背景、愿意在系统建设上投入大量初始时间，并且能在系统稳定运行后抵制「手动干预冲动」的投资者。这条路的上限高，但进入门槛同样高。

---

## 尾声：Carver 的最后一句话

书的尾声部分，Carver 说了一些很坦诚的话。

他承认，他无法保证趋势跟踪或 carry 策略的 alpha 会永远存在。他也不知道哪种原型的绝对收益最高。他知道的是：**认知偏差会持续存在，成本会持续侵蚀收益，纪律会在市场压力下持续受到考验**。

系统化的价值不在于找到一个「更好的预测」，而在于构建一个**不依赖于你在压力下保持理性**的决策框架。

这是整本书最值得记住的一句话背后的逻辑。

---

## 你属于哪一种？

读完四部分，我认为最有价值的不是选出「最好」的原型，而是对自己做一次诚实的评估：

**你现在的资本规模，能支持哪条路？** 不要高估可以分散化的资本门槛。

**你的时间预算是多少？** 全自动系统的建设阶段是真实的大量时间投入，不是「写几行代码就跑起来」。

**你的心理弱点在哪里？** 如果你很难抵制频繁操作的冲动，资产配置投资者路径的「季度检查」规则可能比你想象的更难坚持。

**你对纪律执行的诚实评估是什么？** 任何一种原型，纪律崩溃的后果都会抵消框架带来的收益。

Carver 给出了框架。但选择哪条路、在这条路上能走多远，取决于每个人对自己的了解程度。

---

*本文是《Systematic Trading》读书系列的第四篇。[第一篇](https://overtone-aql.pages.dev/life/systematic-trading-theory-part1) · [第二篇](https://overtone-aql.pages.dev/life/systematic-trading-toolbox-part2) · [第三篇](https://overtone-aql.pages.dev/life/systematic-trading-framework-part3)*

*再次说明：本文所有内容仅为对 Carver 著作的学习整理，不构成投资建议。书中的历史数据和框架仅供理解方法论，不代表未来表现。*
