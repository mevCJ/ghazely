# Worker restart check (decay-engine requirement 10)

Date: 2026-11-15. Method: unpacked `dist/` loaded through the Chrome DevTools MCP.

## Why it should hold
The worker keeps no clock in memory. Every change reads `chrome.storage.local`, applies a pure function from `engine.ts`, and writes back. Content scripts compute elapsed time from `baseMs`, `baseTime` and `speed`. A killed worker loses nothing.

## What was checked
- `snooze` set the clock to 115 min (120 minus 5) and raised the count to 1.
- `setSpeed` 120 kept elapsed time (6,900,000 to 6,900,005 ms). Speed 9999 was rejected.
- `pause` froze `baseMs`. `resume` and `reset` worked.
- A stored day of `2020-01-01` rolled over to today with count 0 on the next message.
- After 102 s at speed 120, `baseMs` was 0 + 102.375 s x 120 = 12,285,000 ms, as the formula says.

## Not proven
The MCP keeps a debugger attached to the worker, so Chrome did not stop it (a global marker survived 75 s of idle). A real kill was not observed. To check by hand: open `chrome://extensions`, click "service worker" under Ghazely, wait for it to go inactive (or use chrome://serviceworker-internals, Stop), send a message, and confirm `clock` still advances from the stored values.

The idle and locked paths are covered by fakes in `tests/rest-detector.test.ts`, not by a live idle event.
