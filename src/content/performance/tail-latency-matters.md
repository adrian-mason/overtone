---
title: "Why Tail Latency Matters More Than Average"
description: "Exploring how p99 latency impacts user experience at scale, and practical techniques to tame it."
date: 2025-01-15
featured: true
tags: ["latency", "distributed-systems", "observability"]
---

When we talk about service performance, averages lie. A system with 50ms average response time sounds great — until you realize 1% of your users are waiting 2 seconds or more.

## The Long Tail Problem

At scale, tail latency compounds. If a single request fans out to 100 backend services, the probability of hitting at least one slow response approaches certainty.

## Practical Mitigations

- **Hedged requests**: Send redundant requests and use the first response
- **Adaptive timeouts**: Adjust timeouts based on recent latency distributions
- **Load shedding**: Reject excess load early rather than degrading everything

The key insight: optimizing for p99 often improves the average too, but the reverse is rarely true.
