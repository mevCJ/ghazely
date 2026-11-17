# Settings and demo: design

## Settings shape

```ts
type Settings = {
  restSeconds: number;      // default 300
  snoozeLimit: number;      // default 3
  snoozeMinutes: number;    // default 10
  skipList: string[];       // host patterns
  sound: boolean;           // default true
  mediaDistortion: boolean; // default false (bonus)
  videoEye: boolean;        // default false (bonus)
};
```

Stored in `chrome.storage.sync`. A `settings.ts` module in `src/shared/` validates and fills defaults. Bad values fall back to defaults.

## Pages

| Page | File | Content |
|---|---|---|
| Options | `src/options/options.html`, `options.ts` | Form for all settings, skip list editor, hidden speed slider |
| Popup | `src/popup/popup.html`, `popup.ts` | Stage name, minutes sat, snoozes left, buttons |

Both use plain HTML and TypeScript. Style them in the Ghazely palette: dark gray, sickly red accents.

## Demo mode

Speed for a 60 second run: `120 min * 60 s/min / 60 s = 120x`. The worker sets `speed = 120`, `baseMs = 0`, `baseTime = now`. Demo ends when elapsed passes 160 minutes of scaled time (the lock stays up for 20 real seconds so it can be read and Snooze is visible), or on Stop. Then it sets `speed = 1` and resets.

The Snooze 30 second delay and the rest countdown use real time, not scaled time. In Demo mode the lock panel shows the Snooze button after 5 seconds, so the video stays short. Mark this in the code as a demo-only exception.

## Hidden slider

Click the version text 5 times to show it. The slider sets `speed` in the worker. The badge in the popup shows the current speed whenever it is not 1.

## Skip list matching

Match on `location.hostname` with simple `*` wildcards. Do not read the path or the query. Default patterns live in `scare-script.ts` next to the other defaults, and the options page can restore them.

Note: checkout path detection (`/checkout`) would need the path. Skip it. Keep host-only matching to respect the no-URL-storage rule.

## Test plan

- Unit: settings validation, wildcard matching, demo speed math.
- Browser: DevTools MCP opens the popup, presses Demo mode, and checks the stage names appear in order within 65 seconds.
- Check that pausing removes the overlay.
