/* ============================================================
   balloons.js — сущности шариков всех видов + спец-шарики
   ============================================================ */
import { PAL, ANIMALS } from './config.js';
import * as D from './draw.js';

/* kind: 0 шарики, 1 фигурки, 2 цифры, 3 зверята, 4 пузыри
   o.speedMul / o.sizeMul — адаптивная сложность
   o.instant — появиться сразу в центре экрана */
export function makeBalloon(W, H, kind, o) {
  o = o || {};
  var m = Math.min(W, H);
  var b = {
    kind: kind,
    r: m * (0.085 + Math.random() * 0.035) * (o.sizeMul || 1),
    x: 0,
    y: o.instant ? H * 0.45 : H + m * 0.25,
    v: H * (0.07 + Math.random() * 0.05) * (o.speedMul || 1),
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
  if (kind === 1) b.shape = Math.floor(Math.random() * 5); /* 0 круг 1 квадрат 2 треугольник 3 ромб 4 звезда */
  if (kind === 2) b.num = 1 + Math.floor(Math.random() * 5);
  if (kind === 3) {
    b.an = Math.floor(Math.random() * ANIMALS.length);
    var A = ANIMALS[b.an]; b.cols = [A.body, A.dark];
  }
  if (kind === 4) {
    b.hue = Math.random() * 360;
    b.cols = ['hsla(' + Math.round(b.hue) + ',90%,70%,.95)', '#ffffff'];
  }
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
  if (b.kind === 0) drawClassic(ctx, b);
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
  D.highlight(ctx, r);
  D.face(ctx, r, b.pal[1], b.expr, b.blink);
}

/* kind 1 — геометрические фигуры: круг, квадрат, треугольник, ромб, звезда */
function drawShape(ctx, b) {
  var r = b.r;
  D.knotString(ctx, b, r, b.pal[1]);
  var build;
  if (b.shape === 0) {
    build = function (c) { c.beginPath(); c.arc(0, 0, r * 0.95, 0, Math.PI * 2); };
  } else if (b.shape === 1) {
    build = function (c) { D.roundedPoly(c, [[-r * 0.8, -r * 0.8], [r * 0.8, -r * 0.8], [r * 0.8, r * 0.8], [-r * 0.8, r * 0.8]], r * 0.26); };
  } else if (b.shape === 2) {
    build = function (c) { D.roundedPoly(c, [[0, -r * 1.02], [r * 0.98, r * 0.72], [-r * 0.98, r * 0.72]], r * 0.24); };
  } else if (b.shape === 3) {
    build = function (c) { D.roundedPoly(c, [[0, -r * 1.05], [r * 0.82, 0], [0, r * 1.05], [-r * 0.82, 0]], r * 0.24); };
  } else {
    build = function (c) { D.starPath(c, r); };
  }
  ctx.lineJoin = 'round'; ctx.strokeStyle = b.pal[1]; ctx.lineWidth = r * 0.14;
  build(ctx); ctx.stroke();
  ctx.fillStyle = D.glossy(ctx, r, b.pal[0], b.pal[1]);
  build(ctx); ctx.fill();
  ctx.save(); build(ctx); ctx.clip(); D.highlight(ctx, r); ctx.restore();
  /* мордочка — меньше и с учётом формы фигуры */
  var fr = r * (b.shape === 1 ? 0.68 : b.shape === 0 ? 0.78 : 0.52);
  var fy = b.shape === 2 ? r * 0.2 : b.shape === 3 ? r * 0.04 : 0;
  ctx.save(); ctx.translate(0, fy);
  D.face(ctx, fr, b.pal[1], b.expr, b.blink);
  ctx.restore();
}

/* ---------------- цифры: шарик в форме самой цифры ---------------- */
var numCv = null, numCtx = null; /* общий офскрин-холст, DPR-чёткий */

function drawNumber(ctx, b) {
  var r = b.r, main = b.pal[0], dark = b.pal[1];
  var FONT = '"Arial Black","Arial Rounded MT Bold","Comic Sans MS",system-ui,sans-serif';
  var q = Math.min(2, window.devicePixelRatio || 1);
  var S = Math.ceil(r * 3.6 * q);

  if (!numCv) { numCv = document.createElement('canvas'); numCtx = numCv.getContext('2d'); }
  if (numCv.width < S) { numCv.width = S; numCv.height = S; }

  var c = numCtx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, numCv.width, numCv.height);
  c.setTransform(q, 0, 0, q, numCv.width / 2, numCv.height / 2);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineCap = 'round'; c.miterLimit = 2;

  var fs = r * 2.3;
  c.font = '900 ' + Math.round(fs) + 'px ' + FONT;
  var w = c.measureText(b.num).width;
  if (w > r * 1.7) { /* широкие цифры чуть ужмём, чтобы влезали */
    fs = fs * r * 1.7 / w;
    c.font = '900 ' + Math.round(fs) + 'px ' + FONT;
  }

  /* жирный скруглённый контур — «тельце» шарика-цифры */
  c.strokeStyle = dark; c.lineWidth = r * 0.34;
  c.strokeText(b.num, 0, -r * 0.05);
  /* глянцевая заливка точно по форме цифры */
  c.fillStyle = D.glossy(c, r * 1.05, main, dark);
  c.fillText(b.num, 0, -r * 0.05);
  /* блик — только внутри цифры (source-atop не выходит за глиф) */
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = 'rgba(255,255,255,.5)';
  c.beginPath(); c.ellipse(-r * 0.38, -r * 0.6, r * 0.24, r * 0.42, -0.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)';
  c.beginPath(); c.arc(-r * 0.02, -r * 0.88, r * 0.08, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = 'source-over';

  D.knotString(ctx, b, r, dark);
  ctx.drawImage(numCv, 0, 0, numCv.width, numCv.height,
    -numCv.width / (2 * q), -numCv.height / (2 * q), numCv.width / q, numCv.height / q);
}

/* kind 4 — мыльный пузырь: прозрачная плёнка, радужный ободок, блики */
function drawBubble(ctx, b) {
  var r = b.r, h = b.hue;
  var w = Math.sin(b.t * 2.2 + b.ph);
  ctx.scale(1 + w * 0.03, 1 - w * 0.03); /* лёгкое «дыхание» плёнки */

  /* тело: почти прозрачное, плотнее к краю, как у плёнки */
  var g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
  g.addColorStop(0, 'hsla(' + h + ',70%,90%,.02)');
  g.addColorStop(0.8, 'hsla(' + h + ',80%,80%,.09)');
  g.addColorStop(1, 'hsla(' + h + ',90%,74%,.26)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  /* радужный ободок, медленно переливается */
  ctx.save();
  ctx.rotate(Math.sin(b.t * 0.5 + b.ph) * 0.8);
  var rim = ctx.createLinearGradient(-r, -r, r, r);
  rim.addColorStop(0, 'hsla(' + h + ',95%,74%,.9)');
  rim.addColorStop(0.3, 'hsla(' + ((h + 70) % 360) + ',95%,72%,.55)');
  rim.addColorStop(0.55, 'hsla(' + ((h + 170) % 360) + ',90%,76%,.5)');
  rim.addColorStop(0.8, 'hsla(' + ((h + 260) % 360) + ',95%,72%,.55)');
  rim.addColorStop(1, 'hsla(' + h + ',95%,74%,.9)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(2, r * 0.085);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  /* блики: широкий мягкий + яркая точка */
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.44, r * 0.32, r * 0.19, -0.75, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.62, r * 0.08, 0, Math.PI * 2); ctx.fill();

  /* преломление снизу-справа + искорка на ободке */
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = Math.max(2, r * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.74, Math.PI * 0.22, Math.PI * 0.5); ctx.stroke();
  ctx.strokeStyle = 'hsla(' + ((h + 40) % 360) + ',100%,88%,.9)';
  ctx.lineWidth = Math.max(1.5, r * 0.045);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.96, -0.35, 0.25); ctx.stroke();
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
