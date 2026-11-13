---
title: "The Two-Tier LLM Quality Gate: Stopping Prompt Regressions in CI Without Blowing Free-Tier Quotas"
description: "How Agent Keeper combines a zero-token deterministic gate (<10s) with decoupled Groq + Gemini evaluation and SHA-256 caching to catch prompt regressions before merge."
pubDate: 2026-11-12
tags: ["AI Engineering", "LLM Evals", "CI/CD", "Pydantic"]
readTime: "7 min read"
---

When LLM applications move from prototypes to production, a single sentence edit in a system prompt—or an upstream model update—can silently degrade behavior. Traditional unit tests cannot detect semantic regressions, and manual review does not scale across pull requests.

Most CI/CD evaluation guides recommend running heavyweight frameworks with parallel bursts (`maxConcurrency: 5`) and multi-pass voting (`repeat: 3`) against a single provider key. When we ran that playbook on **Agent Keeper** across a 15-ticket regression suite, execution halted immediately on `TC-01` with:

```text
google.genai.errors.ClientError: 429 RESOURCE_EXHAUSTED
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
Limit: 20 requests per day for model: gemini-3.8-flash
```

Evaluating 15 test cases (1 generation + 1 judge call = 30 requests) is mathematically impossible on a single-provider 20 requests/day free-tier cap.

Here is the **Two-Tier Quality Gate** architecture we built to make automated LLM regression testing fast, deterministic, and sustainable in GitHub Actions.

---

## Tier 1: The Deterministic Fast Gate (< 10s, Zero Tokens)

An LLM judge should never burn API tokens checking things deterministic code can reject in milliseconds. Tier 1 runs locally and on **every** pull request—including external fork PRs where repository secrets are unavailable:

1. **Pydantic v2 Schema Conformance:** Validates field types, string length bounds (`draft_response` 10–1500 chars), and strict enum invariants (`P0`–`P3`, routing categories).
2. **Regex PII Screening:** Scans generated text for unmasked SSNs (`\d{3}-\d{2}-\d{4}`), 16-digit credit card numbers, and JWT authorization headers (`ey...`).
3. **Token Budget Verification:** Uses `tiktoken` (`cl100k_base`) to assert prompts and completions stay strictly within budgeted windows (`<= 1,500` tokens).

---

## Tier 2: Dual-Provider Golden Suite & Grammar-Constrained Judging

When Tier 1 passes, Tier 2 evaluates 15 stratified reference scenarios (P0 outages, credential leaks, billing disputes, SAML SSO failures, legal threats, and prompt injections) using two architectural invariants:

### 1. Decouple Inference from the Judge
Never share a quota pool between your model-under-test and your evaluation judge:
* **Inference:** Routed to **Groq** (`openai/gpt-oss-20b`, `temperature=0.0`), which provides **14,400 requests/day** on its free tier.
* **Judge:** Isolated on **Google Gemini** (`gemini-3.5-flash`) with sequential pacing (~10–12 RPM) and Tenacity jitter backoff, scoring Factual Consistency (`>= 0.85`) and Hallucination (`<= 0.10`).

### 2. Enforce Pydantic Schema Injection Instead of JSON Prompting
Prompting a model with `"Output valid JSON"` still causes silent `ValidationError` crashes when optional-looking fields like `routing_team` are omitted. Passing the Pydantic model directly to the native `google-genai` SDK enforces grammar-constrained decoding:

```python
response = self.gemini_client.models.generate_content(
    model=self.model,
    contents=[system_prompt, user_prompt],
    config={
        "response_mime_type": "application/json",
        "response_schema": TriageResult,  # Guarantees 100% field presence
        "temperature": 0.0,
    },
)
```

### 3. Deterministic SHA-256 Cache Replay
Ephemeral CI runners wipe disk state on every run. We hash `{model}:{system_prompt}:{user_prompt}` with SHA-256 into `.eval_cache/` and persist it via `actions/cache@v4`:

```yaml
- name: Restore Eval Cache
  uses: actions/cache@v4
  with:
    path: .eval_cache
    key: eval-cache-${{ hashFiles('src/triage/prompts.py', 'evals/datasets/golden_15.jsonl') }}
```

### 4. Fork PR Secret Isolation
Never use `pull_request_target` to expose secrets to untrusted forks. Tier 1 runs unconditionally, while Tier 2 gracefully calls `pytest.skip("Credentials not set")` when API keys are absent.

---

## Measured Results

| Configuration | Runtime | Outcome |
| :--- | :--- | :--- |
| **Single-Provider (`gemini-3.8-flash`)** | Halted | Crashed on `TC-01` (`429 RESOURCE_EXHAUSTED`) |
| **Two-Tier Cold Run (Groq + Gemini 3.5)** | `3m 08s` | **100%** schema pass; caught **6** boundary regressions |
| **Two-Tier Cached CI (`actions/cache@v4`)** | `< 1s` | **0** API tokens consumed on unchanged prompts |
