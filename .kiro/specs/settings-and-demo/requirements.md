# Settings and demo: requirements

User controls, a popup, and the demo tools for judges. Reads `.kiro/steering/product.md`.

## User story

As a user, I want to control when and where Ghazely acts. As a judge, I want to see every stage in a minute.

## Acceptance criteria (EARS)

1. THE options page SHALL let the user set the rest length (default 5 minutes, minimum 15 seconds).
2. THE options page SHALL let the user set the daily snooze limit (default 3) and the snooze length (default 10 minutes).
3. THE options page SHALL show the skip list, let the user add or remove hosts, and restore the defaults.
4. THE options page SHALL let the user turn sound, media distortion, and the real eye video on or off.
5. WHEN the user opens the popup, THE popup SHALL show the current stage name, minutes sat, and snoozes left.
6. THE popup SHALL have Pause (1 hour), Resume, Reset clock, and Demo mode buttons.
7. WHEN the user presses Demo mode, THE worker SHALL set the speed so that stage `calm` to `lock` takes 60 seconds, and reset the clock to zero.
8. WHEN Demo mode ends or the user presses Stop demo, THE worker SHALL return the speed to 1 and reset the clock.
9. THE options page SHALL have a hidden speed slider (revealed by clicking the version number 5 times) from 1x to 240x.
10. WHILE Demo mode or a speed above 1 is on, THE popup SHALL show a visible "Demo speed" badge so it is never on by accident.
11. WHEN the user turns Ghazely off, THE worker SHALL set status `paused` and every content script SHALL unmount its overlay within one second.
12. THE settings SHALL be saved in `chrome.storage.sync` so they follow the user. THE clock state SHALL stay in `chrome.storage.local`.
13. THE options page and popup SHALL be keyboard accessible and use the palette from the scare script.

## Out of scope

Accounts. Cloud sync beyond `chrome.storage.sync`. Analytics.
