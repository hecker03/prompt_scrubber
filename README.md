# Prompt Scrubber

Redacts usernames, hostnames, paths, GitHub handles, emails and secrets before you paste text into AI prompts. Runs 100% locally.

Two ways to use it, one shared rule set (`rules.json`):

| Piece | Covers | Trigger |
|---|---|---|
| **Browser extension** (Firefox now; Chrome/Edge/Brave planned) | Text boxes in the browser | Automatic on paste |
| **Desktop agent** (Python) | Terminals, VS Code, desktop AI apps, any browser | Hotkey or auto-watch on the clipboard |

## What it redacts

| Type | Example | Result |
|---|---|---|
| Shell prompts (Linux/macOS/Git Bash) | `alice@kali:~$` | `user@host:~$` |
| Home paths | `/home/alice`, `/Users/alice`, `C:\Users\alice` | `.../user` |
| GitHub usernames in URLs and remotes | `github.com/octocat/repo`, `git@github.com:octocat/repo.git`, `octocat.github.io` | `[GITHUB_USER]` |
| Names in `Name <email>` (git author lines, mail headers) | `Jane Q Public <jane@x.org>` | `[NAME] <[EMAIL]>` |
| Emails | `me@example.com` | `[EMAIL]` |
| ssh targets (IP kept) | `root@10.0.0.5` | `user@10.0.0.5` |
| `key = value` secrets | `password = hunter2`, `"api_key": "..."` | `[REDACTED]` |
| URL credentials | `https://u:pw@host` | `https://[CRED]@host` |
| AWS / GitHub / Slack / Google keys, JWTs, Bearer tokens, private keys | | `[AWS_KEY]`, `[GITHUB_TOKEN]`, ... |
| Indian PAN, Aadhaar (spaced), mobile numbers | | `[PAN]`, `[AADHAAR]`, `[PHONE]` |
| Your own terms (name, hostname) | `Alice Doe` | `[NAME]` |
| IPv4 (optional, off by default) | `192.168.1.5` | `[IP]` |

## Browser extension

**Install**
- Signed build: download the `.xpi` from [Releases](../../releases) and open it in Firefox.
- Temporary: `about:debugging#/runtime/this-firefox` -> Load Temporary Add-on -> `manifest.json`.

If it does nothing on a site, allow access to all websites: `about:addons` -> Prompt Scrubber -> Permissions.

**Settings** (JSON on the add-on's Settings page)
```json
{ "enabled": true, "ips": false, "terms": ["yourusername", "Your Name"], "disabled": [] }
```
`disabled` takes rule ids from `rules.json`, e.g. `["phone", "aadhaar"]`.

Works on paste only. A hotkey to scrub typed text is planned.

## Desktop agent

Works anywhere you can copy and paste, including terminals and VS Code.

```
cd agent
pip install -r requirements.txt
python scrubber_agent.py              # hotkey mode (default)
python scrubber_agent.py --watch      # auto-scrub every copy
```

- **Hotkey mode:** copy text, press `Ctrl+Alt+S`, paste. The clipboard now holds the scrubbed text. Safest: it never touches passwords you copy from a password manager.
- **Watch mode:** scrubs every copy automatically. `Ctrl+Alt+P` pauses and resumes.
- **Auto-learned terms:** reads your OS username, hostname, home folder and `git config user.name/email`, so bare names (`ls -l` owners, `whoami` output, zsh prompts without `@`) are redacted too. `python scrubber_agent.py --show-terms` lists them.
- **Pipe mode:** `Get-Clipboard | python scrubber_agent.py --stdin` (PowerShell) or `... | python scrubber_agent.py --stdin` (any shell).
- **Config:** `~/.prompt-scrubber/config.json` (`terms`, `ips`, `disabled`, `auto_learn`, `hotkey`, `pause_hotkey`).
- **Windows autostart:** put a shortcut to `pythonw scrubber_agent.py --watch` in `shell:startup`.
- Linux needs `xclip` or `xsel`. macOS needs Accessibility permission for hotkeys.

Limits: acts on the clipboard only (not typed text), and Windows clipboard history (Win+V) may keep the original copy.

## Rules

`rules.json` is the single source of truth. After editing it:

```
python tools/build_rules.py     # regenerates rules.js for the extension
node tests/test_js.js           # shared cases, extension logic
python tests/test_core.py       # shared cases, desktop agent logic + rules.js sync check
```
Add a case to `tests/cases.json` for every new rule.

## Build the extension

```
zip -r prompt-scrubber.xpi manifest.json rules.js content.js options.html options.js icon.png
```
Sign as an unlisted add-on on addons.mozilla.org to install it permanently in regular Firefox.

## Roadmap

- Hotkey to scrub typed text in the browser
- Chrome / Edge / Brave build
- VS Code extension
- More detectors (Luhn-checked cards, more cloud keys, high-entropy secrets)
- Reversible placeholders (`[NAME_1]`) with a local map
- Evaluation on a labeled prompt set; reuse of `rules.json` as an input/output sanitization layer for LLM apps

## License

MIT
