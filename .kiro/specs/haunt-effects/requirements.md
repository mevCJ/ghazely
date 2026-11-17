# Haunt effects: requirements

The page effects that grow with each stage. Reads `.kiro/steering/scare-script.md`.

## User story

As a person who sits too long, I want the page to feel worse the longer I sit, so that I feel the cost of not resting.

## Acceptance criteria (EARS)

1. WHEN a page loads and the host is not on the skip list, THE content script SHALL mount one closed Shadow DOM overlay host.
2. WHEN the host is on the skip list, THE content script SHALL mount nothing and add no listeners.
3. WHEN the stage changes or time passes, THE overlay SHALL update every effect to the interpolated intensity from the engine.
4. THE overlay SHALL render these effects: blur, bloodshot veins from the screen edges, eyelids closing from top and bottom, floaters, tunnel vision.
5. WHILE the stage is before `lock`, THE overlay SHALL set `pointer-events: none` so typing, clicking, and scrolling pass through.
6. WHILE the stage is `tunnel` or earlier, THE blur SHALL keep page text barely readable (blur intensity at most 0.7).
7. WHEN the status becomes `resting`, THE overlay SHALL fade every effect out in under one second.
8. WHERE the user sets `prefers-reduced-motion`, THE overlay SHALL use slow fades instead of flicker, shake, and fast floaters.
9. WHEN the tab is hidden, THE overlay SHALL pause its animation loop.
10. WHEN the stage reaches `dry`, THE audio module SHALL play a faint whisper. WHEN the stage reaches `tunnel`, THE audio module SHALL start the heartbeat.
11. WHEN sound starts, THE overlay SHALL show a mute control that stays visible.
12. WHERE the page has a `<video>` or `<audio>` element and the bonus is on, THE media module SHALL apply a pitch and filter change by stage. IF the media is protected and silent, THEN THE module SHALL skip it without errors.
13. THE overlay SHALL not read or send any page text, URL, or input.

## Out of scope

Tab capture. Blood on every element. Cursor trail.
