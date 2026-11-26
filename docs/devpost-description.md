## Inspiration

Most of us have heard of the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Few of us follow it. A break reminder pops up, we dismiss it without thinking, and a few hours later our eyes are sore, dry and blurry.

A reminder is easy to ignore because it only tells you something. You don't feel it. So we asked: what if the screen showed you how your eyes feel? The page would slowly get worse the longer you stare, until a break felt like a relief. Kiroween made the horror part easy to justify. Body horror shows up first, and the Halloween scares come at the end.

## What it does

Ghazely is a Chrome extension that makes every web page slowly rot while you sit and stare. A real rest heals it. The longer you look, the more your screen shows what your eyes feel:

- **The eye:** one large, eerily realistic eye, drawn entirely in code, opens in the middle of the screen. It blinks and watches your cursor.
- **Body horror on the page:** bloodshot veins crawl in from the edges, heavy eyelids droop, and floaters drift over the text.
- **Blur and tunnel vision:** the page blurs and the edges close in, while text stays barely readable until the lock.
- **Red images and video:** images and videos sink into a dark, sickly red.
- **Video distortion:** videos smear and lose their color.
- **Audio distortion:** page audio slows down and slurs.
- **Haunting sounds:** a heartbeat, a ringing tone and whispers rise underneath.
- **Soft lock:** at the end, the eye fills the screen and asks you to rest.
- **Rest heals it:** rest for a while and every effect fades away.

It counts continuous screen time and moves through six stages:

| Stage | Minutes | What you see and hear |
|---|---|---|
| calm | 0 | Nothing |
| strain | 20 | Nothing visible yet. That's the trap. |
| dry | 45 | Bloodshot veins creep in from the edges, heavy eyelids, faint whispers |
| haze | 75 | Blur starts, floaters drift over the text, the vignette closes in, an eye peeks out |
| tunnel | 105 | Tunnel vision, a heartbeat, the eye opens wider and watches |
| lock | 120 | A full-screen, realistic eye that follows your cursor, and a soft lock |

The lock says: *"This is how your eyes feel. Not permanent. Rest fixes it."* It shows the 20-20-20 tip, links to the American Optometric Association page on digital eye strain, and counts down your rest.

A rest means no input and no tab playing sound for a length you choose (5 minutes by default). When you rest, every effect fades away in about half a second.

It is a work tool, not a prison:

- Typing, scrolling and saving are never blocked before the lock.
- A Snooze button appears after 30 seconds, a few times a day. Each snooze brings the next haunt back sooner and stronger.
- You can pause Ghazely for an hour at any time.
- Video calls, payment and banking sites are skipped by default, and the skip list is yours to edit.
- It respects `prefers-reduced-motion` and swaps flicker and shake for slow fades.

For judges, a Demo mode button runs all six stages in 60 seconds. A hidden speed slider (1x to 240x) lets you explore at any pace.

**Honest by design.** Screens cause tired, dry, blurry eyes, and that is temporary. Ghazely never claims screens cause blindness or floaters. The scare is there to get you to rest, and it doesn't lie about the damage.

**Private by design.** No network calls and no remote code. Ghazely never reads, stores or sends page text, keystrokes or URLs. It stores only the clock and your settings.

## How we built it

**Stack:** Chrome Manifest V3, strict TypeScript, Vite with `@crxjs/vite-plugin`, Vitest. No UI framework, just plain DOM, SVG and canvas.

**Architecture:**

- `src/shared/engine.ts` is a pure module. It turns elapsed time into a stage and effect strengths, eased linearly so the page never jumps. It has no browser APIs and is fully unit tested.
- The background service worker owns the clock and rest detection (`chrome.idle` plus a check for audible tabs). It stores `{ baseMs, baseTime, speed, status, snoozes }`.
- Every tab computes elapsed time on its own (`baseMs + (now - baseTime) * speed`), so the worker never ticks. One global clock means every tab shows the same stage.
- All effects draw inside one closed Shadow DOM host with `pointer-events: none`. Only the lock panel takes clicks.
- Blur uses a `backdrop-filter` layer instead of `filter` on `<html>`, which would break `position: fixed` and slow the page down.
- One `requestAnimationFrame` loop per page, paused when the tab is hidden, animating only `opacity` and `transform` where possible.
- The eye is drawn in code on a canvas: sclera, iris, conjunctival veins, lids and skin. It blinks, makes small eye jumps and follows the cursor.
- Sound is our own: a generated heartbeat (60 bpm in tunnel, rising to 90 at the lock), a ringing tone, and bundled whispers. Nothing is captured from the page.

**How we used Kiro.** Kiro shaped the project from the first idea to the final video.

- **Kiro chat to refine the idea.** Before any code, Kiro questioned the concept one question at a time. That produced ten decisions: what counts as a rest, how hard the lock is, which sites are skipped, how honest the final message must be, and that the eye replaces a ghost character.
- **Steering files as one source of truth.** `.kiro/steering/` holds four files: product rules, tech rules, project structure, and the "scare script". The scare script has every stage time, intensity, color and line of copy. Every spec reads it, so the whole product speaks in one voice.
- **A drift test.** `tests/scare-script.test.ts` parses the steering file and fails if the code drifts from it. Change a stage time in the steering file and the build goes red until the code matches.
- **Four specs, built in order.** `decay-engine`, `haunt-effects`, `eye-and-soft-lock`, `settings-and-demo`. Each has requirements, a design and tasks. A task was ticked only after lint, typecheck, tests and a check in real Chrome.
- **Hooks.** `.kiro/hooks/` runs shared checks, effect tests and UI typechecks on save.
- **Chrome DevTools MCP.** Kiro loaded the unpacked extension, set the demo clock, drove the popup and options page, and took screenshots of every stage.
- **Kiro CLI.** We ran it headless with only named tools trusted. It drove Chrome through MCP to record the one-take demo in our video.
- **ElevenLabs MCP.** Kiro CLI generated the voiceover line by line from our demo script, with pauses and tone for each line.
- **Kiro Crew.** A team-lead agent planned the work, built the engine, wrote the demo script, mixed the voice and cut the video with `ffmpeg`.

## Challenges we ran into

- **Blur vs. readability.** Blur is the strongest effect, but a blurry work doc gets the extension uninstalled. The scare script caps blur so text stays barely readable until the lock.
- **Easing vs. hard limits.** The script asked for smooth easing between stages and also a blur cap before the lock. Those two rules clash at the lock boundary. We hold blur at the cap and let a CSS transition smooth the last step.
- **Defining a rest.** `chrome.idle` only sees the mouse and keys, so watching a video looked like resting. We added a check for audible tabs so playing media doesn't count.
- **Protected audio.** Spotify's protected audio can't go through Web Audio, and tab capture needs a click on every tab. We chose our own sounds and kept page media distortion as an optional bonus.
- **Sites with strict security rules.** Some pages block inline styles. The closed Shadow DOM overlay keeps our styles separate from the page.
- **A service worker that can die.** MV3 workers stop at any time. The stored clock is designed so tabs keep the right stage without the worker ticking.
- **Automation inside a sandbox.** Chrome kept failing with `Requesting main frame too early!` under the agent. The cause was Chrome's own sandbox failing inside the agent's sandbox. It took a careful hunt to find, and we only loosened it for test pages.
- **Making a drawn eye not look cheap.** We built the eye prototype first, before anything else, because a flat eye would ruin the final scare.

## Accomplishments that we're proud of

- An eye drawn entirely in code that people find genuinely unsettling. It blinks, makes small eye jumps and watches your cursor.
- The whole scare runs from one steering file, and a test keeps code and copy in step.
- It is honest. It scares you without making false health claims, and it always says rest fixes it.
- It is respectful. It never blocks work before the lock, the lock is always escapable, and sensitive sites are never touched.
- Strict privacy: no network calls, and nothing about the page is stored.
- A pure, tested engine with 140+ unit tests across 17 test files.
- A demo video made with Kiro end to end: the script, the voiceover, the recorded take and the final cut.

## What we learned

- Steering files are most useful when they hold the product's *content*, not just its rules. One scare script kept stages, colors and copy in sync across four specs.
- A test that checks steering against code turns a document into a contract.
- Asking hard questions before writing code saved days. The honesty question changed the ending from a false prophecy to an honest one.
- Make the clock pure and let every tab compute it locally. That avoids most MV3 service worker problems.
- `backdrop-filter` is much safer than `filter` on `<html>` for page-wide effects.
- Agents driving a real browser need the right sandbox setup. Once it works, screenshotting every stage on each change is a strong feedback loop.

## What's next for Ghazely: A break reminder you can't ignore.

- Swap in a real eye video as an optional final layer, keeping the drawn eye as the fallback.
- Test page media distortion on more video sites.
- Daily and weekly stats: time staring, rests taken, snoozes used.
- Gentler skins built on the same decay engine, like a calm "stretch now" theme for people who don't want horror.
- Posture and neck stages, so the page slumps and tilts the longer you sit.
- Firefox and Edge versions, then a Chrome Web Store release.
