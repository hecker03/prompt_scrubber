# Prompt Scrubber: typed-text MVP spec (v0.1)

Implements design v0.3, section 4 (consent UX), for text the user **types** into a box. Browser extension first (Firefox). Spec only: no code until endsem ends.

## 1. Scope
- Elements: `textarea`, `input[type=text|search]`, `contenteditable` (chat boxes).
- Sites: allowlist, editable in settings. Start with claude.ai, chatgpt.com, gemini.google.com, google.com (search box).
- Never scanned: password fields, hidden inputs.

## 2. Behaviour
| # | Rule |
|---|---|
| 1 | **Detect read-only.** On `input`, debounce 300 ms, scan the current text. Nothing is rewritten while typing. |
| 2 | **Chip.** A small shadow-DOM chip below the box: `2 found: Redact / Keep`. Shown only when something is found; hidden when the box is empty or has no findings. |
| 3 | **Redact** replaces all flagged spans in one operation and keeps the caret in place relative to the text. |
| 4 | **Keep** adds the matched value (hash, in memory) to an ignore set so the chip doesn't return for it. "Always keep on this site" is stored per rule and site. |
| 5 | **Undo.** Native `Ctrl+Z` works; the chip also offers Undo for 60 s from an in-memory snapshot. |
| 6 | **Hotkey** `Ctrl+Shift+S` scrubs the whole box. |
| 7 | **Scrub on send (phase 2).** On allowlisted sites, if findings exist when the user presses Enter or Send, hold and show `Redact and send / Send anyway`. |
| 8 | **Paste** keeps the v1.2 behaviour (auto per tier). |
| 9 | **Decision log (local, no text):** rule id, tier, action offered, choice, ms to decide, site category, timestamp. Feeds the learning rules in design section 5. |

## 3. Replacement method
- `textarea` / `input`: `setRangeText` on each span from the end to the start, then restore the selection.
- `contenteditable`: select each span with a `Range`, then `execCommand('insertText')`.
- If a site's editor rejects the change, show **Copy redacted text** instead. Never leave the box half-edited.

## 4. Guards
- Ignore `input` events fired by our own replacement (loop guard).
- Pause scanning during IME composition (`compositionstart` to `compositionend`).
- Cap the scan at 20,000 characters; scan time target under 15 ms for 5,000 characters.
- Scan only while the box is focused or has changed.

## 5. Test table (write these as automated tests first)
| ID | Case | Expected |
|---|---|---|
| T1 | type a fake AWS key | chip `1 found`; Redact gives `[AWS_KEY]`; caret stays after it |
| T2 | type an email, press Keep | chip hides; a different email shows a chip again |
| T3 | edit in the middle of a long text | redaction replaces only the span; caret keeps its relative position |
| T4 | type with an IME (for example Devanagari) | no chip until composition ends; text not corrupted |
| T5 | password field | never scanned |
| T6 | contenteditable chat box | replacement works, or "Copy redacted text" appears |
| T7 | Redact, then Undo within 60 s | original restored; after 60 s the snapshot is gone |
| T8 | `Name <email>` (two overlapping findings) | precedence per design 3.4; chip counts distinct spans |
| T9 | 10 offers, `email` rule accepted 9 times | promoted to `auto` for paste |
| T10 | `high`-tier rule undone 20 times | never below `ask` |
| T11 | 20,000-character text | scan capped; under 50 ms; no UI lag |
| T12 | our own replacement | does not retrigger the chip |

## 6. Open questions (decide in the first spike)
- Do claude.ai and chatgpt.com accept `execCommand('insertText')` reliably, or do I need the fallback?
- Where to anchor the chip so it doesn't cover the send button?
- Is scrub-on-send possible without per-site code, or is each site an adapter?

## 7. Out of scope
Keystroke hooks, OS-level typing capture, cross-site tracking, any network call.

## 8. Plan
| When | Work |
|---|---|
| Before Nov 22 (optional, 1 hour) | review this spec, refine the table |
| After endsem | spike on two sites (T6 and the open questions), then the chip, then tests T1 to T12 |
| After GATE | scrub-on-send, learning rules, user study |
