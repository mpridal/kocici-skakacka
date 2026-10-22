// Kočička ve stylu „bochníček“. Pózy: run, jump, hurt, blink, idle.
import { OUTLINE, CHEEK, fillStroke, strokePath, ellipse, swing, rotateAround, prepare, path } from './shapes.js';

const TAIL = 'M-38,-20 C-46,-24 -50,-30 -52,-36';
const TAIL_STRIPES = 'M-46,-25 l3,-4 M-50,-31 l4,-2';
const EAR_L = 'M24,-51 L28,-66 L37,-55Z';
const EAR_R = 'M43,-56 L51,-66 L55,-50Z';
const BODY = 'M-38,-4 C-47,-22 -36,-44 -8,-46 C8,-47 22,-58 38,-56 C56,-54 63,-36 57,-20 C53,-6 40,-2 20,-2 L-30,-2 C-35,-2 -37,-3 -38,-4Z';
const STRIPES = 'M38,-54 v6 M44,-55 v6 M50,-53 v5 M-14,-46 q3,5 0,10 M-4,-46 q3,5 0,10 M6,-47 q3,5 0,10';
const MOUTH = 'M43.5,-31 q1.5,2.2 3,0 q1.5,2.2 3,0';
const BLINK = 'M37.5,-37 q2.5,2 5,0 M49.5,-37.5 q2.5,2 5,0';
const OUCH = 'M37.5,-39.5 l4.5,2.5 -4.5,2.5 M54.5,-40 l-4.5,2.5 4.5,2.5';
const LEGS = [-31, -16, 18, 33];
const LEG_PHASE = [1, -1, -1, 1]; // přední levá + zadní pravá spolu

function legPath(x) {
  return `M${x + 4.5},-9 h1 a4.5,4.5 0 0 1 4.5,4.5 v1 a4.5,4.5 0 0 1 -4.5,4.5 h-1 a4.5,4.5 0 0 1 -4.5,-4.5 v-1 a4.5,4.5 0 0 1 4.5,-4.5Z`;
}
const LEG_PATHS = LEGS.map(legPath);

// Ozdoba v souřadnicích kočky (sedí na hlavě / obličeji).
export function drawAccessory(ctx, id, eye = '#3A3238') {
  if (!id || id === 'none') return;
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = OUTLINE;
  if (id === 'bow') {
    ctx.fillStyle = '#FF7590';
    ctx.beginPath();
    ctx.moveTo(48, -61); ctx.lineTo(41, -66); ctx.lineTo(41, -56); ctx.closePath();
    ctx.moveTo(48, -61); ctx.lineTo(55, -66); ctx.lineTo(55, -56); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ellipse(ctx, 48, -61, 2.6, 2.6, '#FF9AB0', 1.6);
  } else if (id === 'glasses') {
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(40, -37, 5.2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(52, -37.5, 5.2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(45.2, -37.6); ctx.lineTo(46.8, -37.6); ctx.moveTo(34.8, -38); ctx.lineTo(29, -41); ctx.stroke();
  } else if (id === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, 26 + Math.cos(a) * 3.6, -57 + Math.sin(a) * 3.6, 2.8, 2.8, '#FFB3C7', 1.2);
    }
    ellipse(ctx, 26, -57, 2.2, 2.2, '#FFD45E', 1.2);
  } else if (id === 'mask') {
    // maska superhrdiny s otvory pro oči a mašlí vzadu
    ctx.fillStyle = '#5DA9E9';
    ctx.beginPath();
    ctx.moveTo(32, -38);
    ctx.bezierCurveTo(32, -45, 44, -44, 46, -41);
    ctx.bezierCurveTo(48, -44, 60, -45, 60, -38);
    ctx.bezierCurveTo(60, -32, 50, -31, 46, -34);
    ctx.bezierCurveTo(42, -31, 32, -32, 32, -38);
    ctx.closePath();
    ctx.moveTo(43.4, -37); ctx.ellipse(40, -37, 3.4, 3.6, 0, 0, Math.PI * 2);
    ctx.moveTo(55.4, -37.5); ctx.ellipse(52, -37.5, 3.4, 3.6, 0, 0, Math.PI * 2);
    ctx.fill('evenodd');
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, -38); ctx.lineTo(25, -42); ctx.moveTo(32, -37); ctx.lineTo(26, -33);
    ctx.strokeStyle = '#5DA9E9';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  } else if (id === 'mustache') {
    // knír nad pusinkou, barvou jako oči (na černé kočce světlý)
    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.moveTo(46, -31);
    ctx.bezierCurveTo(43, -33.5, 38, -33, 36, -29);
    ctx.bezierCurveTo(39, -30.5, 42.5, -28.8, 46, -29.8);
    ctx.bezierCurveTo(49.5, -28.8, 53, -30.5, 56, -29);
    ctx.bezierCurveTo(54, -33, 49, -33.5, 46, -31);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'skirt') {
    // načechraná růžová sukýnka (tutu): nahoře pásek, dole se rozšiřuje přes obrys těla
    ctx.fillStyle = '#FFB3C7';
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(32, -22);
    ctx.lineTo(44, -7);
    const n = 8;
    const step = (44 + 34) / n;
    for (let i = 0; i < n; i++) {
      const x0 = 44 - i * step;
      ctx.quadraticCurveTo(x0 - step / 2, 3, x0 - step, -7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FF9AB0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 1; i < n; i++) {
      const x = 44 - i * step;
      ctx.moveTo(x, -7);
      ctx.lineTo(x * 0.72 + 4, -20);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22, -22); ctx.lineTo(32, -22);
    ctx.strokeStyle = '#FF7590';
    ctx.lineWidth = 3.4;
    ctx.stroke();
  } else if (id === 'crown') {
    ctx.fillStyle = '#FFD45E';
    ctx.beginPath();
    ctx.moveTo(31, -56); ctx.lineTo(31, -65); ctx.lineTo(35.5, -61); ctx.lineTo(40, -69);
    ctx.lineTo(44.5, -61); ctx.lineTo(49, -65); ctx.lineTo(49, -56); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ellipse(ctx, 40, -59, 1.6, 1.6, '#FF7590');
  }
}

// Ikona ozdoby samostatně (tlačítko na úvodu); size = přibližná velikost v px.
export function drawAccessoryIcon(ctx, id, cx, cy, size) {
  // [střed x, střed y, šířka] ozdoby v souřadnicích kočky
  const box = {
    bow: [48, -61, 15], glasses: [43, -38.5, 30], flower: [26, -57, 13], crown: [40, -62.5, 19],
    mask: [44, -38, 36], mustache: [46, -31, 23], skirt: [5, -10, 82],
  };
  const c = box[id];
  if (!c) return;
  ctx.save();
  prepare(ctx);
  ctx.translate(cx, cy);
  ctx.scale(size / c[2], size / c[2]);
  ctx.translate(-c[0], -c[1]);
  drawAccessory(ctx, id);
  ctx.restore();
}

export function drawCat(ctx, x, groundY, scale, skin, pose, t, blinking = false, accessory = 'none') {
  ctx.save();
  prepare(ctx);
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  const running = pose === 'run' || pose === 'hurt';
  const legAngle = running ? swing(t, 0.3, 32, -32) : pose === 'jump' ? 18 : 0;
  const bob = running ? -swing(t, 0.15, 0, 2.5) : 0;
  const tailAngle = pose === 'idle' || pose === 'blink' ? swing(t, 1.2, -8, 10) : swing(t, 0.3, -12, 14);
  if (pose === 'jump') rotateAround(ctx, 0, -33, -12);

  for (let i = 0; i < 4; i++) {
    ctx.save();
    rotateAround(ctx, LEGS[i] + 5, -9, legAngle * LEG_PHASE[i]);
    fillStroke(ctx, LEG_PATHS[i], skin.fur);
    ctx.restore();
  }

  ctx.translate(0, bob);
  ctx.save();
  rotateAround(ctx, -38, -20, tailAngle);
  strokePath(ctx, TAIL, OUTLINE, 13);
  strokePath(ctx, TAIL, skin.fur, 8.5);
  strokePath(ctx, TAIL_STRIPES, skin.stripe, 2.6);
  ctx.restore();

  fillStroke(ctx, EAR_L, skin.fur);
  fillStroke(ctx, EAR_R, skin.fur);
  fillStroke(ctx, BODY, skin.fur);
  strokePath(ctx, STRIPES, skin.stripe, 2.6);
  ellipse(ctx, 36, -29, 3.6, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 56, -30, 3, 2.2, CHEEK, 0, 0.7);

  const face = pose === 'hurt' ? 'hurt' : (blinking || pose === 'blink') ? 'blink' : 'open';
  if (face === 'hurt') {
    strokePath(ctx, OUCH, skin.eye, 1.6);
    ellipse(ctx, 46, -30, 2.2, 2.6, skin.eye);
  } else {
    if (face === 'blink') strokePath(ctx, BLINK, skin.eye, 1.6);
    else {
      ellipse(ctx, 40, -37, 2.2, 2.9, skin.eye);
      ellipse(ctx, 52, -37.5, 2.2, 2.9, skin.eye);
    }
    strokePath(ctx, MOUTH, skin.eye, 1.4);
  }
  drawAccessory(ctx, accessory, skin.eye);
  ctx.restore();
}

// Hlavička kočky (ikona aplikace): jen přední část těla s ušima a obličejem.
export function drawCatHead(ctx, cx, cy, size, skin) {
  ctx.save();
  prepare(ctx);
  ctx.translate(cx, cy);
  const s = size / 46;
  ctx.scale(s, s);
  ctx.translate(-40, 38);
  fillStroke(ctx, EAR_L, skin.fur);
  fillStroke(ctx, EAR_R, skin.fur);
  ctx.beginPath();
  ctx.ellipse(41, -38, 22, 19, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin.fur;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  strokePath(ctx, 'M35,-54 v6 M41,-55 v6 M47,-54 v5', skin.stripe, 2.6);
  ellipse(ctx, 29, -31, 3.6, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 53, -31, 3.6, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 35, -38, 2.2, 2.9, skin.eye);
  ellipse(ctx, 47, -38, 2.2, 2.9, skin.eye);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = skin.eye;
  ctx.stroke(path('M38,-32 q1.5,2.2 3,0 q1.5,2.2 3,0'));
  ctx.restore();
}
