/* ============================================================
   main.js — игровой цикл, ввод (тап + свайп), адаптивная
   сложность, вехи-праздники, HUD-звёзды и настройки
   ============================================================ */
import { MODES, CFG, MILESTONE } from './config.js';
import * as A from './audio.js';
import * as BG from './background.js';
import * as P from './particles.js';
import * as B from './balloons.js';
import * as D from './draw.js';

/* ---------------- холст ---------------- */
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var W = 0, H = 0, DPR = 1;
var safeTop = 0;
var probe = document.getElementById('probe');

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  safeTop = probe ? probe.getBoundingClientRect().height : 0;
  BG.resize(W, H);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();
window.addEventListener('contextmenu', function (e) { e.preventDefault(); });

/* ---------------- состояние ---------------- */
var mode = 0, score = 0;
var balloons = [];
var missStreak = 0, assist = 1;          /* адаптивная помощь малышу */
var lastInput = performance.now();
var spawnAcc = 0, last = performance.now();

function ls(k, d) {
  try {
    var v = localStorage.getItem(k);
    return v === null ? d : v;
  } catch (e) { return d; }
}
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

mode = Math.min(4, parseInt(ls('b3_mode', '0'), 10) || 0);

/* ---------------- сложность ---------------- */
function speedMul() {
  return (0.8 + Math.min(0.5, score * 0.01)) * assist;
}

/* ---------------- лопание ---------------- */
function pop(b) {
  b.dead = true;
  P.spawnPop(b, W, H);
  A.popSound(b.kind, b.num, score);
  A.vibrate(25);
  score++;
  missStreak = 0;
  assist = Math.min(1, assist + 0.04);
  if (score % CFG.MILESTONE === 0) celebrate();
}

/* Праздник каждые 10 лопаний */
function celebrate() {
  P.spawnConfettiRain(W, H, 80);
  P.spawnStreamers(W, 6);
  P.spawnFirework(W * (0.2 + Math.random() * 0.25), H * (0.2 + Math.random() * 0.2));
  P.spawnFirework(W * (0.55 + Math.random() * 0.25), H * (0.15 + Math.random() * 0.2));
  P.spawnFirework(W * (0.35 + Math.random() * 0.3), H * (0.35 + Math.random() * 0.15));
  A.milestoneSound();
  BG.showRainbow(6);
  toast(MILESTONE[Math.floor(Math.random() * MILESTONE.length)]);
  /* взрыв HUD-звёздочек */
  for (var i = 0; i < CFG.MILESTONE; i++) {
    P.spawnStars(16 + i * 26, safeTop + 22, 2, '#ffd93d');
  }
}

/* ---------------- ввод: тап + свайп, мультитач ---------------- */
function toGame(cx, cy) {
  var rect = canvas.getBoundingClientRect();
  return { x: (cx - rect.left) * (W / rect.width), y: (cy - rect.top) * (H / rect.height) };
}
function hit(x, y, isMove) {
  for (var i = balloons.length - 1; i >= 0; i--) {
    var b = balloons[i], dx = x - b.x, dy = y - (b.y - b.bounceOff);
    var rr = b.r * (b.kind === 2 ? 1.55 : CFG.HIT_R); /* цифра шире круга */
    if (dx * dx + dy * dy < rr * rr) { pop(b); return true; }
  }
  if (!isMove) { /* промах считаем только по нажатию, не по проведению */
    missStreak++;
    if (missStreak >= 3) assist = Math.max(0.65, assist - 0.08);
    P.spawnMiss(x, y);
    A.missTick();
  }
  return false;
}

var activePtrs = {};
canvas.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  activePtrs[e.pointerId] = true;
  lastInput = performance.now();
  var p = toGame(e.clientX, e.clientY);
  hit(p.x, p.y, false);
});
canvas.addEventListener('pointermove', function (e) {
  if (!activePtrs[e.pointerId]) return; /* палец прижат — лопаем на пути */
  lastInput = performance.now();
  var p = toGame(e.clientX, e.clientY);
  hit(p.x, p.y, true);
});
function ptrUp(e) { delete activePtrs[e.pointerId]; }
canvas.addEventListener('pointerup', ptrUp);
canvas.addEventListener('pointercancel', ptrUp);

if (!window.PointerEvent) {
  var touchIds = {};
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault(); lastInput = performance.now();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i]; touchIds[t.identifier] = true;
      var p = toGame(t.clientX, t.clientY); hit(p.x, p.y, false);
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (!touchIds[t.identifier]) continue;
      var p = toGame(t.clientX, t.clientY); hit(p.x, p.y, true);
    }
  }, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) delete touchIds[e.changedTouches[i].identifier];
  });
  canvas.addEventListener('mousedown', function (e) {
    lastInput = performance.now();
    var p = toGame(e.clientX, e.clientY); hit(p.x, p.y, false);
  });
}

/* ---------------- игровой цикл ---------------- */
function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  var t = now / 1000;

  /* спавн: интервал плавно уменьшается со счётом */
  spawnAcc += dt * 1000;
  var interval = Math.max(CFG.SPAWN_MIN, CFG.SPAWN0 - score * 4);
  if ((spawnAcc > interval && balloons.length < CFG.MAX_B) || balloons.length === 0) {
    balloons.push(B.makeBalloon(W, H, mode, {
      speedMul: speedMul(),
      sizeMul: assist < 1 ? 1.15 : 1,  /* если трудно — шарики чуть крупнее */
      instant: balloons.length === 0
    }));
    spawnAcc = 0;
  }

  /* ре-вовлечение: давно не трогали — шарик подпрыгивает и хихикает */
  if (performance.now() - lastInput > CFG.IDLE_MS && balloons.length) {
    var cand = balloons[Math.floor(Math.random() * balloons.length)];
    cand.bounce = 0.7;
    A.giggleSound();
    lastInput = performance.now();
  }

  B.updateBalloons(balloons, dt, W, H, {
    onEscape: function (b) { A.byeSound(); }
  });
  balloons = balloons.filter(function (x) { return !x.dead; });

  P.update(dt, W, H);
  BG.update(dt);

  /* отрисовка */
  BG.draw(ctx, t);
  for (var i = 0; i < balloons.length; i++) B.drawBalloon(ctx, balloons[i]);
  P.draw(ctx);
  drawHud();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* пауза времени при скрытии вкладки — без скачка dt */
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) last = performance.now();
});

/* ---------------- HUD: 10 звёздочек прогресса + счёт ---------------- */
function drawHud() {
  var x0 = 16, y0 = safeTop + 22, gap = 26, s = 10;
  var progress = score % CFG.MILESTONE;
  ctx.save();
  for (var i = 0; i < CFG.MILESTONE; i++) {
    ctx.save();
    ctx.translate(x0 + i * gap, y0);
    var filled = i < progress;
    var pop = filled && i === progress - 1 ? 1 + 0.25 * Math.max(0, 1 - (performance.now() / 1000 - lastPopTime) / 0.3) : 1;
    ctx.scale(pop, pop);
    D.starPath(ctx, s);
    if (filled) {
      ctx.fillStyle = '#ffd93d'; ctx.fill();
      ctx.strokeStyle = '#cfa600'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  }
  /* маленький счёт для родителей */
  ctx.font = '900 14px "Comic Sans MS",system-ui,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(91,75,196,.85)';
  ctx.fillText('💥 ' + score, x0, y0 + 20);
  ctx.restore();
}
var lastPopTime = 0;
var _origPop = pop;
pop = function (b) { lastPopTime = performance.now() / 1000; _origPop(b); };

/* ---------------- UI ---------------- */
var menu = document.getElementById('menu');
var toastEl = document.getElementById('toast');
var gridBtns = Array.prototype.slice.call(menu.querySelectorAll('[data-mode]'));
var tglSound = document.getElementById('tglSound');
var tglMusic = document.getElementById('tglMusic');
var soundOn = ls('b3_sound', '1') === '1';
var musicOn = ls('b3_music', '1') === '1';

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('show');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
}

function refreshToggles() {
  tglSound.textContent = (soundOn ? '🔊' : '🔇') + ' Звуки';
  tglSound.classList.toggle('off', !soundOn);
  tglMusic.textContent = (musicOn ? '🎵' : '🎵') + ' Музыка';
  tglMusic.classList.toggle('off', !musicOn);
}
function setMode(i, silent) {
  mode = i; balloons = []; P.clear();
  lsSet('b3_mode', String(i));
  gridBtns.forEach(function (btn) {
    btn.classList.toggle('active', parseInt(btn.getAttribute('data-mode'), 10) === i);
  });
  if (!silent) toast(MODES[i].ic + ' ' + MODES[i].nm + '!');
  balloons.push(B.makeBalloon(W, H, mode, { instant: true }));
}

gridBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    setMode(parseInt(btn.getAttribute('data-mode'), 10));
    menu.classList.add('hidden');
  });
});
document.getElementById('btnSettings').addEventListener('click', function () {
  menu.classList.remove('hidden');
});
menu.addEventListener('pointerdown', function (e) {
  if (e.target === menu) menu.classList.add('hidden');
});

tglSound.addEventListener('click', function () {
  soundOn = !soundOn; lsSet('b3_sound', soundOn ? '1' : '0');
  A.setSound(soundOn); refreshToggles();
});
tglMusic.addEventListener('click', function () {
  musicOn = !musicOn; lsSet('b3_music', musicOn ? '1' : '0');
  A.setMusic(musicOn); refreshToggles();
});

/* Полный экран — отдельная кнопка рядом с настройками */
function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFS() {
  var d = document, el = d.documentElement, p;
  try {
    if (!isFS()) {
      var rq = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rq) { p = rq.call(el); if (p && p.catch) p.catch(function () {}); }
      else toast('Полный экран недоступен 🙁');
    } else {
      var ex = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen;
      if (ex) { p = ex.call(d); if (p && p.catch) p.catch(function () {}); }
    }
  } catch (e) {}
}
document.getElementById('btnFull').addEventListener('click', toggleFS);

/* первый жест: включаем звук и (если выбрана) музыку */
document.addEventListener('pointerdown', function () { A.unlock(); }, { once: true });
document.addEventListener('touchstart', function () { A.unlock(); }, { once: true });

/* ---------------- старт ---------------- */
A.setSound(soundOn);
A.setMusic(musicOn); /* заиграет после первого касания (autoplay-политика) */
refreshToggles();
setMode(mode, true);
toast('Лопай шарики! 👆');
