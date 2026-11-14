#!/usr/bin/env python3
"""Prompt Scrubber desktop agent: scrubs clipboard text system-wide
(terminals, VS Code, desktop AI apps, any browser).

  python scrubber_agent.py               hotkey mode: copy text, press Ctrl+Alt+S, paste
  python scrubber_agent.py --watch       auto mode: scrub everything you copy (Ctrl+Alt+P pauses)
  python scrubber_agent.py --stdin       filter: Get-Clipboard | python scrubber_agent.py --stdin
  python scrubber_agent.py --text "..."  scrub one string
  python scrubber_agent.py --show-terms  list the names auto-learned from this machine
"""
import argparse
import sys
import time

from scrubber_core import learn_terms, load_config, load_rules, redact


def notify(msg):
    print(msg, flush=True)
    try:
        from plyer import notification
        notification.notify(title='Prompt Scrubber', message=msg, timeout=2)
    except Exception:
        pass


def build(cfg):
    terms = list(cfg.get('terms', []))
    if cfg.get('auto_learn', True):
        terms += learn_terms()
    return load_rules(), terms


def scrub(text, rules, terms, cfg):
    return redact(text, rules, terms, cfg.get('ips', False), cfg.get('disabled', []))


def run_agent(cfg, watch):
    import pyperclip
    from pynput import keyboard

    rules, terms = build(cfg)
    state = {'paused': False, 'last': None}

    def scrub_now():
        text = pyperclip.paste()
        if not text:
            return
        out, n = scrub(text, rules, terms, cfg)
        if n:
            pyperclip.copy(out)
            state['last'] = out
            notify(f'Scrubbed {n} item(s). Paste now.')
        else:
            notify('Nothing to scrub.')

    def toggle():
        state['paused'] = not state['paused']
        notify('Auto-scrub paused.' if state['paused'] else 'Auto-scrub resumed.')

    hk = keyboard.GlobalHotKeys({cfg['hotkey']: scrub_now, cfg['pause_hotkey']: toggle})
    hk.start()
    notify(f"Running ({'watch' if watch else 'hotkey'} mode). Scrub: {cfg['hotkey']}  Pause: {cfg['pause_hotkey']}")
    try:
        if watch:
            prev = pyperclip.paste()
            while True:
                time.sleep(0.4)
                cur = pyperclip.paste()
                if cur and cur != prev and cur != state['last'] and not state['paused']:
                    out, n = scrub(cur, rules, terms, cfg)
                    if n:
                        pyperclip.copy(out)
                        state['last'] = out
                        notify(f'Scrubbed {n} item(s).')
                        cur = out
                prev = cur
        else:
            hk.join()
    except KeyboardInterrupt:
        pass


def main():
    ap = argparse.ArgumentParser(description='Prompt Scrubber desktop agent')
    ap.add_argument('--watch', action='store_true', help='auto-scrub every copy')
    ap.add_argument('--stdin', action='store_true', help='read stdin, print scrubbed text')
    ap.add_argument('--text', help='scrub this string and print it')
    ap.add_argument('--show-terms', action='store_true', help='print auto-learned terms')
    args = ap.parse_args()
    cfg = load_config()

    if args.show_terms:
        print('\n'.join(cfg.get('terms', []) + learn_terms()))
        return
    if args.stdin or args.text is not None:
        rules, terms = build(cfg)
        text = sys.stdin.read() if args.stdin else args.text
        out, n = scrub(text, rules, terms, cfg)
        sys.stdout.write(out)
        print(f'\n[scrubbed {n} item(s)]', file=sys.stderr)
        return
    run_agent(cfg, args.watch)


if __name__ == '__main__':
    main()
