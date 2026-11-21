import { describe, expect, it } from 'vitest';
import { STAGE_ART } from '../src/popup/stage-art';
import { STAGES } from '../src/shared/scare-script';

describe('stage art', () => {
  const art = STAGES.map((s) => STAGE_ART[s.id]);

  it('has a picture for every stage', () => {
    expect(art.every(Boolean)).toBe(true);
  });

  it('gets worse as the stages go on', () => {
    for (const key of ['veins', 'floaters', 'dark', 'bags'] as const) {
      const values = art.map((a) => a[key]);
      expect(values).toEqual([...values].sort((x, y) => x - y));
    }
    const pupils = art.map((a) => a.pupil);
    expect(pupils).toEqual([...pupils].sort((x, y) => y - x));
  });

  it('starts clean', () => {
    expect(STAGE_ART.calm).toMatchObject({ veins: 0, floaters: 0, dark: 0, bags: 0 });
  });
});
