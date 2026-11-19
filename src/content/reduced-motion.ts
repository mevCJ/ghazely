let photosensitive = false;

/** The user's photosensitive setting. It turns on the same slow fades as the system preference. */
export const setPhotosensitive = (on: boolean): void => {
  photosensitive = on;
};

/** Effects read this each frame. When true they pick slow fades over flicker and drift. */
export const reducedMotion = (): boolean =>
  photosensitive || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
