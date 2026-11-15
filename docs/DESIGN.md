# Scope-aware Prompt Scrubber: design v0.2

**Changes from v0.1:** positioning as a pre-ingress privacy module; threat model made explicit; schema version and tie-breaking added; findings never carry values; auto-learned identities need confirmation; precise leakage definition; baselines and freeze protocol; claims limited to what is defensible; timing set to spec-only during endsem.

## 1. Positioning
An **optional, local, pre-ingress privacy-minimization module** for lab VAPT text. It reduces exposure of *matched* sensitive values before text goes to an LLM.
- It is **not** a prompt-injection detector and does not replace Guardrail Layer 1.
- It is **not** an authorization tool: the scope file controls data handling, not whether testing is permitted.

```
tool output / clipboard
      |
Scope Scrubber (preview -> apply, local session vault)
      | scrubbed text only
Guardrail Layer 1 -> 2 -> 3 -> 4 -> LLM -> Layer 5
```
Optional later: a separate outbound sensitive-data check at Layer 5. No automatic rehydration there.

## 2. Threat model
**Goal:** reduce exposure of recognized sensitive values in lab VAPT text sent to cloud LLMs.

**Helps with:** accidental sharing of recognized tokens, identifiers, paths, usernames, phone-like strings and user-defined terms; consistent placeholders within a session.

**Does not provide:** anonymity, complete detection, protection against semantic inference, protection for text sent outside the clipboard/paste flow, security on a compromised machine or extension. Regex evasion, unknown formats, bad scope rules and false positives remain risks.

**Wording rule:** say "risk reduction for specified patterns and workflows". Never "prevents leaks" or "anonymizes".

## 3. Scope file (`scope.json`, schema 1)
```json
{
  "schema": 1,
  "engagement": "demo-lab",
  "client": { "names": ["Acme Corp"], "domains": ["acme.com"] },
  "keep": { "hosts": ["juice-shop.local", "10.10.10.0/24"] },
  "pseudonymize": { "domains": ["*.acme.com"], "emails": true, "usernames": ["tester1"] },
  "always_remove": ["cookie", "set-cookie", "authorization", "api_keys", "private_keys", "jwt"],
  "identity": { "auto_learn": true, "confirmed_terms": [] }
}
```
**Precedence:** `always_remove > keep > pseudonymize > default rules`.

**Overlapping spans:**
1. On the overlapping region, the higher-precedence action wins.
2. Same action: the longest span wins.
3. Still tied: the earlier rule in `rules.json` wins.

A `keep` entry never overrides `always_remove` (e.g., a token inside a kept host's request).

## 4. Interface (Python library first)
```python
result = scrubber.process(text=tool_output, policy=scope_policy,
                          session=session, mode="preview")   # or "apply"
# result.scrubbed_text
# result.findings: [{span, category, action, placeholder}]   <- never the raw value
restored = scrubber.rehydrate(response, session=session)     # local, opt-in
```
- **Session vault:** memory-only in the MVP. Raw values and the mapping are never sent to Guardrail's API, the LLM, logs or dashboards.
- **`always_remove` values are not stored**, so they cannot be restored.
- **Unknown placeholders** in a reply are left untouched, never guessed.
- **Auto-learned identities** (OS user, hostname, git name/email) are shown once for confirmation. Only confirmed terms are used.
- The extension and desktop agent become **adapters to the same engine** later. No second policy engine.

## 5. Evaluation
**Question:** on lab VAPT artifacts, does a scope-aware policy reduce policy-violating exposure compared with regex-only rules, while preserving triage utility?

**Data:** local DVWA / Juice Shop output with **synthetic seeded values** at known positions. No client data, no real personal data. Do not use or redistribute machine output from TryHackMe, HackTheBox or CyberDefenders (platform terms, spoilers).

| Metric | Definition |
|---|---|
| Leakage rate | protected gold spans (resolved action `always_remove` or `pseudonymize`) whose raw value survives / all such spans |
| Over-redaction | `keep` or benign/task-relevant spans altered / all such spans |
| Detection P/R/F1 | per category |
| Utility | paired triage tasks on original vs scrubbed text (same model and settings, fake values only); rubric: vulnerability identified, evidence retained, remediation quality |
| Consistency | same value maps to the same placeholder in a session; no restore from unknown placeholders |
| Overhead | processing time |

**Baselines:** no scrubber; current v1.2 rules; scope-aware version; Presidio only if time allows.
**Ablations:** scope precedence; session-consistent pseudonyms; `keep` exceptions.
**Protocol:** freeze the test set and scoring rubric before the final run. Pilot numbers are never reported as final.

## 6. Related work and claims
| Work | Overlap | Position |
|---|---|---|
| Prompt Scrubber v1.2 (mine) | regex rules, browser and clipboard flows | the baseline, not a contribution |
| Nano-Collective `prompt-scrub` | local scrubbing, session placeholders, rehydration, custom detectors, watch mode | not novel claims; **audit its v1.2 docs and source before claiming anything about precedence** |
| Microsoft Presidio | general PII detection and anonymization | optional baseline |
| Guardrail Layer 1 | input security analysis | complementary, kept separate |

**Safe contribution claim:** a Guardrail-compatible, scope-aware policy workflow for lab VAPT artifacts, with explicit action precedence and an empirical leakage-versus-utility evaluation. Do not claim regex, placeholders, clipboard monitoring or rehydration as new. Do not claim "first" or "unique" without a source audit.

## 7. Plan
| Period | Work | Exit |
|---|---|---|
| **Endsem (now to early Dec)** | Spec only, about 1 hour in total: freeze schema 1 and write about 10 precedence/tie-break test cases as a table. No coding. | Frozen schema + test table |
| **After endsem to GATE** | Light: Nano audit (about 30 min), Python MVP (preview/apply, precedence, in-memory vault), seeded lab fixtures | Tested text-only prototype |
| **After GATE (last semester)** | One VAPT-to-Guardrail path, baselines, ablations, utility tests, write-up | Reproducible results, report, demo |

## 8. Risks
- **Novelty:** examiners may call it existing tools combined. Answer: the contribution is the scope policy plus the measured trade-off; compare openly.
- **False negatives and lost context:** report per-category results, over-redaction and utility. Show the preview before sending.
- **Narrow boundary:** typing or other upload paths bypass it. Limit claims to tested text workflows.
- **Vault and scope mistakes:** memory-only vault, confirmation of learned terms, tests for conflicts and unknown placeholders.
- **Scope creep:** HTTP text first. Other tool outputs later.
