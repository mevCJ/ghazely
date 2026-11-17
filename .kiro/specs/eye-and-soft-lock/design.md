# Eye and soft lock: design

## Parts

| Part | File | Job |
|---|---|---|
| Eye renderer | `src/content/eye/eye.ts` | Draws the eye on a canvas, 2D |
| Eye parts | `src/content/eye/sclera.ts`, `iris.ts`, `veins.ts`, `lids.ts` | Separate draw functions |
| Eye state | `src/content/eye/eye-state.ts` | Openness, pupil target, blink timer, redness |
| Lock panel | `src/content/lock-panel.ts` | Text, buttons, countdown |
| Video eye (bonus) | `src/content/eye/video-eye.ts` | Plays bundled clip, falls back to drawn eye |

## Eye drawing

Layers on one canvas, back to front:
1. Sclera: off-white `#e8e2d8` with a soft radial shade at the corners.
2. Veins: red branches from the corners, count and thickness grow with `veins` intensity.
3. Iris: radial gradient of `#5a6b4a` with fiber lines, a dark limbal ring, and a highlight.
4. Pupil: black circle. It follows the cursor (max offset about 25% of the iris radius). It shrinks as the stage rises, which looks more unsettling.
5. Lids: top and bottom curves. Openness comes from the stage. Add lid shadow and eyelash strokes.
6. Wet shine: small white specular spots and a thin tear line on the bottom lid.

## Eye placement by stage

| Stage | Eye | Size | Openness |
|---|---|---|---|
| `haze` | Center | 90% | 0.3 |
| `tunnel` | Center | 90% | 0.6 |
| `lock` | Center, full strength | 90% | 1.0, with slow blinks |

## Lock panel

- Sits below the eye, centered, over a dark gradient.
- Elements in order: headline, line, tip, source link, countdown, Snooze button (after 30 s), Pause link, Settings link.
- Focus moves to the panel when `lock` starts and returns to the page when it ends. Trap focus inside the panel while visible.
- Do not remove or change the page's own DOM. The overlay only sits on top.

## Snooze and pause

Messages to the worker: `{ type: 'snooze' }` and `{ type: 'pause', minutes: 60 }`. The worker answers by writing a new `ClockState`. The panel reacts to the state change; it keeps no state of its own.

## Rest countdown

Counts the remaining rest seconds. It shows only after the worker confirms `idle`. If the user moves the mouse, the countdown resets and the panel says the rest did not count. That is the "force" part.

## Honest copy

Use the exact strings from the scare script. Do not add other health claims.

## Test plan

- Unit: eye-state blink timing, pupil clamp, openness by stage.
- Browser: DevTools MCP screenshot of each eye stage. Move the mouse and check the pupil.
- Check focus trap and Tab order. Check the 30-second Snooze delay at speed 1 (the delay does not scale with speed).
- Check that no snooze is shown after the limit.
