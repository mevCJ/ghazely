import { describe, expect, it } from 'vitest';
import { PALETTE, STAGES } from '../src/shared/scare-script';
// ?raw avoids needing Node typings in a browser-extension project.
import steering from '../.kiro/steering/scare-script.md?raw';

// The steering file is the source of truth. This fails when the code drifts from it.

const rows = steering
  .split('\n')
  .filter((l) => /^\|\s*(calm|strain|dry|haze|tunnel|lock)\s*\|/.test(l))
  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));

describe('scare script matches the steering file', () => {
  it('has the same stages in the same order', () => {
    expect(rows.map((r) => r[0])).toEqual(STAGES.map((s) => s.id));
  });

  it.each(STAGES.map((s, i) => [s, rows[i]] as const))('stage %# values match', (stage, row) => {
    expect(row).toBeDefined();
    const [, start, blur, veins, eyelids, floaters, tunnel, heartbeat, whisper, eye, lock] =
      row as string[];
    expect(stage.startMin).toBe(Number(start));
    expect(stage.levels).toEqual({
      blur: Number(blur),
      veins: Number(veins),
      eyelids: Number(eyelids),
      floaters: Number(floaters),
      tunnel: Number(tunnel),
    });
    expect(stage.heartbeat).toBe(heartbeat === 'on');
    expect(stage.whisper).toBe(whisper);
    expect(stage.eye).toBe(eye);
    expect(stage.lock).toBe(lock === 'yes');
  });

  it('uses the palette colors from the steering file', () => {
    for (const hex of Object.values(PALETTE)) expect(steering).toContain(hex);
  });
});
