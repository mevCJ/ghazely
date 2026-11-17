# Ghazely

A Chrome extension (Manifest V3) that makes web pages slowly rot while you sit and stare. A real rest heals them.

Built for Kiroween. It is a work tool: it pushes a break, and you can snooze, pause, or skip any site.

## What it does

The longer you sit, the worse the page looks. Stages come from continuous screen time:

| Stage | Minutes | What you see |
|---|---|---|
| calm | 0 | Nothing |
| strain | 20 | Nothing visible yet |
| dry | 45 | Veins at the edges, heavy eyelids, faint whispers |
| haze | 75 | Blur starts and grows, floaters, a dark vignette, a half-shut eye in the middle of the screen |
| tunnel | 105 | Heartbeat, the eye opens wider |
| lock | 120 | A full-screen eye and a soft lock panel |

The effects do not fade in. The whole overlay blinks on and off every 10 seconds. It is on for 15% of each cycle at first, and that share grows until it stays on at the lock. All tabs blink together.

The values are in `.kiro/steering/scare-script.md` and mirrored in `src/shared/scare-script.ts`. A test fails if they drift apart.

At the lock, the panel says `This is how your eyes feel.` and `Not permanent. Rest fixes it.`, with the 20-20-20 tip and a link to the American Optometric Association page on digital eye strain. A snooze button appears after 30 seconds, until the daily limit is used up. Each snooze brings the next haunt back sooner and stronger.

A rest is no input and no audible tab for the rest length you set (default 5 minutes). A rest clears every effect with a fade of about half a second.

The health claims stay modest: screens cause tired, dry, blurry eyes, and that is temporary.

## Install and run

```
npm install
npm run build
```

Open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and pick the `dist` folder.

A rebuild replaces `dist`, and Chrome can drop the extension when that happens. If it disappears, load `dist` again.

Other commands:

```
npm run lint
npm run typecheck
npm test
```

## Demo for judges

- Open the popup and press Demo mode. It runs calm to lock in 60 seconds (120x speed), holds the lock for 20 more seconds, and ends by itself. While it runs, the lock panel shows Snooze after 5 seconds instead of 30. A "Demo speed" badge shows in the popup whenever the clock is not at normal speed.
- The options page has a hidden speed slider (1x to 240x). Click the version text five times in a row to show it.
- Stop demo in the popup returns to normal speed and a fresh clock.

## Settings

Open them from the popup or from the lock panel. They are saved as you type.

- Rest length (at least 15 seconds), snoozes per day, snooze length.
- Sound and media distortion switches.
- The skip list: hosts Ghazely never touches. `*` is a wildcard. The defaults cover video calls, payment, and banking. Changes reach a page that is already open after it reloads.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Keeps the clock (`chrome.storage.local`) and your settings (`chrome.storage.sync`). |
| `idle` | Detects that you have stopped using the computer, which is how a rest is found. |
| `alarms` | Wakes the background worker for the midnight snooze reset, the pause timer, the demo end, and a re-check while a tab is playing sound. |
| `tabs` | Used for one thing: asking whether any tab is playing sound. A rest does not count while one is. Ghazely never reads tab URLs or titles. |
| `web_accessible_resources` (not a permission) | Lets the content script load the bundled whisper clip `sfx/whisper.mp3`. It uses a per-session address, so a page cannot probe for the extension by requesting the file. |
| Content script on all sites | Draws the overlay on every page. It runs in the page only to draw, and skips hosts on the skip list. |

## Privacy

- It never reads, stores, or sends page text, keystrokes, or URLs.
- What is stored: the clock (elapsed time, speed, status, today's snooze count) and your settings. The skip list holds host patterns you typed or the defaults.
- The page's host name is compared with the skip list on your device and is not saved.
- While the lock panel is up, the page notes only the time of the last input, to run the rest countdown. It does not record what the input was.
- There are no network calls and no remote code. The heartbeat and ring are generated in the browser. Whispers play a clip bundled with the extension (`public/sfx/whisper.mp3`), with a generated whisper as a fallback. Nothing is taken from the page.
- Distorting page `<video>` and `<audio>` is off by default. It changes the playback speed and a CSS filter on the element. It does not capture audio.

## Safety rules the code follows

- Typing, scrolling, and saving are never blocked before the lock.
- The lock is soft: Snooze shows after 30 seconds while snoozes remain, and Pause is always there.
- Skip-listed pages are never touched, and effects are removed in under a second when you rest or pause.
- Motion is replaced with slow fades when `prefers-reduced-motion` is set.

## How it is built

- TypeScript (strict), Vite with `@crxjs/vite-plugin`, Vitest. Plain DOM, SVG, and canvas. No UI framework.
- `src/shared/engine.ts` turns elapsed time into a stage and effect strengths. It has no browser APIs and is unit tested.
- The background worker owns the clock and rest detection. Pages compute elapsed time themselves from the stored clock, so the worker never ticks.
- Effects draw in one closed Shadow DOM host. Blur uses a `backdrop-filter` layer, so `position: fixed` on the page keeps working.
- The eye is drawn on a canvas in code, with no image or video.

```
src/shared/      engine, scare script, storage, settings, messages
src/background/  service worker, rest detector
src/content/     overlay, effects, eye, audio, lock panel
src/options/     settings page
src/popup/       status, pause, reset, demo
tests/           unit tests, named after the source files
```

## Built with Kiro

- Steering files in `.kiro/steering/` hold the product rules, the scare script, the tech rules, and the structure.
- Four specs in `.kiro/specs/` (decay-engine, haunt-effects, eye-and-soft-lock, settings-and-demo) were built in that order, with every task ticked only after lint, typecheck, tests, and a check in a real Chrome.
- Hooks in `.kiro/hooks/` run checks on save. Their file format was written from memory and has not been confirmed in the IDE.
- The Chrome DevTools MCP loaded the extension, set the clock, took screenshots of each stage, and drove the popup and options page.

## Known gaps

- The real eye video is not built. The drawn eye always shows.
- Sound was checked only through Chrome's audible flag. I did not listen to it.
- Media distortion has not been tried on a real video.
- A real kill of the service worker was never observed. The state design is meant to survive one, and `docs/worker-restart-check.md` says how to check.
- The countdown in the lock panel counts quiet time on that page. Activity in another tab is not seen by it, although the worker still decides when a rest has really started.
- Blinking and cursor-following were checked by unit tests, not watched in motion.
- Demo mode does not reset today's snooze count, so earlier snoozes make the demo harsher.
- The eye's glint and the skin around it are the weakest parts of the drawing.
