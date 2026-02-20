---
title: "Beyond the Flame Graph"
subtitle: "How wPerf Finds the Bottlenecks Your Profiler Can't See"
description: "wPerf uses graph theory — wait-for graphs, Knot detection, and cascaded redistribution — to find Off-CPU bottlenecks that duration-based profilers miss entirely."
date: 2026-02-20
featured: true
tags: ["Profiling", "OffCPU", "OSDI"]
---

There's a specific kind of frustration that every performance engineer has felt. You're staring at a flame graph, CPU utilization is sitting at 35%, your latency is through the roof — and the profiler shows nothing. No hot functions. No obvious culprits. Just a system that's inexplicably slow.

That's an Off-CPU problem, and traditional profilers are completely blind to it.

When a thread blocks on a mutex, waits for a disk write to commit, or sleeps on a condition variable, CPU profilers record... nothing. The thread isn't on the CPU, so the sampler never fires. The bottleneck is real and often severe, but it's invisible to the tooling most of us reach for first.

This is what motivated wPerf, a research project out of OSU Systems Lab that was presented at OSDI '18. The paper doesn't just add another Off-CPU profiler to the ecosystem — it introduces a fundamentally different way of reasoning about waiting, one grounded in graph theory rather than duration statistics.

## The Problem with "Who Waited Longest"

The existing approach to Off-CPU analysis, popularized by Brendan Gregg's Off-CPU flame graphs and eBPF-based tools like `offcputime`, works by recording how long each thread spends blocked and attributing that time to the blocking stack. It answers: *which thread waited the most?*

This is useful, but it has a critical flaw: long waits are not the same as global bottlenecks.

Imagine a background compaction thread in a storage engine sleeping for 200ms waiting for a flush to complete. That's a long wait. It'll show up prominently in any duration-based profiler. But if that thread has no relationship to your request-handling path, optimizing it moves nothing meaningful.

Meanwhile, a 50-microsecond lock acquisition on your critical write path — taken thousands of times per second by every worker thread — is generating almost no per-event duration signal, but it's quietly throttling your entire throughput. Duration-based analysis will rank it below the compaction thread noise.

wPerf's insight is that we need to answer a different question: *which waiting events are causally connected to the overall throughput of the system?*

## Wait-for Graphs and the Knot Theorem

wPerf models a running system as a directed graph G=(V,E). Each vertex represents either a thread or an I/O device (treated as a pseudo-thread). Each directed edge u→v means "thread u is currently waiting on v." The weight of an edge represents the cumulative wait time over the observation window.

This structure captures what duration-based tools miss: the *topology* of waiting. It's not just who waited, but who caused whom to wait, and how that causality chains through the system.

The key theoretical contribution is what the paper calls the **Knot theorem**. In graph theory, a Knot is a subgraph where no vertex has outgoing edges pointing outside the subgraph — it's a closed waiting loop. The theorem states: *if a wait-for graph contains any Knot composed of worker threads, that Knot contains at least one bottleneck limiting the application's maximum throughput.*

The intuition is clean. If a set of threads are waiting only on each other and never on anything external, they're stuck in a closed system. No optimization outside that Knot can break the cycle. To improve throughput, you must break at least one edge inside every Knot.

To find Knots efficiently, wPerf decomposes the wait-for graph into Strongly Connected Components (SCCs) using Tarjan's algorithm. Any SCC with no outgoing edges in the condensed DAG is a Knot. This immediately narrows the search space from hundreds of threads to a handful of structural bottlenecks.

## Cascaded Redistribution: Tracing Causality Through Chains

Identifying Knots gets you to the right neighborhood, but you still need to know *which specific wait* inside the Knot to fix. This is where it gets more interesting.

Consider a chain: thread A waits on thread B, which is blocked waiting for a disk write. The raw graph has edges A→B and B→Disk. If you only look at edge weights, B carries the weight of A's waiting but is itself a victim. Optimizing B's code accomplishes nothing if the real bottleneck is disk throughput.

wPerf solves this with **cascaded redistribution**. The algorithm propagates wait weight along dependency chains: if A waits for B, and during that same interval B is waiting for C, then A's wait is redistributed — partially or fully — onto the B→C edge. The weight "flows" toward the root cause.

If a node is actively executing on CPU while being waited on, it absorbs the weight — it's genuinely doing work that's taking time. If it's also blocked, the weight keeps flowing downstream. The final accumulated weight on each edge reflects its true causal contribution to the waiting of everything upstream.

After redistribution, wPerf applies edge trimming — dropping edges below a significance threshold (roughly 1% of total time) — and re-runs Knot identification. This iterative refinement compresses a complex dependency network with hundreds of threads down to a tight loop of a few nodes that are genuinely causing each other's delays.

## Implementation: KProbes, perf, and a Python Graph Engine

The engineering implementation is worth understanding because it shapes what wPerf can and can't observe.

The kernel module uses **KProbe hooks** on two scheduler functions:

```bash
# The two critical hook points
sched_switch   # captures who left the CPU and why (blocked vs preempted)
sched_wakeup   # captures who woke whom — this builds the directed edges
```

`sched_wakeup` is the critical one. Every time a thread wakes another, wPerf records the waker's TID alongside the wakee's. This is what allows it to construct directed edges rather than just recording durations. eBPF's `offcputime` typically only captures the blocking stack — it knows who was sleeping but not who kicked it awake.

The recorder layer (`record.sh`) coordinates additional data collection:

```bash
# Stack collection for attribution
perf record -g --call-graph dwarf -p $PID

# I/O saturation detection
iostat -x 1
ifstat 1

# Thread name resolution for readability
jstack $PID  # for JVM workloads
```

The analyzer is Python-based, using NetworkX for graph operations. It ingests the raw `wait`/`wakeup` event stream, performs timestamp matching to reconstruct wait intervals, runs the redistribution algorithm, and exports the resulting Knots and weighted edges as CSV files with full call stacks attached.

For user-space synchronization that doesn't cross the kernel boundary — spinlocks, RDMA operations, custom lock-free structures — wPerf provides an annotation API. C programs call `uds_add()` at initialization and log custom wait/wakeup events around their synchronization points. Java workloads use a JNI wrapper. It's inelegant but necessary: modern high-performance systems deliberately bypass the kernel, and a profiler that can only see kernel-boundary events will miss a growing fraction of real bottlenecks.

## What It Found in the Wild

The case studies are where the methodology proves its value.

**ZooKeeper** was the flagship example. Under a read-heavy workload, CPU utilization sat around 30-40% — clearly not the bottleneck. wPerf's graph revealed a Knot between the SendThread and SyncThread, with an I/O pseudo-thread representing the transaction log. The cascade analysis showed that the fundamental issue was batch size: ZooKeeper's design limited outstanding requests, which reduced the number of writes batched per fsync call, which made synchronization overhead dominate. After increasing concurrency limits and tuning the batching algorithm, throughput improved by up to **4.83x** with latency dropping over 50%.

**MySQL** surfaced a subtler issue. wPerf identified an SCC containing both worker threads and background flush threads. The redistribution analysis converged on a specific lock: "waiting for empty flushing slot." MySQL defaulted to 8 flush slots for single-page operations — a configuration that silently serialized concurrent dirty-page eviction under high write load. The fix was straightforward (increase the slot count or buffer size), but the bug was essentially invisible to any tool that only looked at lock contention duration without tracing the resource pool structure.

**HDFS** demonstrated the distributed case. EditLog sync latency in the Namenode propagated through processing threads to DataNode clients — a dependency chain that crossed RPC boundaries. The cascade algorithm correctly stripped out network latency contributions and isolated metadata flush as the root cause.

## Overhead and Tradeoffs

wPerf reports approximately **5.1% runtime overhead** in its evaluations, which is competitive for a tool providing full causal graph analysis. For comparison:

- `perf` with CPU sampling: under 1%, but completely blind to Off-CPU time
- eBPF `offcputime`: 10-40% under high syscall rates
- `ftrace` function tracing: 298-841% — fine for development, unusable in production

The gap between wPerf and eBPF tools at high syscall rates is worth noting. eBPF programs execute synchronously on every event; in a system making millions of context switches per second, that adds up. wPerf's kernel module uses an optimized binary log format with deferred flushing, which smooths out the overhead profile.

The honest limitation is the annotation requirement for user-space synchronization. If you're profiling a system that does significant coordination below the kernel boundary — and many high-performance databases, messaging systems, and network stacks do — you need to instrument those paths manually. That's not a fatal flaw, but it is engineering work.

## What This Changes for Practitioners

The practical shift wPerf demands is conceptual before it's tooling. Duration-based profiling asks "what took the longest?" Graph-based analysis asks "what is structurally blocking progress?"

These are different questions, and they lead to different diagnoses. A thread that waited for 500ms on a lock is a fact. A Knot containing that thread, where cascade analysis shows the weight ultimately accumulating on a 5-slot resource pool shared by 32 threads, is an actionable finding.

A few things to take from this:

When you see high latency with low CPU utilization, you're in Off-CPU territory. `offcputime` or wPerf-style analysis is the right tool, not a flame graph.

When `offcputime` gives you a stack but the fix isn't obvious, you're probably looking at a victim thread rather than a root cause. Tracing the wakeup chain — who woke the thread, who woke the waker — gets you to the real bottleneck.

wPerf's Knot theorem gives you a formal way to evaluate whether a proposed optimization will actually help. If the bottleneck isn't inside a Knot, fixing it won't improve throughput. This is a useful sanity check before spending engineering time on a change.

The tooling itself is available at [OSUSysLab/wPerf on GitHub](https://github.com/OSUSysLab/wPerf). It requires kernel module compilation and some integration work, so it's not a one-command drop-in. But the methodology — building wait-for graphs, identifying SCCs, applying cascade redistribution — is sound enough that even implementing parts of it in your own tracing infrastructure, using eBPF and a graph library, would yield better Off-CPU analysis than duration aggregation alone.

The flame graph was a genuine breakthrough for CPU profiling. For Off-CPU analysis, we've been coasting on the duration-based equivalent for too long. Graph topology is the next step.

---

*wPerf was presented at OSDI '18. The full paper is available at the [USENIX site](https://www.usenix.org/conference/osdi18/presentation/zhou).*

<!-- zh -->

CPU 利用率 35%，延迟飙高，火焰图上什么都没有。

这种情况你大概遇到过。没有热点函数，没有明显的嫌疑人，系统就是慢，但 profiler 告诉你一切正常。这不是工具的 bug，是工具的盲区——你遇到的是 Off-CPU 问题。

线程阻塞在 mutex 上、等磁盘写入完成、睡在条件变量上——这些时间里线程不在 CPU 上，采样型 profiler 永远不会采到它。瓶颈真实存在，但对绝大多数工具来说它是透明的。

wPerf 是 OSU Systems Lab 发表在 OSDI '18 上的研究成果，它不是又一个 Off-CPU 时长统计工具，而是用图论重新定义了"等待分析"这件事。

## "谁等得最久"有什么问题

现有的 Off-CPU 分析思路——Brendan Gregg 的 Off-CPU 火焰图、eBPF 的 `offcputime`——核心逻辑都是记录线程被阻塞的时长，然后归因到调用栈。回答的问题是：谁等得最久？

这个问题有价值，但有一个致命缺陷：等待时间长，不等于它是全局瓶颈。

举个存储引擎里常见的场景：有一个后台 compaction 线程在等 flush 完成，一次等了 200ms。这个数字很显眼，任何基于时长的工具都会把它排在前列。但如果这个线程跟你的请求处理路径毫无关系，优化它对吞吐量没有任何影响。

与此同时，写入关键路径上有一把锁，每次获取只需要 50 微秒，但每秒被几千个 worker 线程争抢。每次等待时间太短，在时长排行榜上根本排不上，但它在悄悄掐死整个系统的吞吐量。

wPerf 换了一个问题来问：哪些等待事件，在因果关系上影响了整个系统的吞吐量？

## 等待图与 Knot 定理

wPerf 把运行中的系统建模为有向图 G=(V,E)。每个顶点是一个线程或一个 I/O 设备（后者被抽象为伪线程）。有向边 u→v 的含义是"线程 u 正在等待 v"，边的权重是观测窗口内的累计等待时长。

这个结构捕捉的是等待的拓扑关系——不只是谁在等，而是谁导致了谁在等，这种因果关系如何在系统中传播。

论文的核心理论贡献是 **Knot 定理**。图论里，Knot 是一个子图，其中所有节点都没有指向子图外部的出边，也就是一个封闭的等待环。定理的结论是：如果等待图里存在任何由 worker 线程构成的 Knot，那这个 Knot 内部必然有至少一个限制系统最大吞吐量的瓶颈。

直觉上也很好理解：一组线程只在互相等待，从不等待外部任何东西，它们就困在一个封闭系统里。优化这个环之外的任何事情，影响都传不进来。要提升吞吐量，必须在每一个 Knot 内部至少打断一条等待边。

寻找 Knot 的方法是用 Tarjan 算法把等待图分解为强连通分量（SCC，Strongly Connected Components），在压缩后的 DAG 里没有出边的 SCC 就是 Knot。几百个线程的搜索空间，一下子缩减到几个结构性的瓶颈节点。

## 级联重分布：沿依赖链追踪根因

找到 Knot 只是定位到了正确的范围，还需要知道 Knot 内部具体该优化哪条等待。

考虑这样一条链：线程 A 等线程 B，线程 B 被磁盘 I/O 阻塞。图里有两条边：A→B 和 B→Disk。如果只看边权重，B 扛着 A 等待的所有时间，但 B 本身是受害者，优化 B 的代码毫无意义，真正的根因是磁盘。

wPerf 用**级联重分布**（cascaded redistribution）解决这个问题。算法沿依赖链传播等待权重：如果 A 在等 B，而 B 在同一时间段内也在等 C，那么 A 的等待权重会被部分或全部转移到 B→C 这条边上。权重朝根因方向流动。

如果一个节点在被等待期间正在 CPU 上执行，它就吸收权重——它确实在做需要时间的工作。如果它也在等别人，权重继续往下传。最终每条边上积累的权重，反映了它对上游所有等待的真实因果贡献。

重分布完成后，wPerf 裁剪掉低于阈值（约占总时间 1%）的弱边，重新识别 Knot。经过这个迭代精炼，几百个线程的复杂依赖网络会收缩成几个节点之间的紧密小环，瓶颈一目了然。

## 实现：KProbe、perf 与 Python 图引擎

理解实现方式有助于判断这个工具能看到什么、看不到什么。

内核模块在调度器的两个关键函数上挂 **KProbe**：

```bash
# 两个核心 hook 点
sched_switch   # 记录线程离开 CPU 的原因（主动阻塞还是被抢占）
sched_wakeup   # 记录谁唤醒了谁——这是构建有向边的关键
```

`sched_wakeup` 是关键所在。每次一个线程唤醒另一个线程，wPerf 会同时记录唤醒者和被唤醒者的 TID。这是它能构建有向边而不只是记录时长的原因。eBPF 的 `offcputime` 通常只捕获阻塞那一刻的调用栈——它知道谁在睡觉，但不知道谁把它叫醒的。

数据采集层（`record.sh`）还协调了几个标准工具：

```bash
# 采集调用栈用于归因
perf record -g --call-graph dwarf -p $PID

# I/O 饱和度检测
iostat -x 1
ifstat 1

# 将 TID 映射到可读线程名
jstack $PID  # JVM 工作负载
```

分析器用 Python 编写，基于 NetworkX 做图运算。它读入原始的 wait/wakeup 事件流，通过时间戳匹配还原出等待区间，执行重分布算法，最后把 Knot 和带权边导出为附有完整调用链的 CSV 文件。

对于不过内核边界的用户态同步——自旋锁、RDMA 操作、自定义的无锁结构——wPerf 提供了注释 API。C 程序在初始化时调用 `uds_add()`，在自定义同步点手动记录 wait/wakeup 事件；Java 工作负载通过 JNI 包装器接入。这个设计谈不上优雅，但有其必要性：现代高性能系统大量绕过内核做同步，一个只能看到内核边界事件的工具会漏掉越来越多的真实瓶颈。

## 在真实系统里发现了什么

**ZooKeeper** 是最典型的案例。在 read-heavy 负载下，CPU 利用率只有 30-40%，显然不是瓶颈所在。wPerf 的等待图发现了 SendThread 和 SyncThread 之间的一个 Knot，I/O 伪线程代表事务日志。级联分析显示根本问题在于批处理大小：ZooKeeper 的设计限制了 outstanding requests 的数量，导致每次 fsync 能批量写入的条目太少，同步开销占比因此居高不下。调整并发限制和批处理算法后，吞吐量最高提升了 **4.83 倍**，延迟降低超过 50%。

**MySQL** 暴露的问题更隐蔽。wPerf 识别出一个包含 worker 线程和后台 flush 线程的 SCC，重分布分析最终收敛到一把具体的锁："waiting for empty flushing slot"。MySQL 默认只为单页刷新提供 8 个插槽，在高并发写入下这个资源池把并发脏页淘汰彻底序列化了。修复方式很直接（增加插槽数或缓冲区大小），但这个 bug 对任何只看锁竞争时长、不追踪资源池结构的工具来说几乎是隐形的。

**HDFS** 展示了跨节点的情况。Namenode 的 EditLog sync 延迟通过处理线程传导到 DataNode 客户端，这条依赖链跨越了 RPC 边界。级联算法正确地剥离了网络延迟的影响，将根因定位到元数据刷盘。

## 开销与取舍

wPerf 在评测中报告的运行时开销约为 **5.1%**，对于能提供完整因果图分析的工具来说这个数字相当有竞争力。横向比较一下：`perf` CPU 采样的开销不到 1%，但对 Off-CPU 时间完全失明；eBPF `offcputime` 在高 syscall 速率下开销在 10%–40% 之间；`ftrace` 函数追踪的开销是 298%–841%，开发环境够用，生产环境别想。

wPerf 和 eBPF 工具在高 syscall 速率下的差距值得关注。eBPF 程序在每个事件上同步执行，系统每秒发生几百万次上下文切换时，这个开销会快速累积。wPerf 的内核模块采用优化的二进制日志格式加延迟刷新，开销曲线更平稳。

它的局限也需要正视：用户态同步路径需要手动插桩。很多高性能数据库、消息系统和网络协议栈大量使用内核以下的同步机制，如果你的系统是这类，就需要额外的集成工作。这不是致命缺陷，但不能忽略。

## 对实际工作的改变

wPerf 要求的转变，首先是思维方式上的。基于时长的 profiling 问的是"什么花了最长时间"，基于图的分析问的是"什么在结构上阻碍了进展"。

这是两个不同的问题，会导向截然不同的诊断结论。"某线程在锁上等了 500ms"是一个事实。"包含该线程的 Knot，经级联分析后权重最终积累在一个被 32 个线程共享的 5 槽资源池上"才是一个可以行动的发现。

几个实际操作层面的结论：看到高延迟但 CPU 利用率低，就是 Off-CPU 场景，该用 `offcputime` 或 wPerf 风格的分析，不是火焰图。`offcputime` 给了你调用栈但修法不明朗，你大概看到的是受害者线程而不是根因，顺着唤醒链往上追——谁唤醒了这个线程，谁又唤醒了那个唤醒者——才能到达真正的瓶颈。Knot 定理给了你一个形式化的方法来判断一个优化是否有效：如果瓶颈不在 Knot 内，修它不会改善吞吐量，这是在投入工程时间之前很有价值的 sanity check。

工具本身在 [OSUSysLab/wPerf](https://github.com/OSUSysLab/wPerf) 可以找到，需要编译内核模块，有一定集成工作量，不是开箱即用的。但其方法论——构建等待图、识别 SCC、执行级联重分布——足够扎实，即便只是把这些思路引入你自己的 eBPF 追踪基础设施，配合一个图计算库，也能比纯时长聚合得到好得多的 Off-CPU 分析结果。

火焰图是 CPU profiling 领域真正的突破。Off-CPU 分析这边，我们在时长统计这条路上走了太久了。图拓扑是下一步。

---

*wPerf 发表于 OSDI '18，论文全文可在 [USENIX](https://www.usenix.org/conference/osdi18/presentation/zhou) 获取。*
