/* ============================================================
   particles.js — частицы: кусочки «резины», конфетти, серпантин,
   фейерверки, вспышки, звёздочки
   ============================================================ */
import { PAL } from './config.js';
import * as D from './draw.js';

var parts = [];
var TAU = Math.PI * 2;

export function clear() { parts.length = 0; }

/* Большой взрыв при лопании: вспышка + «резина» + точки + звёзды + кольцо */
export function spawnPop(b, W, H) {
  var cols = b.cols || ['#ff5d6c', '#ffe14d', '#4dc9ff'];
  var i, a, sp;

  parts.push({ tp: 'flash', x: b.x, y: b.y, r0: b.r * 0.5, v: b.r * 6, t: 0, life: 0.16 });

  for (i = 0; i < 7; i++) { /* кусочки «резины» */
    a = Math.random() * TAU; sp = 90 + Math.random() * 200;
    parts.push({
      tp: 'shred', x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
      g: 520, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14,
      len: b.r * (0.35 + Math.random() * 0.4), c: cols[i % cols.length], t: 0, life: 0.7 + Math.random() * 0.3
    });
  }
  for (i = 0; i < 12; i++) {
    a = Math.random() * TAU; sp = 60 + Math.random() * 220;
    parts.push({
      tp: 'dot', x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
      g: 420, s: 3 + Math.random() * 6, t: 0, life: 0.6 + Math.random() * 0.4, c: cols[i % cols.length]
    });
  }
  for (i = 0; i < 6; i++) {
    a = Math.random() * TAU; sp = 80 + Math.random() * 180;
    parts.push({
      tp: 'star', x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100,
      g: 300, s: 6 + Math.random() * 8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10,
      t: 0, life: 0.8 + Math.random() * 0.4, c: cols[(i + 1) % cols.length]
    });
  }
  parts.push({ tp: 'ring', x: b.x, y: b.y, t: 0, life: 0.4, r0: b.r * 0.4, v: b.r * 4, c: cols[0] });
}

/* Лёгкие белые искорки при промахе */
export function spawnMiss(x, y) {
  for (var i = 0; i < 3; i++) {
    var a = Math.random() * TAU, sp = 40 + Math.random() * 80;
    parts.push({
      tp: 'star', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      g: 200, s: 4 + Math.random() * 4, rot: Math.random() * TAU, vr: 6, t: 0, life: 0.5, c: '#ffffff'
    });
  }
}

/* Конфетти-дождь сверху (праздник, золотой шарик) */
export function spawnConfettiRain(W, H, n) {
  var PALF = PAL;
  for (var i = 0; i < n; i++) {
    var p = PALF[Math.floor(Math.random() * PALF.length)][0];
    parts.push({
      tp: 'conf',
      x: Math.random() * W, y: -20 - Math.random() * H * 0.4,
      vx: (Math.random() - 0.5) * 50, vy: 90 + Math.random() * 90,
      w: 6 + Math.random() * 5, h: 9 + Math.random() * 6,
      rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10,
      phase: Math.random() * TAU, c: p, t: 0, life: 3.2 + Math.random() * 1.5
    });
  }
}

/* Серпантин — длинные ленты */
export function spawnStreamers(W, n) {
  for (var i = 0; i < n; i++) {
    var p = PAL[Math.floor(Math.random() * PAL.length)][0];
    parts.push({
      tp: 'stream', x: Math.random() * W, y: -30 - Math.random() * 200,
      vy: 120 + Math.random() * 70, phase: Math.random() * TAU,
      c: p, t: 0, life: 3 + Math.random()
    });
  }
}

/* Фейерверк в точке неба */
export function spawnFirework(x, y) {
  var c1 = PAL[Math.floor(Math.random() * PAL.length)][0];
  var c2 = PAL[Math.floor(Math.random() * PAL.length)][0];
  for (var i = 0; i < 26; i++) {
    var a = Math.random() * TAU, sp = 90 + Math.random() * 260;
    parts.push({
      tp: 'dot', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      g: 160, s: 2.5 + Math.random() * 4, t: 0, life: 0.9 + Math.random() * 0.5, c: i % 2 ? c1 : c2
    });
  }
  for (i = 0; i < 8; i++) {
    a = (i / 8) * TAU; sp = 130 + Math.random() * 90;
    parts.push({
      tp: 'star', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      g: 140, s: 6 + Math.random() * 5, rot: Math.random() * TAU, vr: 5,
      t: 0, life: 1 + Math.random() * 0.4, c: c1
    });
  }
  parts.push({ tp: 'ring', x: x, y: y, t: 0, life: 0.5, r0: 8, v: 240, c: c2 });
}

/* Россыпь звёздочек (для взрыва HUD-прогресса) */
export function spawnStars(x, y, n, c) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * TAU, sp = 60 + Math.random() * 140;
    parts.push({
      tp: 'star', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
      g: 260, s: 5 + Math.random() * 5, rot: Math.random() * TAU, vr: 7,
      t: 0, life: 0.7 + Math.random() * 0.4, c: c || '#ffd93d'
    });
  }
}

/* ---------------- обновление и отрисовка ---------------- */

export function update(dt, W, H) {
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    p.t += dt;
    if (p.tp === 'conf') {
      p.x += (p.vx + Math.sin(p.t * 3 + p.phase) * 45) * dt;
      p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > H + 30) p.t = p.life;
    } else if (p.tp === 'stream') {
      p.y += p.vy * dt;
      if (p.y > H + 80) p.t = p.life;
    } else if (p.vx !== undefined) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.vr) p.rot += p.vr * dt;
    }
  }
  parts = parts.filter(function (p) { return p.t < p.life; });
}

export function draw(ctx) {
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i], f = 1 - p.t / p.life;
    if (f <= 0) continue;
    if (p.tp === 'dot') {
      ctx.globalAlpha = f;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s * f + 1, 0, TAU); ctx.fill();
    } else if (p.tp === 'star') {
      ctx.globalAlpha = f;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      D.starPath(ctx, p.s * (0.5 + 0.5 * f)); ctx.fill();
      ctx.restore();
    } else if (p.tp === 'ring') {
      ctx.globalAlpha = f * 0.9;
      ctx.strokeStyle = p.c; ctx.lineWidth = 3 * f + 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + p.t * p.v, 0, TAU); ctx.stroke();
    } else if (p.tp === 'flash') {
      ctx.globalAlpha = f * 0.65;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + p.t * p.v, 0, TAU); ctx.fill();
    } else if (p.tp === 'shred') {
      ctx.globalAlpha = f;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.strokeStyle = p.c; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, p.len, 0, 1.7); ctx.stroke();
      ctx.restore();
    } else if (p.tp === 'conf') {
      ctx.globalAlpha = Math.min(1, f * 3);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.4 + 0.6 * Math.abs(Math.sin(p.t * 5 + p.phase))));
      ctx.restore();
    } else if (p.tp === 'stream') {
      ctx.globalAlpha = Math.min(1, f * 3);
      ctx.strokeStyle = p.c; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      for (var s = 1; s <= 6; s++) {
        ctx.lineTo(p.x + Math.sin(p.t * 4 + p.phase + s * 0.9) * 14, p.y - s * 12);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
