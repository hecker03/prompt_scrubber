// GENERATED from rules.json by tools/build_rules.py. Do not edit.
const RULES_JSON = {
  "version": 1,
  "rules": [
    {
      "id": "privkey",
      "pattern": "-----BEGIN [A-Z ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]*PRIVATE KEY-----",
      "flags": "",
      "replace": "[PRIVATE_KEY]",
      "default": true,
      "desc": "Private key blocks"
    },
    {
      "id": "urlcred",
      "pattern": "(\\b[a-z][a-z0-9+.-]*://)[^\\s/:@]+:[^\\s/@]+@",
      "flags": "i",
      "replace": "$1[CRED]@",
      "default": true,
      "desc": "user:pass in URLs"
    },
    {
      "id": "jwt",
      "pattern": "\\beyJ[\\w-]{8,}\\.eyJ[\\w-]{8,}\\.[\\w-]{8,}\\b",
      "flags": "",
      "replace": "[JWT]",
      "default": true,
      "desc": "JSON web tokens"
    },
    {
      "id": "aws",
      "pattern": "\\b(?:AKIA|ASIA)[0-9A-Z]{16}\\b",
      "flags": "",
      "replace": "[AWS_KEY]",
      "default": true,
      "desc": "AWS access key IDs"
    },
    {
      "id": "ghtoken",
      "pattern": "\\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\\b",
      "flags": "",
      "replace": "[GITHUB_TOKEN]",
      "default": true,
      "desc": "GitHub tokens"
    },
    {
      "id": "slack",
      "pattern": "\\bxox[baprs]-[A-Za-z0-9-]{10,}\\b",
      "flags": "",
      "replace": "[SLACK_TOKEN]",
      "default": true,
      "desc": "Slack tokens"
    },
    {
      "id": "google",
      "pattern": "\\bAIza[0-9A-Za-z_-]{35}\\b",
      "flags": "",
      "replace": "[GOOGLE_KEY]",
      "default": true,
      "desc": "Google API keys"
    },
    {
      "id": "bearer",
      "pattern": "\\b(Bearer\\s+)[A-Za-z0-9._~+/=-]{16,}",
      "flags": "i",
      "replace": "$1[TOKEN]",
      "default": true,
      "desc": "Bearer tokens"
    },
    {
      "id": "secretkv",
      "pattern": "\\b((?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|token)[\\\"']?\\s*[:=]\\s*)([\\\"']?)[^\\s\\\"',;]+\\2",
      "flags": "i",
      "replace": "$1$2[REDACTED]$2",
      "default": true,
      "desc": "key = value secrets"
    },
    {
      "id": "mailbox",
      "pattern": "(?:[A-Z][\\w.'-]*(?: [A-Z][\\w.'-]*){0,3}|[\\w.-]+)(?= <[^<>\\s@]+@[^<>\\s]+>)",
      "flags": "",
      "replace": "[NAME]",
      "default": true,
      "desc": "Name before <email> (git author lines, mail headers)"
    },
    {
      "id": "userip",
      "pattern": "\\b[\\w.-]+@(\\d{1,3}(?:\\.\\d{1,3}){3})\\b",
      "flags": "",
      "replace": "user@$1",
      "default": true,
      "desc": "ssh user@IP (keeps IP)"
    },
    {
      "id": "email",
      "pattern": "\\b(?!git@)[A-Za-z0-9._%+-]+@(?!\\d{1,3}(?:\\.\\d{1,3}){3}\\b)[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+\\b",
      "flags": "",
      "replace": "[EMAIL]",
      "default": true,
      "desc": "Email addresses"
    },
    {
      "id": "prompt",
      "pattern": "\\b[A-Za-z_][\\w.-]*@[A-Za-z0-9_-]+(?=:|\\s*[$#%>]|\\s+(?:MINGW\\d*|UCRT64|CLANG\\w*|MSYS)\\b|\\s+[~/])",
      "flags": "",
      "replace": "user@host",
      "default": true,
      "desc": "Shell prompts (Linux/macOS/Git Bash)"
    },
    {
      "id": "homelinux",
      "pattern": "/home/(?!user\\b)[^/\\s:]+",
      "flags": "",
      "replace": "/home/user",
      "default": true,
      "desc": "Linux home paths"
    },
    {
      "id": "homemac",
      "pattern": "/Users/(?!user\\b)[^/\\s:]+",
      "flags": "",
      "replace": "/Users/user",
      "default": true,
      "desc": "macOS home paths"
    },
    {
      "id": "homewin",
      "pattern": "([A-Za-z]:\\\\Users\\\\)(?!user\\b)[^\\\\\\s]+",
      "flags": "i",
      "replace": "$1user",
      "default": true,
      "desc": "Windows home paths"
    },
    {
      "id": "githuburl",
      "pattern": "\\b(github\\.com|gist\\.github\\.com|raw\\.githubusercontent\\.com)([/:])(?!(?:orgs|features|pricing|about|marketplace|topics|settings|login|explore|sponsors|collections|trending|apps|enterprise|search|notifications|issues|pulls)\\b)[A-Za-z0-9][A-Za-z0-9-]{0,38}(?![\\w-])",
      "flags": "",
      "replace": "$1$2[GITHUB_USER]",
      "default": true,
      "desc": "GitHub usernames in URLs / git remotes"
    },
    {
      "id": "ghpages",
      "pattern": "\\b[A-Za-z0-9-]+(?=\\.github\\.io\\b)",
      "flags": "",
      "replace": "[GITHUB_USER]",
      "default": true,
      "desc": "username.github.io"
    },
    {
      "id": "pan",
      "pattern": "(?<![\\w])[A-Z]{5}\\d{4}[A-Z](?![\\w])",
      "flags": "",
      "replace": "[PAN]",
      "default": true,
      "desc": "Indian PAN"
    },
    {
      "id": "aadhaar",
      "pattern": "(?<![\\w])\\d{4}[ -]\\d{4}[ -]\\d{4}(?![\\w])",
      "flags": "",
      "replace": "[AADHAAR]",
      "default": true,
      "desc": "Aadhaar (spaced)"
    },
    {
      "id": "phone",
      "pattern": "(?<![\\w])(?:\\+91[ -]?)?[6-9]\\d{9}(?![\\w])",
      "flags": "",
      "replace": "[PHONE]",
      "default": true,
      "desc": "Indian mobile numbers"
    },
    {
      "id": "ip",
      "pattern": "\\b(?!127\\.|0\\.0\\.0\\.0)(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
      "flags": "",
      "replace": "[IP]",
      "default": false,
      "desc": "IPv4 (optional: set ips=true)"
    }
  ]
};
if (typeof module !== 'undefined') module.exports = RULES_JSON;
