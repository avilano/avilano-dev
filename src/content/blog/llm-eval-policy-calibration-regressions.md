---
title: "When 6 Failing LLM Eval Tests Are Actually a Win: Policy Calibration in CI"
description: "How granular failure analysis across 15 stratified support tickets turned ambiguous prompt instructions into explicit engineering policy decisions."
pubDate: 2026-11-12
tags: ["LLM Evals", "AI Quality", "Prompt Engineering"]
readTime: "5 min read"
repoUrl: "https://github.com/avilano/agent-keeper"
repoLabel: "avilano/agent-keeper"
---

In conventional software testing, 6 failing tests out of 15 means your code is broken. In AI evaluation engineering, those 6 failures are often the exact reason you built the quality gate.

When we executed **Agent Keeper's** 15-case stratified golden suite using Groq (`openai/gpt-oss-20b`, `temperature=0.0`) and a native Gemini 3.5 Flash judge (`response_schema=TriageResult`), the pipeline completed in **3 minutes and 8 seconds**:
* **100%** passed Pydantic v2 schema conformance, PII regex screening, Factual Consistency (`>= 0.85`), and Hallucination (`<= 0.10`).
* **9 PASSED** end-to-end.
* **6 FAILED** on exact policy-boundary edge cases.

---

## The 6 Boundary Regressions

| Case | Scenario | Expected | Model Output | Architectural Insight |
| :--- | :--- | :--- | :--- | :--- |
| `TC-08` | Phishing email inquiry | `Escalation: False` | `Escalation: True` | Model over-escalated on suspected security keywords. |
| `TC-09` | Unauthorized API token | `Priority: P1` | `Priority: P0` | Model treated leaked token as emergency outage (`P0`). |
| `TC-10` | API 429 rate limit error | `Category: tech` | `Category: general` | Model classified API troubleshooting as general query. |
| `TC-11` | SSO SAML parsing error | `Priority: P1` | `Priority: P2` | Model treated configuration error as non-blocking (`P2`). |
| `TC-12` | `"System broken"` (vague) | `Priority: P3` | `Priority: P1` | Model over-indexed on `"broken"` without context. |
| `TC-14` | Hostile legal threat | `Category: general` | `Category: tech` | Model classified legal outage complaint as tech issue. |

---

## Why This Is Diagnostic Gold

Without an automated regression gate, defensive model conservatism silently floods on-call rotations:
1. **Ambiguous Policy Calibration (`TC-08`):** The system prompt stated *"Security breaches or lost 2FA must escalate."* When a customer forwarded a phishing email asking if it was authentic, the model flagged it as a breach. The failing test forced the team to explicitly decide: *Should customer phishing inquiries page on-call?*
2. **Severity Drift (`TC-09`, `TC-12`):** The model's default bias pushed borderline tickets into `P0`/`P1`. Catching this in CI lets teams tune few-shot rubrics before deploying prompt edits to production.
