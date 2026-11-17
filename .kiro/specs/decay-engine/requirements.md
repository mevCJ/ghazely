# Decay engine: requirements

Counts continuous screen time, detects rest, and turns time into a stage. Reads `.kiro/steering/scare-script.md`.

## User story

As a person who works at a screen for hours, I want Ghazely to track how long I have sat, so that the page can warn me and heal when I rest.

## Acceptance criteria (EARS)

1. WHEN the browser is in use and not resting, THE engine SHALL add real elapsed time, multiplied by the speed setting, to the sitting clock.
2. WHEN given an elapsed time in minutes, THE engine SHALL return the current stage id and an interpolated intensity value for every effect in the scare script.
3. WHEN the elapsed time falls between two stages, THE engine SHALL ease each value linearly between them.
4. WHEN the user has no input and no tab is playing audio for the rest length, THE service worker SHALL mark the status as `resting`.
5. WHEN the status becomes `resting`, THE service worker SHALL reset the sitting clock to zero and keep the snooze counters.
6. WHEN the screen is locked, THE service worker SHALL treat it as a rest.
7. WHEN a tab is audible, THE service worker SHALL NOT count the idle time as a rest.
8. WHEN the user snoozes, THE service worker SHALL set the clock back by the snooze length and raise the snooze penalty as the scare script says.
9. WHEN the local date changes, THE service worker SHALL reset the daily snooze count.
10. WHEN the service worker restarts, THE clock SHALL continue from `chrome.storage.local` without losing more than one second.
11. THE engine SHALL contain no browser API calls.
12. WHEN the speed setting changes, THE clock SHALL keep its current elapsed value and use the new speed from that moment.

## Out of scope

Camera or posture detection. Per-site clocks.
