---
title: "Overfitting Is the Silent Killer of Trading Strategies"
zh_title: "过拟合是量化策略的隐形杀手"
description: "Lessons from Robert Carver's Systematic Trading, Part Two: why beautiful backtests fail and how handcrafting beats optimization."
date: 2026-03-08T10:00:00
featured: false
tags:
  - Systematic Trading
  - Portfolio Construction
  - Overfitting
  - Risk Management
  - Reading
---


There's a particular feeling you get when a backtest finally fits. You've been tweaking the lookback window, adjusting the entry threshold, maybe adding a volatility filter — and then suddenly the equity curve smooths out, the Sharpe ratio climbs past 1.5, and the drawdowns look almost civilized. It feels like discovery. It is, in fact, the opposite.

Robert Carver calls this process "fitting," and he dedicates the entire second part of *Systematic Trading* to explaining why it quietly destroys more trading systems than bad luck or bad markets ever will. This is the second post in my series working through the book. [Part One covered the theoretical foundations](https://overtone.dev) — why systematic rules beat human judgment, and why realistic performance expectations are so much lower than the industry admits. Part Two is where Carver gets surgical.

*Not financial advice. Carver's framework is presented here as a rigorous intellectual structure for thinking about strategy design — not a recommendation to trade anything.*

---

## The Taxonomy of Fitting Sins

Carver's Chapter 3 opens with a taxonomy that I found genuinely clarifying, because it separates things that are usually conflated under the umbrella term "overfitting."

The most common form is **in-sample optimization**: you test a parameter (say, a moving average crossover with a 20-day and 50-day window) against your historical data, find it works, and declare victory. The problem is you've used the answer key to write the test. The parameter values that happen to work in your dataset may have nothing to do with any underlying economic mechanism — they fit the noise.

A subtler variant is **data snooping**, or what statisticians call "p-hacking" in other contexts. This is what happens when you test 200 parameter combinations, find the 10 that are profitable, and then write a strategy around those 10. Even if every individual test has a 5% false-positive rate, running 200 tests almost guarantees you'll find several that look good purely by chance. The book is blunt: if you've tested more than a handful of variations, you should trust the result less than if you'd tested one.

Then there's **survivorship bias**, which is particularly treacherous for equity traders. If you're backtesting on a current index, you're backtesting on companies that survived. Every company that went bankrupt and fell out of the index is invisible to your model. The historical returns of "the S&P 500 components" look much better than what a real investor actually experienced, because real investors held some of those companies before they disappeared.

Carver's test for whether a strategy is overfit is elegantly simple: **look at the out-of-sample period**. Take your full dataset, fit your strategy to the first half, and see how it performs on the second half you didn't touch. If the Sharpe ratio in the second half is dramatically lower than in the first, you haven't discovered an edge — you've memorized history.

But here's the uncomfortable corollary he draws. Even a legitimate out-of-sample test has limits. Because financial data is so noisy, it takes an average of 37 years of data to statistically prove that a typical trading rule with a Sharpe ratio of 0.3 is genuinely profitable — not just lucky. Most backtests cover 10 to 15 years. This isn't a minor caveat. It means we are working in a regime of fundamental statistical uncertainty, and most of what we think we know about strategy performance is noise dressed up as signal.

---

## Why Fewer Parameters Win

The practical implication Carver draws from this is counterintuitive for anyone trained in quantitative methods: **use fewer parameters, not more**.

This runs against instinct. More parameters means more flexibility, more expressiveness, more potential to capture complexity. But complexity in a model is only valuable if you have enough data to reliably estimate each parameter. In finance, you almost never do. A strategy with 10 parameters needs vastly more data to be confident it's not overfitting than a strategy with 2 parameters, and that data simply doesn't exist in typical backtesting horizons.

Carver's prescription is what he calls the "ideas first" approach. Start with an economic hypothesis — something you believe is true about how markets work and why it should persist. Then build the simplest possible rule that captures that hypothesis. Test it. If it works, be skeptical anyway. If it doesn't work, don't iterate endlessly until it does.

This is philosophically opposite to what most retail quants actually do, which is: run a parameter sweep, find what worked historically, post-hoc rationalize why it should have worked. Carver's point is that the second approach is fitting, not discovery.

His specific examples of how strategies degrade are instructive. A trend-following rule tested on data from 1990 to 2005 might show a Sharpe ratio of 0.8. Test it on 2006 to 2015 and it might drop to 0.4. That's not necessarily catastrophic — some decay is expected. But the 0.4 is probably closer to the truth about what the strategy actually offers. The 0.8 was partly fitting to the specific character of the 90s trend environment.

---

## Handcrafting: The Antithesis of Optimization

Chapter 3's most provocative claim is about what to do instead of optimizing. Carver's answer is handcrafting — a manual, judgment-based approach to portfolio construction that he explicitly argues is superior to mathematical optimization for retail and semi-professional systematic traders.

The case against Markowitz-style mean-variance optimization is damning. The optimizer requires estimates of expected returns, variances, and correlations for every asset in the portfolio. It then finds the combination of weights that maximizes expected Sharpe ratio. In theory, this is optimal. In practice, it's a disaster.

The reason is that the optimizer is extremely sensitive to its inputs. Expected returns are notoriously difficult to estimate — Carver notes that the uncertainty in any historical return estimate swamps the signal. Feed the optimizer slightly wrong inputs (which you always will, because all your inputs are slightly wrong) and it produces wildly extreme results: 100% in a single asset class, short positions in everything else, complete abandonment of diversification. The math is right; the estimates are wrong; the portfolio is dangerous.

Handcrafting sidesteps this by relying on structural judgments instead of parameter estimates. The process, as Carver describes it, goes roughly like this: group your assets by economic similarity (government bonds in different currencies are correlated; equities and bonds are less correlated; equity and crude oil are even less). Within each group, assign equal weights. Across groups, assign weights based on a simple lookup table that approximates diversification without requiring precise correlation estimates.

The result is a portfolio that looks unsophisticated — a "pencil and paper" calculation, as Carver puts it. But it consistently outperforms mean-variance optimization in out-of-sample tests, precisely because it doesn't try to exploit noisy parameter estimates. It sacrifices mathematical optimality for robustness, and robustness is what actually matters when you're running money in real markets.

---

## Portfolio Allocation: Diversification's Limits and Mechanisms

Chapter 4 extends the handcrafting philosophy to portfolio allocation more broadly. Carver's framing here is worth sitting with: he describes diversification as "the only free lunch in investing," but then immediately qualifies that most investors significantly underuse it — not by holding too few assets, but by misunderstanding how diversification actually works.

The naive view of diversification is: hold more assets, reduce risk. The more rigorous view is: **hold assets with low correlations to each other, and size them so they contribute roughly equal amounts of risk**. These sound similar but produce very different portfolios.

Consider an investor holding 60% equities and 40% bonds. They have two asset classes, which sounds diversified. But in terms of risk contribution, the portfolio is dominated by equities, because equities are far more volatile. The "40% bonds" position might contribute only 15-20% of total portfolio risk. So the portfolio is effectively 80-85% equity risk, with a thin layer of bonds that barely influences outcomes.

Carver's risk-parity-inspired approach to allocation corrects for this. You size each position so that its daily volatility contribution to the portfolio is standardized — not its capital weight, but its actual risk contribution. This naturally results in larger positions in low-volatility assets (bonds) and smaller positions in high-volatility assets (equities), producing genuine diversification rather than the cosmetic kind.

The bootstrap approach he discusses for estimating portfolio weights is intellectually honest about its own limitations. Rather than trusting a single historical estimate of correlations and Sharpe ratios, bootstrapping involves resampling from historical data many times to get a distribution of possible outcomes. This reveals the uncertainty in your parameter estimates rather than hiding it. The result is often that the "optimal" allocation from a single historical sample falls somewhere in the middle of a wide distribution — meaning you could have allocated quite differently and gotten similar expected outcomes. Equal-weight is frequently within the confidence interval.

This is Carver's empirical argument for why equal-weight often beats "optimal" allocations: not that equal-weight is theoretically best, but that given the amount of noise in parameter estimates, the gap between equal-weight and mean-variance optimal is smaller than the error bands around any estimate you could plausibly make.

---

## The Practical Checklist

Before moving on to Parts Three and Four — which cover the mechanical framework for translating market views into actual trades — it's worth extracting what Part Two actually asks of a practitioner.

**On strategy design:**
- Build rules on economic hypotheses, not parameter searches. If you can't articulate *why* a rule should work in plain language, you shouldn't be trading it.
- Minimize parameters. If you have two versions of a rule — one with three parameters, one with one — default to the simpler version unless you have overwhelming evidence the complexity adds value.
- Out-of-sample performance should be your primary metric, not in-sample Sharpe ratio. If you haven't tested out-of-sample, you don't know what you have.
- Be extremely skeptical of any strategy that required significant parameter tuning before it looked good.

**On portfolio construction:**
- Don't use mean-variance optimization without understanding how sensitive it is to input errors. If you must use it, use bootstrap confidence intervals to understand the range of plausible allocations.
- Handcraft instead: group by correlation structure, equal-weight within groups, risk-weight across groups.
- Target equal risk contribution, not equal capital allocation.

---

## What I Keep Coming Back To

The overfitting chapter resonates because the temptation it describes is so recognizable. Adding parameters until a curve fits perfectly isn't just a technical mistake — it's an emotional response to the frustration of watching a strategy that seemed promising fail to produce clean results. Carver's handcrafting philosophy is a specific, principled antidote to that impulse. Simplicity not as laziness, but as epistemic humility about what the data can actually tell you.

I think the deeper lesson is about the difference between understanding a phenomenon and fitting a model to it. If you understand *why* a market inefficiency exists, you need very few parameters to capture it. If you're fitting, you need many. The number of parameters is a signal about your actual level of understanding.

Parts Three and Four cover how to translate these principles into a daily operational system — position sizing, execution, and what the trading diary actually looks like in practice. That's where the framework moves from philosophy to plumbing, and Carver's treatment of it is, predictably, the opposite of what you'd expect.

---

*This post is part of a series on Robert Carver's Systematic Trading. [Part One](https://overtone.dev) covered the theoretical foundations. Parts Three and Four are forthcoming. Nothing here constitutes financial advice — I'm a reader trying to understand a framework, not a trading advisor.*


<!-- zh -->


这不是投资建议。本文只是一个读者在研读 Robert Carver 的《Systematic Trading》(系统化交易) 时整理出的框架笔记。Carver 的论证我会尽量如实呈现；我对这些框架的判断，仅限于「值得深思」，不延伸到任何具体市场操作。

第一部分我们谈了 Carver 的核心主张：人类大脑天生不适合做交易决策，系统化规则是对抗认知偏差的承诺机制。那篇文章聚焦于为什么要系统化，以及对收益预期的冷水——一个高度分散的系统化组合，真实 Sharpe ratio (夏普比率) 上限大约只有 1.0。

这篇进入第二部分（第 3、4 章）：过拟合从哪里来，以及如何构建一个在样本外仍然存活的投资组合。第三、四部分会在后续文章中继续。

---

## 回测越漂亮，问题越大

每个认真做过回测的人都经历过同一件事：参数调一调，曲线就上去了。再调一调，又上去了。最终你得到一条几乎完美的权益曲线，心里隐约知道哪里不对，但又说不清楚。

Carver 用一整章解释这种感觉的来源。他把这类问题统称为 fitting (拟合)，并给出了一个分类体系。理解这个体系，是判断自己策略是否可信的第一步。

---

## 拟合的四种死法

**第一种：样本内优化。** 直接用历史数据最优化参数，让策略在回测期表现最好。这是最常见也最危险的做法。问题在于：历史数据里混杂着大量噪声，优化器分不清哪些模式是真实的市场规律，哪些只是偶然。Carver 给出了一个令人清醒的数字：要用统计 T-Test 证明一条平均水平的交易规则（Sharpe ratio 约 0.3）确实有效，需要 **37 年**的数据。

你有 37 年的样本外数据吗？

**第二种：参数过多。** 每多加一个参数，策略就多了一个自由度去拟合历史。Carver 的建议极其简洁：一条规则尽量只用一个参数，最多两个。如果你的策略需要五个以上的参数才能运转，那它大概率只是在记忆历史，而不是在识别规律。

**第三种：数据窥探 (data snooping)。** 你测试了 200 个参数组合，选了表现最好的那个。这在统计上等同于作弊——你实际上是在用历史数据选出了最幸运的结果，而不是最有逻辑支撑的结果。即使你只测试了 10 个组合，t 检验的显著性门槛也需要相应调整。Carver 的解法是「先有想法再测试」：先想清楚为什么这条规则应该有效，再用少量参数验证，而不是用数据挖出规律再倒过来编故事。

**第四种：幸存者偏差 (survivorship bias)。** 如果你的数据集只包含今天还活着的股票，那你的回测结果天然乐观——因为所有已经退市、破产的公司都被排除了。这个问题在股票策略中尤其严重，期货策略相对好一些，因为合约本身不会破产。

---

## Carver 的过拟合检测标准

知道这四种死法之后，怎么判断一个策略是否已经过拟合？Carver 提供了几个实用标准：

**策略逻辑要先于数据。** 在看回测结果之前，你应该能够用两三句话解释为什么这个策略应该赚钱——它利用的是什么风险溢价 (risk premium)，还是什么行为偏差？如果你无法事先解释，那策略大概率只是噪声拟合的产物。

**参数数量要尽可能少。** Carver 的趋势跟踪规则 EWMAC (Exponentially Weighted Moving Average Crossover，指数加权移动平均交叉) 只有一个参数：快线的窗口期。他甚至建议同时运行多个窗口期版本，并且以相等权重组合，而不是优化出一个「最佳」窗口期——因为那个最佳数字在样本外几乎必然失效。

**样本外表现是唯一真实的检验。** 严格分割训练集和测试集，绝不把测试集的数据用于任何参数调整。如果策略在样本外大幅劣于样本内，那它就是过拟合的。

---

## 手工配置：对抗优化器的古老方法

第 3 章最有意思的部分不是拟合的定义，而是 Carver 的解决方案：handcrafting (手工配置)。

传统的 Markowitz 均值-方差优化是量化投资的标准工具。给它喂入历史收益和协方差矩阵，它会输出一组「最优」权重。听起来很科学，但 Carver 指出了一个根本性的问题：优化器把历史估计值当成精确事实。历史收益率的估计误差极大，而优化器会把这些误差放大——结果经常是把 100% 的资金集中在单一资产类别，或者输出一些现实中根本无法执行的极端配置。

手工配置的思路截然相反：不用优化器，而是靠常识。

做法分三步。第一步，把所有资产按相关性分组。比如美国股票和欧洲股票高度相关，归一组；股票和债券相关性低，分两组。第二步，在组内平均分配权重。第三步，在组间平均分配权重。整个过程可以用一张表格手算完成——Carver 书里真的附了一张查询表 (look-up table)。

这看起来粗糙，但有实证支持。DeMiguel、Garlappi 和 Uppal 在 2009 年的《Review of Financial Studies》上发表的研究表明：简单的等权重 1/N 配置在大多数情况下能击败复杂的优化算法，因为它不放大估计误差。Carver 的手工配置是这个思路的一个结构化版本，比纯等权重多了一层相关性分组的常识。

---

## 第 4 章：分散化是唯一的免费午餐

如果说第 3 章是关于如何避免被拟合骗，第 4 章是关于如何构建一个真正分散的组合。

Carver 的核心论点是：分散化 (diversification) 是投资中极少数可以真正降低风险而不降低期望收益的方法——用他的话说，是「唯一的免费午餐」。问题在于，大多数人的「分散化」是假的。

持有 20 只科技股不是分散化。它们的相关性在市场压力下会趋近于 1。真正的分散化需要跨越相关性结构的不同层级：股票 vs. 债券，不同国家，不同资产类别（大宗商品、货币），不同策略逻辑（趋势跟踪 vs. 套利）。

**基于相关性的配置逻辑。** Carver 的配置框架以相关性为核心。两个策略的相关性越低，组合在一起的收益越接近各自收益之和，而风险低于各自风险之和。这是数学上的优势，不需要任何预测能力。在实践中，相关性估计同样有噪声，所以 Carver 建议用历史相关性的粗略分档（高/中/低），而不是精确的数字。

**Bootstrap 方法。** 对于需要更严格统计支撑的配置决策，Carver 介绍了 bootstrapping (自举法)，一种非参数重采样方法，由 David Jobson 和 Bob Korkie 在 1980 年代初提出。基本思路是：从历史数据中随机重采样生成数千个「平行历史」，对每个平行历史运行优化，然后取结果的中位数作为最终权重。这比单次优化稳健得多，因为它显式地考虑了估计不确定性。

**等权重往往够用。** Carver 的一个反直觉结论是：在你没有强有力证据证明某种资产比其他资产更好之前，等权重分配是合理的默认选项。过于精细的权重调整往往只是在拟合历史，而不是在发现真正的优势。

---

## 这里可能出什么问题

Carver 自己也承认了手工配置的局限：因为权重是用全部历史数据的平均 Sharpe ratio 来最终确定的，这本质上是一种轻微的样本内使用——他称之为「温和的样本内作弊」。这意味着手工配置的回测结果应该比完全样本外测试的结果更保守地对待。

另一个开放问题是估计误差的传播。无论是相关性矩阵还是各资产的 Sharpe ratio 估计，历史数据的噪声都会以某种方式进入最终配置。手工配置比优化器更能抵抗这种噪声，但不能完全消除它。Carver 的诚实令人尊重——他不声称这是一个完美的解决方案，只是比行业标准的优化器更稳健。

---

## 框架的实际意义

对于任何认真回测策略的人，Carver 第二部分的核心信息可以归结为三个问题：

**在开始回测之前，你能解释为什么这条规则应该有效吗？** 如果不能，暂停。先想清楚逻辑，再拿数据验证。

**你的策略有几个参数？** 超过两个，开始怀疑。超过五个，认真审查。

**你的配置权重是如何来的？** 如果是用优化器从历史数据算出来的，考虑用手工配置替代——按相关性分组，组内等权，组间等权。

这些不是我的建议，而是 Carver 从系统化交易的实践经验中提炼出来的框架。适不适合你的具体情况，需要你自己判断。

下一篇会进入第三、四部分：如何把预测信号转化为具体仓位，以及交易成本如何悄悄吃掉你的 Sharpe ratio。

---

*这不是投资建议。所有框架均来自 Robert Carver 的《Systematic Trading》（Harriman House，2015），建议直接阅读原书。*
