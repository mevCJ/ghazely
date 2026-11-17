import { HEARTBEAT_BPM, STAGES } from '../../shared/scare-script';
import type { WhisperLevel } from '../../shared/types';

const startOf = (id: string): number => STAGES.find((s) => s.id === id)?.startMin ?? 0;
const TUNNEL_MIN = startOf('tunnel');
const LOCK_MIN = startOf('lock');

/** 60 bpm when the tunnel stage starts, rising linearly to 90 bpm at lock. */
export const heartbeatBpm = (elapsedMin: number): number => {
  const t = Math.min(1, Math.max(0, (elapsedMin - TUNNEL_MIN) / (LOCK_MIN - TUNNEL_MIN)));
  return HEARTBEAT_BPM.tunnel + (HEARTBEAT_BPM.lock - HEARTBEAT_BPM.tunnel) * t;
};

/** Gap range in seconds between whispers. Sparse at first, a little busier later. */
export const whisperGapSec = (level: WhisperLevel): readonly [number, number] | undefined => {
  if (level === 'faint') return [14, 28];
  if (level === 'on') return [7, 16];
  return undefined;
};

/** Peak gain of one whisper burst, before the master volume. */
export const whisperPeak = (level: WhisperLevel): number => (level === 'faint' ? 0.35 : level === 'on' ? 0.6 : 0);

/** Peak level a bundled clip is scaled to, so a quiet or loud file ends up at the same loudness. */
const SAMPLE_TARGET_PEAK = 0.9;

/** Gain that brings a clip whose loudest sample is `maxAbs` to the target peak. Silent clips stay silent. */
export const normalizeGain = (maxAbs: number): number =>
  maxAbs > 0.0001 ? SAMPLE_TARGET_PEAK / maxAbs : 0;
