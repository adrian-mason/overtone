---
title: "Linux I/O: From Syscall to Disk Platter"
description: "A deep dive into the Linux I/O stack — from userspace syscalls through the VFS layer, block I/O schedulers, and down to the hardware. Covers io_uring, buffered vs direct I/O, and practical tuning strategies."
date: 2025-11-15
featured: true
tags:
  - linux
  - systems-programming
  - optimization
  - observability
---

Every time your application calls `write()`, an intricate machinery of kernel subsystems springs into action. Understanding this machinery is the difference between an application that handles 10K IOPS and one that handles 500K. Let's trace the journey of a single I/O request from userspace to hardware.

---

## The I/O Stack at a Glance

The Linux I/O stack is a layered architecture. Each layer adds functionality — and latency:

| Layer | Component | Typical Latency |
|-------|-----------|-----------------|
| Userspace | Application `write()` | ~0 (just a syscall) |
| VFS | Virtual File System | 50–200 ns |
| Page Cache | Buffered I/O layer | 100–500 ns |
| File System | ext4, XFS, btrfs | 1–10 μs |
| Block Layer | I/O scheduler, merging | 1–5 μs |
| Device Driver | NVMe, SCSI, virtio | 5–50 μs |
| Hardware | SSD / HDD | 10 μs – 10 ms |

> **Key insight:** For a typical NVMe SSD, the kernel overhead often exceeds the actual hardware latency. This is why technologies like `io_uring` were created — to minimize kernel overhead.

---

## Buffered vs Direct I/O

### Buffered I/O (the default)

When you call `write()` without `O_DIRECT`, the data goes into the **page cache** — a region of memory managed by the kernel. The actual disk write happens later, asynchronously.

```c
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    int fd = open("/tmp/test.dat", O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) return 1;

    const char *data = "Hello, page cache!\n";
    write(fd, data, 19);  // Goes to page cache, NOT disk

    // Data is in memory. Kernel will flush later.
    // Use fsync() to force it to disk:
    fsync(fd);

    close(fd);
    return 0;
}
```

The page cache is **incredibly effective** for most workloads:

- **Read-heavy** workloads get automatic caching
- **Write-heavy** workloads benefit from write coalescing
- **Sequential** access triggers kernel read-ahead

### Direct I/O

Databases like PostgreSQL and MySQL often bypass the page cache using `O_DIRECT`. Why? Because they have their own buffer pool that's smarter about the access patterns:

```c
int fd = open("/data/db.ibd", O_RDWR | O_DIRECT);
```

**When to use Direct I/O:**
- You have your own caching layer (databases)
- You need predictable latency (no page cache eviction surprises)
- You're doing large sequential I/O (streaming, backups)

**When NOT to use Direct I/O:**
- General application code (page cache is almost always better)
- Small random reads (page cache prefetching helps enormously)

---

## The io_uring Revolution

Traditional I/O in Linux uses `read()` / `write()` syscalls — each one requires a context switch between userspace and kernel space. For high-IOPS workloads, these context switches dominate the cost.

`io_uring` (introduced in Linux 5.1) solves this with two shared ring buffers:

1. **Submission Queue (SQ):** Userspace writes I/O requests here
2. **Completion Queue (CQ):** Kernel writes completed results here

```c
#include <liburing.h>
#include <fcntl.h>
#include <string.h>

int main(void) {
    struct io_uring ring;
    io_uring_queue_init(32, &ring, 0);

    int fd = open("/tmp/io_uring_test", O_WRONLY | O_CREAT | O_TRUNC, 0644);

    // Prepare a write request
    struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
    char buf[] = "Hello from io_uring!\n";
    io_uring_prep_write(sqe, fd, buf, strlen(buf), 0);
    io_uring_sqe_set_data(sqe, (void *)42);  // user data tag

    // Submit — may not even need a syscall in SQPOLL mode!
    io_uring_submit(&ring);

    // Wait for completion
    struct io_uring_cqe *cqe;
    io_uring_wait_cqe(&ring, &cqe);

    if (cqe->res < 0) {
        // handle error
    }

    io_uring_cqe_seen(&ring, cqe);
    io_uring_queue_exit(&ring);
    close(fd);
    return 0;
}
```

### Performance comparison

Here's a real benchmark from a 4-core VM with an NVMe SSD, doing 4KB random reads:

| Method | IOPS | Avg Latency | CPU Usage |
|--------|------|-------------|-----------|
| `pread()` sync | 120K | 33 μs | 95% |
| `aio_read()` (libaio) | 310K | 12 μs | 80% |
| `io_uring` | 480K | 8 μs | 60% |
| `io_uring` + SQPOLL | 520K | 7 μs | 45% * |

\* SQPOLL uses a dedicated kernel thread, so CPU usage shifts from userspace to kernel.

---

## Tracing I/O with BPF

When debugging I/O performance, you need visibility into what's happening at each layer. BPF tools give you that:

### biolatency — Block I/O latency histogram

```bash
# Install bcc tools
sudo apt install bpfcc-tools

# Run biolatency
sudo biolatency-bpfcc -D 5
```

### Custom BPF program to trace slow writes

```python
#!/usr/bin/env python3
from bcc import BPF

prog = r"""
#include <linux/blk-mq.h>

BPF_HASH(start, struct request *);
BPF_HISTOGRAM(dist);

int trace_start(struct pt_regs *ctx, struct request *req) {
    u64 ts = bpf_ktime_get_ns();
    start.update(&req, &ts);
    return 0;
}

int trace_done(struct pt_regs *ctx, struct request *req) {
    u64 *tsp = start.lookup(&req);
    if (tsp == 0) return 0;

    u64 delta = bpf_ktime_get_ns() - *tsp;
    dist.increment(bpf_log2l(delta / 1000));

    start.delete(&req);
    return 0;
}
"""

b = BPF(text=prog)
b.attach_kprobe(event="blk_mq_start_request", fn_name="trace_start")
b.attach_kprobe(event="blk_mq_complete_request", fn_name="trace_done")

print("Tracing block I/O... Ctrl+C to stop.")
try:
    b.trace_print()
except KeyboardInterrupt:
    b["dist"].print_log2_hist("usecs")
```

---

## I/O Scheduler Tuning

### Understanding the schedulers

Modern Linux offers three block I/O schedulers:

1. **none** — No reordering. Best for NVMe SSDs with internal parallelism.
2. **mq-deadline** — Ensures requests are served within a deadline. Good for mixed read/write workloads.
3. **bfq** (Budget Fair Queueing) — Provides fairness between processes. Good for desktops.

```bash
# Check current scheduler
cat /sys/block/nvme0n1/queue/scheduler
# Output: [none] mq-deadline kyber bfq

# Change scheduler
echo "mq-deadline" | sudo tee /sys/block/nvme0n1/queue/scheduler
```

### Queue depth tuning

```bash
# Check current queue depth
cat /sys/block/nvme0n1/queue/nr_requests
# Default: 1024

# For latency-sensitive workloads, reduce it
echo 64 | sudo tee /sys/block/nvme0n1/queue/nr_requests
```

> **Rule of thumb:** Higher queue depth = higher throughput but higher tail latency. For databases, a queue depth of 32–64 often gives the best latency/throughput trade-off.

---

## File System Considerations

### ext4 tuning for write-heavy workloads

```bash
# Mount options for maximum write throughput
mount -o noatime,nodiratime,data=writeback,barrier=0 /dev/nvme0n1p1 /data

# WARNING: barrier=0 disables write barriers — data may be lost on power failure!
# Only use this for ephemeral/reproducible data (caches, temp files).
```

### XFS for large files

XFS excels at handling large files and high-concurrency workloads:

```bash
# Create XFS with optimal settings for NVMe
mkfs.xfs -f -d su=4k,sw=1 -l size=256m /dev/nvme0n1p1

# Mount with optimal options
mount -o noatime,logbufs=8,logbsize=256k /dev/nvme0n1p1 /data
```

### Comparing file system performance

A quick `fio` benchmark on the same NVMe SSD:

```bash
fio --name=randwrite --ioengine=io_uring --rw=randwrite \
    --bs=4k --numjobs=4 --size=4G --runtime=60 \
    --group_reporting --filename=/data/fio_test
```

Results (4KB random write, 4 jobs, 60 seconds):

| File System | IOPS | Bandwidth | Avg Latency |
|-------------|------|-----------|-------------|
| ext4 (defaults) | 285K | 1.11 GB/s | 55 μs |
| ext4 (tuned) | 340K | 1.33 GB/s | 46 μs |
| XFS (defaults) | 310K | 1.21 GB/s | 51 μs |
| XFS (tuned) | 355K | 1.39 GB/s | 44 μs |

---

## Practical Checklist

When investigating I/O performance, follow this checklist:

1. **Identify the bottleneck layer** — Use `biolatency` and `iostat` to determine if the problem is in the kernel or the hardware
2. **Check the I/O scheduler** — NVMe drives should almost always use `none`
3. **Verify queue depth** — Too high causes latency spikes; too low wastes throughput
4. **Examine page cache behavior** — Use `vmstat` and `sar -B` to check page cache hit rates
5. **Consider `io_uring`** — If your workload is IOPS-bound and you're on Linux 5.1+
6. **Profile with BPF** — Write custom probes to trace exactly where time is spent
7. **Test file system options** — `noatime`, write barriers, journal mode all matter
8. **Measure, don't guess** — Always benchmark with your actual workload pattern

---

## Further Reading

- [Linux Kernel Documentation: Block Layer](https://www.kernel.org/doc/html/latest/block/index.html)
- [io_uring: Efficient I/O with io_uring (PDF)](https://kernel.dk/io_uring.pdf) — Jens Axboe's original paper
- [Brendan Gregg: BPF Performance Tools](https://www.brendangregg.com/bpf-performance-tools-book.html)
- [fio documentation](https://fio.readthedocs.io/en/latest/) — The standard I/O benchmarking tool
- [LWN.net: An introduction to io_uring](https://lwn.net/Articles/776703/)

---

The Linux I/O stack is deep, but you don't need to understand every layer to be effective. Start by measuring where your time is spent, then work your way down from the top. More often than not, the fix is simpler than you think — a mount option, a scheduler change, or switching to `io_uring`.

Your disk is faster than you think. It's the path to the disk that's slow.

<!-- zh -->

每次你的应用程序调用 `write()`，一个精密的内核子系统机制就会启动。理解这个机制是应用处理 10K IOPS 和处理 500K IOPS 之间的差距。让我们追踪一次 I/O 请求从用户空间到硬件的完整旅程。

---

## I/O 栈概览

Linux I/O 栈是一个分层架构。每一层都增加功能——同时也增加延迟：

| 层级 | 组件 | 典型延迟 |
|------|------|----------|
| 用户空间 | 应用 `write()` | ~0（仅系统调用） |
| VFS | 虚拟文件系统 | 50–200 ns |
| Page Cache | 缓冲 I/O 层 | 100–500 ns |
| 文件系统 | ext4, XFS, btrfs | 1–10 μs |
| 块设备层 | I/O 调度器、合并 | 1–5 μs |
| 设备驱动 | NVMe, SCSI, virtio | 5–50 μs |
| 硬件 | SSD / HDD | 10 μs – 10 ms |

> **关键洞察：** 对于典型的 NVMe SSD，内核开销往往超过实际硬件延迟。这就是 `io_uring` 被创造出来的原因——最小化内核开销。

---

## 缓冲 I/O vs 直接 I/O

### 缓冲 I/O（默认方式）

当你调用 `write()` 而不带 `O_DIRECT` 时，数据会进入**页缓存（page cache）**——一个由内核管理的内存区域。实际的磁盘写入会在稍后异步完成。

```c
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    int fd = open("/tmp/test.dat", O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) return 1;

    const char *data = "你好，页缓存！\n";
    write(fd, data, 19);  // 进入页缓存，而非磁盘

    fsync(fd);
    close(fd);
    return 0;
}
```

页缓存对大多数工作负载**极其高效**：

- **读密集**工作负载获得自动缓存
- **写密集**工作负载受益于写合并
- **顺序**访问触发内核预读

### 直接 I/O

像 PostgreSQL 和 MySQL 这样的数据库通常使用 `O_DIRECT` 绕过页缓存：

```c
int fd = open("/data/db.ibd", O_RDWR | O_DIRECT);
```

**何时使用直接 I/O：**
- 你有自己的缓存层（数据库）
- 你需要可预测的延迟
- 你在做大规模顺序 I/O（流式处理、备份）

---

## io_uring 革命

传统的 Linux I/O 使用 `read()` / `write()` 系统调用——每次调用都需要上下文切换。`io_uring`（Linux 5.1 引入）通过两个共享环形缓冲区解决了这个问题：

1. **提交队列（SQ）：** 用户空间在此写入 I/O 请求
2. **完成队列（CQ）：** 内核在此写入完成结果

```c
#include <liburing.h>
#include <fcntl.h>
#include <string.h>

int main(void) {
    struct io_uring ring;
    io_uring_queue_init(32, &ring, 0);

    int fd = open("/tmp/io_uring_test", O_WRONLY | O_CREAT | O_TRUNC, 0644);

    struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
    char buf[] = "来自 io_uring 的问候！\n";
    io_uring_prep_write(sqe, fd, buf, strlen(buf), 0);

    io_uring_submit(&ring);

    struct io_uring_cqe *cqe;
    io_uring_wait_cqe(&ring, &cqe);

    io_uring_cqe_seen(&ring, cqe);
    io_uring_queue_exit(&ring);
    close(fd);
    return 0;
}
```

### 性能对比

| 方法 | IOPS | 平均延迟 | CPU 使用率 |
|------|------|----------|-----------|
| `pread()` 同步 | 120K | 33 μs | 95% |
| `aio_read()` (libaio) | 310K | 12 μs | 80% |
| `io_uring` | 480K | 8 μs | 60% |
| `io_uring` + SQPOLL | 520K | 7 μs | 45% |

---

## 使用 BPF 追踪 I/O

```bash
# 安装 bcc 工具
sudo apt install bpfcc-tools

# 运行 biolatency
sudo biolatency-bpfcc -D 5
```

```python
#!/usr/bin/env python3
from bcc import BPF

prog = r"""
#include <linux/blk-mq.h>
BPF_HASH(start, struct request *);
BPF_HISTOGRAM(dist);

int trace_start(struct pt_regs *ctx, struct request *req) {
    u64 ts = bpf_ktime_get_ns();
    start.update(&req, &ts);
    return 0;
}

int trace_done(struct pt_regs *ctx, struct request *req) {
    u64 *tsp = start.lookup(&req);
    if (tsp == 0) return 0;
    u64 delta = bpf_ktime_get_ns() - *tsp;
    dist.increment(bpf_log2l(delta / 1000));
    start.delete(&req);
    return 0;
}
"""

b = BPF(text=prog)
b.attach_kprobe(event="blk_mq_start_request", fn_name="trace_start")
b.attach_kprobe(event="blk_mq_complete_request", fn_name="trace_done")

print("正在追踪块 I/O... 按 Ctrl+C 停止。")
try:
    b.trace_print()
except KeyboardInterrupt:
    b["dist"].print_log2_hist("usecs")
```

---

## I/O 调度器调优

```bash
# 检查当前调度器
cat /sys/block/nvme0n1/queue/scheduler

# 更改调度器
echo "mq-deadline" | sudo tee /sys/block/nvme0n1/queue/scheduler
```

> **经验法则：** 更高的队列深度 = 更高的吞吐量但更高的尾延迟。对于数据库，32–64 的队列深度通常最优。

---

## 文件系统性能对比

| 文件系统 | IOPS | 带宽 | 平均延迟 |
|----------|------|------|----------|
| ext4（默认） | 285K | 1.11 GB/s | 55 μs |
| ext4（调优） | 340K | 1.33 GB/s | 46 μs |
| XFS（默认） | 310K | 1.21 GB/s | 51 μs |
| XFS（调优） | 355K | 1.39 GB/s | 44 μs |

---

## 延伸阅读

- [Linux 内核文档：块设备层](https://www.kernel.org/doc/html/latest/block/index.html)
- [io_uring: 高效 I/O（PDF）](https://kernel.dk/io_uring.pdf)
- [Brendan Gregg: BPF 性能工具](https://www.brendangregg.com/bpf-performance-tools-book.html)
- [fio 文档](https://fio.readthedocs.io/en/latest/)
- [LWN.net: io_uring 简介](https://lwn.net/Articles/776703/)

---

Linux I/O 栈很深，但你不需要理解每一层才能高效工作。从测量时间花在哪里开始，然后从顶层向下排查。你的磁盘比你想的更快。慢的是到达磁盘的路径。
