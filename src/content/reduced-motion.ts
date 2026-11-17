/** Effects read this each frame. When true they pick slow fades over flicker and drift. */
export const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
