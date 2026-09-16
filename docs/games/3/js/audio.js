/* ============================================================
   audio.js — звуки, тихая генерируемая музыка, вибрация
   ============================================================ */

var AC = null, master = null, sfx = null, musg = null, musLP = null;
var soundOn = true, musicOn = true;
var musicTimer = null, musicStep = 0, nextT = 0;

/* Пентатоника для весёлых ноток */
var PENT = [523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1174.66, 1318.51, 1567.98];

/* Аккорды колыбельной: C — Am — F — G */
var CHORDS = [
  [261.63, 329.63, 392.00, 523.25],
  [220.00, 261.63, 329.63, 440.00],
  [174.61, 220.00, 261.63, 349.23],
  [196.00, 246.94, 293.66, 392.00]
];
var ARP = [0, 1, 2, 3, 2, 3, 1, 2];

function ac() {
  if (AC === null) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 1; master.connect(AC.destination);
      sfx = AC.createGain(); sfx.gain.value = 1; sfx.connect(master);
      musLP = AC.createBiquadFilter(); musLP.type = 'lowpass'; musLP.frequency.value = 1500;
      musg = AC.createGain(); musg.gain.value = 0;
      musg.connect(musLP); musLP.connect(master);
    } catch (e) { AC = false; }
  }
  if (AC && AC.state === 'suspended') AC.resume().catch(function () {});
  return AC || null;
}

/* Один осциллятор с огибающей громкости */
function beep(t, f0, f1, dur, type, vol, dest) {
  var o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest || sfx);
  o.start(t); o.stop(t + dur + 0.03);
}

/* Нота ксилофона: очень быстрая атака + негармонические обертоны
   настоящих пластинок (1 : 3.93 : 9.2) + стук молоточка */
function xylo(t, f, vol) {
  var parts = [[1, 1, 0.36], [3.93, 0.32, 0.13], [9.2, 0.15, 0.07]];
  for (var i = 0; i < parts.length; i++) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine';
    o.frequency.value = f * parts[i][0] * (0.996 + Math.random() * 0.008);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * parts[i][1], t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + parts[i][2]);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + parts[i][2] + 0.05);
  }
  beep(t, f * 2.4, f * 1.9, 0.03, 'square', vol * 0.1);
}

/* Случайная нота пентатоники — каждый раз другая */
function rndNote() { return PENT[(Math.random() * PENT.length) | 0]; }

/* ---------------- ПУБЛИЧНОЕ ---------------- */

export function vibrate(ms) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}

/* Разблокировка звука первым жестом + старт музыки, если включена */
export function unlock() {
  if (ac() && musicOn) startMusic();
}

export function setSound(on) { soundOn = on; }
export function setMusic(on) { musicOn = on; if (on) startMusic(); else stopMusic(); }

/* Одно касание — одна чистая нота ксилофона, всегда случайная.
   Никаких наслоений: хлопок, отголоски и аккорды убраны — их было слишком много */
export function popSound(kind, num, score) {
  var a = ac(); if (!a || !soundOn) return;
  xylo(a.currentTime, rndNote(), 0.34);
}

/* Фанфара вехи: пробег по пентатонике на ксилофоне + колокольчики */
export function milestoneSound() {
  var a = ac(); if (!a || !soundOn) return;
  var t = a.currentTime, i;
  for (i = 0; i < 5; i++) xylo(t + i * 0.09, PENT[i + 2], 0.22);
  xylo(t + 0.5, 1567.98, 0.16);
  xylo(t + 0.58, 2093.0, 0.12);
}

/* Улетающий шарик: мягкое «пока-а» */
export function byeSound() {
  var a = ac(); if (!a || !soundOn) return;
  beep(a.currentTime, 600, 210, 0.32, 'sine', 0.07);
}

/* Хихиканье для ре-вовлечения */
export function giggleSound() {
  var a = ac(); if (!a || !soundOn) return;
  var t = a.currentTime;
  beep(t, 420, 700, 0.09, 'sine', 0.14);
  beep(t + 0.11, 700, 420, 0.12, 'sine', 0.12);
}

/* Едва слышный тик при промахе (не наказываем!) */
export function missTick() {
  var a = ac(); if (!a || !soundOn) return;
  beep(a.currentTime, 300, 240, 0.05, 'sine', 0.05);
}

/* ---------------- МУЗЫКА (тихая колыбельная) ---------------- */

function musNote(t, f, dur, vol, type) {
  var o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(musg);
  o.start(t); o.stop(t + dur + 0.05);
}

function schedule() {
  if (!AC) return;
  var step = 60 / 76 / 2; /* восьмая при 76 bpm */
  while (nextT < AC.currentTime + 0.35) {
    var bar = (musicStep >> 3) % CHORDS.length;
    var i = musicStep & 7, ch = CHORDS[bar];
    musNote(nextT, ch[ARP[i]], step * 1.8, 0.045);
    if (i === 0) musNote(nextT, ch[0] / 2, step * 7.5, 0.055, 'sine');
    if (i === 4) musNote(nextT, ch[0] / 2 * 1.5, step * 3.5, 0.04, 'sine');
    if (musicStep % 16 === 0) musNote(nextT, ch[3] * 2, step * 6, 0.018, 'sine');
    nextT += step; musicStep++;
  }
}

export function startMusic() {
  var a = ac(); if (!a) return;
  if (musicTimer) return;
  musg.gain.setTargetAtTime(1, a.currentTime, 0.6);
  nextT = a.currentTime + 0.2;
  musicTimer = setInterval(schedule, 150);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (AC && musg) musg.gain.setTargetAtTime(0.0001, AC.currentTime, 0.3);
}
