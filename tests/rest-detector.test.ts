import { describe, expect, it, vi } from 'vitest';
import {
  createRestDetector,
  type IdleState,
  type RestPlatform,
} from '../src/background/rest-detector';
import { MIN_REST_SECONDS } from '../src/shared/settings';

const setup = (audible = false, restSeconds = 300) => {
  let emit: (s: IdleState) => void = () => undefined;
  const state = { audible, idle: 'idle' as IdleState };
  const platform: RestPlatform = {
    setDetectionInterval: vi.fn(),
    onIdleChanged: (l) => {
      emit = l;
    },
    queryIdle: vi.fn(async () => state.idle),
    hasAudibleTab: vi.fn(async () => state.audible),
    startRecheck: vi.fn(),
    stopRecheck: vi.fn(),
  };
  const onRest = vi.fn();
  const onActive = vi.fn();
  const detector = createRestDetector({ platform, restSeconds, onRest, onActive });
  const fire = async (s: IdleState): Promise<void> => {
    emit(s);
    await new Promise((r) => setTimeout(r, 0));
  };
  return { platform, onRest, onActive, detector, fire, state };
};

describe('rest detector', () => {
  it('sets the idle interval to the rest length', () => {
    expect(setup().platform.setDetectionInterval).toHaveBeenCalledWith(300);
  });

  it('raises short rest lengths to the Chrome minimum', () => {
    expect(setup(false, 5).platform.setDetectionInterval).toHaveBeenCalledWith(MIN_REST_SECONDS);
  });

  it('applies a new rest length live', () => {
    const t = setup();
    t.detector.setRestSeconds(90);
    expect(t.platform.setDetectionInterval).toHaveBeenLastCalledWith(90);
  });

  it('rests when idle and nothing is audible', async () => {
    const t = setup();
    await t.fire('idle');
    expect(t.onRest).toHaveBeenCalledOnce();
  });

  it('treats a locked screen as a rest', async () => {
    const t = setup();
    await t.fire('locked');
    expect(t.onRest).toHaveBeenCalledOnce();
  });

  it('treats a locked screen as a rest even when a tab is audible', async () => {
    const t = setup(true);
    await t.fire('locked');
    expect(t.onRest).toHaveBeenCalledOnce();
  });

  it('does not rest while a tab is audible, and rechecks later', async () => {
    const t = setup(true);
    await t.fire('idle');
    expect(t.onRest).not.toHaveBeenCalled();
    expect(t.platform.startRecheck).toHaveBeenCalledOnce();
  });

  it('rests on a recheck once the audio stops', async () => {
    const t = setup(true);
    await t.fire('idle');
    t.state.audible = false;
    await t.detector.recheck();
    expect(t.onRest).toHaveBeenCalledOnce();
    expect(t.platform.stopRecheck).toHaveBeenCalled();
  });

  it('keeps waiting on a recheck while audio plays', async () => {
    const t = setup(true);
    await t.fire('idle');
    await t.detector.recheck();
    expect(t.onRest).not.toHaveBeenCalled();
  });

  it('reports activity and stops rechecking', async () => {
    const t = setup(true);
    await t.fire('idle');
    await t.fire('active');
    expect(t.onActive).toHaveBeenCalledOnce();
    expect(t.platform.stopRecheck).toHaveBeenCalled();
  });
});
