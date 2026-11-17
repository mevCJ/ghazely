# Decay engine: tasks

- [x] 1. Scaffold the project: Vite, `@crxjs/vite-plugin`, TypeScript strict, Vitest, lint, `manifest.config.ts` with the minimal permissions from `tech.md`.
- [x] 2. Write `src/shared/scare-script.ts` from the steering table. Add a test that fails if the table and file drift (parse the markdown table).
- [x] 3. Write `src/shared/engine.ts` with `stageAt`, `intensitiesAt`, `applySnooze`. Cover requirements 2, 3, 8, 11.
- [x] 4. Write engine table tests for every stage start, midpoints, and past 120 min.
- [x] 5. Write `src/shared/storage.ts` with typed `ClockState` get, set, and change subscription.
- [x] 6. Write `src/background/rest-detector.ts`. Cover requirements 4, 5, 6, 7. Test with fakes.
- [x] 7. Write `src/background/service-worker.ts`: init state, message handlers (`snooze`, `pause`, `setSpeed`, `reset`), daily reset (requirement 9).
- [x] 8. Check requirement 10 by stopping and waking the worker. Record the check in `docs/`. (Live checks pass. A real worker kill was not observed. See the doc.)
- [x] 9. Add a hook that runs `npm run typecheck && npm test` when a file in `src/shared/` is saved.
