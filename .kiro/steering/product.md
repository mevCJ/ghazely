---
inclusion: always
---

# Ghazely: product rules

Ghazely is a Chrome (MV3) extension for the Kiroween hackathon. It makes web pages slowly rot as the user sits and stares. A real rest heals them.

## Purpose

- It is a work tool. It pushes a break. The user can snooze or opt out.
- The horror is the message: body horror first, Halloween horror late.
- The final scare is one eerily realistic eye, drawn in code.

## Hard rules

1. Never block typing, scrolling, or saving work before the soft lock.
2. The soft lock always shows a Snooze button after 30 seconds, until the daily snooze limit is used up.
3. Health claims must be honest. Screens cause tired, dry, blurry eyes. This is temporary. Never say screens cause blindness or floaters.
4. Never read, store, or send page content, keystrokes, or URLs off the device. Store only counters and settings.
5. Skip-listed pages (video calls, payment, banking) are never touched.
6. Every effect must be removable in under one second when the user rests.

## Scope decisions (do not reopen without asking the user)

- Rest = no input and no playing media for N minutes. The user sets N.
- Soft lock, with limited daily snoozes. Each snooze makes the next haunt come back faster and stronger.
- Sound: own sounds only (heartbeat, ringing, whispers). Distorting `<video>` and `<audio>` is a bonus. No tab capture.
- Runs on all sites, with an editable skip list.
- One global clock. Every tab shows the same stage.
- Demo: a hidden speed slider, plus a Demo mode button that runs every stage in 60 seconds.
- No ghost character. The eye is the character.

## Out of scope

Blood on every div. Cursor ghost trail. Camera or posture detection. Accounts or cloud sync.
