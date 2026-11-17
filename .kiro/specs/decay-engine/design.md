# Decay engine: design

## Parts

| Part | File | Job |
|---|---|---|
| Engine | `src/shared/engine.ts` | Pure functions: `stageAt`, `intensitiesAt`, `applySnooze` |
| Script data | `src/shared/scare-script.ts` | Stage table, copy, palette. Mirrors the steering file. |
| State store | `src/shared/storage.ts` | Typed read and write of `ClockState` in `chrome.storage.local` |
| Rest detector | `src/background/rest-detector.ts` | `chrome.idle` plus audible-tab check |
| Worker | `src/background/service-worker.ts` | Owns the state. Handles messages from popup and content. |

## State

```ts
type ClockState = {
  baseMs: number;      // elapsed ms at baseTime, in scaled time
  baseTime: number;    // Date.now() when baseMs was set
  speed: number;       // 1 normally, up to 120 in demo
  status: 'active' | 'resting' | 'paused';
  snoozesToday: number;
  snoozeDay: string;   // YYYY-MM-DD, local
  restSeconds: number; // user setting
};
```

Elapsed at any moment: `baseMs + (now - baseTime) * speed` while `active`. Content scripts compute this locally. The worker only rewrites the state on changes (rest, snooze, speed, pause), never on a timer.

## Engine API

```ts
stageAt(elapsedMin: number): StageId
intensitiesAt(elapsedMin: number, penalty: number): Intensities
applySnooze(state: ClockState, snoozeMin: number): ClockState
```

`penalty` is `snoozesToday * 0.1`, added to every intensity and clamped to 1.

## Rest detection

1. Call `chrome.idle.setDetectionInterval(restSeconds)`. Chrome's minimum is 15 seconds.
2. On `idle` or `locked`, query `chrome.tabs.query({ audible: true })`.
3. If any tab is audible, do nothing. Check again on `chrome.alarms` every 30 seconds.
4. Otherwise set `status = 'resting'`, `baseMs = 0`.
5. On `active`, set `status = 'active'` and `baseTime = now`.

Playing silent video is not detected. Accept this and note it in the README.

## Why this design

No tick loop in the worker. MV3 workers sleep, and a timer would be killed. A base time plus a speed survives sleep and makes the demo slider trivial.

## Test plan

- Engine: table tests at every stage start, midpoints, and past 120 min.
- Snooze: penalty rises, clamps to 1, resets on a new day.
- Rest detector: fake `chrome.idle` and `chrome.tabs`. Audible tab blocks rest.
- Clock: speed change keeps elapsed value.
