# Ghazely: 3 minute demo script

Target: 180 seconds. Screen recording plus voice. Voice is short, plain, a little cruel.
Judging links: Impact (0:00-0:30), Design and Innovation (0:30-1:55), Kiro use (2:15-2:48), Presentation (all).

## Demo mode timing (from `src/shared/demo.ts`)

Demo mode runs at 120x. Click the button at **T = 0:30** in the video.

| Real time after click | Video time | Stage |
|---|---|---|
| +0 s | 0:30 | calm |
| +10 s | 0:40 | strain (no visible change, by design) |
| +22.5 s | 0:52 | dry |
| +37.5 s | 1:07 | haze (blur starts here) |
| +52.5 s | 1:22 | tunnel |
| +60 s | 1:30 | lock |
| +65 s | 1:35 | Snooze button shows (demo-only 5 s delay) |
| +80 s | 1:50 | demo ends, page clears |

Record 0:30 to 1:50 as **one unbroken take**. No cuts makes it believable. Do not click Snooze in this take: a snooze moves the clock back and breaks the timing.

## Script

Pause marks: `/` is a short beat (about 0.5 s). `[1s]`, `[2s]` are timed silences. `...` means trail off, don't stop dead. Pace is about 2.3 words per second, slower in the dark stages.

The tone arc: tired and close at the start, quieter and colder as the page rots, near-whisper at haze, flat and steady at the lock, warm at the rest, plain builder voice for the Kiro part, low again for the close.

| Time | On screen | Tone | Voice |
|---|---|---|---|
| 0:00-0:10 | A real work page (docs or news). A clock reads 2 hours. | Tired, close to the mic, slow | "It's late afternoon. [1s] You've been staring at this screen for two hours / and you haven't looked away once." |
| 0:10-0:30 | Quick cuts: rubbing eyes, squinting at text. | Plain, matter-of-fact | "Your eyes feel tired. / Dry. / A little blurry. [1s] That's digital eye strain. [1s] Break reminders don't help. We click them away. [1s] So Ghazely doesn't remind you. / It makes the page feel what your eyes feel." |
| 0:30-0:40 | Popup. Click Demo mode. Badge shows "Demo speed 120x". | Dry, a small smirk | "Ghazely counts how long you've been looking. [1s] Here's two hours / squeezed into sixty seconds." |
| 0:40-0:52 | Stage strain. Page looks normal. | Quiet, almost friendly | "Twenty minutes in. [1s] Nothing has changed. The page looks fine. [2s] That's the trap." |
| 0:52-1:07 | Stage dry. Veins creep in, lids droop. Faint whisper. | Lower, slower, a little cold | "Forty-five minutes. [1s] Red veins creep in from the edges. / Your eyelids start to feel heavy. [2s] Did you hear that?" |
| 1:07-1:22 | Stage haze. Blur starts, floaters, tunnel. The eye peeks. | Near-whisper | "Seventy-five minutes. / The page goes hazy. Specks drift across the text. [2s] And something... [1s] starts looking back." |
| 1:22-1:30 | Stage tunnel. Heartbeat. The eye watches. Text still barely readable. | Tense, short | "An hour forty-five. [1s] Your heart gets loud." |
| 1:30-1:50 | Soft lock. Full eye. Move the cursor so the pupil follows it. Hold on the copy. Point at Snooze when it shows at 1:35. | Silent, then flat and steady, like reading a verdict | [3s, let the eye move] "This is how your eyes feel. [1s] Not permanent. / Rest fixes it. [2s] Every twenty minutes, / look twenty feet away, / for twenty seconds." [hold silence to 1:50] |
| 1:50-1:55 | Demo ends. Page clears. | Warm, relieved | "Rest... / and it goes away." |
| 1:55-2:15 | Separate take: a real lock. Click Snooze, show "{left} left today". Then show the options page: rest length, skip list. | Normal speaking voice, clear | "It's a work tool, not a prison. [1s] You can snooze it a few times a day. / But each snooze brings it back sooner, and stronger. [1s] You choose how long a rest is. / Video calls, payments and banking are never touched." |
| 2:15-2:48 | Kiro segment (below). | Plain builder voice, a bit faster | See the Kiro segment. |
| 2:48-3:00 | Logo, name, repo link. | Low and slow again | "Ghazely. [1s] Rest your eyes... [1s] or be watched." |

## Kiro segment (2:15-2:48), five shots of about 6 seconds

Tone: plain and confident. Short beats `/` between ideas. No horror voice here.

| Shot | On screen | Voice |
|---|---|---|
| 1 | `.kiro/steering/scare-script.md` | "It started in Kiro chat. / One steering file holds every stage, every color, every line of copy." |
| 2 | `.kiro/specs/`: four specs, each with requirements, design, tasks | "Kiro turned it into four specs. / Each one has requirements, a design and tasks." |
| 3 | `tests/scare-script.test.ts` failing after a stage time is edited | "Change a stage time, / and this test fails. [0.5s] The code can't drift from the script." |
| 4 | `.kiro/hooks/` in Kiro IDE, then a save that runs the checks | "In Kiro IDE, every save runs lint, typecheck and tests." |
| 5 | Chrome DevTools MCP run from Kiro CLI | "And Kiro CLI drives Chrome through MCP. / It installs the extension and checks every stage." |

Use shot 5 only if a real MCP run is recorded. Otherwise drop it and give shots 1 to 4 about 8 seconds each.

## Which Kiro tool did what

| Tool | Job in Ghazely |
|---|---|
| Kiro (agent chat) | Grilled the idea into 10 decisions. Wrote the steering files and the four specs. Built the engine, tests and icon. |
| Kiro IDE | Runs the on-save hooks in `.kiro/hooks/` (checks, effect tests, typecheck). Hosts the Chrome DevTools MCP in `.kiro/settings/mcp.json`. |
| Kiro CLI | Runs headless (no window) with only named tools trusted. Drives Chrome DevTools MCP to install the extension and check each stage. |

## Rules for the recording

- Use a real page, not a blank one.
- Show text staying barely readable until lock.
- Say "feels like", never "will cause". Honest health claims only.
- Sound on, volume low, mute button visible once sound starts.
- Turn on captions: the whisper and heartbeat are quiet.
- Record by day 17. Keep one spare day.

## Before recording

- [ ] Demo mode take runs 0:30 to 1:50 with no stutter on the chosen page.
- [ ] The eye looks real enough on camera.
- [ ] Snooze count is reset (fresh day or cleared storage) so the number reads well.
- [ ] One real MCP run recorded, or shot 5 dropped.
- [ ] Rules page read: video length, repo, license.
