// Střídání dne a noci podle skóre: den → večer → noc → ráno → den.
import { CONFIG } from './config.js';

const DAY = { skyTop: '#CDEBFA', skyBottom: '#E6F5FC', hillFar: '#D5EFCB', hillNear: '#AEDDA2', grass: '#92CD7E', path: '#F7E6C4', starsAlpha: 0, sunAlpha: 1, moonAlpha: 0 };
const EVENING = { skyTop: '#F4C3CF', skyBottom: '#FCE3C6', hillFar: '#D9D3C2', hillNear: '#B6C99A', grass: '#9CB97C', path: '#EFD6B5', starsAlpha: 0.3, sunAlpha: 0.6, moonAlpha: 0.3 };
const NIGHT = { skyTop: '#3E4C84', skyBottom: '#6372AA', hillFar: '#5F7A92', hillNear: '#4F7A70', grass: '#4E7E64', path: '#ABA092', starsAlpha: 1, sunAlpha: 0, moonAlpha: 1 };
const MORNING = { skyTop: '#F7D7E6', skyBottom: '#FFF0D9', hillFar: '#D7E8C8', hillNear: '#B3D69F', grass: '#97C882', path: '#F3E1C3', starsAlpha: 0.2, sunAlpha: 0.7, moonAlpha: 0.2 };

// [fáze, paleta] – mezi body se plynule prolíná.
const KEYS = [[0, DAY], [0.4, DAY], [0.5, EVENING], [0.6, NIGHT], [0.82, NIGHT], [0.9, MORNING], [1, DAY]];
const COLORS = ['skyTop', 'skyBottom', 'hillFar', 'hillNear', 'grass', 'path'];
const NUMBERS = ['starsAlpha', 'sunAlpha', 'moonAlpha'];

const parsed = new Map();
function rgb(hex) {
  let c = parsed.get(hex);
  if (!c) { c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); parsed.set(hex, c); }
  return c;
}
const hex2 = (v) => Math.round(v).toString(16).padStart(2, '0').toUpperCase();
function mix(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ca = rgb(a);
  const cb = rgb(b);
  return '#' + hex2(ca[0] + (cb[0] - ca[0]) * t) + hex2(ca[1] + (cb[1] - ca[1]) * t) + hex2(ca[2] + (cb[2] - ca[2]) * t);
}

export function dayPhase(score) {
  const c = CONFIG.dayNight.cyclePoints;
  return (((score % c) + c) % c) / c;
}

export function phaseName(phase) {
  if (phase < 0.45) return 'day';
  if (phase < 0.58) return 'evening';
  if (phase < 0.86) return 'night';
  if (phase < 0.96) return 'morning';
  return 'day';
}

export function skyPalette(phase, out) {
  let i = 0;
  while (i < KEYS.length - 2 && phase >= KEYS[i + 1][0]) i++;
  const [p0, a] = KEYS[i];
  const [p1, b] = KEYS[i + 1];
  const t = p1 > p0 ? (phase - p0) / (p1 - p0) : 0;
  for (const k of COLORS) out[k] = mix(a[k], b[k], t);
  for (const k of NUMBERS) out[k] = a[k] + (b[k] - a[k]) * Math.min(1, Math.max(0, t));
  out.phase = phase;
  return out;
}
