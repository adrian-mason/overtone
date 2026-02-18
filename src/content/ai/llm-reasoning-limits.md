---
title: "Where LLM Reasoning Breaks Down"
description: "Examining the boundaries of large language model reasoning — what they do well, where they fail, and why it matters."
date: 2025-03-05
featured: false
tags: ["llm", "reasoning", "evaluation", "ai-safety"]
---

Large language models are remarkably capable at pattern matching and synthesis. But calling it "reasoning" requires careful qualification.

## What Works

- **Analogical reasoning**: Drawing parallels between domains
- **Chain-of-thought**: Breaking problems into steps when prompted
- **Code generation**: Translating intent into structured logic

## What Breaks

- **Novel multi-step logic**: Problems requiring genuine deduction over unseen structures
- **Consistent world models**: LLMs don't maintain stable internal state across long contexts
- **Calibrated uncertainty**: They sound confident even when wrong

## Why It Matters

If we deploy these models as reasoning engines without understanding their failure modes, we build systems that are brittle in invisible ways. The path forward is honest benchmarking, not hype.
