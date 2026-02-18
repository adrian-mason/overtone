---
title: "Anatomy of a Cache Miss: A Journey Through the Memory Hierarchy"
description: "From L1 to main memory and beyond — understanding why your 'fast' code might be waiting on data it already asked for."
date: 2026-02-15
featured: false
tags: ["memory", "latency", "profiling", "systems-programming", "optimization"]
---

Every nanosecond counts when you're chasing performance. You've profiled your code, eliminated unnecessary allocations, vectorized your hot loops — and yet the numbers refuse to budge. The flame graph points at a function that does almost nothing: a simple array lookup. What's going on?

The answer, more often than not, is **cache misses**. Your CPU is fast. Unimaginably fast. But it spends most of its time *waiting for data*. Understanding why — and what to do about it — is one of the most valuable skills a performance engineer can develop.

This article is a deep dive into the memory hierarchy, cache behavior, and practical techniques for writing cache-friendly code. We'll look at real numbers, real hardware, and real code patterns that make the difference between "fast enough" and "why is this taking 200ms?"

---

## The Memory Hierarchy: A Quick Refresher

Modern CPUs don't just have "memory." They have a carefully layered hierarchy of storage, each level trading capacity for speed:

| Level | Typical Size | Approximate Latency | Relative Speed |
|-------|-------------|---------------------|----------------|
| **L1 Cache** | 32–64 KB | ~1 ns (4 cycles) | 1x |
| **L2 Cache** | 256 KB–1 MB | ~4 ns (12 cycles) | 4x slower |
| **L3 Cache** | 8–64 MB | ~12 ns (40 cycles) | 12x slower |
| **Main Memory** | 16–512 GB | ~60–100 ns | 60–100x slower |
| **NVMe SSD** | 1–8 TB | ~10,000 ns | 10,000x slower |
| **Network** | ∞ | ~500,000 ns | 500,000x slower |

That table tells the whole story. When your code accesses data in L1, it gets it in about 1 nanosecond. When it has to go to main memory, it waits 60–100x longer. And during that wait, the CPU pipeline stalls. Hundreds of potential instructions go unexecuted. Multiply that by millions of accesses per second, and you have a real performance problem hiding behind "simple" code.

The key insight: **a cache miss isn't just slow — it's catastrophically slow relative to everything else the CPU does.**

---

## What Actually Happens During a Cache Miss

Let's trace what happens when your code reads a value from an array:

```c
int value = data[index];
```

**Step 1: Virtual Address Translation.** The CPU takes the virtual address and checks the TLB (Translation Lookaside Buffer) to find the physical address. If the TLB misses, it walks the page table — another potential stall.

**Step 2: L1 Cache Lookup.** The physical address is used to check the L1 data cache. L1 is typically 32 KB, split into 64-byte cache lines. The cache controller checks the tag array to see if the line containing your data is present.

**Step 3: L1 Miss → L2 Lookup.** If the line isn't in L1, the request propagates to L2. This takes about 4 nanoseconds more. L2 is larger (256 KB–1 MB) but slower to access.

**Step 4: L2 Miss → L3 Lookup.** If L2 doesn't have it either, we go to L3. L3 is shared across all cores and can be 8–64 MB. This adds another 8 nanoseconds or so.

**Step 5: L3 Miss → Main Memory.** If even L3 doesn't have the data, the memory controller issues a request to DRAM. This is where the real pain begins. The memory controller must:
1. Send the row address to the correct DRAM bank
2. Wait for the row to be activated (tRAS)
3. Send the column address
4. Wait for the data to be read (CAS latency)
5. Transfer the data back over the memory bus

This entire round trip takes 60–100 nanoseconds. During this time, the CPU core that issued the request may be completely stalled — or, if it's an out-of-order processor, it tries to find other independent work to execute. But if your code is a tight loop over an array, there may be nothing else to do.

**Step 6: Cache Line Fill.** When the data finally arrives, the entire 64-byte cache line is loaded into L1 (and typically L2 and L3 as well). If your next access is within that same 64-byte line, it will be an L1 hit — essentially free.

This is why **spatial locality** matters so much.

---

## The Three Types of Cache Misses

Computer architects classify cache misses into three categories, known as the **Three C's**:

### 1. Compulsory Misses (Cold Misses)

The very first access to a cache line will always miss — the data has never been loaded. There's nothing you can do about these except prefetch data before you need it.

```c
// First access to this array — guaranteed compulsory miss
for (int i = 0; i < N; i++) {
    sum += data[i]; // First touch of each cache line is a cold miss
}
```

In practice, hardware prefetchers detect sequential access patterns and load ahead. So a simple linear scan has far fewer stalls than you'd expect. The prefetcher is your friend — *if* your access pattern is predictable.

### 2. Capacity Misses

Your working set is larger than the cache. Even if you access the same data repeatedly, the cache can't hold it all, so lines get evicted and must be reloaded.

```c
// If data[] is 100 MB, it won't fit in L3
// Second pass will still miss on most lines
for (int pass = 0; pass < 10; pass++) {
    for (int i = 0; i < N; i++) {
        sum += data[i];
    }
}
```

The fix: make your working set smaller, or restructure your algorithm to work on cache-sized blocks (see *loop tiling* below).

### 3. Conflict Misses

Even when the cache has room, two addresses may map to the same cache set and evict each other. This is an artifact of set-associative cache design.

```c
// Pathological case: stride matches cache set mapping
// These two arrays alias in the cache
for (int i = 0; i < N; i++) {
    sum += array_a[i * STRIDE] + array_b[i * STRIDE];
}
```

Conflict misses are rare in modern caches with high associativity (8–16 way), but they do appear in adversarial patterns or when using power-of-two strides that align with the cache geometry.

---

## Measuring Cache Misses

You can't optimize what you can't measure. Here are the tools:

### perf stat (Linux)

The simplest approach — hardware performance counters give you global miss rates:

```bash
perf stat -e cache-references,cache-misses,L1-dcache-load-misses,LLC-load-misses ./my_program
```

Output might look like:

```
 Performance counter stats for './my_program':

     1,847,293,012      cache-references
       412,837,291      cache-misses              # 22.34% of all cache refs
       583,291,037      L1-dcache-load-misses
        89,203,117      LLC-load-misses

       3.127 seconds time elapsed
```

A 22% cache miss rate is a red flag. In well-optimized code, you want this under 5%.

### perf record + perf annotate

When you need to know *which instructions* are causing misses:

```bash
perf record -e mem_load_retired.l3_miss:pp ./my_program
perf annotate --symbol=hot_function
```

This gives you source-line attribution of L3 misses. Incredibly powerful.

### cachegrind (Valgrind)

Simulates the cache hierarchy and gives exact miss counts per line:

```bash
valgrind --tool=cachegrind ./my_program
cg_annotate cachegrind.out.<pid>
```

The downside: ~20x slowdown. But the data is precise and deterministic, which makes it invaluable for comparing before/after.

### Intel VTune / AMD uProf

The commercial profilers give the richest picture: memory access heat maps, bandwidth utilization graphs, and specific guidance on which data structures to restructure.

---

## Patterns That Kill Cache Performance

Let's look at real code patterns that generate cache misses, and their fixes.

### Pattern 1: Linked List Traversal

Linked lists are the poster child for cache-hostile data structures:

```c
struct Node {
    int value;
    struct Node *next;
};

// Each node could be anywhere in memory
int sum = 0;
for (Node *n = head; n != NULL; n = n->next) {
    sum += n->value; // Pointer chase — likely cache miss per node
}
```

Each `n->next` dereference follows a pointer to an unpredictable location. The hardware prefetcher can't help because there's no pattern to predict. Every node access is potentially a cache miss.

**Fix:** Use a contiguous array instead. If you truly need a linked structure, use an *intrusive* linked list backed by a pool allocator so nodes are physically adjacent.

```c
// Cache-friendly alternative
int sum = 0;
for (int i = 0; i < N; i++) {
    sum += values[i]; // Sequential — prefetcher handles this
}
```

The difference in practice: **5–20x faster** for large lists.

### Pattern 2: Column-Major Access on Row-Major Arrays

In C, 2D arrays are stored row-major. Accessing column-by-column strides across cache lines:

```c
// BAD: column-major traversal of a row-major array
for (int col = 0; col < COLS; col++) {
    for (int row = 0; row < ROWS; row++) {
        sum += matrix[row][col]; // Stride = COLS * sizeof(int)
    }
}
```

If COLS is 1024 and elements are 4-byte ints, each row step jumps 4096 bytes — one full page. You're touching one element per cache line and discarding the rest.

```c
// GOOD: row-major traversal
for (int row = 0; row < ROWS; row++) {
    for (int col = 0; col < COLS; col++) {
        sum += matrix[row][col]; // Sequential within cache lines
    }
}
```

This simple loop swap can yield **10–40x** improvement on large matrices.

### Pattern 3: Array of Structs vs. Struct of Arrays

Consider a particle simulation:

```c
// Array of Structs (AoS)
struct Particle {
    float x, y, z;       // position
    float vx, vy, vz;    // velocity
    float mass;
    int type;
    char name[32];
    // ... 64+ bytes per particle
};

Particle particles[1000000];

// Update positions — touches x, y, z, vx, vy, vz
// but loads entire 64+ byte struct into cache
for (int i = 0; i < N; i++) {
    particles[i].x += particles[i].vx * dt;
    particles[i].y += particles[i].vy * dt;
    particles[i].z += particles[i].vz * dt;
}
```

Each particle is 64+ bytes. The position update only needs 24 bytes (x, y, z, vx, vy, vz), but loads the entire struct — wasting half the cache line on `mass`, `type`, `name`, etc.

```c
// Struct of Arrays (SoA)
struct Particles {
    float *x, *y, *z;
    float *vx, *vy, *vz;
    float *mass;
    int *type;
};

// Now position update loads ONLY position and velocity data
for (int i = 0; i < N; i++) {
    x[i] += vx[i] * dt;
    y[i] += vy[i] * dt;
    z[i] += vz[i] * dt;
}
```

SoA packs the hot data together. Every cache line is full of data you actually need. Bonus: this layout is also SIMD-friendly.

### Pattern 4: Hash Map with Open Addressing vs. Chaining

Chained hash maps allocate a linked list per bucket — combining the worst of hashing (random access) with linked list pointer chasing. Open addressing (like Robin Hood or Swiss Table) stores entries inline in a contiguous array, keeping cache behavior much more predictable.

Google's `absl::flat_hash_map` and Rust's `HashMap` (based on Swiss Table) both use open addressing specifically for cache performance.

### Pattern 5: Binary Tree Traversal

BSTs have the same problem as linked lists — each left/right pointer chase is a potential cache miss. For read-heavy workloads, a sorted array with binary search gives identical O(log n) complexity but with far better cache behavior because the data is contiguous.

For write-heavy workloads, B-trees (with high fanout) keep more keys per node, reducing the number of pointer chases per lookup from O(log2 n) to O(logB n).

---

## Advanced Technique: Loop Tiling (Blocking)

Loop tiling (or blocking) restructures loops to operate on cache-sized chunks:

```c
// Naive matrix multiply — terrible cache behavior for large N
for (int i = 0; i < N; i++)
    for (int j = 0; j < N; j++)
        for (int k = 0; k < N; k++)
            C[i][j] += A[i][k] * B[k][j];
```

The inner loop accesses `B[k][j]` with stride N — column-major on a row-major array. For large N, this causes constant L3 misses.

```c
// Tiled matrix multiply — B stays in L1/L2
#define BLOCK 64

for (int ii = 0; ii < N; ii += BLOCK)
  for (int jj = 0; jj < N; jj += BLOCK)
    for (int kk = 0; kk < N; kk += BLOCK)
      for (int i = ii; i < ii + BLOCK; i++)
        for (int j = jj; j < jj + BLOCK; j++)
          for (int k = kk; k < kk + BLOCK; k++)
            C[i][j] += A[i][k] * B[k][j];
```

By processing 64x64 blocks, the working set for the inner loops fits entirely in L1. The speedup for a 4096x4096 matrix multiply can be **3–8x** from tiling alone.

---

## Advanced Technique: Data-Oriented Design

Data-Oriented Design (DoD) is a philosophy that puts data layout at the center of software architecture. Instead of asking "what objects do I need?", you ask "what data do I need to process, and how should it be laid out in memory?"

The key principles:

1. **Think about data flow, not object hierarchies.** What data is read together? Put it together.
2. **Separate hot and cold data.** Fields accessed in the hot path should be in their own array. Rarely-accessed metadata goes elsewhere.
3. **Process in bulk.** Instead of updating one entity at a time through virtual method calls, process all entities of the same type in a tight loop.

The game industry has embraced DoD heavily. The Entity Component System (ECS) pattern, used in engines like Unity DOTS and Bevy, is essentially DoD applied to game architecture: components are stored in contiguous arrays by type, and systems iterate over those arrays linearly.

The result: games that process 100,000+ entities at 60 FPS on hardware that would choke processing 10,000 entities with traditional OOP.

---

## Advanced Technique: Software Prefetching

When the hardware prefetcher can't predict your access pattern (hash table lookups, tree traversals, graph algorithms), you can insert explicit prefetch instructions:

```c
for (int i = 0; i < N; i++) {
    // Prefetch data we'll need 8 iterations from now
    __builtin_prefetch(&data[indices[i + 8]], 0, 1);

    // Process current element
    sum += data[indices[i]];
}
```

The prefetch instruction tells the CPU to start loading the cache line into L2 (or L1, depending on the hint) without stalling. By the time you actually need the data 8 iterations later, it's already in cache.

Caveats:
- Prefetch distance depends on memory latency and loop body duration
- Too aggressive prefetching evicts useful data
- Too timid prefetching doesn't hide the latency
- Profile before and after — it's easy to make things worse

---

## Advanced Technique: Huge Pages

The TLB (Translation Lookaside Buffer) caches virtual-to-physical address translations. Standard pages are 4 KB; a typical L1 TLB has 64 entries, covering only 256 KB of memory. If your working set is larger, you'll get TLB misses on top of cache misses.

Huge pages (2 MB on x86, or 1 GB for the truly ambitious) let each TLB entry cover 512x more memory:

```bash
# Linux: enable transparent huge pages for your process
echo always > /proc/sys/vm/nr_hugepages

# Or use madvise in code
madvise(ptr, size, MADV_HUGEPAGE);
```

For large-footprint applications (databases, scientific computing, JVMs), huge pages can reduce TLB misses by 10–50x and improve throughput by 5–15%.

---

## Real-World Case Study: The 200ms Mystery

Here's a story from production. A service had a p99 latency of 200ms for a particular endpoint. The business logic was trivial: look up a user ID in a hash map, read a few fields, return JSON. Should have been microseconds.

**Investigation:**

1. `perf stat` showed 31% LLC (Last Level Cache) miss rate. Far too high.
2. `perf record -e mem_load_retired.l3_miss` pointed at the hash map lookup.
3. The hash map held 50 million entries. Each entry was a `std::unordered_map<uint64_t, UserProfile>` where `UserProfile` was 2 KB.
4. Total memory: ~100 GB. Way beyond L3 (30 MB on this machine).
5. Every lookup was essentially a random access to main memory: ~100ns for the hash bucket, ~100ns for the `UserProfile` struct. Two cache misses minimum.
6. Under load, memory bandwidth saturation caused further queuing, pushing individual lookups to 500ns+.
7. The endpoint made ~400 lookups per request (loading a user's friends list). 400 * 500ns = 200,000ns = 200 microseconds... but that's per-lookup. With memory bandwidth contention across 32 cores, latency ballooned.

**Fix:**

1. Separated hot fields (`user_id`, `name`, `status`) into a compact 64-byte struct. Cold fields (`bio`, `preferences`, `history`) stayed in the large struct.
2. Replaced `std::unordered_map` with a Swiss Table variant (`absl::flat_hash_map`) using the compact struct.
3. Hot map footprint: 50M * 64B = ~3.2 GB. Still too large for L3, but much more cache-line efficient (one entry per line instead of spanning 32 lines).
4. Added prefetching: when loading a friends list, prefetched the next 4 lookups while processing the current one.
5. Enabled 2 MB huge pages for the hash map's memory region.

**Result:** p99 dropped from 200ms to 8ms. A **25x improvement** from pure data layout and cache optimization — zero algorithmic changes.

---

## Rules of Thumb

After years of chasing cache misses, here are the patterns I've internalized:

1. **Sequential access is ~100x faster than random access** at scale. Always prefer arrays over linked structures.

2. **Keep hot data small.** If your inner loop only reads 3 fields, don't put 30 fields in the same struct.

3. **Measure before optimizing.** `perf stat` takes 10 seconds and tells you if cache misses are even your problem.

4. **Respect the cache line.** 64 bytes. If two fields are always accessed together, put them in the same 64-byte region. If they're accessed by different threads, put them in *different* cache lines (to avoid false sharing).

5. **Trust the hardware prefetcher for sequential patterns.** Don't add software prefetches for linear scans — the hardware already handles it. Save manual prefetching for irregular access patterns.

6. **B-trees beat binary trees.** For any data structure that will be larger than L3, maximize the useful data per cache line.

7. **Profile at the instruction level.** Global miss rates tell you there's a problem. `perf annotate` tells you where.

8. **The fastest cache miss is the one that never happens.** Restructure your data before reaching for prefetching or pinning tricks.

---

## Further Reading

- Brendan Gregg, *Systems Performance*, Chapter 6: Memory
- Ulrich Drepper, *What Every Programmer Should Know About Memory* (2007, still essential)
- Mike Acton, *Data-Oriented Design and C++* (CppCon 2014 talk)
- Daniel Lemire's blog on cache-aware algorithms
- Intel Optimization Manual, Chapter 3: Memory Hierarchy

The memory hierarchy isn't going away. If anything, the gap between CPU speed and memory speed continues to widen with each generation. Learning to work *with* the cache — rather than against it — is one of the highest-leverage skills in performance engineering.

Your CPU is waiting. Stop making it wait for data.

<!-- zh -->

每一纳秒都很重要。你已经做了性能分析，消除了不必要的内存分配，向量化了热循环——但数字就是不动。火焰图指向一个几乎什么都不做的函数：一个简单的数组查找。到底怎么回事？

答案往往是**缓存未命中（cache miss）**。你的 CPU 很快，快到难以想象。但它大部分时间都在*等待数据*。理解其中原因——以及如何解决——是性能工程师最有价值的技能之一。

---

## 内存层次结构

现代 CPU 不只有"内存"。它们有精心分层的存储体系，每一层都在容量和速度之间权衡：

| 层级 | 典型大小 | 大致延迟 | 相对速度 |
|------|---------|---------|---------|
| **L1 缓存** | 32–64 KB | ~1 ns (4 周期) | 1x |
| **L2 缓存** | 256 KB–1 MB | ~4 ns (12 周期) | 慢 4x |
| **L3 缓存** | 8–64 MB | ~12 ns (40 周期) | 慢 12x |
| **主内存** | 16–512 GB | ~60–100 ns | 慢 60–100x |
| **NVMe SSD** | 1–8 TB | ~10,000 ns | 慢 10,000x |

关键洞察：**缓存未命中不只是慢——相对于 CPU 的其他操作，它是灾难性地慢。**

---

## 缓存未命中时到底发生了什么

当代码执行 `int value = data[index];` 时：

1. **虚拟地址转换** — CPU 检查 TLB 获取物理地址，TLB 未命中则遍历页表
2. **L1 缓存查找** — 用物理地址检查 L1 数据缓存（32 KB，64 字节缓存行）
3. **L1 未命中 → L2** — 多花约 4 纳秒
4. **L2 未命中 → L3** — 再多约 8 纳秒，L3 在所有核心间共享
5. **L3 未命中 → 主内存** — 内存控制器向 DRAM 发请求，等待行激活、CAS 延迟、数据传输，整个往返 60–100 纳秒
6. **缓存行填充** — 整个 64 字节缓存行被加载到 L1/L2/L3

这就是**空间局部性**如此重要的原因——下一次访问如果在同一个 64 字节行内，就是 L1 命中，几乎免费。

---

## 缓存未命中的三种类型

计算机体系结构将缓存未命中分为三类，称为 **Three C's**：

### 1. 强制性未命中（冷未命中）

对缓存行的首次访问一定会未命中——数据从未被加载过。除了预取，你对此无能为力。

### 2. 容量性未命中

你的工作集大于缓存。即使你反复访问相同的数据，缓存也无法全部容纳。

**解决方法：** 缩小工作集，或重构算法以处理缓存大小的块（参见下文的*循环分块*）。

### 3. 冲突性未命中

即使缓存有空间，两个地址可能映射到同一个缓存组并互相驱逐。这在现代高关联度缓存（8-16路）中较少见。

---

## 测量缓存未命中

### perf stat (Linux)

```bash
perf stat -e cache-references,cache-misses,L1-dcache-load-misses,LLC-load-misses ./my_program
```

22% 的缓存未命中率是个红旗。优化良好的代码应该低于 5%。

### perf record + perf annotate

```bash
perf record -e mem_load_retired.l3_miss:pp ./my_program
perf annotate --symbol=hot_function
```

精确到源代码行级别的 L3 未命中归因。非常强大。

### cachegrind (Valgrind)

模拟缓存层次结构，给出每行代码精确的未命中计数。缺点是约 20 倍的运行减速，但数据精确且确定性强。

### Intel VTune / AMD uProf

商业分析器提供最丰富的视角：内存访问热力图、带宽利用率图表，以及具体的数据结构重构建议。

---

## 性能杀手模式

### 模式 1：链表遍历

链表是缓存不友好数据结构的典型代表。每次 `next` 指针追踪都是不可预测的内存访问。

**解决方法：** 使用连续数组。实际差异：大型链表上快 **5–20 倍**。

### 模式 2：行主序数组的列优先访问

在 C 中，二维数组是行主序存储的。按列访问会跨越缓存行。简单的循环交换就能带来 **10–40 倍** 的提升。

### 模式 3：结构体数组 vs 数组结构体

结构体数组（AoS）将冷热数据混在一起，浪费缓存行。数组结构体（SoA）将热数据打包在一起，每条缓存行都装满了你真正需要的数据。

### 模式 4：链式哈希表 vs 开放寻址

链式哈希表为每个桶分配链表——结合了哈希的随机访问和链表的指针追踪。开放寻址（如 Robin Hood 或 Swiss Table）将条目内联存储在连续数组中，缓存行为更可预测。Google 的 `absl::flat_hash_map` 和 Rust 的 `HashMap` 都使用开放寻址。

### 模式 5：二叉树遍历

BST 和链表有同样的问题——每次左/右指针追踪都是潜在的缓存未命中。对于读密集型负载，排序数组 + 二分查找给出相同的 O(log n) 复杂度，但缓存行为好得多。对于写密集型负载，B 树（高扇出）每个节点保存更多键，将每次查找的指针追踪从 O(log₂ n) 减少到 O(log_B n)。

---

## 高级技术：循环分块

通过处理缓存大小的数据块，让内层循环的工作集完全放入 L1。对 4096×4096 矩阵乘法，仅分块就能带来 **3–8 倍** 加速。

## 高级技术：面向数据的设计

不要问"我需要什么对象"，而要问"我需要处理什么数据，它应该如何在内存中布局"。

游戏行业已大量采用面向数据的设计。ECS 模式本质上就是应用于游戏架构的 DoD。

## 高级技术：软件预取

当硬件预取器无法预测访问模式时（哈希表查找、树遍历、图算法），可以插入显式预取指令：

```c
for (int i = 0; i < N; i++) {
    __builtin_prefetch(&data[indices[i + 8]], 0, 1);
    sum += data[indices[i]];
}
```

预取指令告诉 CPU 开始加载缓存行但不阻塞。等你 8 次迭代后真正需要数据时，它已经在缓存里了。注意：预取距离取决于内存延迟和循环体耗时，优化前后都要测量。

## 高级技术：大页

TLB 缓存虚拟到物理地址的转换。标准页 4 KB，典型 L1 TLB 有 64 条目，仅覆盖 256 KB。大页（x86 上 2 MB）让每个 TLB 条目覆盖 512 倍内存。对大内存应用（数据库、科学计算、JVM），大页可减少 TLB 未命中 10–50 倍，吞吐量提升 5–15%。

---

## 实战案例：200ms 之谜

一个服务的 p99 延迟为 200ms。业务逻辑很简单：在哈希表中查找用户 ID，读几个字段，返回 JSON。

**调查过程：** `perf stat` 显示 31% LLC 未命中率。哈希表有 5000 万条目，每条 2 KB，总计约 100 GB——远超 L3（30 MB）。每次查找至少两次缓存未命中。该端点每请求做约 400 次查找（加载好友列表）。

**解决方案：** 将热字段（64 字节）和冷字段分离，替换为 Swiss Table，添加预取（当前查找时预取后续 4 个），启用 2 MB 大页。

**结果：** p99 从 200ms 降到 8ms。**25 倍提升**，纯数据布局和缓存优化——零算法变更。

---

## 经验法则

1. **顺序访问比随机访问快约 100 倍**。始终优先选择数组而非链式结构。
2. **保持热数据小巧**。如果内循环只读 3 个字段，不要在同一个结构体中放 30 个字段。
3. **先测量再优化**。`perf stat` 只需 10 秒就能告诉你缓存未命中是否是你的问题。
4. **尊重缓存行**。64 字节。一起访问的字段放在同一个 64 字节区域。
5. **B 树胜过二叉树**。对于大于 L3 的数据结构，最大化每条缓存行的有用数据。

---

内存层次结构不会消失。CPU 速度和内存速度之间的差距每一代都在扩大。学会*配合*缓存工作——而不是与之对抗——是性能工程中回报最高的技能之一。

你的 CPU 在等待。别让它等数据了。

## 延伸阅读

- Brendan Gregg《系统性能》第 6 章：内存
- Ulrich Drepper《每个程序员都应该了解的内存知识》（2007 年，至今必读）
- Mike Acton《面向数据的设计与 C++》（CppCon 2014 演讲）
- Daniel Lemire 关于缓存感知算法的博客
- Intel 优化手册，第 3 章：内存层次结构
