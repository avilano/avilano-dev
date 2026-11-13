---
title: "Stress-Testing AI System Designs: How 7 Stateless Subagents Audited Our Architecture Spec"
description: "Applying the Elephant-Goldfish Model (EGM) to catch rate-limit contradictions, fork PR security gaps, and framework drift before writing a single line of code."
pubDate: 2026-11-12
tags: ["AI Architecture", "Multi-Agent Systems", "Design Review"]
readTime: "6 min read"
---

Asking the same AI session that wrote an architecture specification to "review it for bugs" almost always fails. Shared conversational history creates **shared confirmation bias**: the model remembers why it made compromises earlier in the thread and rationalizes away missing sections or contradictions.

Before writing production code for **Agent Keeper**, we subjected the design specification to the **Elephant-Goldfish Model (EGM)**—a 10-stage multi-agent review pipeline.

---

## The Elephant-Goldfish Model (EGM)

EGM separates two complementary cognitive roles:
* **The Elephant (Persistent Resolver):** The primary context containing institutional memory, historical trade-offs, and final repair capabilities.
* **The Goldfish (Stateless Auditors):** Ephemeral subagents spawned in fresh context windows with **zero conversational history**, forced to evaluate the specification strictly on what is written.

---

## What the 7 Stateless Personas Caught

| Persona | Core Mandate | Key Discovery Before Code Execution |
| :--- | :--- | :--- |
| **Skeptical Architect** | Anti-Weeds, YAGNI | Flagged inlined 30-line Pydantic dumps and speculative features; identified `deepeval` vs. native SDK redundancy. |
| **Naive Reader** | Self-Containment | Exposed undefined dataset schemas and noted that ephemeral GitHub Actions runners evaporate `.eval_cache/` without `actions/cache`. |
| **Hostile Design Critic** | Scalability & Security | Caught a **rate-limit math contradiction** (30 calls in `<90s` = 20 RPM, exceeding Gemini's 15 RPM free-tier limit) and **fork PR secret exposure**. |
| **Structural Validator** | Symmetry & Compliance | Mandated formal *Goals & Non-Goals* and *Problem Statement* sections. |
| **Style Editor** | Objective Prose | Stripped buzzwords and corrected hyperbolic claims (*"Zero-Flakiness Guarantee"* → *"Flakiness Mitigation"*). |
| **Pragmatic Tech Lead** | Zero-Decision Rule | Prohibited leaving JSON schemas or adapter classes ambiguous for implementers; mandated exit verification commands. |
| **Codebase Auditor** | Doc-vs-Code Parity | Caught that the codebase used native `google.genai.Client` while the roadmap still referenced `DeepEval`. |

---

## The Crucial Intervention: Rejecting Reviewer Bloat

Adversarial critics naturally suggest adding complexity. During an intermediate **Zoom-Out Gate**, the Skeptical Architect persona explicitly **rejected** reviewer bloat that would have crippled the pipeline:
* **Rejected:** 3-pass majority voting, dynamic token-bucket limiters, and VCR recording fixtures (which would have tripled API burn on free tiers).
* **Shipped Instead:** Sequential execution (~10–12 RPM), `temperature=0.0`, and graceful `pytest.skip` on fork PRs.
