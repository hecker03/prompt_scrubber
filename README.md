# Prompt Scrubber

Firefox extension that redacts sensitive text as you paste it into prompts.

When you paste into any text box (AI chats, GitHub, forms), Prompt Scrubber replaces usernames, hostnames, paths, emails and secrets with placeholders before the text is inserted. Everything runs locally in the browser. Nothing is sent anywhere.

## What it redacts

| Type | Example | Result |
|---|---|---|
| Shell prompts (Linux/macOS/Git Bash) | `alice@kali:~$` | `user@host:~$` |
| Home paths | `/home/alice`, `/Users/alice`, `C:\Users\alice` | `.../user` |
| Emails | `me@example.com` | `[EMAIL]` |
| ssh targets (IP kept) | `root@10.0.0.5` | `user@10.0.0.5` |
| Passwords / tokens / API keys (`key = value`) | `password = hunter2` | `password = [REDACTED]` |
| URL credentials | `https://u:pw@host` | `https://[CRED]@host` |
| AWS, GitHub, Slack, Google keys, JWTs, Bearer tokens | | `[AWS_KEY]`, `[GITHUB_TOKEN]`, ... |
| Private key blocks | `-----BEGIN ... PRIVATE KEY-----` | `[PRIVATE_KEY]` |
| Your own terms (name, hostname, college) | `Alice Doe` | `[NAME]` |
| IPv4 addresses (optional, off by default) | `192.168.1.5` | `[IP]` |

A small "Scrubbed N items" toast appears when something is changed. Text with nothing to redact pastes normally.

## Install

- **Signed build:** download the `.xpi` from the [Releases](../../releases) page, then open it in Firefox (or `about:addons` -> gear -> Install Add-on From File).
- **Temporary (development):** `about:debugging#/runtime/this-firefox` -> Load Temporary Add-on -> select `manifest.json`.

If it does not act on a site, open `about:addons` -> Prompt Scrubber -> Permissions and allow access to all websites.

## Settings

Open the add-on's Settings page and edit the JSON:

```json
{
  "enabled": true,
  "ips": false,
  "terms": ["yourusername", "Your Name", "YOUR-HOSTNAME"],
  "disabled": []
}
```

- `enabled`: turn the extension on or off.
- `ips`: also replace IPv4 addresses (off by default, useful when pasting pentest targets).
- `terms`: your own words to hide. Each becomes `[NAME]`.
- `disabled`: rule names to turn off, e.g. `["email", "prompt"]`.

## Limits

- Only works on paste, not on typed text.
- Firefox only. It does not cover terminals, desktop apps or VS Code.
- Pattern-based: custom prompts without `@`, or names in plain text, need entries in `terms`.

## Develop

```
node tests/test.js
zip -r prompt-scrubber.xpi manifest.json content.js options.html options.js icon.png
```

Sign the `.xpi` as an unlisted add-on on addons.mozilla.org to install it permanently in regular Firefox.

## Roadmap

- More detectors: Aadhaar/PAN/phone, card numbers (Luhn), more cloud keys, SSH keys, DB connection strings, MAC/IPv6, high-entropy secrets
- Reversible placeholders (`[NAME_1]`) with a local map
- Per-site on/off and a settings UI
- Rules in a shared JSON file, reusable as an input/output sanitization layer for LLM applications
- Evaluation on a labeled prompt set (precision, recall, false positives)

## License

MIT
