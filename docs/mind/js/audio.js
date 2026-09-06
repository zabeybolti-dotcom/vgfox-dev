// audio.js — весь звук синтезируется на лету, ноль аудиофайлов (решение из PLAN).
// AudioContext создаётся лениво после первого жеста пользователя (требование
// браузеров); звук по умолчанию выключен, состояние — в localStorage `mind.muted`.
// Инструменты:
//   chime   — колокольчик (sine + triangle октавой выше): нота из цвета области,
//   tick    — тихий шум-блип на hover с rate-limit,
//   ambient — зацикленный коричневый шум через lowpass: «гул живого мозга»,
//   pad     — три расстроенных saw через lowpass с медленным LFO: одежда режимов.

const LS_MUTE = 'mind.muted';

// ---------- Тюнинг ----------
const AMBIENT_GAIN = 0.035; // тихо: фон, а не концерт
const AMBIENT_CUT = 220;    // Гц: срез lowpass эмбиента — глухой «гул»
const TICK_GAIN = 0.05;
const TICK_CUT = 1900;      // Гц: центр bandpass шум-блипа
const TICK_GAP = 80;        // мс: минимум между тиками, чтобы не трещало
const CHIME_DECAY = 0.6;    // с: затухание колокольчика
const CHIME_GAIN = 0.2;
const PENTA = [0, 3, 5, 7, 10]; // минорная пентатоника: любые ноты звучат ладно
const BASE_FREQ = 220;      // A3 — база пентатоники
const PAD_GAIN = 0.045;
const PAD_FADE = 2.2;       // с: въезд пэда
const PAD_OUT = 1.4;        // с: выезд пэда при выключении

export function createAudio() {
  let ctx = null;
  let master = null;
  let whiteBuf = null; // короткие блипы
  let brownBuf = null; // эмбиент
  let pad = null;      // { oscs, lfo, gain }
  let lastTick = 0;
  let muted = true;
  try { muted = localStorage.getItem(LS_MUTE) !== '0'; } catch (e) { /* приватный режим */ }

  const canSound = () => ctx && !muted;

  // Цвет области 0xRRGGBB → оттенок (hue) → ступень пентатоники и октава.
  // Разные области звучат по-разному, но любая пара — консонанс.
  function hueToFreq(color) {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const idx = Math.round((h / 360) * (PENTA.length * 2 - 1)); // две октавы ступеней
    const semis = PENTA[idx % PENTA.length] + 12 * Math.floor(idx / PENTA.length);
    return BASE_FREQ * Math.pow(2, semis / 12);
  }

  function makeNoise(brown) {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        prev = (prev + 0.02 * white) / 1.02; // интегрированный белый — «коричневый»
        d[i] = prev * 3.5;
      } else {
        d[i] = white;
      }
    }
    return buf;
  }

  // Создаётся только из обработчика жеста (клик/тап) — иначе браузер молчит
  function unlock() {
    if (ctx) {
      if (!muted && ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    whiteBuf = makeNoise(false);
    brownBuf = makeNoise(true);

    // Эмбиент живёт всегда, пока контекст существует: mute = suspend всего контекста
    const src = ctx.createBufferSource();
    src.buffer = brownBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = AMBIENT_CUT;
    const g = ctx.createGain();
    g.gain.value = AMBIENT_GAIN;
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start();

    if (muted) ctx.suspend();
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(LS_MUTE, m ? '1' : '0'); } catch (e) { /* см. loadMuted */ }
    if (!ctx) return;
    if (m) {
      stopPad();
      ctx.suspend(); // глушим всё разом и не греем CPU
    } else {
      ctx.resume();
    }
  }

  // Колокольчик: sine на ноте + triangle октавой выше, экспоненциальный хвост
  function chime(color) {
    if (!canSound()) return;
    const f = hueToFreq(color);
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(CHIME_GAIN, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + CHIME_DECAY);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35; // верхняя октава — только подкраска
    o1.connect(g);
    o2.connect(g2);
    g2.connect(g);
    g.connect(master);
    o1.start(t);
    o2.start(t);
    o1.stop(t + CHIME_DECAY + 0.05);
    o2.stop(t + CHIME_DECAY + 0.05);
    o1.onended = () => g.disconnect(); // узлы не копим
  }

  // Hover: щелчок по фильтрованному шуму; чаще, чем раз в TICK_GAP — молчим
  function tick() {
    if (!canSound()) return;
    const now = performance.now();
    if (now - lastTick < TICK_GAP) return;
    lastTick = now;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = whiteBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = TICK_CUT;
    bp.Q.value = 9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(TICK_GAIN, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t, Math.random() * 1.5, 0.08);
    src.onended = () => g.disconnect();
  }

  // Пэд режима: три расстроенных пилы (прима/квинта/октава) через lowpass,
  // частоту которого медленно качает LFO — «дышащая» подложка без эффектов
  function startPad(color) {
    if (!ctx) return;
    stopPad();
    const f = hueToFreq(color);
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(PAD_GAIN, t + PAD_FADE);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 350;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lp.connect(gain);
    gain.connect(master);
    const oscs = [];
    const mults = [1, 1.5, 2];  // прима, квинта, октава
    const cents = [-6, 5, -4];  // расстройка — хорус без эффектов
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f * mults[i];
      o.detune.value = cents[i];
      o.connect(lp);
      o.start(t);
      oscs.push(o);
    }
    lfo.start(t);
    pad = { oscs, lfo, gain };
  }

  function stopPad() {
    if (!pad) return;
    const p = pad;
    pad = null;
    const t = ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(Math.max(0.0001, p.gain.gain.value), t);
    p.gain.gain.exponentialRampToValueAtTime(0.0001, t + PAD_OUT);
    // осцилляторы останавливаем после хвоста, узлы бросаем — GC доберёт
    setTimeout(() => {
      p.oscs.forEach((o) => o.stop());
      p.lfo.stop();
    }, PAD_OUT * 1000 + 100);
  }

  return {
    unlock,
    setMuted,
    chime,
    tick,
    startPad,
    stopPad,
    isMuted: () => muted,
  };
}
