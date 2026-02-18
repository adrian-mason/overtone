---
title: "Flame Graphs 101: Reading the Heat"
description: "Interpret flame graphs and find performance bottlenecks in complex distributed systems."
date: 2025-02-20
featured: true
tags: ["flame-graphs", "profiling", "visualization"]
---

Flame graphs are the single most useful visualization for understanding where your program spends its time. Invented by Brendan Gregg, they turn stack trace samples into an interactive map of CPU usage.

## How to Read Them

- Width = time spent (wider = more CPU)
- Height = stack depth (taller = deeper call chain)
- Color is arbitrary — ignore it

## Common Patterns

A flat, wide plateau means one function dominates CPU. A deep, narrow spike means deep recursion. The goal: find the wide boxes and ask "should this be this wide?"
