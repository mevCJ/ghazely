---
inclusion: always
---

# Tech rules

## Stack

- Chrome Manifest V3 extension.
- TypeScript (strict), Vite with `@crxjs/vite-plugin`.
- Vitest for unit tests. Playwright is not needed. Browser checks go through the Chrome DevTools MCP.
- No UI framework for the overlay. Use plain DOM, SVG, and canvas. The settings page may use plain HTML and TypeScript.
- No remote code. No network calls except an optional health-facts MCP demo that runs only on the developer machine.

## Architecture

- A pure module `src/shared/engine.ts` turns elapsed time into a stage and intensity values. It has no browser APIs. Unit test it.
- The background service worker owns the clock state and rest detection. It stores state in `chrome.storage.local` as `{ baseMs, baseTime, speed, status, snoozes }`.
- Content scripts compute elapsed time locally: `baseMs + (now - baseTime) * speed`. They never poll the background for ticks.
- Effects render in one closed Shadow DOM host element with a very high z-index and `pointer-events: none`. The soft lock turns on pointer events for its own panel only.
- Blur uses a `backdrop-filter` layer, not `filter` on `html`. A filter on `html` breaks `position: fixed` and slows pages.
- Respect `prefers-reduced-motion`: replace flicker and shake with slow fades.

## Performance

- Animate only `opacity` and `transform` where possible.
- One `requestAnimationFrame` loop per page, paused when the tab is hidden.
- Budget: under 4 ms of script per frame on a mid laptop.

## Permissions (keep minimal)

`storage`, `idle`, `alarms`, `tabs` (only for the audible check), host access `<all_urls>` through content scripts. Explain each in the README.

## Testing and checks

- Run `npm run lint`, `npm run typecheck`, `npm test` before any task counts as done.
- Visual stages are checked with the Chrome DevTools MCP: load the extension, open a test page, set demo speed, screenshot every stage.

## Code style

Small files. Named exports. No default exports. No `any`. Comments say why, not what.
