---
title: "Memory Allocation Strategies Compared"
description: "Arena, pool, slab, and bump allocators — when to use each and why it matters for latency."
date: 2024-11-05
featured: false
tags: ["memory", "allocators", "systems-programming"]
---

The default malloc is fine for most programs. But when you're chasing microsecond latencies or building a game engine, the allocation strategy matters enormously.

## Arena Allocators

Allocate linearly, free everything at once. Perfect for request-scoped work where all memory has the same lifetime.

## Pool Allocators

Pre-allocate fixed-size blocks. Zero fragmentation, O(1) alloc and free. Ideal for objects that are created and destroyed frequently.
