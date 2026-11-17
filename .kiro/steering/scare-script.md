---
inclusion: always
---

# Scare script (single source of truth)

Every spec reads this file. If stage times, colors, or wording change, change them here first. Code must import values from `src/shared/scare-script.ts`, which mirrors this file.

## Stages

Times are minutes of continuous screen time at normal speed. Intensity values go from 0 to 1.

| id | startMin | blur | veins | eyelids | floaters | tunnel | heartbeat | whisper | eye | lock |
|---|---|---|---|---|---|---|---|---|---|---|
| calm | 0 | 0 | 0 | 0 | 0 | 0 | off | off | none | no |
| strain | 20 | 0 | 0 | 0 | 0 | 0 | off | off | none | no |
| dry | 45 | 0 | 0.25 | 0.20 | 0 | 0 | off | faint | none | no |
| haze | 75 | 0 | 0.45 | 0.35 | 0.5 | 0.2 | off | on | peek | no |
| tunnel | 105 | 0.70 | 0.70 | 0.50 | 0.8 | 0.6 | on | on | watch | no |
| lock | 120 | 0.85 | 1.00 | 0.70 | 1.0 | 0.9 | on | on | full | yes |

Between two stages, ease each value linearly so the page never jumps.

Blur starts at `haze`: it is 0 until minute 75, then rises toward `tunnel`.

Blur is capped: at stage `tunnel` or earlier, text must stay barely readable. Only `lock` may exceed 0.7.

## Palette

- Base: gray. `#1a1a1a` shade, `#8a8a8a` fog.
- Danger: sickly red. `#7a1f1f` veins, `#b02a2a` drip.
- Eye white: `#e8e2d8`. Iris: `#5a6b4a`. Never use bright orange.

## Voice

Short. Plain. A little cruel. Never preachy. One line at a time.

## Final screen copy

- Headline: `This is how your eyes feel.`
- Line: `Not permanent. Rest fixes it.`
- Tip: `Every 20 minutes, look 20 feet away for 20 seconds.`
- Source link: American Optometric Association, digital eye strain page.
- Rest countdown: `Rest for {mm:ss}. Then I will go away.`
- Snooze button: `Snooze {n} min ({left} left today)`
- Rest interrupted: `You moved. That did not count.`
- No snoozes left: `No snoozes left today.`
- Pause link: `Pause Ghazely for 1 hour`
- Settings link: `Settings`
- Dialog label for screen readers: `Time to rest your eyes`

## Snooze penalty

Each snooze today cuts the time to the next haunt by 25% and raises all intensities by 0.1 (max 1). The counters reset at local midnight.

## Sound

All sounds are generated or bundled, never taken from the page. Heartbeat starts at 60 bpm in `tunnel` and rises to 90 bpm in `lock`. Whispers are quiet and sparse. Default volume is low. A mute control is always visible once sound starts.
