# Scope-aware Prompt Scrubber: design v0.3

**Changes from v0.2:** rule groups and profiles; tiered consent UX (auto / ask / off) with undo; learn-from-choices with safety floors; paste-time desktop flow with app allowlist; custom rules with ReDoS limits; interaction metrics and a small user study. The scope policy, precedence and evaluation from v0.2 are kept.

## 1. Positioning
An **optional, local, pre-ingress privacy-minimization module** for text going to LLMs. It reduces exposure of *matched* sensitive values.
- Not a prompt-injection detector; does not replace Guardrail Layer 1.
- Not an authorization tool: the scope file controls data handling, not whether testing is permitted.
- Not anonymity. Wording rule: "risk reduction for specified patterns and workflows".

```
text (paste / API request)
   |
Scrubber: detect -> policy (profile + scope + user overrides) -> auto / ask / off
   | scrubbed text only
Guardrail Layer 1 -> 2 -> 3 -> 4 -> LLM -> Layer 5
```

## 2. Threat model
**Helps with:** accidental sharing of recognized tokens, identifiers, paths, usernames, contact details and user-defined terms.
**Does not provide:** anonymity; complete detection; protection from semantic inference; protection from a compromised machine or extension; protection from the site's own scripts that read what you type (the UI only helps you avoid *submitting* it); coverage of text sent outside the supported paths.
**Extra risks introduced by consent UX and learning:** prompt fatigue leading users to disable protection; adaptation that learns to stop protecting something important (section 5 sets safety floors).

## 3. Policy model
### 3.1 Rules, groups, tiers
Every rule in `rules.json` gets:
- `group`: `secrets`, `identity`, `paths`, `vcs`, `contact`, `id-numbers`, `network`
- `tier`: `high` (secrets, keys, tokens), `medium` (emails, phones, ID numbers), `low` (names, usernames, paths, repo handles)
- `locked`: true for `high` rules (cannot be demoted by learning; disabling needs an explicit confirmation)

### 3.2 Actions per rule
| Action | Behaviour |
|---|---|
| `auto` | redact on paste, one-click **Undo** |
| `ask` | paste as-is, show a chip: "N items found: Redact / Keep" |
| `highlight` | underline only, no change |
| `off` | ignore |
| `pseudonymize`, `remove` | from the scope file (v0.2 section 3) |

### 3.3 Profiles (lists of group actions)
| Profile | secrets | contact | id-numbers | identity / paths / vcs |
|---|---|---|---|---|
| **minimal (default)** | auto | ask | ask | off |
| developer | auto | ask | off | off (keeps usernames, paths, commits for context) |
| student | auto | ask | ask | highlight |
| pentester | auto + scope file | ask | ask | scope-driven (keep in-scope hosts, pseudonymize client names) |
| healthcare / finance / HR | auto | auto | auto | highlight (sector terms added as custom rules) |

### 3.4 Files and precedence
- `rules.json`: shipped rules (never edited by users).
- `profile.json`: chosen profile and per-rule action overrides.
- `user_rules.json`: custom rules. Edits live here, so updates never overwrite them.
- `scope.json`: engagement scope (pentest profile).

**Precedence (first match wins):** scope `always_remove` > locked rules (floor: at least `ask`) > scope `keep` > user per-rule overrides > profile > shipped default.
Overlapping spans: higher precedence wins, then longest span, then earlier rule.

## 4. Consent UX
**Browser extension (primary):** after a paste, a small chip anchored to the text box (shadow DOM). Detection while typing is **read-only** (underline plus chip); the extension never rewrites text under the cursor.
- `auto` rules: text is already redacted; chip shows "2 redacted. Undo".
- `ask` rules: chip shows "2 found. Redact / Keep".
- Fallback when a rich editor blocks replacement: "Copy redacted version".
- Chip appears only when something is found. "Don't ask again for this rule on this site" is one click.

**Desktop (clipboard):** no hover is possible over arbitrary app text, so use a toast near the cursor with Redact / Keep and a short timeout, plus an **Undo hotkey** that restores the original clipboard for about 60 s (in memory only).

## 5. Learn from choices (adaptive policy)
**Logged locally per decision (never content):** rule id, tier, action offered, user choice (accepted, skipped, undone), time to decide, site/app category, timestamp.

**Adaptation rules**
- Promote `ask` -> `auto` when, over the last N decisions (N >= 10), the user accepted >= 90%.
- Demote `auto` -> `ask`, or `ask` -> `highlight`, when the user undid or skipped >= 70%.
- Adapts only the **user's own** profile, per rule, and per site when enough data exists.

**Safety floors (the system must not learn to stop protecting)**
- `high`-tier and `locked` rules never go below `ask`, whatever the user does.
- Every change is shown in a visible "Rules changed" list with one-click revert and a reset-to-profile button.
- A minimum number of decisions and a cool-down between changes prevent flapping.
- Old decisions decay, so habits can change.
- Adaptation can be turned off.

**Privacy:** the decision log stays on the device, holds no text, has a size cap, and is deletable. Export for the user study is opt-in.

## 6. Desktop paste-time flow (app-scoped)
1. A paste hotkey (for example `Ctrl+Alt+V`) reads the foreground window.
2. If it matches the **allowlist** (LLM apps and sites, by app name or window title), scrub per the profile.
3. Send the paste, then **restore the original clipboard**.
4. Any other app: paste unchanged. Passwords and commands are never touched.

Limits: for browsers the desktop only sees the window title (heuristic); exact sites need the extension. A **log-only mode** records what would have been redacted without changing anything.

## 7. Custom rules
- Stored in `user_rules.json` with `id`, `group`, `tier`, `pattern`, `replace`.
- **Validation before saving:** length cap, compile check, and a test against sample text with a time limit.
- **ReDoS protection:** run user patterns with a timeout (separate process or a timeout-capable regex engine); reject patterns that exceed it.
- A warning explains that profiles reduce exposure for matched patterns only.

## 8. Library interface
```python
result = scrubber.process(text=..., policy=policy, session=session, mode="preview")  # or "apply"
# result.scrubbed_text
# result.findings: [{span, category, tier, action, placeholder}]   <- never the raw value
restored = scrubber.rehydrate(response, session=session)           # local, opt-in
```
Session vault is memory-only; `always_remove` values are not stored; unknown placeholders are left untouched. Auto-learned identities are confirmed once before use.

## 9. Evaluation
**Detection and policy (from v0.2):** leakage rate, over-redaction, per-category P/R/F1, utility on paired triage tasks, consistency, overhead. Data: lab outputs (DVWA / Juice Shop) with synthetic seeded values; no platform machine output (TryHackMe, HackTheBox, CyberDefenders). Baselines: no scrubber, v1.2 rules, scope-aware, Presidio if time allows. Freeze the test set and rubric before the final run.

**Interaction (new)**
| Metric | Meaning |
|---|---|
| Prompt rate | chips shown per 100 pastes |
| Accept / skip / undo rate | per rule and per tier |
| Time to decide | seconds from chip to choice |
| Disable rate | share of users who turn the tool or a group off |
| Retention | still enabled after 1 and 2 weeks |

**Hypotheses:** H1: tiered consent (auto for secrets, ask for contact data) gives a lower disable rate than blanket auto-redaction at similar leakage. H2: learning from choices lowers the prompt rate over time without lowering protection of `high`-tier rules (checked against the floors).

**User study (small, after endsem):** 2 weeks on myself, then 5 to 8 volunteers (developer, student, pentester) for a week each. Informed consent, no content collected, only the decision log fields above, with their approval.

## 10. Related work and claims
Not novel claims: regex redaction, placeholders, clipboard monitoring, rehydration (Nano `prompt-scrub` and others). **Audit its v1.2 docs and source before claiming anything about precedence or consent UX.** Presidio is a general PII baseline. Guardrail Layer 1 is complementary.
**Safe claim:** a Guardrail-compatible, policy-driven scrubber with tiered consent and a measured privacy-versus-friction trade-off, including scope-aware handling for lab VAPT text. Do not claim "first" or "unique" without a source audit.

## 11. Plan
| Period | Work | Exit |
|---|---|---|
| **Endsem (to early Dec)** | Design only: freeze schema (profiles, tiers, actions), write about 10 precedence and adaptation test cases as a table | Frozen schema + test table |
| **After endsem to GATE** | Light: Nano audit, Python policy engine, extension chip with log-only mode, decision log | Working prototype with logs |
| **After GATE (last semester)** | Adaptive policy, user study, scope-aware benchmark, Guardrail integration, write-up | Results and report |

## 12. Risks
- **Prompt fatigue:** tiers, "only when found", per-site silencing, learning from choices; measured by the interaction metrics.
- **Learning erodes protection:** safety floors, visible changes, revert and reset.
- **Fragile editor integration:** fallback "Copy redacted version"; per-site adapters kept small.
- **False negatives and lost context:** report per-category results and utility; always allow Undo.
- **Custom-rule abuse (ReDoS):** validation and timeouts.
- **Weak novelty:** compare openly; contribute the policy, the consent UX and the measurements.
- **Scope creep:** extension chip first, desktop toast second.
