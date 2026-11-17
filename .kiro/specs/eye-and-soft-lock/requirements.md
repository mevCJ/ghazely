# Eye and soft lock: requirements

The final stage: a realistic eye fills the screen and asks for a rest. Reads `.kiro/steering/scare-script.md`.

## User story

As a person who has sat too long, I want a clear, hard-to-ignore break prompt that still lets me snooze, so that I rest without losing control.

## Acceptance criteria (EARS)

1. WHEN the stage is `haze`, THE overlay SHALL show the eye peeking from a screen corner.
2. WHEN the stage is `tunnel`, THE eye SHALL watch from the dark, larger and more open.
3. WHEN the stage is `lock`, THE overlay SHALL show the eye full screen and enable pointer events on its own panel.
4. WHILE the eye is visible, THE pupil SHALL follow the cursor with a small lag.
5. THE eye SHALL blink at random gaps and show veins that match the stage.
6. WHEN the stage is `lock`, THE panel SHALL show the headline, the line, the tip, the source link, and the rest countdown from the scare script.
7. WHEN 30 seconds pass in `lock` and snoozes are left today, THE panel SHALL show the Snooze button with the remaining count.
8. WHEN the user presses Snooze, THE service worker SHALL apply the snooze and the overlay SHALL return to the stage `tunnel` look.
9. WHEN no snoozes are left, THE panel SHALL show no Snooze button and SHALL keep the rest countdown.
10. WHEN the user rests for the rest length, THE eye SHALL close slowly and the overlay SHALL fade out.
11. THE panel SHALL always include a "Pause Ghazely" link that pauses for one hour and a link to settings.
12. WHERE a real eye video file is bundled and the setting allows it, THE eye SHALL use the video in place of the drawn eye. IF the video fails to load, THEN THE drawn eye SHALL show.
13. THE panel SHALL be readable with a screen reader (labels, focus order, `role="dialog"`).
14. WHERE `prefers-reduced-motion` is set, THE eye SHALL blink less and skip fast pupil motion.
15. THE source link SHALL open in a new tab with `rel="noopener noreferrer"`.

## Out of scope

Hard lock. Camera. A talking character.
