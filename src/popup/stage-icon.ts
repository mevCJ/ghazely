import { PALETTE } from '../shared/scare-script';
import type { StageId } from '../shared/types';
import { STAGE_ART } from './stage-art';

const NS = 'http://www.w3.org/2000/svg';
const W = 240;
const H = 110;
const CX = W / 2;
const CY = H / 2;
/** Half the width of the eye opening. */
const A = 100;
const IRIS_R = 28;
const SCLERA = PALETTE.eyeWhite;

type Attrs = Record<string, string | number>;

const node = (tag: string, attrs: Attrs, ...kids: SVGElement[]): SVGElement => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...kids);
  return el;
};

/** The lid curves. The upper lid rises higher than the lower one drops, like a real eye. */
const opening = (open: number): string => {
  const top = CY - 90 * open;
  const bottom = CY + 72 * open;
  return `M${CX - A},${CY} Q${CX},${top} ${CX + A},${CY} Q${CX},${bottom} ${CX - A},${CY} Z`;
};

/** Vein strokes from the corners and lids toward the iris. The first ones drawn are the longest. */
const VEINS = [
  'M30,52 Q55,46 82,56',
  'M210,52 Q185,46 158,56',
  'M32,62 Q60,68 84,60',
  'M208,62 Q180,70 156,62',
  'M62,36 Q80,44 96,52',
  'M178,36 Q160,44 144,52',
  'M62,78 Q82,70 98,62',
  'M178,78 Q158,70 142,62',
  'M96,28 Q104,40 108,48',
  'M144,28 Q136,40 132,48',
  'M96,82 Q106,72 110,64',
  'M144,82 Q134,72 130,64',
] as const;

const FLOATERS = [
  [88, 40],
  [152, 72],
  [112, 80],
  [166, 40],
  [72, 68],
] as const;

/**
 * One eye, drawn from the stage's numbers. It is decoration, so it is hidden from screen
 * readers. The stage name next to it says the same thing in words.
 */
export const createStageIcon = (id: StageId): SVGSVGElement => {
  const art = STAGE_ART[id];
  const clipId = `stage-eye-${id}`;
  const darkId = `stage-dark-${id}`;
  const path = opening(art.open);

  const veins = VEINS.slice(0, art.veins).map((d) =>
    node('path', { d, stroke: PALETTE.drip, 'stroke-width': 1.3, 'stroke-linecap': 'round', fill: 'none', opacity: 0.85 }),
  );
  const floaters = FLOATERS.slice(0, art.floaters).map(([x, y]) =>
    node('path', {
      d: `M${x},${y} q4,-6 8,0 t8,0`,
      stroke: PALETTE.fog,
      'stroke-width': 1.4,
      'stroke-linecap': 'round',
      fill: 'none',
      opacity: 0.6,
    }),
  );
  const eye = node(
    'g',
    { 'clip-path': `url(#${clipId})` },
    node('rect', { width: W, height: H, fill: SCLERA }),
    ...veins,
    node('circle', { cx: CX, cy: CY, r: IRIS_R, fill: PALETTE.iris, stroke: '#38442f', 'stroke-width': 3 }),
    node('circle', { cx: CX, cy: CY, r: IRIS_R * art.pupil, fill: '#050505' }),
    node('rect', {
      x: CX - 15,
      y: CY - 17,
      width: 9,
      height: 6,
      rx: 1.5,
      fill: '#fff',
      opacity: 0.8,
      transform: `rotate(-9 ${CX - 10} ${CY - 14})`,
    }),
    ...floaters,
  );

  // The dark ring: clear in the middle, the page shade at the edge. It closes in with the stage.
  const gradient = node(
    'radialGradient',
    { id: darkId, cx: '50%', cy: '50%', r: '70%' },
    node('stop', { offset: 0, 'stop-color': PALETTE.shade, 'stop-opacity': 0 }),
    node('stop', { offset: 0.9 - art.dark * 0.7, 'stop-color': PALETTE.shade, 'stop-opacity': 0 }),
    node('stop', { offset: 1, 'stop-color': PALETTE.shade, 'stop-opacity': 0.95 }),
  );

  const svg = node(
    'svg',
    { viewBox: `0 0 ${W} ${H}`, width: '100%', 'aria-hidden': 'true', focusable: 'false' },
    node('defs', {}, node('clipPath', { id: clipId }, node('path', { d: path })), gradient),
    eye,
    node('path', {
      d: `M${CX - 75},${CY + 22} Q${CX},${CY + 36 * art.open + 26} ${CX + 75},${CY + 22}`,
      fill: 'none',
      stroke: PALETTE.veins,
      'stroke-width': 3,
      'stroke-linecap': 'round',
      opacity: 0.55 * art.bags,
    }),
    node('path', { d: path, fill: 'none', stroke: PALETTE.fog, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    node('rect', { width: W, height: H, fill: `url(#${darkId})` }),
  );
  return svg as SVGSVGElement;
};
