# Eye and soft lock: tasks

Depends on: `decay-engine` and `haunt-effects` tasks 1 to 3.

- [x] 1. Prototype the eye first in a plain HTML page (`src/content/eye/prototype.html`). Sclera, iris, pupil, lids. Judge if it looks real. This is the largest risk. Stop and rethink if it looks cheap. (Passed. See the note below.)
- [x] 2. Move the prototype into `eye.ts` and its part files. Requirements 4, 5.
- [x] 3. Add `eye-state.ts`: blink timer, pupil target with lag, openness by stage. Unit tests.
- [x] 4. Add veins growth and the wet shine. Requirement 5.
- [x] 5. Place the eye for `haze`, `tunnel`, `lock`. Requirements 1, 2, 3. (Checked live at haze, tunnel and lock. Gaze following the cursor and blink were not observed in motion, only unit-tested.)
- [x] 6. `lock-panel.ts`: copy from the scare script, countdown, 30 s Snooze delay, Pause and Settings links. Requirements 6, 7, 9, 11, 15. (Checked live. The Settings link sends `openOptions`, which does nothing until the options page exists.)
- [x] 7. Wire Snooze and Pause messages to the worker. Requirement 8. (Checked live: Snooze moved the clock to 110 min and count 1. Pause set status `paused` and a 60 min alarm; the alarm resumed it. `pause` now takes optional `minutes`.)
- [x] 8. Rest countdown that resets on movement. Requirement 10. (Page-local: the countdown counts input-free time on this page, reset by pointer move, key, click, wheel and touch. The worker still starts the real rest through `chrome.idle`. Another tab being active is not seen here. Checked live: a hover reset it and showed the message.)
- [x] 9. Focus trap, `role="dialog"`, labels. Requirement 13. (Checked live with the a11y snapshot: modal dialog with a label, heading, Tab and Shift+Tab wrap through link, buttons and Mute. Focus returned to the textarea after the lock ended.)
- [x] 10. Reduced-motion path. Requirement 14. (The panel only fades. The eye blink and gaze changes are unit-tested. Rendered once under reduced-motion emulation on a 390x800 viewport; the panel fit. Blink rate and gaze drift under emulation were not measured.)
- [x] 11. Browser check with the DevTools MCP: screenshot each stage, test Snooze, test no-snooze-left. (Screenshots of haze, tunnel and lock, Snooze, no-snooze-left, Pause, rest fade, Tab trap, focus return and a narrow viewport. Calm, strain and dry have no eye and were not re-shot here. Sound and real mouse-following gaze were not checked.)
- [ ] 12. Bonus: `video-eye.ts` with a bundled clip and fallback. Requirement 12. Only after tasks 1 to 11 pass.

## Prototype notes
- Build and view: `node scripts/build-prototype.mjs`, serve the repo root (`python3 -m http.server`), open `src/content/eye/prototype.html`. The generated `prototype.js` is git-ignored.
- Verdict after three passes: it reads as a real, bloodshot eye, and the half-lidded small-pupil look is unsettling. It is a stylized render, not a photo. A frame costs about 0.7 ms.
- Weakest parts: the corneal glint still looks a bit like a sticker, and the skin is flat.
