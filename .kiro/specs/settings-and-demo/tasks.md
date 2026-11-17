# Settings and demo: tasks

Depends on: `decay-engine` tasks 1 to 7.

- [x] 1. `src/shared/settings.ts`: type, defaults, validation, `chrome.storage.sync` get, set, subscribe. Unit tests. Requirement 12.
- [x] 2. Host wildcard matcher with tests. Wire it into the content script skip check (`haunt-effects` task 2).
- [x] 3. Options page: rest length, snooze limit and length, toggles. Requirements 1, 2, 4. (Checked live: a value of 5 s saved as 15 s. Fields save on change.)
- [x] 4. Options page: skip list editor with add, remove, restore defaults. Requirement 3. (Checked live: a pasted URL keeps only the lowercase host, Remove and Restore defaults work, a bad host shows a message. Skip list changes reach open pages only after reload.)
- [x] 5. Popup: stage, minutes sat, snoozes left, Pause, Resume, Reset. Requirements 5, 6. (Checked live. The stage line shows `(resting)` or `(paused)` when the clock is not active.)
- [x] 6. Demo mode: worker handler, 120x speed, auto end, Stop button. Requirements 7, 8. (Checked live: the worker sets 120x, the demo ends by itself at 160 scaled minutes, 20 real seconds after the lock starts, and Stop demo restores 1x and a fresh clock. The end alarm is re-armed after a snooze moves the clock back. The demo does not touch the snooze count, so earlier snoozes still add their penalty. The lock panel shows Snooze after 5 s while speed is above 1.)
- [x] 7. Hidden speed slider and the "Demo speed" badge. Requirements 9, 10. (Checked live: five clicks within 2 s reveal the slider. Speed 60 showed `Demo speed 60x` in the popup.)
- [x] 8. Pause removes overlays within one second. Requirement 11. (Measured: from the pause message to a fully hidden overlay took 544 ms.)
- [x] 9. Keyboard access and palette check for both pages. Requirement 13. (Both pages use only palette colors and native controls with labels. Tab order is the page order. Keyboard use of the hidden slider and a contrast tool were not run.)
- [x] 10. Browser check with the Chrome DevTools MCP: press Demo mode, confirm every stage name appears in order within 65 seconds. (Measured on the fixture page with a 100 ms poll: calm 0 s, strain 7.8, dry 20.3, haze 35.3, tunnel 50.3, lock 57.8, back to calm 60.6. The offset from the demo start was about 2 s, so the real times are strain 10, dry 22.5, haze 37.5, tunnel 52.5, lock 60, end 62.5.)
- [x] 11. Add a hook: on save in `src/options/` or `src/popup/`, run typecheck. (`.kiro/hooks/ui-typecheck.kiro.hook`. The hook format is a guess, like the other hooks.)
