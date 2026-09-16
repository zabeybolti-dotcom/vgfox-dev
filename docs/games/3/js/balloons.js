/* ============================================================
   balloons.js — сущности шариков всех видов + спец-шарики
   ============================================================ */
import { PAL, ANIMALS } from './config.js';
import * as D from './draw.js';

/* kind: 0 шарики, 1 фигурки, 2 цифры, 3 зверята, 4 пузыри
   o.special: 'rainbow' | 'gold' | 'giant' | null
   o.speedMul / o.sizeMul — адаптивная сложность
   o.instant — появиться сразу в центре экрана */
export function makeBalloon(W, H, kind, o) {
  o = o || {};
  var m = Math.min(W, H);
  var b = {
    kind: kind,
    special: o.special || null,
    r: m * (0.09 + Math.random() * 0.045) * (o.sizeMul || 1) * (o.special === 'giant' ? 1.9 : 1),
    x: 0,
    y: o.instant ? H * 0.45 : H + m * 0.25,
    v: H * (0.07 + Math.random() * 0.05) * (o.speedMul || 1) *
       (o.special === 'giant' ? 0.55 : o.special === 'rainbow' ? 0.8 : 1),
    ph: Math.random() * 6.283, sw: 0.5 + Math.random() * 0.8,
    t: 0, rot: 0, dead: false,
    expr: Math.floor(Math.random() * 3),        /* 0 улыбка, 1 удивление, 2 подмигивание */
    blinkAt: 2 + Math.random() * 4, blink: 0,
    bounce: 0, bounceOff: 0                     /* подпрыгивание для ре-вовлечения */
  };
  b.x = b.r + Math.random() * Math.max(1, W - b.r * 2);
  if (kind === 0 || kind === 1 || kind === 2) {
    b.pal = PAL[Math.floor(Math.random() * PAL.length)];
    b.cols = b.pal;
  }
  if (kind === 1) b.shape = Math.floor(Math.random() * 3); /* 0 звезда, 1 сердце, 2 цветок */
  if (kind === 2) b.num = 1 + Math.floor(Math.random() * 5);
  if (kind === 3) {
    b.an = Math.floor(Math.random() * ANIMALS.length);
    var A = ANIMALS[b.an]; b.cols = [A.body, A.dark];
  }
  if (kind === 4) {
    b.hue = Math.random() * 360;
    b.cols = ['hsla(' + Math.round(b.hue) + ',90%,70%,.95)', '#ffffff'];
  }
  if (b.special === 'gold') b.cols = ['#ffd93d', '#e8a812'];
  if (b.special === 'rainbow') b.cols = ['#ff5d6c', '#ffb03a', '#ffe14d', '#5ad469', '#4dc9ff', '#7a7bff', '#c77dff'];
  return b;
}

/* Движение, покачивание, моргание; fx.onEscape(b) при улёте за верх */
export function updateBalloons(list, dt, W, H, fx) {
  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    b.t += dt;
    b.y -= b.v * dt;
    b.x += Math.sin(b.t * b.sw + b.ph) * 22 * dt;
    if (b.x < b.r * 0.5) b.x = b.r * 0.5;
    if (b.x > W - b.r * 0.5) b.x = W - b.r * 0.5;
    b.rot = Math.sin(b.t * b.sw + b.ph) * 0.08;
    if (b.blinkAt > 0) { b.blinkAt -= dt; if (b.blinkAt <= 0) { b.blink = 0.13; b.blinkAt = 2.5 + Math.random() * 4.5; } }
    if (b.blink > 0) b.blink = Math.max(0, b.blink - dt);
    if (b.bounce > 0) {
      b.bounce -= dt;
      b.bounceOff = b.bounce > 0 ? Math.sin((1 - b.bounce / 0.7) * Math.PI) * b.r * 0.35 : 0;
    }
    if (b.y < -b.r * 2.4) { b.dead = true; if (fx && fx.onEscape) fx.onEscape(b); }
  }
}

export function drawBalloon(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y - b.bounceOff);
  ctx.rotate(b.rot);
  D.softShadow(ctx, b.r);
  if (b.special === 'rainbow') drawRainbow(ctx, b);
  else if (b.special === 'gold') drawGold(ctx, b);
  else if (b.kind === 0) drawClassic(ctx, b);
  else if (b.kind === 1) drawShape(ctx, b);
  else if (b.kind === 2) drawNumber(ctx, b);
  else if (b.kind === 3) drawAnimal(ctx, b);
  else drawBubble(ctx, b);
  ctx.restore();
}

/* ---------------- обычные режимы ---------------- */

function drawClassic(ctx, b) {
  var r = b.r;
  D.knotString(ctx, b, r, b.pal[1]);
  ctx.fillStyle = D.glossy(ctx, r, b.pal[0], b.pal[1]);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2); ctx.stroke();
  D.highlight(ctx, r);
  D.face(ctx, r, b.pal[1], b.expr, b.blink);
  if (b.special === 'giant') drawCrown(ctx, r); /* гигантский — с короной! */
}

function drawShape(ctx, b) {
  var r = b.r;
  D.knotString(ctx, b, r, b.pal[1]);
  if (b.shape === 2) { /* цветочек */
    ctx.fillStyle = b.pal[0]; ctx.strokeStyle = b.pal[1]; ctx.lineWidth = r * 0.06; ctx.lineJoin = 'round';
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    var g = ctx.createRadialGradient(-r * 0.1, -r * 0.1, r * 0.05, 0, 0, r * 0.5);
    g.addColorStop(0, '#fff7c9'); g.addColorStop(1, '#ffd93d');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
    D.highlight(ctx, r * 0.5);
    return;
  }
  var build = b.shape === 0 ? D.starPath : D.heartPath;
  ctx.lineJoin = 'round'; ctx.strokeStyle = b.pal[1]; ctx.lineWidth = r * 0.18;
  build(ctx, r); ctx.stroke();
  ctx.fillStyle = D.glossy(ctx, r, b.pal[0], b.pal[1]);
  build(ctx, r); ctx.fill();
  ctx.save(); build(ctx, r); ctx.clip(); D.highlight(ctx, r); ctx.restore();
  D.face(ctx, r * 0.62, b.pal[1], b.expr, b.blink);
}

function drawNumber(ctx, b) {
  var r = b.r;
  D.knotString(ctx, b, r, b.pal[1]);
  ctx.fillStyle = D.glossy(ctx, r, b.pal[0], b.pal[1]);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2); ctx.stroke();
  D.highlight(ctx, r);
  ctx.font = '900 ' + Math.round(r * 1.15) + 'px "Arial Rounded MT Bold","Comic Sans MS",system-ui,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = r * 0.24;
  ctx.strokeText(b.num, 0, r * 0.06);
  ctx.fillStyle = b.pal[1]; ctx.fillText(b.num, 0, r * 0.06);
}

function drawBubble(ctx, b) {
  var r = b.r, s = 1 + Math.sin(b.t * 2.4 + b.ph) * 0.035, h = b.hue;
  ctx.scale(s, s);
  var g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.12);
  g.addColorStop(0, 'hsla(' + h + ',90%,85%,.05)');
  g.addColorStop(0.72, 'hsla(' + h + ',90%,75%,.12)');
  g.addColorStop(0.92, 'hsla(' + ((h + 50) % 360) + ',90%,70%,.3)');
  g.addColorStop(1, 'hsla(' + ((h + 90) % 360) + ',90%,70%,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'hsla(' + h + ',85%,80%,.7)'; ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  for (var k = 0; k < 3; k++) {
    ctx.strokeStyle = 'hsla(' + ((h + k * 70 + b.t * 40) % 360) + ',90%,75%,.4)'; ctx.lineWidth = r * 0.1;
    ctx.beginPath(); ctx.arc(0, 0, r * (0.74 - k * 0.11), b.t * 1.2 + k * 2.1, b.t * 1.2 + k * 2.1 + 1.25); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.ellipse(-r * 0.34, -r * 0.4, r * 0.22, r * 0.32, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.arc(-r * 0.08, -r * 0.62, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0.5, 1.9); ctx.stroke();
}

/* ---------------- зверята (8 видов) ---------------- */

function drawAnimal(ctx, b) {
  var r = b.r, A = ANIMALS[b.an];
  D.knotString(ctx, b, r, A.dark);

  /* уши/детали «за» телом */
  if (b.an === 0) { /* котик: треугольные ушки */
    ctx.fillStyle = A.body; ctx.strokeStyle = A.dark; ctx.lineWidth = r * 0.05; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.45); ctx.lineTo(-r * 0.55, -r * 1.05); ctx.lineTo(-r * 0.15, -r * 0.72); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.45); ctx.lineTo(r * 0.55, -r * 1.05); ctx.lineTo(r * 0.15, -r * 0.72); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.inner;
    ctx.beginPath(); ctx.moveTo(-r * 0.62, -r * 0.55); ctx.lineTo(-r * 0.52, -r * 0.88); ctx.lineTo(-r * 0.28, -r * 0.68); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * 0.62, -r * 0.55); ctx.lineTo(r * 0.52, -r * 0.88); ctx.lineTo(r * 0.28, -r * 0.68); ctx.closePath(); ctx.fill();
  }
  if (b.an === 2) { /* зайка: длинные ушки */
    ctx.fillStyle = A.body; ctx.strokeStyle = A.dark; ctx.lineWidth = r * 0.05;
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 1.05, r * 0.2, r * 0.55, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.38, -r * 1.05, r * 0.2, r * 0.55, -0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.inner;
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 1.02, r * 0.1, r * 0.36, 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.38, -r * 1.02, r * 0.1, r * 0.36, -0.12, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 3) { /* мишка: круглые ушки */
    ctx.fillStyle = A.body; ctx.strokeStyle = A.dark; ctx.lineWidth = r * 0.05;
    ctx.beginPath(); ctx.arc(-r * 0.62, -r * 0.68, r * 0.28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.62, -r * 0.68, r * 0.28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.inner;
    ctx.beginPath(); ctx.arc(-r * 0.62, -r * 0.68, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.62, -r * 0.68, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 4) { /* цыплёнок: хохолок */
    ctx.fillStyle = A.inner;
    ctx.beginPath(); ctx.arc(-r * 0.16, -r * 0.95, r * 0.12, 0, Math.PI * 2); ctx.arc(0, -r * 1.04, r * 0.13, 0, Math.PI * 2); ctx.arc(r * 0.16, -r * 0.95, r * 0.12, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 5) { /* панда: чёрные ушки */
    ctx.fillStyle = A.dark;
    ctx.beginPath(); ctx.arc(-r * 0.62, -r * 0.68, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.62, -r * 0.68, r * 0.28, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 6) { /* свинка: ушки-лепестки */
    ctx.fillStyle = A.body; ctx.strokeStyle = A.dark; ctx.lineWidth = r * 0.05; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.55); ctx.lineTo(-r * 0.62, -r * 0.98); ctx.lineTo(-r * 0.3, -r * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.55); ctx.lineTo(r * 0.62, -r * 0.98); ctx.lineTo(r * 0.3, -r * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  /* тело */
  ctx.fillStyle = D.glossy(ctx, r, A.body, A.dark);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2); ctx.stroke();
  D.highlight(ctx, r);

  /* детали «на» теле */
  if (b.an === 1) { /* щенок: висячие ушки + носик */
    ctx.fillStyle = A.dark;
    ctx.beginPath(); ctx.ellipse(-r * 0.78, -r * 0.05, r * 0.26, r * 0.5, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.78, -r * 0.05, r * 0.26, r * 0.5, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = A.inner;
    ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.3, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2b3d';
    ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.09, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 3) { /* мишка: светлый ротик */
    ctx.fillStyle = A.inner;
    ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.32, r * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2b3d';
    ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.1, r * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 4) { /* цыплёнок: клювик */
    ctx.fillStyle = '#ff8c1a';
    ctx.beginPath(); ctx.moveTo(0, r * 0.08); ctx.lineTo(-r * 0.15, r * 0.24); ctx.lineTo(r * 0.15, r * 0.24); ctx.closePath(); ctx.fill();
  }
  if (b.an === 5) { /* панда: глазные пятна */
    ctx.fillStyle = A.dark;
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.12, r * 0.24, r * 0.2, 0.2, 0, Math.PI * 2);
    ctx.ellipse(r * 0.32, -r * 0.12, r * 0.24, r * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2b3d';
    ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.11, r * 0.085, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (b.an === 6) { /* свинка: пятак */
    ctx.fillStyle = A.inner; ctx.strokeStyle = A.dark; ctx.lineWidth = r * 0.045;
    ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.34, r * 0.24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.dark;
    ctx.beginPath();
    ctx.ellipse(-r * 0.11, r * 0.2, r * 0.05, r * 0.08, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.11, r * 0.2, r * 0.05, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.an === 7) { /* лягушонок: глазки на макушке (поверх тела) */
    for (var s = -1; s <= 1; s += 2) {
      ctx.fillStyle = A.body; ctx.strokeStyle = A.dark; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(s * r * 0.38, -r * 0.88, r * 0.26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s * r * 0.38, -r * 0.9, r * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b2b3d';
      ctx.beginPath(); ctx.arc(s * r * 0.38, -r * 0.88, r * 0.08, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (b.an === 7) { /* лягушонок: широкая улыбка и щёчки */
    ctx.strokeStyle = A.dark; ctx.lineWidth = Math.max(2.5, r * 0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, r * 0.02, r * 0.42, 0.35, Math.PI - 0.35); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,150,.5)';
    ctx.beginPath();
    ctx.arc(-r * 0.52, r * 0.22, r * 0.13, 0, Math.PI * 2);
    ctx.arc(r * 0.52, r * 0.22, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  if (b.an === 7) return; /* у лягушонка своё лицо */
  D.face(ctx, r, A.dark, b.expr, b.blink, b.an === 6 || b.an === 5 || b.an === 1 || b.an === 3 || b.an === 4);

  if (b.an === 0) { /* котик: усики + носик */
    ctx.strokeStyle = 'rgba(70,50,40,.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.1); ctx.lineTo(-r * 0.9, r * 0.02);
    ctx.moveTo(-r * 0.55, r * 0.22); ctx.lineTo(-r * 0.9, r * 0.26);
    ctx.moveTo(r * 0.55, r * 0.1); ctx.lineTo(r * 0.9, r * 0.02);
    ctx.moveTo(r * 0.55, r * 0.22); ctx.lineTo(r * 0.9, r * 0.26);
    ctx.stroke();
    ctx.fillStyle = '#ff5d84';
    ctx.beginPath(); ctx.moveTo(0, r * 0.06); ctx.lineTo(-r * 0.07, r * 0.14); ctx.lineTo(r * 0.07, r * 0.14); ctx.closePath(); ctx.fill();
  }
}

/* ---------------- спец-шарики ---------------- */

/* Радужный: переливается всеми цветами, вокруг искорки */
function drawRainbow(ctx, b) {
  var r = b.r, t = b.t;
  D.knotString(ctx, b, r, '#7a7bff');
  var h = (t * 90 + b.ph * 57) % 360;
  var g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.02);
  g.addColorStop(0, 'hsla(' + ((h + 40) % 360) + ',95%,80%,1)');
  g.addColorStop(0.55, 'hsla(' + h + ',95%,65%,1)');
  g.addColorStop(1, 'hsla(' + ((h + 80) % 360) + ',90%,45%,1)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2); ctx.stroke();
  D.highlight(ctx, r);
  D.face(ctx, r, '#5b4bc4', b.expr, b.blink);
  for (var i = 0; i < 3; i++) {
    var a = t * 2 + i * 2.1;
    D.sparkle(ctx, Math.cos(a) * r * 1.3, Math.sin(a * 1.3) * r * 1.15, r * 0.1, '#fff', 0.9);
  }
}

/* Золотая звезда: сияет и искрится */
function drawGold(ctx, b) {
  var r = b.r;
  D.knotString(ctx, b, r, '#c9971c');
  ctx.lineJoin = 'round'; ctx.strokeStyle = '#c9971c'; ctx.lineWidth = r * 0.16;
  D.starPath(ctx, r); ctx.stroke();
  var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
  g.addColorStop(0, '#fff6c0'); g.addColorStop(0.55, '#ffd93d'); g.addColorStop(1, '#e8a812');
  ctx.fillStyle = g;
  D.starPath(ctx, r); ctx.fill();
  ctx.save(); D.starPath(ctx, r); ctx.clip(); D.highlight(ctx, r * 0.8); ctx.restore();
  D.face(ctx, r * 0.62, '#a87808', b.expr, b.blink);
  D.sparkle(ctx, r * 0.95, -r * 0.8, r * 0.09, '#fff', 0.8 + Math.sin(b.t * 6) * 0.2);
  D.sparkle(ctx, -r * 0.9, r * 0.5, r * 0.07, '#fff', 0.6 + Math.sin(b.t * 5 + 2) * 0.3);
}

/* Корона гигантского шарика */
function drawCrown(ctx, r) {
  ctx.fillStyle = '#ffd93d'; ctx.strokeStyle = '#e8a812'; ctx.lineWidth = r * 0.035; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 1.02);
  ctx.lineTo(-r * 0.34, -r * 1.3);
  ctx.lineTo(-r * 0.17, -r * 1.12);
  ctx.lineTo(0, -r * 1.38);
  ctx.lineTo(r * 0.17, -r * 1.12);
  ctx.lineTo(r * 0.34, -r * 1.3);
  ctx.lineTo(r * 0.34, -r * 1.02);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff5d6c';
  ctx.beginPath(); ctx.arc(0, -r * 1.08, r * 0.05, 0, Math.PI * 2); ctx.fill();
}
