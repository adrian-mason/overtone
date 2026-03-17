---
title: "Annotate Everything, Pay Nothing"
subtitle: "A Deep Dive into Intel ITT"
zh_title: "零开销插桩的秘密"
zh_subtitle: "Intel ITT 架构设计深度解析"
description: "Intel ITT lets you ship production binaries with profiler annotations permanently compiled in — and pay zero overhead when no tool is attached. Here's how it works."
date: 2026-03-17T10:00:00
featured: false
tags:
  - Performance
  - Intel
  - Profiling
  - Tracing
  - VTune
---


The first time I read the Intel ITT documentation, I assumed I was misunderstanding something. The claim was that you could compile instrumentation calls into production binaries — every hot path, every tight loop — and that when no profiling tool was attached, the overhead would be negligible. Not "low". Not "amortised over time". Negligible, by design, at every call site.

That's a bold claim. Most instrumentation stories go the other way: you add markers for debugging, they slow things down, so you ifdef them out for release and then wonder why your release builds behave differently from your profiling builds. ITT's answer to this is an architectural decision, not a performance trick, and it's worth understanding from the ground up.

---

## The Two-Layer Design

ITT separates the *instrumentation surface* from the *collection mechanism* at the binary level.

Your application links against `libittnotify` — a static library that ships with the Intel oneAPI toolkits and is also available standalone via the [ittapi repository](https://github.com/intel/ittapi). This library contains no actual collection logic. What it contains is a global function pointer table. Every ITT API call in your code — `__itt_task_begin`, `__itt_domain_create`, `__itt_pause`, all of them — expands to an indirect call through this table.

At process start, all entries in the table point to null stubs. A null stub is exactly what it sounds like: a function that immediately returns, doing nothing. The compiler sees an indirect call; the CPU executes a pointer dereference and a branch. That's the entirety of the overhead when no collector is present.

When a profiling tool like VTune attaches (or is already running when the process starts), it loads a collector dynamic library into the process. That collector calls `__itt_api_init`, which populates the function pointer table with real implementations. From that point forward, every ITT call routes to the collector. The application binary is identical in both cases.

This is the inversion I found surprising: the decision to pay instrumentation overhead belongs to the *profiler operator*, not the *developer who wrote the code*. You can ship an ITT-annotated binary to production and pay ~2–5 ns per call (one pointer dereference and an indirect branch on x86-64). When your on-call engineer wants to profile a live instance, they attach VTune without recompiling anything.

The implication for production deployability is real. No separate "profiling build". No ifdef forests. The annotation is always there; the collector is optional.

---

## The API Surface

ITT has two distinct API families that serve different purposes and are often confused.

**The ITT Notification API** is for annotating *known* code. You own the source; you add markers. **The JIT Profiling API** is for *dynamic* code — methods compiled at runtime by a JIT compiler or interpreter. They share the zero-overhead-when-idle guarantee but have very different shapes.

### Domains, Tasks, and String Handles

The core ITT model revolves around three types:

- A **Domain** is a named namespace for your annotations. Think of it as a category that groups related tasks. VTune can filter by domain.
- A **String Handle** is an interned string reference. Creating it is moderately expensive (heap allocation + internal registration); using it is free. You create handles once, store them globally, and pass them to task calls.
- A **Task** marks a region of work on a single thread. You call begin before the work and end after.

In C:

```c
// Initialise once — not in hot paths
static __itt_domain*        g_domain    = NULL;
static __itt_string_handle* g_draw_mesh = NULL;

void init_itt(void) {
    g_domain    = __itt_domain_create("com.myengine.render");
    g_draw_mesh = __itt_string_handle_create("RenderSystem::DrawMesh");
}

// In the hot path
void draw_mesh(Mesh* m) {
    __itt_task_begin(g_domain, __itt_null, __itt_null, g_draw_mesh);
    // ... actual work ...
    __itt_task_end(g_domain);
}
```

The `__itt_null` arguments are the task ID and parent task ID. Passing `__itt_null` for the parent tells the collector to infer parentage from the call stack. You can assign explicit IDs if you need to express logical parent-child relationships that don't follow the physical call stack — useful for work-stealing thread pools where tasks migrate between threads.

The Rust `ittapi` crate wraps this cleanly:

```rust
use ittapi::{Domain, StringHandle, Task};

// Once at startup
let domain    = Domain::new("com.myengine.render");
let draw_mesh = StringHandle::new("RenderSystem::DrawMesh");

// In the hot path — RAII guard, ends task on drop
fn draw_mesh_fn(mesh: &Mesh) {
    let _task = Task::begin(&domain, &draw_mesh);
    // ... actual work ...
    // task ends here automatically
}
```

The RAII design is not cosmetic. The C API has no protection against a `task_begin` without a matching `task_end` — a panic or early return in the middle of a region will leave the task open, producing malformed timelines in the profiler. The Rust crate makes this impossible: the `Task` struct calls `__itt_task_end` in its `Drop` implementation. I've caught real bugs this way during development, where an error path bypassed cleanup code.

### Frames, Counters, and Markers

Beyond tasks, ITT provides three other useful primitives:

**Frames** annotate application-level cycles — game loops, render frames, request/response cycles. Where tasks measure individual operations, frames measure the wall-clock budget of a full iteration. VTune has a dedicated frame duration view that plots frame time distributions:

```c
__itt_frame_begin_v3(g_domain, NULL);
// ... process one frame ...
__itt_frame_end_v3(g_domain, NULL);
```

**Counters** track scalar metrics over time — queue depths, cache hit rates, object pool utilisation. They appear in VTune's custom metrics timeline:

```c
static __itt_counter g_queue_depth = NULL;
g_queue_depth = __itt_counter_create("WorkQueue::depth", "com.myengine.threading");

// Later:
__itt_counter_set_value(g_queue_depth, &depth);  // unsigned 64-bit
```

**Markers** are instantaneous events — a one-time annotation with no duration:

```c
__itt_marker(g_domain, __itt_null, my_handle, __itt_marker_scope_process);
```

Useful for noting when a configuration reload fired, when a GC cycle started, or when a network partition was detected.

### Pause and Resume

This one earns its place in every VTune workflow I use:

```c
__itt_pause();   // Stop collecting
// ... warm-up code, initialisation, parts you don't care about ...
__itt_resume();  // Start collecting
```

`__itt_pause` and `__itt_resume` signal the collector to suppress sample collection. The CPU keeps running; nothing about execution changes. What changes is whether VTune records the samples. When you're profiling a server that takes 10 seconds to initialise before entering steady-state operation, this eliminates 10 seconds of initialisation noise from your profile. The resulting report is clean: every sample is from the code path you actually care about.

---

## The JIT Profiling API

If you're writing a JIT compiler, an interpreter, or anything that generates machine code at runtime, the JIT Profiling API is the mechanism by which profilers can attach symbol names to your dynamically generated code.

Without it, profiler samples that land in JIT-compiled regions appear as unlabelled addresses. With it, they appear as named methods with source-level line attribution.

The core call:

```c
#include <jitprofiling.h>

// Before registering a JIT-compiled method, check if anyone is listening
if (iJIT_IsProfilingActive() != iJIT_NOTHING_RUNNING) {
    iJIT_Method_Load method = {0};
    method.method_id          = assign_unique_id();   // caller owns this
    method.method_name        = "MyJIT::fibonacci";
    method.method_load_address = code_ptr;
    method.method_size         = code_size;
    method.source_file_name    = "fibonacci.myl";
    method.line_number_size    = line_table_count;
    method.line_number_table   = line_table_ptr;

    iJIT_NotifyEvent(iJVM_EVENT_TYPE_METHOD_LOAD_FINISHED, &method);
}
```

The `iJIT_IsProfilingActive()` gate is important. Building a `iJIT_Method_Load` struct requires allocating and filling name strings, constructing a line number table, and calling into the notification infrastructure. When nothing is profiling, that's wasted work. The fast path when `iJIT_NOTHING_RUNNING` is returned: skip the entire block.

The `method_id` uniqueness requirement is the most common source of bugs in JIT integrations. The API provides no ID allocator — you own it. In a compiler with concurrent compilation threads, ID assignment requires synchronisation. An atomic counter works fine in practice:

```c
static _Atomic unsigned int g_next_method_id = 1;

unsigned int assign_unique_id(void) {
    return atomic_fetch_add_explicit(
        &g_next_method_id, 1, memory_order_relaxed
    );
}
```

When a tiered JIT re-compiles a method (e.g., after collecting type feedback), you must send `iJVM_EVENT_TYPE_METHOD_UNLOAD_START` with the old ID before registering the new version. Re-using an ID without an unload event produces undefined collector behaviour — in practice, VTune will merge samples from different compilations of the same method, making it impossible to compare them.

Implementing the line number table is non-trivial but worth it. Without it, profilers can attribute samples to a method name but not to a source line. For any compiler targeting a non-trivial language, line-level attribution is the difference between "the JIT'd code is hot" and "line 47 in fibonacci.myl accounts for 83% of samples".

---

## What "Zero Overhead" Actually Means

The documentation says negligible overhead when no collector is attached. Let me be more precise about what that means at the instruction level.

Each ITT call compiles to something like:

```asm
mov  rax, QWORD PTR [rip + __itt_task_begin_ptr]
test rax, rax
je   skip
call rax
skip:
```

That's a load from the function pointer table, a null check, and a conditional indirect call. On a modern out-of-order CPU with a warm L1 cache, this is roughly 3–5 ns — maybe 2–3 cycles for the load, plus branch prediction overhead if the branch is poorly predicted (it won't be, since it's always-not-taken when no collector is attached).

For most code — functions that do microseconds or more of work — this is genuinely negligible. For code that's called in loops running at sub-100 ns per iteration, 5 ns per ITT call starts to add up. I've seen ITT overhead become measurable in loops running at 20 MHz+ call rates. The right response is not to abandon ITT but to hoist the task boundary to a coarser granularity: annotate the batch, not each element.

When a collector *is* attached, overhead depends entirely on what the collector does. VTune's production collector is reasonably optimised, but it does take a lock, record a timestamp, and write to a ring buffer per task event. For a well-instrumented application with moderate task granularity (functions taking microseconds to milliseconds), this is invisible. For extremely fine-grained annotation of tight loops, you'll see collector overhead — which is a signal to coarsen your instrumentation, not to remove it.

---

## Comparison with Alternatives

No instrumentation API exists in isolation. Here's where ITT sits relative to the other options:

### Linux perf software events (`PERF_COUNT_SW_DUMMY`)

`perf_event_open` with `PERF_COUNT_SW_DUMMY` gives you userspace breakpoints that perf can count or sample around. The interface is lower-level than ITT: you call `ioctl(fd, PERF_EVENT_IOC_ENABLE)` to start and stop collection regions. It integrates with the kernel's perf subsystem, meaning you get hardware PMU correlation for free.

The limitation: no semantic naming. You annotate regions by file descriptor, not by human-readable domain/task names. Tooling support outside of `perf record`/`perf report` is thin. For understanding *what* a region does, you're on your own.

ITT wins on semantics and ecosystem integration. Perf wins on portability (any Linux kernel ≥ 3.x, no Intel-specific headers required) and kernel-level correlation.

### LTTng Userspace Tracing (UST)

LTTng UST is a mature, high-throughput tracing framework for Linux. It uses shared memory ring buffers between the traced application and the collection daemon, which gives it lower per-event overhead than ITT at high event rates — sub-nanosecond in some configurations.

LTTng supports CTF (Common Trace Format), meaning traces can be consumed by tools like Babeltrace, TraceCompass, and Perfetto. The ecosystem is broader than VTune.

The cost: LTTng requires a running daemon (`lttng-sessiond`), session configuration before tracing starts, and a non-trivial setup for per-probe type declarations. ITT's "link the library and call the API" story is much simpler to adopt incrementally. For production server tracing at high event rates, I'd consider LTTng. For developer-workflow profiling where VTune is already in the picture, ITT is less friction.

### ETW (Event Tracing for Windows)

ETW is the Windows analogue and is, in many ways, more capable than ITT for system-level tracing — it integrates with kernel events, supports hardware PMU data, and WPA (Windows Performance Analyzer) is an excellent analysis tool. If your application is Windows-first, ETW is the native choice.

ITT is cross-platform (Linux, Windows, macOS); ETW is Windows-only. On Linux, ETW is not an option. On Windows, VTune can consume both ETW and ITT events simultaneously, which is genuinely useful.

### Tracy and Superluminal

Tracy is a sampling + instrumentation profiler with its own marker API. You instrument with `ZoneScoped` macros (RAII, like the Rust `ittapi` crate's `Task`), and Tracy records high-resolution timelines with memory profiling, mutex contention tracking, and GPU zone support.

The important distinction: Tracy is a *complete profiling system*, not just an instrumentation API. It ships its own collection server, its own GUI, and its own wire protocol. This makes it more self-contained and more portable than ITT. It does not require VTune.

The trade-off is that Tracy's collector is always-on in profiling builds — it continuously records to a memory-mapped ring buffer and streams to the capture server. This is great for realtime visualisation but means you can't ship Tracy instrumentation in production binaries with zero overhead. ITT's null-stub design is fundamentally better for production code that you want instrumented at all times.

Superluminal has a similar story: excellent Windows profiler, its own marker API, but tied to its own tool ecosystem.

My current practice: ITT annotations for long-running production services where the zero-overhead property matters. Tracy for game-engine and GPU workloads during development, where the richer visualisation and realtime streaming are more useful than production deployability.

---

## Practical Patterns

### The handle pre-creation rule

This is the single most important operational detail and the most commonly violated. `__itt_domain_create` and `__itt_string_handle_create` are *not* free. They allocate memory, register the handle internally (with a lock), and may trigger lazy DLL loading on first call. Calling them in a hot path is a performance bug.

The right pattern:

```c
// Module-level or thread-local statics, initialised at startup
static __itt_domain*        s_domain   = NULL;
static __itt_string_handle* s_compress = NULL;

// Call this exactly once, during application initialisation
void audio_system_init(void) {
    s_domain   = __itt_domain_create("com.myengine.audio");
    s_compress = __itt_string_handle_create("AudioSystem::CompressBlock");
}

// In the hot path — handles already exist, just use them
void compress_audio_block(const float* samples, size_t count) {
    __itt_task_begin(s_domain, __itt_null, __itt_null, s_compress);
    // ...
    __itt_task_end(s_domain);
}
```

In Rust, the `once_cell` or `std::sync::OnceLock` pattern works well:

```rust
use std::sync::OnceLock;
use ittapi::{Domain, StringHandle};

static DOMAIN: OnceLock<Domain>       = OnceLock::new();
static COMPRESS: OnceLock<StringHandle> = OnceLock::new();

fn init() {
    DOMAIN.get_or_init(|| Domain::new("com.myengine.audio"));
    COMPRESS.get_or_init(|| StringHandle::new("AudioSystem::CompressBlock"));
}
```

### Naming tasks with enough context

`__itt_string_handle_create("loop")` is useless. VTune groups timeline entries by string handle. If you have a single "loop" handle used everywhere, your timeline collapses all loops into one indistinguishable mass.

Good names encode the subsystem and the specific operation:

```
"RenderSystem::DrawMesh"
"PhysicsEngine::BroadPhase::SAP"
"NetworkLayer::DeserialisePacket[TCP]"
"AudioMixer::Resample[48kHz→44.1kHz]"
```

When I'm annotating a codebase for the first time, I use the format `SubSystem::Method[distinguishing_parameter]`. The square-bracket qualifier is informal — ITT treats it as an opaque string — but it makes profiles much easier to read when the same method is called with meaningfully different arguments.

### Using pause/resume to focus on steady-state

A server application might spend 15 seconds on startup before entering its event loop. A game engine spends significant time on asset loading. You almost never care about these phases when profiling steady-state performance.

```c
int main(int argc, char** argv) {
    __itt_pause();             // Suppress collection during init

    load_config(argv[1]);
    init_thread_pool(8);
    warmup_jit_cache();

    __itt_resume();            // Now start collecting

    run_event_loop();          // This is what we care about
    return 0;
}
```

The resulting VTune report starts clean, with no samples from the init path inflating hotspot counts.

### The Reference Collector for headless environments

The ITT reference collector is a standalone tool that records ITT events to a trace file without requiring VTune. This makes it useful for CI performance regression testing: instrument your application, run it under the reference collector, capture the trace, parse task durations, and assert that no critical path has regressed beyond a threshold.

This is not a complete analysis workflow — you won't get flame graphs or source attribution from it. But for automated regression detection on a build server where installing VTune is impractical, it fills a real gap.

### Annotating JIT compilers — the complete pattern

For a JIT compiler or interpreter, the full integration pattern is:

1. On process start, check `iJIT_IsProfilingActive()`. If nothing is profiling, skip all notification infrastructure.
2. After each successful compilation, call `iJIT_NotifyEvent(iJVM_EVENT_TYPE_METHOD_LOAD_FINISHED, ...)` with a fully populated `iJIT_Method_Load` including the line number table.
3. On re-compilation (tiered JIT, deoptimisation + recompile), send `iJVM_EVENT_TYPE_METHOD_UNLOAD_START` with the old ID, then send a new `METHOD_LOAD_FINISHED` event with a new ID.
4. On process shutdown or module unload, send `iJVM_EVENT_TYPE_METHOD_UNLOAD_START` for all registered methods if cleanup is required.

Step 3 is where most JIT integrations have bugs. Tiered compilation is common, and the unload/reload dance is easy to forget until you see VTune reporting impossible hotspot distributions in re-JIT'd methods.

---

## When Not to Use ITT

ITT is an *emission-only* instrumentation API. It has no in-process query capability — you cannot ask "how long did the last DrawMesh task take?" from within your application. All analysis lives in the collector. If you need in-process metrics (for adaptive algorithms, circuit breakers, or self-monitoring logic), ITT is the wrong tool. Reach for `std::chrono`, RDTSC wrappers, or a metrics library.

ITT requires you to identify the code you want to annotate. When you don't know where the hotspot is, sampling profilers — `perf record`, VTune's sampling mode, async-profiler — are more appropriate. Annotate after you've identified the interesting regions, not before.

For kernel-level tracing — understanding syscall latency, scheduler interference, interrupt storms, block I/O patterns — ITT doesn't help. You're in userspace; the kernel is opaque to ITT. eBPF, perf events, and ftrace are the right tools for kernel-side analysis. I frequently use ITT and `perf sched` together: ITT to understand what the application thinks it's doing, perf sched to understand what the kernel did to the threads during that time.

The static library adds approximately 100–200 KB to your binary. For most server applications this is irrelevant. For embedded targets with tight flash budgets, it may not be.

Finally: ITT is Intel tooling. The JIT Profiling API has broader cross-vendor adoption (perf and async-profiler both support it), but the domain/task/frame/counter surface is primarily consumed by VTune, Advisor, and Inspector. If your team uses neither, the semantic annotations won't produce output anywhere. On those stacks, Tracy, LTTng, or ETW (Windows) are more appropriate choices.

---

The architectural insight that makes ITT worth understanding is the function pointer indirection: defer the cost decision to the operator, not the developer. Every other instrumentation design I've encountered either strips annotations for release or pays overhead always. ITT's answer — link it everywhere, pay only when something is listening — is the right trade-off for production code where you want profiling to be an operational decision, not a build-time one.

The Rust `ittapi` crate makes this accessible without the rough edges of the C API. The RAII task guard is not just ergonomics; it's correctness. In a codebase where panics, early returns, and error propagation can interrupt any region, a C-style begin/end pair is a reliability hazard. The `Drop` implementation removes that category of bug entirely.

Annotate early, name precisely, pre-create handles, and gate JIT notifications behind `iJIT_IsProfilingActive`. The profile you can take in production is worth more than the perfect profile you can only take in a lab.

---

*Adrian is a performance engineer writing at [overtone.dev](https://overtone.dev).*


<!-- zh -->


第一次在生产代码里留下 ITT 标注时，我的 tech lead 问了一个问题：「这玩意儿在没有 VTune 的环境下会拖慢服务吗？」

这个问题问得非常好。大多数插桩方案的答案是「会，但不多」。Intel ITT (Instrumentation and Tracing Technology) 的答案是「几乎不会——不是因为它很轻，而是因为它的架构让这个问题从根本上变得不同」。

理解这个区别，需要先看清楚 ITT 的两层设计。

---

## 两层架构：静态库 + 动态 collector

ITT 的核心架构是一个函数指针表。应用程序链接的是 `libittnotify`（一个约 100–200 KB 的静态库），它里面的每个 API 函数——`__itt_task_begin`、`__itt_domain_create`、`__itt_pause` 等——都不是直接的实现，而是通过一张全局函数指针表跳转的宏。

```c
// ittnotify.h 内部展开大概是这样的
#define __itt_task_begin(domain, id, parentid, name) \
    (!__itt_api_version ? (void)0 : \
     ITTNOTIFY_VOID(task_begin)(domain, id, parentid, name))
```

当没有任何 profiling 工具时，这张表的每个槽位都指向一个空函数（no-op stub）。调用开销：一次指针解引用 + 间接跳转，在现代 x86-64 上大约 1–5 ns。

当 VTune（或其他兼容 collector）启动并附加到进程时，它调用 `__itt_api_init(&__itt_api_version, __itt_group_all)` 来填充这张表，把每个函数指针替换成真正的实现。从这一刻起，每次 `__itt_task_begin` 调用才会产生真实的 tracing 事件。

这个设计的含义很直接：**你可以把 ITT 标注永久编译进生产二进制，不需要 `#ifdef PROFILING` 或者 build flag**。是否付出开销，由运行时的 collector 决定，不由代码决定。

---

## 「零开销」的真实含义

「零开销」是个营销说法，实际情况更微妙。

**没有 collector 时：** 每次 ITT 调用约 1–5 ns（指针解引用 + 空函数调用），如果编译器无法内联（通常不能，因为是函数指针），分支预测器也需要 warm-up。对于调用频率 < 100 万次/秒的函数，这个开销真的可以忽略不计。对于 < 100 ns 的紧密循环，就不行了——这时每次调用可能占总执行时间的 1–5%。

**有 collector 时：** 开销取决于 collector 实现，通常在 50–500 ns 之间。VTune 的 collector 会写入一个 per-thread ring buffer，减少锁竞争，但依然有内存写入。

对比竞争方案：
- `__builtin_ia32_pause()` 之类的 CPU hint：< 1 ns，但不携带任何语义
- `perf_event_open` PERF_COUNT_SW_DUMMY 打点：走 syscall，单次约 100–200 ns
- 直接 `write()` 到 trace fd：500 ns+

结论：ITT 在「有 collector」场景下不比 perf markers 快，但「无 collector」场景下比 perf markers 快 20–100 倍。这使它特别适合「偶尔开启的深度 profiling」而不是「总是开启的监控」。

---

## API 核心抽象

ITT API 有几个核心概念，理解它们的关系比记 API 名字更重要。

**Domain（域）**是所有标注的命名空间，也是 VTune 里 timeline 的分组单位。通常按子系统创建：

```c
// 全局创建一次，不要放在 hot path 里
static __itt_domain* g_render_domain = NULL;

void render_init() {
    g_render_domain = __itt_domain_create("com.myapp.render");
}
```

**String Handle** 是 domain 内的字符串 intern 机制。同一个字符串只被分配一次，之后用指针比较，不做字符串比较。同样只创建一次：

```c
static __itt_string_handle* h_draw_mesh = NULL;

void tasks_init() {
    h_draw_mesh = __itt_string_handle_create("RenderSystem::DrawMesh");
}
```

命名要有具体性。`"loop"` 和 `"update"` 在真实 profile 里毫无价值，用 `"PhysicsSystem::BroadPhase"` 这种能定位到调用站点的名字。

**Task** 是时间线上的一段区间。begin/end 成对使用：

```c
void draw_mesh(Mesh* mesh) {
    __itt_task_begin(g_render_domain, __itt_null, __itt_null, h_draw_mesh);
    // 实际渲染工作
    __itt_task_end(g_render_domain);
}
```

注意第二、三个参数是 task ID 和 parent task ID，传 `__itt_null` 表示「无显式 ID，由 profiler 从调用栈推断」。ITT 的 task 模型是**平坦的时间线标注**，不是调用树。不同线程上的 task 可以重叠，这是设计上的正确选择，不是限制——并发工作负载天然不是树状的。

**Counter** 用于跟踪自定义指标：

```c
__itt_counter queue_depth_ctr = __itt_counter_create("job_queue_depth", "com.myapp");

// 在入队/出队时更新
__itt_counter_set_value(queue_depth_ctr, (void*)&queue_size);
```

**Frame** 标注应用帧边界（游戏循环、渲染帧）：

```c
__itt_frame_begin_v3(g_render_domain, NULL);
// ... 整帧工作 ...
__itt_frame_end_v3(g_render_domain, NULL);
```

Frame 和 Task 的区别：Frame 代表应用级的「预算单位」，VTune 有专门的 Frame Duration 视图；Task 是任意粒度的工作标注。

**Pause / Resume** 是最被低估的功能：

```c
__itt_pause();   // 通知 collector 停止采集
// ... 你不关心的初始化代码 ...
__itt_resume();  // 恢复采集

// 实际要分析的 hot path 在这里
```

VTune 采集一个完整进程生命周期会产生大量噪音。用 pause/resume 把关注点圈出来，profile 报告会干净很多。这不影响 CPU 执行，纯粹是给 collector 的信号。

---

## Rust 的 `ittapi` crate

C API 有一个经典问题：容易忘记调用 `__itt_task_end`，导致 VTune timeline 上出现从不关闭的 task 区间。Rust 的 `ittapi` crate 通过 RAII 彻底解决了这个问题：

```rust
use ittapi::{Domain, StringHandle, Task};

// 全局初始化（用 OnceLock 或 lazy_static）
static RENDER_DOMAIN: OnceLock<Domain> = OnceLock::new();
static DRAW_MESH_HANDLE: OnceLock<StringHandle> = OnceLock::new();

fn draw_mesh(mesh: &Mesh) {
    let domain = RENDER_DOMAIN.get_or_init(|| Domain::new("com.myapp.render"));
    let name = DRAW_MESH_HANDLE.get_or_init(|| StringHandle::new("RenderSystem::DrawMesh"));

    let _task = Task::begin(domain, name);
    // _task 在 drop 时自动调用 __itt_task_end
    // 编译器确保即使提前 return 或 panic 也能正确关闭
    do_actual_work(mesh);
}
```

这是 C++ RAII wrapper 也有的模式，但 Rust 的所有权系统使它成为零成本抽象：`Task` guard 没有运行时开销，它的 `Drop` 实现就是一次 `__itt_task_end` 调用。

---

## JIT Profiling API：为动态代码服务

如果你在写 JIT 编译器、解释器、或者任何动态生成机器码的东西，有另一层 API：`jitprofiling.h`。

问题背景：profiler 采集到的 IP (Instruction Pointer) 落在 JIT 生成的代码段时，它不知道这段代码对应哪个函数。没有符号信息，VTune 只能显示 `unknown` 或者内存地址。

JIT Profiling API 让 JIT 编译器在生成代码时通知 profiler：

```c
#include <jitprofiling.h>

void notify_jit_compiled(const char* method_name, void* code_addr, size_t code_size) {
    // 先检查是否有工具在监听，避免无谓的结构体构造
    if (iJIT_IsProfilingActive() == iJIT_NOTHING_RUNNING) return;

    iJIT_Method_Load method = {0};
    method.method_id = allocate_unique_method_id(); // 调用方负责唯一性
    method.method_name = (char*)method_name;
    method.method_load_address = code_addr;
    method.method_size = (unsigned int)code_size;
    // 有条件地提供 line number table，否则 profiler 只有方法级精度

    iJIT_NotifyEvent(iJVM_EVENT_TYPE_METHOD_LOAD_FINISHED, &method);
}
```

`iJIT_IsProfilingActive()` 这个 gate 非常重要。构造 `iJIT_Method_Load` 结构体、分配 `method_name` 字符串、构建 line number table——这些在没有 profiler 时全是浪费。先 check，再构造。

`method_id` 必须全进程唯一。这是调用方的责任，API 不提供 ID 分配服务。多线程 JIT（tiered compilation）需要同步来保证唯一性，这是 JIT 集成中最常见的 bug 来源。

这个 API 的生态价值远超 Intel 工具本身：Linux `perf inject --jit`、async-profiler、以及各种 perf map 方案追溯到同一个接口谱系。实现一次，多个 profiler 受益。

---

## 与其他方案的对比

| 方案 | 无工具开销 | 有工具开销 | 可移植性 | 工具生态 |
|------|-----------|-----------|---------|---------|
| ITT API | 1–5 ns | 50–500 ns | Linux/macOS/Windows | VTune、部分 perf 支持 |
| perf markers (PERF_COUNT_SW_DUMMY) | ~200 ns (syscall) | ~200 ns | Linux only | perf、BCC |
| LTTng UST | < 10 ns (无工具时几乎 no-op) | 20–100 ns | Linux only | Trace Compass、babeltrace |
| ETW | Windows only | — | Windows only | WPA、perfview |
| Tracy | 50–200 ns (始终写入) | 同上 | 跨平台 | Tracy GUI (自带) |

几点值得展开：

**LTTng UST 是 Linux 下的强竞争者**。它的无工具开销通过 `LD_PRELOAD` 级别的 tracepoint 机制实现，几乎和 ITT 一样低。工具生态弱一些，但 Trace Compass 足够好，且 LTTng 对内核 + 用户空间联动 tracing 支持更原生。如果你只在 Linux 上工作且不依赖 VTune，LTTng 值得认真考虑。

**Tracy 的哲学完全不同**。Tracy 不依赖外部 collector——它在应用内维护一个 ring buffer，通过网络 socket 实时流给 Tracy GUI。这意味着它始终有开销，但开销可预测且延迟极低。对于游戏引擎这种需要持续监控帧时间的场景，Tracy 的实时展示能力远超 VTune。但它不适合「偶尔深度分析」的服务端场景。

**perf markers 的 syscall 开销通常被低估**。PERF_COUNT_SW_DUMMY 需要进内核，哪怕有 vDSO 优化也要 100 ns 起步。对于 > 10 MHz 的调用频率，这个开销是真实的问题。

---

## 生产级插桩模式

**模式一：分层标注，不要平铺到函数级**

最常见的错误是把 ITT task 加到每个函数上。这产生的噪音比信号更多。正确的做法是按「工作阶段」而非调用栈标注：

```c
// 好的：标注有语义意义的工作阶段
__itt_task_begin(domain, __itt_null, __itt_null, h_physics_step);
run_broad_phase();
run_narrow_phase();
integrate_velocities();
__itt_task_end(domain);

// 不好的：把每个函数都包一层，VTune 里一片红
```

**模式二：所有 handle 在模块 init 时创建**

`__itt_domain_create` 和 `__itt_string_handle_create` 内部有锁，首次调用有分配开销。在任何 hot path 上创建 handle 都是错的：

```rust
// 用 std::sync::OnceLock 或 once_cell::sync::Lazy
static HANDLES: OnceLock<PipelineHandles> = OnceLock::new();

fn get_handles() -> &'static PipelineHandles {
    HANDLES.get_or_init(PipelineHandles::init)
}
```

**模式三：pause/resume 聚焦 critical path**

```c
int main() {
    __itt_pause();  // 停止采集
    
    load_config();
    init_systems();
    warm_up_caches();
    
    __itt_resume();  // 从这里开始采集
    
    run_main_loop();  // 这才是你关心的
}
```

**模式四：Reference Collector 用于 CI 性能回归检测**

ITT Reference Collector 允许在没有 VTune 的机器上录制 ITT 事件到文件。这意味着 CI 可以运行有标注的二进制，录制 task 时长分布，与 baseline 对比。这不需要 VTune license，也不需要 GUI。

---

## 什么时候不该用 ITT

ITT 是**语义标注工具**，不是**问题发现工具**。如果你不知道瓶颈在哪，先用采样 profiler（VTune 的 Hotspots 分析、Linux perf record）定位，再用 ITT 深挖已知区域。用 ITT 标注一个你不知道有问题的代码库，只会产生大量你不知道如何解读的数据。

**需要内核级可见性时用 eBPF**。ITT 是纯用户空间的。如果你的瓶颈在 syscall、调度延迟、中断处理，或者 TCP/IP 栈，ITT 看不到这些。bpftrace、BCC、perf 是更合适的工具。

**需要始终在线的监控时用 OpenTelemetry**。ITT 设计为「开发/调试时开启，生产偶发开启」。如果你需要生产环境持续的 span 追踪、分布式 trace，OTel 的语义模型（parent-child 因果关系、baggage propagation）远比 ITT 的平坦 task 模型强。

**平台不确定时谨慎依赖**。ITT 在 Linux/Windows/macOS 上都有，但最完整的工具支持（VTune 的全部分析类型）仍然是 Linux x86 和 Windows。在 ARM macOS 上，ITT 可以记录事件，但分析深度受限。

---

回到最初那个问题：这玩意儿在没有 VTune 的环境下会拖慢服务吗？

我的答案是：把 handle 创建放到 init，把 task 标注放到有意义的工作边界，每次调用 1–5 ns——对于绝大多数服务端代码，这个开销在测量噪声里消失了。

真正的问题不是「能不能加」，而是「加了之后 profile 是否足够有洞察力」。一个有精心命名的 domain + task 层次的 VTune 录制，比一张没有任何上下文的火焰图有价值得多。ITT 的价值在于它让 profiler 懂你的代码，而不只是看到 IP 地址。

---

*Adrian*
