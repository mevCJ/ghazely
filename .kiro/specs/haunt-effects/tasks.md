# Haunt effects: tasks

Depends on: `decay-engine` tasks 1 to 7.

- [x] 1. `src/content/overlay-host.ts`: closed Shadow DOM host, adopted stylesheet, fullscreen re-mount. Requirement 1, 13.
- [x] 2. Skip-list check before mounting. Requirement 2. Default list: `meet.google.com`, `zoom.us`, `teams.microsoft.com`, `*.bank*`, `paypal.com`, `stripe.com`, checkout paths. (Matcher done in `host-match.ts`. Skipped pages register no listeners, so a skip-list change applies on next load.)
- [x] 3. `src/content/main.ts`: one rAF loop, local elapsed time, `intensitiesAt`, visibility pause. Requirements 3, 9.
- [x] 4. Blur effect with `backdrop-filter` and the 0.7 cap. Requirements 4, 6.
- [x] 5. Tunnel vision effect.
- [x] 6. Eyelids effect.
- [x] 7. Veins effect (seeded, offscreen canvas, opacity and mask).
- [x] 8. Floaters effect.
- [x] 9. Fade-out on rest in under one second. Requirement 7.
- [x] 10. Reduced-motion path for all effects. Requirement 8. (Not checked live with emulation. Lids and floaters have a path. Blur, tunnel and veins only change slowly and never flicker.)
- [x] 11. Audio module: heartbeat, ringing, whispers, gesture gate, mute control. Requirements 10, 11.
- [x] 12. Browser check with the Chrome DevTools MCP: screenshot each stage on a fixture page. Confirm typing works before `lock`. Requirement 5.
- [x] 13. Bonus: media distortion module. Requirement 12. (Uses CSS filter and playbackRate only, not `createMediaElementSource`. Not tested on a real video.)
- [x] 14. Add a hook: on save in `src/content/effects/`, run the effect unit tests.
