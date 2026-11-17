import type { Intensities } from '../../shared/types';

export type Effect = {
  id: string;
  mount: (root: ShadowRoot) => void;
  update: (intensities: Intensities, dtMs: number) => void;
  unmount: () => void;
};
