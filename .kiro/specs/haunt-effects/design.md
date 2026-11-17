# Haunt effects: design

## Overlay layers (bottom to top)

| Layer | Tech | Effect |
|---|---|---|
| Blur | a `div` with `backdrop-filter: blur(px)` | Page blur. Max px set by intensity. |
| Tunnel | radial-gradient `div` | Dark edges close in |
| Veins | canvas, drawn once per stage and faded by opacity | Red branches from edges |
| Floaters | SVG shapes with slow `transform` drift | Specks and strands |
| Eyelids | two `div`s moved with `transform: translateY` | Close from top and bottom |
| Controls | small panel, `pointer-events: auto` | Mute button |

All layers live in one Shadow DOM host. Styles go in one `adoptedStyleSheets` sheet, so strict page security rules do not block them.

## Module contract

```ts
export type Effect = {
  id: string;
  mount(root: ShadowRoot): void;
  update(i: Intensities, dtMs: number): void;
  unmount(): void;
};
```

`src/content/main.ts` builds the list, runs one `requestAnimationFrame` loop, computes elapsed time from `ClockState`, calls `intensitiesAt`, and passes the result to every effect.

## Veins

Generate branch paths once per page load from a seeded random. Draw them to an offscreen canvas at the highest intensity. Show them by changing opacity and a mask size. This keeps frame cost low.

## Audio

- `src/content/audio/` uses the Web Audio API. A heartbeat is two low sine thumps with an envelope. Ringing is a quiet 4 to 8 kHz sine with slow gain. Whispers are filtered noise bursts, sparse.
- Start the audio context only after a user gesture on the page. Until then, keep sound off and show a small "enable sound" control. Chrome blocks audio without a gesture.

## Media distortion (bonus)

- Find `<video>` and `<audio>` elements with a `MutationObserver`.
- Add CSS filters on video (`saturate`, `hue-rotate`, `contrast`, small `blur`).
- For audio, use `createMediaElementSource` plus a `BiquadFilter` and `playbackRate`. If the context outputs silence on protected media, restore the element and stop trying for that element.

## Reduced motion

A single flag from `matchMedia`. Effects read it and pick a calmer path.

## Risks

- Pages with their own top-level z-index wars. Use `2147483647` and test on YouTube, Gmail, Docs.
- Fullscreen video hides the overlay. Accept this. Mount the overlay inside `document.fullscreenElement` when present.

## Test plan

- Unit: each effect's `update` sets the right style values for given intensities.
- Browser: Chrome DevTools MCP loads the extension, opens a fixture page, sets speed to 120, and screenshots every stage.
- Check that typing in a text field works at every stage before `lock`.
