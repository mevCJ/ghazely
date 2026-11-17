# Ghazely

A Chrome extension that makes web pages slowly rot as you sit and stare. A real rest heals them.

Built for Kiroween (Kiro's Halloween hackathon). Build window: Oct 30 to Dec 4, 2026.

## Problem

People sit and stare at screens for hours. Eye strain, dry eyes, headaches, and neck and back pain build up. Break timers get ignored.

## Idea

Show the harm instead of describing it. The page gets worse the longer you sit. At the end, an eerily realistic eye fills the screen. It is a work tool: it pushes a break, and the user can snooze or opt out.

## Decisions (from the grilling session)

| # | Topic | Decision |
|---|---|---|
| 1 | Purpose | Work tool with snooze. Pushes a break, user can pause or opt out. |
| 2 | Rest | No input and no playing media for N minutes. User sets N. |
| 3 | Force level | Soft lock. Full eye screen, rest timer counts. Snooze button appears after 30 sec. Limited snoozes per day. Each snooze makes the next haunt return faster and stronger. |
| 4 | Sound | Ghazely plays its own sounds (heartbeat, ringing, whispers). Distorting page media (`<video>`, `<audio>` tags) is a bonus. No tab capture. |
| 5 | Which pages | Everywhere, with an editable skip list. Default skips: video calls, payment and banking pages. One global timer, every tab shows the same stage. |
| 6 | Final message | Honest. The eye is the scare. A small line says: feels like this, not permanent, rest fixes it. Add one source link on digital eye strain. |
| 7 | The eye | Drawn in code (SVG and canvas). Pupil follows the cursor. Veins grow by stage. A real eye video replaces it if time allows. The Ghost character is dropped. |
| 8 | Time | 25+ hours a week, so all scope is in. |
| 9 | Kiro use | Specs, steering files, hooks, vibe coding. Chrome DevTools MCP loads and tests the extension. A custom health-facts MCP server is optional. |
| 10 | Demo clock | Hidden speed slider for judges, plus a "Demo mode" button that runs every stage in 60 seconds. |

## How it works

1. A background worker counts continuous screen time.
2. `chrome.idle` plus a media-playing check detects a rest.
3. A content script applies effects, stage by stage, in a Shadow DOM overlay.
4. A rest clears everything with a fade.

## Stages

Body horror first. Halloween horror late. The same eye grows closer at each stage.

| Time | Body effect | Spooky effect |
|---|---|---|
| 20 min | Slight blur, dry eyes | None |
| 45 min | Eyelids droop, red veins at edges | Faint whisper |
| 75 min | Double image, floaters | Shadows move at edges |
| 105 min | Tunnel vision, heartbeat | The eye watches from the dark |
| 120 min | Near blind. Full eye screen, honest health line. | Blood drips once |
| Rest | Screen clears | Eye closes and fades |

## Effects in scope

- Blur and floaters
- Bloodshot veins from the edges
- Eyelids closing
- The code-drawn eye
- Own sounds: heartbeat, ringing, whispers
- Media distortion on `<video>` and `<audio>` (bonus)
- Soft lock with limited snoozes
- Settings: rest length, skip list, snooze count
- Demo slider and Demo mode button

Cut unless time is left: blood on every div, cursor ghost trail.

## Design rules

- Never block typing or saving work.
- Cap blur so text stays barely readable until the last stage.
- One palette: gray, then sickly red.
- Effects live in a Shadow DOM overlay and one injected stylesheet, so strict site security rules do not break them.

## Risks

| Risk | Plan |
|---|---|
| A flat drawn eye looks cheap | Prototype the eye first |
| Strict page security (CSP) | Shadow DOM overlay plus one stylesheet |
| Judges cannot wait two hours | Demo slider and Demo mode |
| Heavy blur slows pages | Use an overlay with `backdrop-filter`, not a filter on the whole page. Test on YouTube. |
| Store rules | Load unpacked for the hackathon |

## Build order

1. Days 1 to 5: timer, rest detection, blur, soft lock, demo mode.
2. Days 6 to 12: veins, eyelids, the eye, sounds, settings.
3. Days 13 to 19: polish, media distortion, real eye video, write-up. Record the demo by day 17.

## Hackathon fit

- Category: Costume Contest. Second choice: Frankenstein.
- Impact: a real problem with an honest health link.
- Design: slow build-up around one eye.
- Kiro use: steering files hold the "scare script" (stage times, colors, wording). Every spec reads it.
- Only new work counts, so start after Oct 30.

## To check on the rules page

- Public repo and license needed?
- Demo video length?
- How judges install and try it?
- Team and age limits?
