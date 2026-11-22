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

Record 0:30 to about 2:07 as **one unbroken take**. No cuts makes it believable. Click Snooze **once**, at 1:42. In demo mode a snooze shows a calm page for 5 real seconds, then jumps straight back to the lock at about 1:47; the demo ends 20 s after that. Before the take, reset today's snooze count so the bar starts full (a snooze in demo mode uses a real daily snooze).

## Script

Pause marks: `/` is a short beat (about 0.5 s). `[1s]`, `[2s]` are timed silences. `...` means trail off, don't stop dead. Pace is about 2.3 words per second, slower in the dark stages.

The tone arc: tired and close at the start, quieter and colder as the page rots, near-whisper at haze, flat and steady at the lock, warm at the rest, plain builder voice for the Kiro part, low again for the close.

| Time | On screen | Tone | Voice |
|---|---|---|---|
| 0:00-0:10 | Cold open (`video/cold-open`): dark room, 9:02 PM, then hands and cans at 1:47 AM. | Tired, close to the mic, slow | "As developers, / we stare at screens for hours. [1s] A hackathon. / A deadline. / Or just being in the zone." |
| 0:10-0:20 | Cold open: 4:00 AM, push in on bloodshot eyes, then the code blurs and doubles. | Plain, a little worn | "And our eyes pay for it. / Tired. / Dry. / Blurry. / I tried a Pomodoro timer. / I snoozed it." |
| 0:20-0:30 | Cold open: blur peaks, cut to black, "You haven't blinked in 11 minutes." Then the Ghazely title. | Flat, then a beat of resolve | "A cute mascot? / I ignored it. [1s] I needed something stronger. [2s] So I built Ghazely." |
| 0:30-0:40 | Popup. Click Demo mode. Badge shows "Demo speed 120x". | Dry, a small smirk | "It doesn't remind me. / It makes the page feel what my eyes feel. / Here's the demo of two hours, in sixty seconds." |
| 0:40-0:52 | Stage strain. Page looks normal. | Quiet, almost friendly | "Twenty minutes in. [1s] Nothing has changed. The page looks fine. [2s] That's the trap." |
| 0:52-1:07 | Stage dry. Veins creep in, lids droop. Faint whisper. | Lower, slower, a little cold | "Forty-five minutes. [1s] Red veins creep in from the edges. / Your eyelids start to feel heavy. [2s] Did you hear that?" |
| 1:07-1:22 | Stage haze. Blur starts, floaters, tunnel. The eye peeks. | Near-whisper | "Seventy-five minutes. / The page goes hazy. Specks drift across the text. [2s] And something... [1s] starts looking back." |
| 1:22-1:30 | Stage tunnel. Heartbeat. The eye watches. Text still barely readable. | Tense, short | "An hour forty-five. [1s] Your heart gets loud." |
| 1:30-1:42 | Soft lock. Full eye. Move the cursor so the pupil follows it. Snooze shows at 1:35; hover it, don't click yet. | Flat and steady, like reading a verdict | "This is how your eyes feel. [1s] Not permanent. / Rest fixes it. [2s] Every twenty minutes, / look twenty feet away, / for twenty seconds." |
| 1:42-1:52 | **Click Snooze at 1:42.** The snooze bar drops one cell. Every effect fades out and the page sits **calm for 5 s** (demo-only behavior), then the lock **snaps back at about 1:47**. Do not click Snooze again. | Normal speaking voice, clear | "It's a work tool, not a prison. [1s] You can snooze it a few times a day. / But each snooze brings it back sooner... and stronger." |
| 1:52-2:07 | Second lock holds. Let the eye follow the cursor. Demo ends at about 2:07 and the page clears. | Silent, then warm at the clear | [hold silence] ... at 2:07: "Rest... / and it goes away." |
| 2:07-2:14 | Separate take: the options page. Rest length, snooze settings, skip list. | Normal speaking voice, clear | "You choose how long a rest is. / Video calls, payments and banking are never touched." |
| 2:14-2:49 | Kiro segment (below), five shots of 7 s. | Plain builder voice, a bit faster | See the Kiro segment. |
| 2:49-2:56 | Logo, name, repo link. | Low and slow again | "Ghazely. [1s] Rest your eyes... [1s] or be watched." |

## Kiro segment (2:14-2:49), five shots of 7 seconds

Tone: plain and confident. Short beats `/` between ideas. No horror voice here.

| Shot | On screen | Voice |
|---|---|---|
| 1 | `.kiro/steering/scare-script.md` | "It started in Kiro chat. / One steering file holds every stage, every color, every line of copy." |
| 2 | `.kiro/specs/`: four specs, each with requirements, design, tasks | "Kiro turned it into four specs. / Each one has requirements, a design and tasks." |
| 3 | `tests/scare-script.test.ts` failing after a stage time is edited | "Change a stage time, / and this test fails. [0.5s] The code can't drift from the script." |
| 4 | `.kiro/hooks/` in Kiro IDE, then a save that runs the checks | "In Kiro IDE, every save runs lint, typecheck and tests." |
| 5 | Kiro CLI running the Chrome DevTools MCP: Chrome opens, the extension loads, Demo mode runs and each stage is checked. Show the Kiro MCP panel, never `.kiro/settings/mcp.json` (it holds an API key). | "And through MCP, / Kiro CLI drives Chrome itself. / It loads the extension and checks every stage." |
| 6 | Kiro chat: the brainstorming thread and the video script draft | "Kiro chat is where it all began. / Brainstorming the idea, and scripting this video." |
| 7 | Kiro web: a README edit or a new idea committed to the repo from the browser | "And when I'm away from my laptop, / Kiro web updates the README, / and jots new ideas straight into the repo." |

Shot 5 must be a real MCP run, recorded live. Speed it up 2-4x in the edit if the run is long.

## Which Kiro tool did what

| Tool | Job in Ghazely |
|---|---|
| Kiro (agent chat) | Initial brainstorming and the video script. Grilled the idea into 10 decisions. Wrote the steering files and the four specs. Built the engine, tests and icon. |
| Kiro IDE | Runs the on-save hooks in `.kiro/hooks/` (checks, effect tests, typecheck). Hosts the Chrome DevTools MCP in `.kiro/settings/mcp.json`. |
| Kiro web | Updates the README and jots new ideas into the repo when away from the laptop. |
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
