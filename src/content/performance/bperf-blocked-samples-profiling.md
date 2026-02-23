---
title: "When perf Goes Blind"
subtitle: "Unified On/Off-CPU Profiling with Blocked Samples"
zh_title: "当 perf 两眼一抹黑"
zh_subtitle: "用 Blocked Samples 统一 On/Off-CPU 性能分析"
description: "Blocked Samples hooks the Linux scheduler to emit synthetic Off-CPU samples alongside perf's On-CPU data — giving bperf unified profiles and BCOZ causal what-if analysis, all at 1.6% overhead."
date: 2026-02-21T09:00:00
featured: true
tags: ["Profiling", "OffCPU", "OSDI", "BPF"]
---

Most performance engineers have been there: `perf top` shows a flat profile, the CPU looks busy, latency is still bad, and you're staring at a flame graph that tells you nothing useful. The application isn't spinning — it's *waiting*. And your profiler has no idea.

This is the core problem addressed in a paper from OSDI '24, and it's one of those rare cases where reading a systems paper genuinely changed how I think about instrumentation. The work introduces **Blocked Samples**, a lightweight kernel-level sampling primitive that bridges the gap between On-CPU and Off-CPU analysis — and then builds two practical tools on top of it.

## The Fundamental Gap in Linux Profiling

Linux `perf` is brilliant for CPU-bound work. Its `task-clock` software event fires on a fixed interval, captures the instruction pointer and call chain, and you get a statistically sound picture of where your cycles are going. But the moment a thread blocks — on a `read()`, a mutex, a `futex` — the timer stops. The thread disappears from `perf`'s view entirely until it's rescheduled.

This creates an invisible population of samples. A thread that spends 80% of its wall-clock time waiting for a slow `fsync()` looks, to `perf`, like it barely exists.

The workarounds are unsatisfying. You can use `perf sched` or eBPF-based tools to trace scheduler events, but these give you raw tracing data, not aggregated profiles. You can instrument your code with `clock_gettime()` around suspect calls. You can build custom eBPF programs that hook `sched_switch`. All of this requires knowing roughly where to look — which defeats the purpose of profiling.

The paper's authors call this the three-way failure of existing tools: they give you a partial view (On-CPU only), they lack precise code-level context for Off-CPU events, and — critically — they can't answer the causality question: *if I fix this bottleneck, how much faster does my program actually run?*

## What Blocked Samples Actually Do

The key insight is that the OS *already knows* exactly when a thread blocks and for how long. Every scheduler context switch records timestamps. The information is there — it just wasn't being fed back into the sampling stream.

Blocked Samples work by hooking three points in the Linux kernel scheduler: **schedule-out** (when a thread gives up the CPU), **wake-up** (when something signals the thread is ready), and **schedule-in** (when the thread resumes). At each hook point, timestamps are recorded. When a thread finally gets scheduled back in, the runtime calculates two intervals:

- **T_blocked**: time spent actually blocked (waiting for I/O, a lock, etc.)
- **T_sched**: time spent in the run queue, waiting for a CPU to become available

If the sum of these spans would have crossed one or more of `perf`'s regular sampling ticks, a synthetic "blocked sample" is emitted — at the cadence of the original sampling frequency, maintaining statistical comparability with On-CPU samples.

Each blocked sample carries four pieces of information that make it genuinely useful:

**Instruction Pointer and call chain** — the last user-space IP before the thread blocked, plus the full kernel call chain. This is what existing Off-CPU tools have historically lacked. You don't just know *that* something blocked; you know *which line of code* triggered the block, and you can see whether it went through `vfs_read`, `blkdev_submit_bio`, `io_schedule`, or somewhere else entirely.

**Subclass** — a coarse categorization of *why* the thread blocked. The paper uses four: I/O waiting, synchronization (locks/futexes), CPU scheduling contention, and everything else (sleeps, timers). This single field turns out to carry a lot of diagnostic weight.

**Weight** — a deduplication mechanism. A thread blocked on an `fsync` that takes 300ms would, naively, generate thousands of identical samples. Instead, the system emits a single physical sample with a weight encoding how many logical samples it represents. This keeps overhead low without losing fidelity.

The overhead numbers are compelling: average 1.6% across the paper's benchmarks. That's production-safe.

## The Two Tools: bperf and BCOZ

### bperf

`bperf` is a direct extension of Linux `perf`, designed to feel familiar to anyone already using `perf stat` or `perf report`. The core addition is that its output now includes blocked samples alongside CPU samples, tagged by subclass:

```
# Samples tagged [I] = I/O block, [L] = Lock, [S] = Scheduling wait

  35.12%  rocksdb  [I]  GetDataBlockFromCache
                        BlockFetcher::ReadBlockContents
                        BlockBasedTable::NewDataBlockIterator

  21.43%  rocksdb  [L]  LRUCacheShard::Lookup
                        ShardedCache::Lookup
                        BlockBasedTable::GetFromBlockCache
```

The bracketed subclass tags give you immediate signal. If you're seeing `[I]` on code you expected to be cache-resident, something's wrong with your caching layer. If you're seeing `[L]` deep in a hot path, you have lock contention hiding behind what looks like normal execution.

For each blocked sample, `bperf` reports both the last user-space IP and the last kernel-space IP before the block. The kernel IP is often where the real story is — it tells you whether an apparent lock wait is really a futex, whether an I/O wait is going through the page cache, whether a "sleep" is actually spinning in a kernel retry loop.

### BCOZ

COZ is a causal profiler originally published at SOSP '15. Its central idea is elegant: instead of measuring how fast code *is*, simulate how fast your program would be *if* a particular section of code were faster. It does this with "virtual speedup" — when the target code runs, artificially slow down all other concurrent threads by the same proportion. If the target is truly on the critical path, the overall program speeds up proportionally. If other work absorbs the slack, you see diminishing returns.

BCOZ extends this to Off-CPU events. The critical addition is **subclass-level virtual speedup**: instead of targeting a specific code location, you can target a *class of blocking events*. You can ask: "What would happen to my overall throughput if all I/O waits in this program were 50% shorter?" This models hardware upgrade scenarios — NVMe vs. SATA, faster memory — without you having to actually buy new hardware.

The implementation complexity here is non-trivial. Standard COZ injects delays into threads to create the virtual speedup illusion. But Off-CPU events involve synchronization primitives — if thread A is waiting for thread B to release a lock, naively delaying thread B propagates the delay to thread A in ways that corrupt the measurement. The paper handles this by injecting delays *before* wake-up operations, ensuring the causal chain is accounted for correctly.

## Three Cases from RocksDB

The paper validates all of this against RocksDB, which is a good choice: it's complex, widely deployed, and exhibits both lock contention and I/O-heavy behavior depending on workload.

**Case 1: The lock hiding behind I/O.** On a read-heavy workload with a large block cache, an existing Off-CPU tool (based on wait-for graphs) identified the bottleneck as threads waiting on hardware interrupts — suggesting that faster SSDs would help. `bperf` told a different story: the dominant `[L]`-tagged samples pointed to `LRUCacheShard::Lookup`, deep in the block cache. BCOZ predicted that optimizing `GetDataBlockFromCache` would yield ~50% speedup. The fix — sharding the cache to reduce lock contention — cut lock wait time by 97% and improved throughput 3.4x. No new hardware required.

**Case 2: Knowing which I/O to fix.** On a random-read workload with a small cache, the profile was full of `[I]` samples — obviously I/O-bound. But which I/O? RocksDB issues reads for filter blocks (Bloom filters), index blocks, and data blocks. `bperf` distinguished these in the call chain, and BCOZ identified filter block reads as the highest-leverage target. Converting filter and index block reads from synchronous to asynchronous I/O dropped blocking I/O events by 74% and improved throughput 1.8x.

**Case 3: Scheduling contention.** The NAS Parallel Benchmark integer sort, running 32 threads on fewer cores, had CPUs as the real bottleneck — but through scheduler contention rather than raw compute. Original COZ saw no meaningful speedup signal from any code location. BCOZ's `[S]`-subclass virtual speedup correctly identified scheduling contention and predicted linear improvement from adding cores, which matched the actual measurement.

## What This Approach Can't (Yet) Do

The paper is refreshingly honest about current limitations. The biggest one: the I/O subsystem is still a black box. When a blocked sample fires with subclass `[I]`, you know a thread was waiting for I/O. You don't know *why the I/O was slow* — whether the device was busy, whether an SSD's garbage collection kicked in, whether you hit a queue depth limit, whether the kernel's I/O scheduler made a bad decision.

The authors note this as explicit future work: integrating device-internal event information (NVMe command completion, GC pauses, etc.) into the blocked sample stream. This would close the loop between application-level call stacks and device-level behavior — a genuinely hard problem given the diversity of storage hardware.

The subclass taxonomy is also coarse. Four categories (I/O, lock, scheduling, other) covers most cases, but distinguishing between a futex-based mutex and an RCU read lock, or between a page fault stall and a network socket wait, would require finer granularity. The current implementation groups these under "other", which limits its usefulness for network-heavy or memory-pressure scenarios.

## What To Do Differently

The immediate takeaway isn't "go use bperf in production today" (though the 1.6% overhead claim is encouraging). It's more about how you frame the problem when something is slow.

When you see high latency without proportional CPU usage, the gap is Off-CPU time — and you need tooling that can see it. `perf`'s `task-clock` profiling isn't wrong; it's just not looking at the right population of events. Adding even rough Off-CPU visibility — whether through `bperf`, `async-profiler`'s wall-clock mode, or custom eBPF programs that hook `sched_switch` — fundamentally changes the diagnostic conversation.

The causality point matters too. Identifying that your program spends 40% of wall time on I/O is useful. Knowing that eliminating *this specific call path's* I/O would speed up the whole program by 30% — while eliminating that other call path's I/O would buy you almost nothing because it's off the critical path — is what actually guides optimization priorities. BCOZ's virtual speedup mechanism, extended to hardware upgrade scenarios, is a practical way to answer "is this worth doing" before you write a line of code or sign a PO.

The deeper architectural insight is that the scheduler is an untapped telemetry source. Every context switch is a structured event with timestamps, thread identities, and wake-up reasons. Most of that data evaporates. Blocked Samples is, at its core, a proposal to treat scheduler events as first-class profiling data — on equal footing with PMU counters and tracepoints. That framing feels right, and I expect we'll see more tools built around it.

---

*This post is based on "Blocked Samples: Unified On-/Off-CPU Profiling for Causal Performance Analysis", presented at [OSDI '24](https://www.usenix.org/conference/osdi24/presentation/ahn).*

<!-- zh -->

# 当 perf 失明：用 Blocked Samples 统一 On/Off-CPU 分析

线上服务延迟飙高，`perf top` 看着 CPU 利用率不低，火焰图也没有明显的热点，但问题就是找不到。这种情况相信不少人遇到过。程序不是在计算，它在**等待**——而你的 profiler 对此一无所知。

这是 OSDI '24 一篇论文想解决的核心问题。读完之后我觉得它对"性能分析"这件事的理解框架有真正的推进。论文提出了 **Blocked Samples**（阻塞采样），一个轻量的内核级采样原语，把 On-CPU 和 Off-CPU 的分析统一到同一个视角下，并在此基础上构建了两个实用工具。

## perf 的盲区在哪里

`perf` 的 `task-clock` 基于定时器采样：每隔固定间隔打断线程，记录当前的 instruction pointer 和调用栈，最终拼出一张统计上可靠的 CPU 热点图。这套机制对 CPU 密集型任务非常有效。

问题在于，线程一旦阻塞——发起 `read()`、等 mutex、陷入 `futex`——定时器就停了。线程从 `perf` 的视野里彻底消失，直到被重新调度回来。一个线程 80% 的时间卡在 `fsync()` 上，在 `perf` 的报告里几乎看不见它。

现有的绕法都不够好。`perf sched` 或基于 eBPF（内核扩展虚拟机）的工具可以 trace 调度事件，但输出的是原始事件流，不是聚合的 profile。你也可以在可疑调用前后插 `clock_gettime()` 手动计时，或者自己写 eBPF 程序 hook `sched_switch`。这些方法的共同问题是：你得先知道去哪里找，但如果已经知道在哪里找，还需要 profiler 干什么？

论文把现有工具的缺陷概括为三点：只有 On-CPU 视角、Off-CPU 事件缺乏代码级上下文、无法回答因果问题——也就是"修了这个瓶颈，整体能快多少？"

## Blocked Samples 的原理

关键洞察很简单：操作系统其实**已经知道**线程什么时候阻塞、阻塞了多久。每次调度切换都有时间戳，信息都在，只是从来没被喂回采样流里。

Blocked Samples 在 Linux 内核调度器的三个关键点打钩子：**schedule-out**（线程让出 CPU）、**wake-up**（线程被唤醒，进入就绪队列）、**schedule-in**（线程重新上 CPU）。在每个点记录时间戳。当线程再次被调度进来时，计算两段时间：

- **T_blocked**：实际阻塞时间（等 I/O、等锁等）
- **T_sched**：在就绪队列里等待调度的时间

如果这两段时间加起来跨越了原本 `perf` 应该触发的采样点，系统就会生成对应数量的"阻塞样本"，频率与 On-CPU 采样保持一致，统计上可直接比较。

每个阻塞样本携带四个字段：

**IP 与调用栈**——线程阻塞前的最后一条用户态指令地址，加上完整的内核调用链。这是现有 Off-CPU 工具一直缺失的东西。你不只是知道"有东西在等"，而是知道**是哪行代码触发的等待**，以及内核路径走的是 `vfs_read`、`blkdev_submit_bio` 还是 `io_schedule`。

**Subclass（子类别）**——阻塞原因的粗粒度分类：I/O 等待、锁同步、CPU 调度竞争、其他（睡眠、定时器等）。就这一个字段，在实际诊断中信息量很大。

**Weight（权重）**——去重机制。一次 300ms 的 `fsync` 理论上会跨越几百个采样周期，但系统只记录一个物理样本，用权重表示它代表多少个逻辑样本，兼顾了精度和开销。

开销数字是 1.6% 均值，可以用在生产环境。

## 两个工具：bperf 与 BCOZ

### bperf

`bperf` 是 `perf` 的直接扩展，用法和 `perf report`、`perf stat` 高度兼容。核心改变是输出里同时包含 On-CPU 和 Off-CPU 样本，并按子类别打标签：

```
# [I] = I/O 阻塞, [L] = 锁等待, [S] = 调度等待

  35.12%  rocksdb  [I]  GetDataBlockFromCache
                        BlockFetcher::ReadBlockContents
                        BlockBasedTable::NewDataBlockIterator

  21.43%  rocksdb  [L]  LRUCacheShard::Lookup
                        ShardedCache::Lookup
                        BlockBasedTable::GetFromBlockCache
```

标签给了你立即可用的信号。缓存命中率应该很高的代码路径上出现 `[I]`，说明缓存层有问题。热路径上出现 `[L]`，说明锁竞争藏在看起来正常的执行里。

`bperf` 对每个阻塞样本同时报告最后一个用户态 IP 和最后一个内核态 IP。内核 IP 往往才是真正的线索——它能告诉你这个"锁等待"底层是不是 futex，这个"I/O 等待"有没有经过 page cache，这个"sleep"是不是在内核里自旋重试。

### BCOZ

COZ 是 SOSP '15 发表的因果性能分析器（causal profiler），核心思路很优雅：不测代码跑得多快，而是模拟"如果这段代码更快，程序整体会怎样"。具体机制是虚拟加速（virtual speedup）——目标代码运行时，故意让所有其他并发线程按比例减速。如果目标真的在关键路径上，整体吞吐就会按比例提升；如果其他工作消化了多余的时间，收益就会递减。

BCOZ 把这套机制扩展到了 Off-CPU 事件。最关键的新功能是**子类级别的虚拟加速**：加速目标不再只能是某行代码，也可以是某类阻塞事件。比如你可以直接问："如果程序里所有 I/O 等待都缩短 50%，整体吞吐能提升多少？"——这等于在不买新硬件的情况下，提前评估换 NVMe、加内存的实际收益。在国内很多团队里，硬件采购周期长、审批流程复杂，这个功能的实用价值不言而喻。

实现上有一个微妙的地方：COZ 通过给线程注入延迟来制造虚拟加速的假象，但 Off-CPU 事件涉及同步原语。如果线程 A 在等线程 B 释放锁，直接延迟线程 B 会把延迟传播给线程 A，污染测量结果。论文的解法是在 wake-up 操作**之前**注入延迟，保证因果链的正确性。

## 三个 RocksDB 实战案例

论文选 RocksDB 做验证是个好选择——足够复杂，部署足够广，根据负载可以同时表现出锁竞争和 I/O 密集两种特征。

**案例一：藏在 I/O 背后的锁竞争。** 读密集负载配大块缓存，某个基于等待图（wait-for graph）的 Off-CPU 工具把瓶颈归结为线程等待硬件中断，建议换更快的 SSD。`bperf` 给出了不同的答案：最重的 `[L]` 样本指向 `LRUCacheShard::Lookup`，问题在缓存层的锁竞争。BCOZ 预测优化 `GetDataBlockFromCache` 能带来约 50% 的加速。实际修法是对缓存做 sharding 分片，锁等待时间降低 97%，整体吞吐提升 3.4 倍。硬件一分钱没花。

**案例二：知道 I/O 慢，但不知道是哪个 I/O。** 小缓存随机读场景，profile 里全是 `[I]`，显然是 I/O 密集型。但 RocksDB 的读路径会分别读 filter block（布隆过滤器）、index block 和 data block，到底是谁的 I/O 在拖后腿？`bperf` 通过调用栈区分了这三类读操作，BCOZ 识别出 filter block 的读取是最高价值的优化目标。把 filter block 和 index block 的同步读改成异步 I/O 之后，阻塞 I/O 事件减少 74%，吞吐提升 1.8 倍。

**案例三：调度竞争。** NAS Parallel Benchmark 的整数排序，32 个线程被限制在少量 CPU 核上运行，瓶颈是调度竞争而非计算本身。原版 COZ 对任何代码位置都测不出有意义的加速信号；BCOZ 的 `[S]` 子类虚拟加速准确识别出了调度竞争，并预测放开核心限制后性能线性增长——和实际测量吻合。

## 当前的局限

论文对局限性说得很直接。最大的问题是 I/O 子系统仍然是黑盒。阻塞样本的子类别是 `[I]`，你知道线程在等 I/O，但不知道为什么慢——是设备本身繁忙？SSD 在做垃圾回收？队列深度打满了？内核 I/O 调度器做了糟糕的决策？这些都看不到。

论文把设备内部事件（NVMe 命令完成、GC 停顿等）集成进阻塞采样流作为未来工作提出来了。这个方向有价值，但难度也不小，不同存储设备的接口差异很大。

子类别的粒度也偏粗。四个类别覆盖了大多数情况，但 futex 锁和 RCU 读锁的等待性质完全不同，page fault 卡顿和网络 socket 等待也不是一回事——这些目前都归进了"other"，对网络密集型或内存压力场景的诊断帮助有限。

## 改变诊断思路

短期内直接上 bperf 生产环境不一定现实，但这篇论文更重要的价值在于它改变了看问题的框架。

当延迟高但 CPU 利用率对不上的时候，差值就是 Off-CPU 时间，而你需要能看见这部分的工具。`perf` 的 `task-clock` 没有错，它只是在看错误的事件总体。不管是用 `bperf`、`async-profiler` 的 wall-clock 模式，还是自己写 eBPF 程序 hook `sched_switch`，加上 Off-CPU 的可见性会从根本上改变诊断对话的起点。

因果分析的价值同样被低估。知道程序 40% 的时间花在 I/O 上是有用的信息，但知道"优化这条调用路径的 I/O 能让整体快 30%，而优化那条路径几乎没有收益因为它不在关键路径上"，才是真正能指导优化优先级的信息。BCOZ 把虚拟加速扩展到硬件升级场景，本质上是在花钱或写代码之前先做一次可量化的 ROI 评估。

更深层的洞察是：调度器是一个被严重低估的遥测数据源。每次上下文切换都是一个带时间戳、线程标识、唤醒原因的结构化事件，绝大多数信息就这么蒸发掉了。Blocked Samples 的本质是把调度器事件提升为一等公民的 profiling 数据，与 PMU 计数器和 tracepoint 并列。这个方向我觉得是对的，期待后续有更多工具围绕它构建起来。

---

*本文基于 OSDI '24 论文《Blocked Samples: Unified On-/Off-CPU Profiling for Causal Performance Analysis》整理，论文全文可在 [USENIX](https://www.usenix.org/conference/osdi24/presentation/ahn) 获取。*
