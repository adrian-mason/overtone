---
title: "Building a Trading System From Scratch"
zh_title: "从零组装一个交易系统"
description: "A walkthrough of Robert Carver's modular framework — from individual forecasts through position sizing to full portfolio construction."
date: 2026-03-08T10:00:00
featured: false
tags:
  - Systematic Trading
  - Position Sizing
  - Volatility Targeting
  - Portfolio Construction
  - Reading
---


*This is Part Three of a series on Robert Carver's* Systematic Trading. *[Part One](https://overtone-aql.pages.dev/life/systematic-trading-theory-part1) covered the psychological case for rules-based systems. [Part Two](https://overtone-aql.pages.dev/life/systematic-trading-toolbox-part2) examined Carver's toolbox — why data mining fails and why handcrafting beats Markowitz. Here we get to the engineering.*

---

There's a moment in every technical book where the author stops explaining why and starts explaining how. In *Systematic Trading*, that moment arrives at Chapter 5, and the shift is almost physical. The earlier chapters — about cognitive biases, about the 37-year proof horizon for trading rules, about the dangers of optimization — are compelling, but they're also somewhat comfortable. Abstract arguments don't require you to do anything. Part Three requires you to do quite a lot.

Chapters 5 through 12 are the mechanical heart of Carver's framework. They describe a complete system: how to select instruments, how to generate and scale forecasts, how to combine them, how to target volatility, how to size positions, how to build a diversified portfolio, and how to think about trading speed and minimum capital. This is not financial advice — it's an engineering blueprint, and the distinction matters. Carver is explicit throughout that he's teaching a *way of thinking about* systematic trading, not telling anyone what to trade.

What makes this section worth studying carefully is that the pieces are genuinely modular. You can implement a minimal version — one instrument, one rule — and scale up incrementally. Most quantitative frameworks punish you for partial implementation. This one doesn't.

*Disclaimer: Nothing in this post constitutes financial advice. This is a reading note, not a trading recommendation.*

---

## The Architecture: One System, Three Practitioners

Carver opens Part Three by reminding the reader that the framework serves three different practitioner types: the *asset-allocating investor* (no forecasting, no leverage, static portfolio of ETFs), the *semi-automatic trader* (manual forecasting, systematic risk management), and the *staunch systems trader* (fully algorithmic, forecasting and all).

This isn't a marketing segmentation. It's a genuine architectural choice. The same position-sizing formula, the same volatility-targeting logic, the same diversification multiplier — all three types use it. The difference is where human judgment enters. The asset allocator sets forecasts to a constant +10 (always long). The semi-automatic trader sets forecasts manually, based on their own directional view. The systems trader derives forecasts algorithmically. Everything downstream is identical.

The insight is that *risk management and position sizing are separable from forecasting*. Most retail traders never make this separation. They fold their market view, their position size, and their risk tolerance into a single intuitive number — "I'll buy 100 shares" — and the three concerns become inseparable, and therefore unexaminable. Carver's framework forces you to decompose the decision.

---

## Forecasts: A Universal Scale

The forecast is Carver's unit of market opinion. Whatever your source — a trend-following rule, a carry calculation, a manual read of macro conditions — it gets translated into a number on a standardized scale. The expected average absolute value of a forecast is 10. So +10 means "average buy." +20 is the ceiling. −20 is the floor. There is no +100 for your highest-conviction trade of the year.

That ceiling is more important than it sounds. The reasoning: in a normal distribution, you'd only see forecast values above 20 about 5% of the time. There's simply not enough historical evidence that signals of that magnitude translate into proportionally larger returns. Markets also tend to reverse sharply at extremes. Capping at 20 is conservative, but Carver argues conservatism at the forecast level is exactly where you want it.

The mechanics of forecast generation are covered in Chapters 6 and 7. Carver uses EWMAC (Exponentially Weighted Moving Average Crossover) as his primary illustration — a trend-following rule that calculates the difference between a fast and slow moving average, then scales the result to the standardized scale. He's careful to distinguish between the *raw* forecast (the unscaled moving average difference) and the *scaled* forecast (mapped to the ±20 range using a scalar derived from historical data).

This scaling step is non-trivial. Without it, you can't combine forecasts from different rules or different instruments — they'd be in incomparable units. Volatility standardization is what makes the whole system coherent.

---

## Combining Forecasts: Why Simple Beats Complex

Chapter 8 addresses one of the most counterintuitive results in quantitative finance: a portfolio of simple, weakly correlated rules almost always outperforms a single sophisticated rule.

The mechanism is straightforward once you see it. Combining uncorrelated forecasts reduces variance without proportionally reducing expected return. If you have two rules with the same expected Sharpe ratio, and they're uncorrelated, the combined portfolio has a higher Sharpe ratio than either rule alone. Adding more rules continues to help, with diminishing returns.

Carver formalizes this with the *diversification multiplier* for forecasts — the same mathematical concept he uses for instruments. Given N forecast variations with a correlation matrix H and weights W summing to 1, the multiplier is:

```
1 ÷ √(W × H × Wᵀ)
```

This multiplier scales the combined forecast back up to maintain the same expected absolute value of 10. Without it, combining forecasts would reduce your effective signal strength.

On weighting: Carver advocates handcrafting here, not optimization. He groups similar rules together (fast trend-followers, slow trend-followers, carry rules) and assigns weights within groups first, then between groups. It's pencil-and-paper work, grounded in common sense rather than numerical optimization that would overfit to historical noise. The same critique that dismantled Markowitz in Part Two applies here.

---

## Volatility Targeting: The Central Idea

This is where theory converts to engineering — and where the framework's real insight becomes visible.

The problem: you want to take a consistent amount of risk across all the instruments in your portfolio. But crude oil futures and Japanese government bond futures are completely different beasts. Sizing both at "100 contracts" is meaningless. Sizing both at "2% of capital" is almost as meaningless, because 2% of capital buys very different amounts of volatility in different instruments.

Carver's solution is *cash volatility targeting*. You decide in advance how much annual volatility (in cash terms) you want your portfolio to generate. Say your account is £500,000 and you want 25% annualized volatility — that's a £125,000 annual cash volatility target. Divide by 16 (the square root of 256 trading days) to get the daily target: roughly £7,800.

Now, for any given instrument, you can calculate the daily cash volatility of one "block" (one futures contract, one lot, one share). That's the price volatility (standard deviation of daily percentage returns) multiplied by the block value (how much the position changes in cash terms when the price moves 1%). The ratio of your daily cash volatility target to the instrument's volatility — that's the *volatility scalar*.

Position size = volatility scalar × forecast ÷ 10

That last division by 10 is because the expected average absolute forecast is 10, so dividing normalizes it. A forecast of +10 gives you one "full" volatility-scaled position. A forecast of +5 gives you half. A forecast of −10 gives you a short position of the same size.

What this achieves is genuinely elegant. A position in crude oil and a position in German Bunds will now both contribute the same expected amount of daily cash volatility to your portfolio, regardless of how different the underlying contracts are. Risk becomes the unit of account, not capital percentage or number of contracts.

The volatility target itself is set using the Half-Kelly criterion. Carver walks through the math: if your expected pre-cost Sharpe ratio is 0.75, the Kelly-optimal risk level is 75% annual volatility. Half-Kelly gives you 37%. This sounds high, but Carver's argument is that you should be pessimistic about your own Sharpe ratio estimate (it's almost certainly higher than reality due to optimism and look-ahead bias), and that cutting the mathematically optimal level in half provides meaningful protection against estimation error and bad luck.

---

## Position Sizing: The Full Formula

Chapter 10 assembles the complete position-sizing sequence. In full:

1. **Instrument price volatility**: standard deviation of daily percentage price returns
2. **Block value**: cash value of one block when price moves 1%
3. **Instrument currency volatility**: price volatility × block value
4. **Volatility scalar**: daily cash volatility target ÷ instrument currency volatility
5. **Subsystem position**: volatility scalar × forecast ÷ 10

For a portfolio with multiple instruments and multiple rules, each rule generates a subsystem position for each instrument. These are combined using the forecast weights and diversification multiplier. The result is a target position, expressed in number of blocks.

Carver then introduces *position inertia*: if the current held position is within 10% of the target position, don't trade. This is a cost-reduction rule, not a performance rule. The daily fluctuations in volatility estimates and forecasts generate small position adjustments that, in aggregate, produce significant transaction costs without adding meaningful signal. Ignoring adjustments smaller than 10% of the current position eliminates most of that friction.

---

## Building the Portfolio: Instrument Diversification

Chapter 11 applies the same logic to instruments that Chapter 8 applied to forecasts. More uncorrelated instruments → higher portfolio Sharpe ratio. The instrument diversification multiplier is calculated identically:

```
1 ÷ √(W × H × Wᵀ)
```

Where H is now the correlation matrix of instrument returns (not forecast values) and W is the instrument weights. Carver caps this multiplier at 2.5 — a hard limit to prevent extreme leverage during market stress, when correlations tend to spike unexpectedly toward 1.

The instrument weight selection follows the same handcrafting logic: group instruments by asset class (equities, bonds, commodities, FX), weight within groups first based on correlation clusters, then between groups based on common-sense diversification. Carver provides look-up tables in the appendices.

One practical note that Carver emphasizes: the minimum capital requirement scales with the number of instruments. Each instrument has a minimum block size (one futures contract, one lot). If your position sizing math says you need 0.3 contracts, you can't hold 0.3 contracts — you round to zero or one. For a diversified portfolio to be implemented at all, you need enough capital that rounding errors don't dominate. Carver works through specific examples with realistic futures contract sizes; the minimums are not trivial.

---

## Speed and Costs: The Speed Limit

Chapter 12 addresses a constraint that many systematic traders ignore until it's too late. Trading costs — commissions, spreads, slippage — are a direct drag on returns. They're also a function of how fast you trade. A system that rebalances daily pays dramatically more than one that rebalances monthly.

Carver formalizes this as a *speed limit*: never spend more than one-third of your expected annual Sharpe ratio on trading costs. For a staunch systems trader with a pre-cost expected SR of 0.40, the cost limit is 0.13 SR units annually. For asset allocators and semi-automatic traders, it's 0.08 SR units.

To enforce the limit, he calculates *standardized costs*: the round-trip cost of trading one block (commissions plus half the bid-offer spread, doubled), divided by the annualized instrument cash volatility. This gives a cost expressed in the same units as Sharpe ratio, which can then be compared against the speed limit.

The practical implication: many fast trend-following rules — those with short EWMAC spans, for example — are unprofitable after costs for retail traders. You simply can't trade fast enough to justify the expense. Carver's framework selects trading rules not just by their pre-cost Sharpe ratio but by their post-cost performance, accounting for the minimum instrument block size and realistic execution costs.

---

## What the Framework Actually Is

Reading through Chapters 5 to 12 in sequence, something becomes clear that's not obvious from a chapter-by-chapter description. The framework is a cascade of risk-normalizing transformations.

Forecasts normalize market opinion onto a universal scale. Volatility scaling normalizes instrument risk so positions across different assets carry comparable cash risk. Diversification multipliers normalize for correlation, so adding more rules or instruments doesn't just add complexity — it adds risk-adjusted return. Position inertia normalizes trading frequency to avoid cost drag. Speed limits normalize the relationship between rule speed and transaction costs.

At every stage, the goal is to make things *comparable* — across time, across assets, across rule types — so that decisions can be made on a consistent basis. This is what Carver means when he says the framework is modular. Each normalization is independent. You can implement them incrementally. And because they're all expressed in the same units (Sharpe ratio, cash volatility, or standardized forecasts), the pieces fit together without friction.

The volatility targeting concept is the key that unlocks this. Once you understand that risk (not capital percentage, not number of contracts) is the right unit for position sizing, the rest of the framework follows naturally. It's the kind of insight that feels obvious in hindsight and genuinely isn't obvious at all beforehand.

Whether this blueprint is implementable for any given reader depends heavily on capital size, instrument access, and broker costs. The appendices contain the exact formulas and look-up tables needed to run the calculations. What Part Three gives you, at minimum, is a rigorous way to think about what a systematic position actually means.

---

*Part Four of this series will cover Carver's real-world application diaries — how the framework behaves during the 2008 crash, the 2014 oil collapse, and other stress events.*

---

*This post reflects my reading of Robert Carver's* Systematic Trading *(Harriman House, 2015). Nothing here is financial advice. I am a reader studying this material, not a professional trader, and none of this should be construed as a recommendation to buy, sell, or hold any financial instrument.*


<!-- zh -->


**声明：本文是读书笔记，不构成任何投资建议。我不会在文中披露个人持仓或交易活动。**

这是《系统化交易》系列精读的第三篇，对应原书第三部分（第5-12章）。前两篇（[第一篇](https://overtone-aql.pages.dev/life/systematic-trading-theory-part1)、[第二篇](https://overtone-aql.pages.dev/life/systematic-trading-toolbox-part2)）分别讨论了为什么规则化系统优于直觉判断，以及如何避免数据挖掘和过拟合陷阱。这一篇是最密集的部分——Carver 从头构建完整的仓位管理框架，每一个组件都有精确的数学定义。

理论转化为工程的过程往往令人沮丧。读完前两部分之后，脑子里还是一堆概念，却不知道如何把"我认为市场会上涨"这个判断转化成"明天开盘买入 X 手合约"这个操作。第三部分解决的正是这个问题。

---

## 框架的整体架构

Carver 把整个系统拆成五个模块，按顺序连接：

```
原始信号 → 标准化预测 → 组合预测 → 波动率目标 → 仓位数量
```

每个模块的输入和输出都有严格定义。这种设计的好处是可替换性——你可以换掉趋势跟踪规则，改用均值回归，只要输出依然是标准化预测值，后面的仓位计算逻辑完全不用动。

这也是为什么 Carver 反复强调"模块化"。它不是软件工程意义上的好代码，而是认知上的保护——每次只修改一个模块，才能搞清楚变化的来源。

---

## 预测信号：标准化是前提

不同的交易规则会产生完全不同量纲的信号。EWMAC（指数加权移动平均交叉）的原始输出可能是价格差，RSI 输出的是 0 到 100 的数值，利差类信号又是另一套单位。要把这些信号合并成一个有意义的仓位，必须先把它们标准化到同一尺度。

Carver 的方案简洁：**所有预测的期望绝对值为 10，上限为 ±20**。

+10 表示"标准买入"，-10 表示"标准卖出"，0 表示无方向性判断。标准化方法是用历史数据估计原始信号的绝对均值，然后除以这个均值再乘以 10。

上限 ±20 不是随意拍的。如果预测值服从正态分布，绝对值超过 20 的情况只出现约 5% 的时间——这意味着统计上没有足够证据证明极端信号真的对应极端的后续回报。而且市场在极值往往会急速反转。帽子要戴上，哪怕信号显示这是"百年一遇的机会"。

---

## 组合预测：简单规则的联合胜过一个复杂规则

第8章的核心论点是反直觉的：用多个简单、相关性低的规则组合，效果持续优于单一复杂规则。

原因在于"主动管理定律"（Law of Active Management）：

> 信息比率 ≈ 技巧 × √(每年独立押注次数)

独立押注次数越多，整体夏普比率越高——前提是每次押注之间相关性低。把两个不相关的预测规则（比如快速趋势跟踪 + 慢速利差）组合起来，等于增加了独立押注次数，在不增加预测难度的情况下提升系统整体表现。

**预测权重的确定**也是这一章的核心工程问题。Carver 同样反对用历史夏普比率来优化权重——原因和之前讨论过的一样：37年才能统计显著地证明一条规则有效，根本没有足够数据支撑精确的优化。

他的替代方案是"手工构建"（handcrafting）：按规则的类型分组（趋势跟踪类、利差类、均值回归类），组内均等权重，组间按相关性判断分配权重。这和用铅笔在信封背面做计算没什么本质区别，但实践中表现并不差于精心优化的权重矩阵。

---

## 波动率目标：整个框架的核心

第9章是我认为全书最重要的章节。

波动率目标（Volatility Target）解决的是一个基本问题：**怎样让不同资产的仓位具有可比的风险敞口？**

原油期货和短期国债期货在价格波动上完全不是一个量级。如果按合约数量来分配仓位，就像在用苹果和橙子做比较。Carver 的方案是把"我要承担多少风险"定义为年化波动率百分比，然后反推每种资产应该持有多少合约。

**年化现金波动率目标**的设定遵循"半凯利准则"（Half-Kelly）：

- Kelly 准则给出的最优杠杆是夏普比率（SR）的平方
- 但 Kelly 假设你对 SR 的估计是精确的——实际上不是
- 过高的杠杆在坏运气面前是致命的
- 所以用 Half-Kelly：实际杠杆 = 最优杠杆 × 0.5

如果回测显示某策略 SR 为 0.75，Kelly 建议的年化波动率目标约为 75%，Half-Kelly 则是 **37%**。对于带有负偏度的策略（比如卖期权、套利交易），还需要再减半到 Quarter-Kelly。

把年化目标转换为日度操作指标：

```
日度现金波动率目标 = 年化现金波动率目标 / √256 ≈ 年化目标 / 16
```

这个日度目标是后续所有仓位计算的锚点。

---

## 仓位计算：从预测到合约数量

第10章把之前所有组件连接起来，给出一个完整的数学序列。以期货为例：

1. **价格波动率**：近期日度价格标准差（百分比）
2. **合约价值**：价格涨1%时，一手合约的盈亏金额
3. **工具货币波动率**：= 价格波动率 × 合约价值（一手合约的日度盈亏标准差）
4. **波动率标量**（Volatility Scalar）：= 日度现金波动率目标 ÷ 工具货币波动率
5. **子系统仓位**：= 波动率标量 × 预测值 ÷ 10

最终合约数量就是子系统仓位取整。

这个公式的精妙之处在于：当资产波动率上升，分母（工具货币波动率）增大，波动率标量自动缩小，持仓自动减少。系统在市场动荡时自动降杠杆，不需要人工判断。

用 Carver 书中的 Apple 例子说明：假设 AAPL 从 $400 涨到 $404，价格波动率约 1% 每日，账户规模 $100,000，年化波动率目标 25%，Half-Kelly 后约为 12.5%，日度目标约为 $781。若当前预测值为 +10（标准买入），倒推应持有约多少股，数学上是确定的。

---

## 投资组合：多样化乘数

第11章处理多资产组合的仓位问题。

当持有多种不相关资产时，组合波动率低于各资产波动率之和。这意味着在保持相同组合风险的前提下，可以持有更多资产、更多合约。**多样化乘数**（Diversification Multiplier）正是对这一效应的定量补偿：

```
多样化乘数 = 1 ÷ √(W × H × Wᵀ)
```

其中 W 是各工具的权重向量，H 是预测值的相关矩阵。

如果持有的资产两两相关性为 0（完全独立），多样化乘数最大；如果高度相关，乘数接近 1，没什么多样化效益。

Carver 强烈建议将乘数上限设为 **2.5**。原因是市场危机时相关性会急剧上升——历史上看起来不相关的资产往往在最坏的时刻同步崩溃。如果乘数没有上限，危机期间杠杆会超出预期的很多。

---

## 速度与规模：成本是隐形税

第12章讨论两个被散户系统严重低估的问题：交易成本和最低资本要求。

**标准化成本**的计算方式是将一次完整交易（买入+卖出）的摩擦成本（佣金+点差）除以工具的日度波动率，再乘以 16 换算为年化：

```
标准化成本 = 2 × 摩擦成本 ÷ (16 × 工具现金波动率)
```

Carver 给出的速度限制非常严格：
- 全系统交易者：年化成本不超过 **0.13 SR 单位**
- 半自动/资产配置者：不超过 **0.08 SR 单位**

这意味着如果一条规则在成本之前 SR 约为 0.4，你最多能花 0.13/0.4 = 32.5% 的预期收益在交易成本上。这个限制直接决定了哪些合约的哪些交易频率是可行的。

**仓位惯性**（Position Inertia）是降低成本的工程手段：如果新计算的目标仓位与当前仓位的差距不超过 10%，就不执行交易。这过滤掉了大量由预测值微小变动引发的无意义调仓，实测对事前收益的影响极小，但对成本的削减相当显著。

**最低资本**是另一个硬约束。某些期货合约的最小交易单位很大（比如日本国债期货单张面值约 1.5 亿日元），小账户根本无法达到合理的分散度。Carver 给出了根据账户规模判断哪些合约可以参与的方法——不满足最低资本要求的合约直接排除，不要试图用 0.3 手合约来"参与"。

---

## 系统的整体感

读完这八章，最深的感受是整个框架的内部一致性。波动率目标不仅是风险管理工具，它同时也是连接不同资产类别、不同预测信号的通用语言。一旦所有东西都用"日度现金波动率"表达，苹果和橙子就可以加减了。

这种统一性在直觉上不是立刻显而易见的。刚开始看的时候，我也觉得为什么不直接按百分比分配仓位。直到把公式从头推一遍，才明白：按百分比分配隐含了一个假设——所有资产的风险是可比的。而它们显然不是。

框架的另一个特点是谨慎的悲观主义。每个参数的设定都在问：如果我错了会怎样？Half-Kelly 是对 SR 估计误差的对冲，多样化乘数上限是对危机时相关性跳变的对冲，预测值上限是对极端信号统计证据不足的承认。这种对"自己可能是错的"的系统性假设，在金融工程领域并不常见。

第四部分将这套框架带入实战情景——包括 2008 年金融危机和 2014 年原油暴跌期间的交易日记。那将是另一篇文章。

---

*这是《系统化交易》精读系列的第三篇。本系列不构成投资建议，仅作学习记录。*
