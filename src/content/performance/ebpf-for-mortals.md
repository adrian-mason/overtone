---
title: "Linux eBPF for Mere Mortals"
description: "A guide to using eBPF tools for production debugging without kernel expertise."
date: 2025-03-01
featured: true
tags: ["ebpf", "linux", "debugging", "observability"]
---

eBPF lets you run sandboxed programs inside the Linux kernel — without compiling kernel modules or rebooting. For performance engineers, it's the closest thing to X-ray vision.

## Getting Started

You don't need to write eBPF programs from scratch. Tools like `bpftrace` give you one-liners that answer questions like "which files is this process reading?" or "why is this syscall slow?"

## Practical Examples

- `opensnoop` — trace file opens system-wide
- `biolatency` — histogram of block I/O latency
- `tcplife` — track TCP connection lifetimes
