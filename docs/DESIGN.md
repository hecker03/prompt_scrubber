# Scope-aware Prompt Scrubber: design

## 1. Goal
Let security testers use cloud LLMs on real tool output without leaking client data, while keeping enough context for the LLM to stay useful.

The scrubber reads an **engagement scope file** and decides, per item: **keep**, **pseudonymize**, or **always remove**.

## 2. Non-goals
- Not anonymity. Semantic content (a niche bug, a distinctive app) can still identify a client.
- No network-level protection (IP, timing, headers sent by the user's own client).
- Not a substitute for the client's NDA or data-handling rules.
- Evaluated on lab data only (DVWA, Juice Shop), never real client data.

## 3. Scope file (`scope.json`)
```json
{
  "engagement": "demo-lab",
  "client": { "names": ["Acme Corp"], "domains": ["acme.com"] },
  "keep": { "hosts": ["juice-shop.local", "10.10.10.0/24"] },
  "pseudonymize": { "domains": ["*.acme.com"], "emails": true, "usernames": ["tester1"] },
  "always_remove": ["cookie", "set-cookie", "authorization", "api_keys", "private_keys", "jwt"],
  "identity": { "auto_learn": true, "terms": [] }
}
```

**Precedence (first match wins):**
1. `always_remove`
2. `keep` (exact hosts and CIDRs)
3. `pseudonymize`
4. default rules from `rules.json`

## 4. Pipeline
1. **Parse:** detect input type (HTTP request/response first; nmap, nuclei, sqlmap later). Fall back to plain text.
2. **Classify:** apply the scope file, then default rules and learned identity terms.
3. **Replace:** consistent placeholders per session (`acme.com` -> `client1.example` everywhere, `user@acme.com` -> `user1@client1.example`).
4. **Preview:** show a diff of what was kept, replaced and removed. Nothing is sent until confirmed.
5. **Rehydrate:** map placeholders in the LLM reply back to real values, locally.

**Session map:** stored locally only, with a TTL (default 7 days), never sent anywhere. `always_remove` items are **not** stored, so they cannot be rehydrated.

## 5. Components (reuse what exists)
| Component | Status |
|---|---|
| `rules.json` + shared tests | done (v1.2) |
| Desktop agent (clipboard, hotkey, `--stdin`) | done (v1.2) |
| Scope loader + precedence engine | new |
| HTTP parser (headers, cookies, bodies) | new |
| Consistent pseudonyms + session map + rehydrate | new |
| Preview diff | new |
| Browser extension reads the same scope file | later |

## 6. Evaluation (the research part)
**Dataset:** about 50 tool outputs from a local DVWA / Juice Shop lab. A script injects fake client identifiers and secrets at known positions, which gives ground-truth labels.

**Metrics**
| Metric | Definition |
|---|---|
| Leakage rate | share of labeled sensitive items still present after scrubbing |
| Over-redaction | share of non-sensitive tokens removed or altered |
| Utility | LLM answers to 5 fixed questions per output (which parameter is injectable, severity, next step, ...), original vs scrubbed + rehydrated, scored with a rubric |

**Baselines:** no scrubbing; generic regex (current v1.2); Nano `prompt-scrub`; ours with scope file.
**Ablations:** with/without scope file; with/without consistent pseudonyms; with/without HTTP parser.

**Claim to test:** scope-aware redaction keeps utility close to the unscrubbed baseline while cutting leakage below generic regex scrubbing.

## 7. Milestones
| When | Work |
|---|---|
| Now to Nov 22 | Finalize this design; collect 10-20 lab outputs (about 1 h/day max) |
| After endsem to Jan | Scope loader, HTTP parser, pseudonyms, preview, CLI |
| After GATE (last semester) | Full dataset, benchmark, write-up (paper) |

## 8. Risks
- **False negatives:** always show the preview; report leakage honestly.
- **LLM-as-judge bias:** use a fixed rubric plus manual spot-checks.
- **Pseudonym collisions or leakage through structure:** unit-test the mapping, keep placeholders non-derivable from originals.
- **Scope creep:** HTTP first, other tools later.

## 9. Link to the LLM-security project
The scrubber becomes the input-sanitization layer, with policy by destination (local vs cloud model) and a prompt risk score. Output checks (reply echoing secrets) are future work.
