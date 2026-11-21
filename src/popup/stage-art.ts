import type { StageId } from '../shared/types';

/**
 * What each stage's picture shows. The numbers follow the scare-script table: veins and
 * floaters grow, the pupil shrinks, the dark ring closes in. `open` is how far the lids
 * leave the eye open, and the lock stage stares wide on purpose.
 */
export type StageArt = {
  /** 0 shut, 1 fully open. */
  open: number;
  /** How many of the vein strokes to draw. */
  veins: number;
  /** How many floaters to draw. */
  floaters: number;
  /** How far the dark ring has closed in, 0 to 1. */
  dark: number;
  /** Pupil radius as a share of the iris. */
  pupil: number;
  /** Dark shadow under the eye, 0 to 1. It is the first sign of strain. */
  bags: number;
};

/** A Record, so adding a stage to the scare script fails to compile until it has a picture. */
export const STAGE_ART: Record<StageId, StageArt> = {
  calm: { open: 1, veins: 0, floaters: 0, dark: 0, pupil: 0.4, bags: 0 },
  strain: { open: 0.86, veins: 0, floaters: 0, dark: 0, pupil: 0.4, bags: 0.5 },
  dry: { open: 0.74, veins: 4, floaters: 0, dark: 0, pupil: 0.4, bags: 0.7 },
  haze: { open: 0.66, veins: 7, floaters: 3, dark: 0.25, pupil: 0.38, bags: 0.85 },
  tunnel: { open: 0.56, veins: 10, floaters: 5, dark: 0.6, pupil: 0.3, bags: 1 },
  lock: { open: 0.95, veins: 12, floaters: 5, dark: 0.92, pupil: 0.2, bags: 1 },
};
