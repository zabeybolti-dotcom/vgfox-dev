/* ============================================================
   draw.js — общие примитивы рисования (ctx передаётся явно)
   ============================================================ */

export function hexRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
}

export function shade(hex, t) {
  var c = hexRgb(hex), m = t > 0 ? 255 : 0, k = Math.abs(t);
  return 'rgb(' + Math.round(c[0] + (m - c[0]) * k) + ',' + Math.round(c[1] + (m - c[1]) * k) + ',' + Math.round(c[2] + (m - c[2]) * k) + ')';
}

/* Глянцевый радиальный градиент (в центре системы координат шарика):
   свет сверху-слева, тело держит основной цвет, к краю — сочное затемнение */
export function glossy(ctx, r, main, dark) {
  var g = ctx.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.14, 0, 0, r * 1.04);
  g.addColorStop(0, shade(main, 0.5));
  g.addColorStop(0.5, main);
  g.addColorStop(0.8, shade(main, -0.06));
  g.addColorStop(1, dark);
  return g;
}

/* Блики: мягкий главный + маленькая искорка */
export function highlight(ctx, r) {
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.ellipse(-r * 0.34, -r * 0.44, r * 0.22, r * 0.32, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath(); ctx.arc(-r * 0.06, -r * 0.64, r * 0.07, 0, Math.PI * 2); ctx.fill();
}

/* Узелок и волнистая верёвочка */
export function knotString(ctx, b, r, dark) {
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(-r * 0.14, r * 0.9); ctx.lineTo(r * 0.14, r * 0.9); ctx.lineTo(0, r * 1.14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(60,60,90,.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, r * 1.12);
  for (var i = 1; i <= 10; i++) { ctx.lineTo(Math.sin(b.ph * 2 + i * 0.9) * r * 0.14, r * 1.12 + i * r * 0.11); }
  ctx.stroke();
}

/* ============================================================
   Лицо: expr 0 — улыбка, 1 — удивление («о-о»), 2 — подмигивание
   blink > 0 — глазки закрыты (моргание)
   skipMouth — не рисовать рот (например, у свинки есть пятак)
   ============================================================ */
export function face(ctx, r, dark, expr, blink, skipMouth) {
  var closedL = blink > 0 || expr === 2; /* левый глаз закрыт при подмигивании */
  var closedR = blink > 0;
  var ey = -r * 0.12, ex = r * 0.32, ew = r * 0.17;

  if (!closedL || !closedR) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (!closedL) ctx.arc(-ex, ey, expr === 1 ? ew * 1.15 : ew, 0, Math.PI * 2);
    if (!closedR) ctx.arc(ex, ey, expr === 1 ? ew * 1.15 : ew, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2b3d';
    var py = expr === 1 ? ey - ew * 0.25 : ey + ew * 0.02;
    ctx.beginPath();
    if (!closedL) ctx.arc(-ex + ew * 0.06, py, ew * 0.56, 0, Math.PI * 2);
    if (!closedR) ctx.arc(ex + ew * 0.06, py, ew * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (!closedL) ctx.arc(-ex + ew * 0.14, py - ew * 0.18, ew * 0.18, 0, Math.PI * 2);
    if (!closedR) ctx.arc(ex + ew * 0.14, py - ew * 0.18, ew * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  /* закрытые глазки — весёлые дуги */
  if (closedL || closedR) {
    ctx.strokeStyle = '#2b2b3d'; ctx.lineWidth = Math.max(2, r * 0.05); ctx.lineCap = 'round';
    ctx.beginPath();
    if (closedL) ctx.arc(-ex, ey + ew * 0.2, ew * 0.8, Math.PI + 0.4, Math.PI * 2 - 0.4);
    if (closedR) ctx.arc(ex, ey + ew * 0.2, ew * 0.8, Math.PI + 0.4, Math.PI * 2 - 0.4);
    ctx.stroke();
  }
  /* щёчки */
  ctx.fillStyle = 'rgba(255,120,150,.35)';
  ctx.beginPath();
  ctx.arc(-r * 0.5, r * 0.18, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.5, r * 0.18, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  if (skipMouth) return;
  if (expr === 1) { /* удивлённый ротик «о» */
    ctx.strokeStyle = dark; ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.11, 0, Math.PI * 2); ctx.stroke();
  } else { /* улыбка */
    ctx.strokeStyle = dark; ctx.lineWidth = Math.max(2, r * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, r * 0.14, r * 0.18, 0.25, Math.PI - 0.25); ctx.stroke();
  }
}

/* Путь пятиконечной звезды (радиус r, центр в 0,0) */
export function starPath(ctx, r) {
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var rad = i % 2 ? r * 0.52 : r, a = -Math.PI / 2 + i * Math.PI / 5;
    var x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/* Многоугольник со скруглёнными углами (pts — [[x,y],...]) */
export function roundedPoly(ctx, pts, rad) {
  var n = pts.length;
  ctx.beginPath();
  ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (var i = 0; i < n; i++) {
    var p = pts[i], q = pts[(i + 1) % n];
    ctx.arcTo(p[0], p[1], q[0], q[1], rad);
    ctx.lineTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  ctx.closePath();
}

/* Маленькая искра-звёздочка в точке (x,y) */
export function sparkle(ctx, x, y, s, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, s * 0.3); ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
  ctx.moveTo(0, -s); ctx.lineTo(0, s);
  ctx.moveTo(-s * 0.5, -s * 0.5); ctx.lineTo(s * 0.5, s * 0.5);
  ctx.moveTo(-s * 0.5, s * 0.5); ctx.lineTo(s * 0.5, -s * 0.5);
  ctx.stroke();
  ctx.restore();
}
