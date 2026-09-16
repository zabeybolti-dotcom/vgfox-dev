/* ============================================================
   background.js — небо, солнце, облака (параллакс), холмы,
   радуга-арка, птички и бабочки, блёстки
   ============================================================ */

var W = 0, H = 0;
var bgGrad = null;
var cloudsFar = [], cloudsNear = [], sparkles = [], flowers = [];
var flyers = [];          /* птички и бабочки */
var nextFlyer = 5;        /* секунд до следующего пролёта */
var rainbowT = 0;         /* сколько ещё секунд радуга видна */
var TAU = Math.PI * 2;

export function resize(w, h) {
  W = w; H = h;
  bgGrad = null; /* пересоздаётся лениво в draw */
  cloudsFar = []; cloudsNear = []; sparkles = []; flowers = [];
  var i;
  for (i = 0; i < 3; i++) cloudsFar.push({ x: Math.random() * W, y: H * (0.05 + Math.random() * 0.25), s: 28 + Math.random() * 42, v: 4 + Math.random() * 5 });
  for (i = 0; i < 4; i++) cloudsNear.push({ x: Math.random() * W, y: H * (0.07 + Math.random() * 0.3), s: 45 + Math.random() * 65, v: 9 + Math.random() * 9 });
  for (i = 0; i < 12; i++) sparkles.push({ x: Math.random() * W, y: Math.random() * H * 0.55, s: 2 + Math.random() * 3.5, ph: Math.random() * TAU, sp: 0.8 + Math.random() * 1.6 });
  /* цветочки на переднем холме */
  var fc = Math.max(6, Math.round(W / 90));
  for (i = 0; i < fc; i++) {
    flowers.push({
      x: Math.random() * W,
      y: H * (0.9 + Math.random() * 0.07),
      c: ['#ffffff', '#ff8fd8', '#ffe14d', '#ff9d6c'][Math.floor(Math.random() * 4)],
      s: 2.5 + Math.random() * 2
    });
  }
}

/* Показать радугу на dur секунд */
export function showRainbow(dur) { rainbowT = Math.max(rainbowT, dur); }

export function update(dt) {
  var i, c;
  for (i = 0; i < cloudsFar.length; i++) { c = cloudsFar[i]; c.x += c.v * dt; if (c.x > W + c.s * 1.3) c.x = -c.s * 1.3; }
  for (i = 0; i < cloudsNear.length; i++) { c = cloudsNear[i]; c.x += c.v * dt; if (c.x > W + c.s * 1.3) c.x = -c.s * 1.3; }
  if (rainbowT > 0) rainbowT -= dt;

  nextFlyer -= dt;
  if (nextFlyer <= 0) {
    nextFlyer = 6 + Math.random() * 9;
    var dir = Math.random() < 0.5 ? 1 : -1;
    if (Math.random() < 0.55) { /* птичка */
      flyers.push({ tp: 'bird', x: dir > 0 ? -40 : W + 40, y: H * (0.08 + Math.random() * 0.3), v: (55 + Math.random() * 40) * dir, ph: Math.random() * TAU });
    } else { /* бабочка */
      flyers.push({ tp: 'fly', x: dir > 0 ? -40 : W + 40, y: H * (0.25 + Math.random() * 0.4), v: (35 + Math.random() * 25) * dir, ph: Math.random() * TAU, hue: Math.random() * 360 });
    }
  }
  for (i = 0; i < flyers.length; i++) {
    var f = flyers[i];
    f.x += f.v * dt; f.ph += dt;
  }
  flyers = flyers.filter(function (f) { return f.x > -80 && f.x < W + 80; });
}

function drawCloud(ctx, c, alpha) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, c.s * 0.5, 0, TAU);
  ctx.arc(-c.s * 0.45, c.s * 0.1, c.s * 0.35, 0, TAU);
  ctx.arc(c.s * 0.45, c.s * 0.1, c.s * 0.38, 0, TAU);
  ctx.arc(-c.s * 0.15, -c.s * 0.22, c.s * 0.4, 0, TAU);
  ctx.arc(c.s * 0.2, -c.s * 0.18, c.s * 0.35, 0, TAU);
  ctx.fill(); ctx.restore();
}

function drawHill(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill();
}

export function draw(ctx, t) {
  if (!bgGrad) {
    bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#6ec6ff');
    bgGrad.addColorStop(0.55, '#c9ecff');
    bgGrad.addColorStop(1, '#dff3ff');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  /* солнце с лучами */
  var sx = W * 0.85, sy = H * 0.14, sr = Math.min(W, H) * 0.09;
  var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.2);
  g.addColorStop(0, 'rgba(255,240,150,.55)'); g.addColorStop(1, 'rgba(255,240,150,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, sr * 3.2, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.08);
  ctx.fillStyle = 'rgba(255,220,90,.35)';
  for (var i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillRect(sr * 1.25, -sr * 0.09, sr * 0.7, sr * 0.18); }
  ctx.restore();
  var cg = ctx.createRadialGradient(sx - sr * 0.2, sy - sr * 0.2, 0, sx, sy, sr);
  cg.addColorStop(0, '#fff9d0'); cg.addColorStop(1, '#ffd93d');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();

  /* блёстки в небе */
  for (i = 0; i < sparkles.length; i++) {
    var sp = sparkles[i];
    var a = Math.max(0, Math.sin(t * sp.sp + sp.ph)) * 0.55;
    if (a < 0.03) continue;
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sp.x - sp.s, sp.y); ctx.lineTo(sp.x + sp.s, sp.y);
    ctx.moveTo(sp.x, sp.y - sp.s); ctx.lineTo(sp.x, sp.y + sp.s);
    ctx.stroke(); ctx.restore();
  }

  /* облака: два слоя параллакса */
  for (i = 0; i < cloudsFar.length; i++) drawCloud(ctx, cloudsFar[i], 0.5);
  for (i = 0; i < cloudsNear.length; i++) drawCloud(ctx, cloudsNear[i], 0.9);

  /* радуга-арка (после вех и радужного шарика) */
  if (rainbowT > 0) {
    var rc = Math.min(W, H) * 0.62, band = rc * 0.045, cx = W / 2, cy = H * 1.18;
    var ra = rainbowT > 6 ? Math.min(1, (8 - rainbowT) / 2) : Math.min(1, rainbowT / 1.5);
    var cols = ['#ff5d6c', '#ff9d4d', '#ffe14d', '#7ed957', '#4dc9ff', '#7a7bff'];
    ctx.save(); ctx.globalAlpha = ra * 0.55; ctx.lineCap = 'butt';
    for (i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i]; ctx.lineWidth = band;
      ctx.beginPath(); ctx.arc(cx, cy, rc - i * band, Math.PI, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  /* птички и бабочки */
  for (i = 0; i < flyers.length; i++) {
    var f = flyers[i];
    ctx.save(); ctx.translate(f.x, f.y + Math.sin(f.ph * 2) * 8);
    if (f.tp === 'bird') {
      var flap = Math.sin(f.ph * 9) * 5;
      ctx.strokeStyle = 'rgba(70,80,110,.75)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, -flap); ctx.quadraticCurveTo(-4, 2, 0, 0);
      ctx.quadraticCurveTo(4, 2, 8, -flap);
      ctx.stroke();
    } else {
      var fl = Math.sin(f.ph * 12) * 0.85;
      ctx.rotate(Math.sin(f.ph * 1.7) * 0.2);
      ctx.fillStyle = 'hsla(' + f.hue + ',85%,70%,.9)';
      ctx.beginPath(); ctx.ellipse(-4, 0, 5, 3.5, -0.5 - fl, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, 0, 5, 3.5, 0.5 + fl, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(60,60,90,.8)';
      ctx.beginPath(); ctx.ellipse(0, 0, 1.6, 3.4, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* холмы: три мягких слоя */
  drawHill(ctx, W * 0.22, H * 1.16, W * 0.6, H * 0.19, '#bfe8a0');
  drawHill(ctx, W * 0.8, H * 1.18, W * 0.65, H * 0.17, '#a8dd88');
  drawHill(ctx, W * 0.5, H * 1.22, W * 0.85, H * 0.2, '#8fd172');

  /* цветочки на переднем холме */
  for (i = 0; i < flowers.length; i++) {
    var fw = flowers[i];
    ctx.fillStyle = fw.c;
    ctx.beginPath();
    for (var p = 0; p < 5; p++) {
      var a = p / 5 * TAU + Math.sin(t * 0.8 + fw.x) * 0.15;
      var px = fw.x + Math.cos(a) * fw.s, py = fw.y + Math.sin(a) * fw.s;
      ctx.moveTo(px + fw.s * 0.62, py);
      ctx.arc(px, py, fw.s * 0.62, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath(); ctx.arc(fw.x, fw.y, fw.s * 0.5, 0, TAU); ctx.fill();
  }
}
