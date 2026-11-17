---
inclusion: always
---

# Project structure

```
Ghazely/
  .kiro/
    steering/      product.md, scare-script.md, tech.md, structure.md
    specs/         decay-engine, haunt-effects, eye-and-soft-lock, settings-and-demo
    hooks/         on-save checks
    settings/      mcp.json
  docs/            idea-summary.md, write-up notes
  src/
    shared/        engine.ts, scare-script.ts, storage.ts, types.ts
    background/    service-worker.ts, rest-detector.ts
    content/       main.ts, overlay-host.ts, effects/, eye/, audio/, media-distort.ts
    options/       options.html, options.ts
    popup/         popup.html, popup.ts (status, snooze, pause, demo button)
  tests/           engine.test.ts, rest-detector.test.ts, ...
  manifest.config.ts
```

## Naming

- Effect modules live in `src/content/effects/` and export `{ id, mount, update(intensities), unmount }`.
- Tests mirror source file names.

## Build order (match the specs)

1. `decay-engine`
2. `haunt-effects`
3. `eye-and-soft-lock`
4. `settings-and-demo`
