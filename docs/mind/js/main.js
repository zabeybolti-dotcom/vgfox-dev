// MIND — точка входа: тир устройства, рендерер, камера, цикл, лоадер, FPS-оверлей.
// main.js — композиционный корень: только он знает все модули (RULES §4).

import * as THREE from '../lib/three.module.min.js';
import { createCameraRig } from './cameraRig.js';
import { createBrain } from './brain.js';
import { REGIONS, REGION_INDEX, createRegions } from './regions.js';
import { createMarkers } from './markers.js';
import { createEffects } from './effects.js';
import { createIntro } from './intro.js';
import { createCards } from './cards.js';
import { createAudio } from './audio.js';
import { createModes } from './modes.js';
import { createTour } from './tour.js';
import { createQuality } from './quality.js';
import { CARDS as CORTEX_CARDS } from './data/content-cortex.js';
import { CARDS as DEEP_CARDS } from './data/content-deep.js';
import { CARDS as BACK_CARDS } from './data/content-back.js';
import { MODES, TOUR_IDS } from './data/content-modes.js';

// Полные 200 карточек: кора (S10–S11) + глубина (S12) + задний мозг (S13)
const CARDS = [...CORTEX_CARDS, ...DEEP_CARDS, ...BACK_CARDS];

// ---------- Тюнинг (константы наверху, RULES §5) ----------
const TIERS = {
  low:    { dprCap: 1.25, msaa: false, targetFps: 40 },
  medium: { dprCap: 1.75, msaa: true,  targetFps: 50 },
  high:   { dprCap: 2.0,  msaa: true,  targetFps: 60 },
};
const CAMERA_FOV = 42;
const CAMERA_START = [0, 0.35, 3.4]; // стартовая позиция — мозг займёт центр кадра
const DT_CLAMP = 0.1;                // с: защита от гигантских dt после паузы
const FPS_WINDOW = 0.5;              // с: окно усреднения FPS-оверлея

// ---------- Тир устройства (RULES §3) ----------
function detectTier() {
  const cores = navigator.hardwareConcurrency || 2;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const uaMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const isMobile = coarse || uaMobile;

  let tier = 'low';
  if (cores >= 8 && !isMobile) tier = 'high';
  else if (cores >= 6) tier = 'medium';

  // Дорогие Android с DPR > 3 душатся экраном — им не выше Medium
  if ((window.devicePixelRatio || 1) > 3 && tier === 'high') tier = 'medium';
  return tier;
}

const tier = detectTier();
const cfg = TIERS[tier];

// ---------- DOM ----------
const canvas = document.getElementById('scene');
const loader = document.getElementById('loader');
const loaderErr = loader.querySelector('.loader__err');
const fpsEl = document.getElementById('fps');
const dragHint = document.getElementById('dragHint');

function failLoad(msg) {
  loaderErr.textContent = msg;
  loaderErr.classList.remove('is-hidden');
  loader.querySelector('.loader__pulse').classList.add('is-hidden');
  loader.querySelector('.loader__sub').classList.add('is-hidden');
}

// ---------- Рендерер ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: cfg.msaa,
    alpha: true, // фон-градиент живёт в CSS — дешевле и мягче чистого цвета
    powerPreference: 'high-performance',
  });
} catch (e) {
  failLoad('Ваш браузер не поддерживает WebGL — 3D-мозг не сможет собраться.');
  throw e;
}
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.dprCap));
renderer.setSize(window.innerWidth, window.innerHeight);

// ---------- Сцена и камера ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(...CAMERA_START);
camera.lookAt(0, 0, 0);

// ---------- Камера-риг (S02): орбита, инерция, зум, auto-rotate ----------
const startR = Math.hypot(...CAMERA_START);
const rig = createCameraRig(camera, canvas, {
  theta: Math.atan2(CAMERA_START[0], CAMERA_START[2]),
  phi: Math.acos(CAMERA_START[1] / startR),
  radius: startR,
  onFirstDrag: () => dragHint.classList.add('done'),
  onUserInput: () => tour.pause(), // руками крутит камеру — экскурсия ждёт (S15)
});

// ---------- Мозг (S03–S04): силуэт, извилины, шейдер без источников света ----------
const brain = createBrain(tier);
scene.add(brain.group);

// ---------- Области (S05): подсветка коры, чипы, полёты камеры ----------
const regions = createRegions({
  brain,
  rig,
  chips: document.getElementById('chips'),
});

// ---------- Звук (S14): синтез WebAudio, выключен по умолчанию ----------
const audio = createAudio();
const btnSound = document.getElementById('btnSound');
btnSound.setAttribute('aria-pressed', audio.isMuted() ? 'false' : 'true');
btnSound.addEventListener('click', () => {
  audio.unlock(); // клик — жест: только теперь браузер разрешает звук
  audio.setMuted(!audio.isMuted());
  btnSound.setAttribute('aria-pressed', audio.isMuted() ? 'false' : 'true');
});

// ---------- Маркеры (S06) + карточки (S07): точки, тап-выбор, панель, прогресс ----------
const CARD_DIST = { low: 2.3, medium: 2.05, high: 1.8 }[tier]; // дистанция камеры от точки

const markers = createMarkers({
  cards: CARDS,
  brain,
  camera,
  rig,
  canvas,
  regions,
  tooltip: document.getElementById('tooltip'),
  focusDist: CARD_DIST,
  onHover: (on) => { if (on) audio.tick(); }, // тихий тик при наведении (S14)
  onSelect: (card) => {
    // Во время режима любой тап по сцене — «следующий шаг» (S14)
    if (modes.active()) { modes.next(); return; }
    if (tour.active()) {
      tour.pause(); // выбрал точку руками — экскурсия ждёт
      if (card) openCard(card); // тап мимо точки — просто пауза, карточку маршрута не прячем
      return;
    }
    if (card) openCard(card); else cards.hide(); // тап мимо — закрыть
  },
});
scene.add(markers.object);

// ---------- Эффекты (S08): пыль, сеть связей, импульсы, ударная волна ----------
const effects = createEffects({ scene, camera, canvas, tier, markers, regions, reveal: brain.reveal });

// ---------- Менеджер качества (S15): EMA FPS → шаги вниз, один откат ----------
const quality = createQuality({
  renderer,
  effects,
  dprCap: cfg.dprCap,
  lowDprCap: TIERS.low.dprCap,
});

// ---------- Интро (S09): слёт частиц в силуэт, мозг проявляет uReveal ----------
// По чужой ссылке (#id) интро пропускаем — человек ждёт конкретную точку, не шоу
const startCard = cardFromHash();
const intro = createIntro({
  scene,
  canvas,
  tier,
  brain,
  skip: !!startCard,
});

const cards = createCards({
  panel: document.getElementById('cardPanel'),
  progress: document.getElementById('progress'),
  total: CARDS.length,
  onClose: () => {
    markers.deselect();
    regions.clearFocus();
    deepAutoXray = false; // пр.13: программный рентген гаснет вместе с карточкой
    applyXray();
    if (tour.active()) tour.pause(); // карточку закрыли вручную (свайп/Esc) — экскурсия ждёт
    history.replaceState(null, '', location.pathname + location.search); // хэш — без записи в историю
  },
});

// Полный цикл открытия: точка → вспышка → камера → панель → подсветка → хэш
function openCard(card) {
  markers.selectCard(card); // подсветка, полёт камеры, волна вспышек соседей (S08)
  effects.shockAt(markers.getSelected()); // кольцо-ударная волна цвета точки (S08)
  cards.show(card);
  // пр.13: deep-карточка (ссылка, экскурсия) сама включает рентген — иначе её
  // точка спрятана; обычная карточка гасит программный рентген (ручной остаётся)
  deepAutoXray = REGIONS[REGION_INDEX[card.region]].deep;
  applyXray();
  // пр.11: без полёта — камера уже наведена на саму точку (selectCard),
  // фокус на якоре доли уводил взгляд мимо нажатого маркера
  regions.focusRegion(card.region, false);
  audio.chime(REGIONS[REGION_INDEX[card.region]].color); // нота из цвета области (S14)
  history.replaceState(null, '', `#${card.id}`); // адрес можно скопировать и поделиться
}

// Ссылка вида #id: открытие с полётом; ручная очистка хэша — закрыть карточку
function cardFromHash() {
  if (location.hash.length < 2) return null;
  return CARDS.find((c) => c.id === decodeURIComponent(location.hash.slice(1))) || null;
}
window.addEventListener('hashchange', () => {
  if (modes.active()) return; // во время режима чужие ссылки не перехватывают сцену
  if (tour.active()) tour.pause(); // ручной переход по ссылке — экскурсия ждёт
  const card = cardFromHash();
  if (card) {
    if (cards.currentId !== card.id) openCard(card);
  } else if (cards.currentId) {
    cards.hide();
  }
});
// ---------- Рентген «Глубина» (S09; пр.13: ручной + программный показ) ----------
// Складываются два источника: кнопка и открытая deep-карточка (ссылка, экскурсия)
const btnXray = document.getElementById('btnXray');
let xrayManual = false;   // «Глубина» включена пользователем
let deepAutoXray = false; // программный показ: открыта deep-карточка
function applyXray() {
  const on = xrayManual || deepAutoXray;
  brain.setXray(on); // кора плавно стекленеет, глубина вспыхивает (brain.js)
  btnXray.setAttribute('aria-pressed', on ? 'true' : 'false');
}
btnXray.addEventListener('click', () => {
  xrayManual = !xrayManual;
  deepAutoXray = false; // ручной клик главнее программного показа
  applyXray();
});

if (startCard) openCard(startCard); // зашли по чужой ссылке — сразу летим к точке

// ---------- «О проекте»: счётчики — из данных, не хардкод (S13) ----------
const aboutModal = document.getElementById('aboutModal');
document.getElementById('btnAbout').addEventListener('click', () => {
  document.getElementById('aboutStats').textContent =
    `${CARDS.length} фактов · ${REGIONS.length} областей · ${MODES.length} живых режимов`;
  aboutModal.classList.remove('is-hidden');
});
aboutModal.addEventListener('click', (e) => {
  if (e.target === aboutModal || e.target.id === 'aboutClose') {
    aboutModal.classList.add('is-hidden');
  }
});

// ---------- «На весь экран» (пр.21): где API нет (iPhone) — кнопка прячется ----------
const btnFull = document.getElementById('btnFull');
const fsRoot = document.documentElement;
if (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen) {
  btnFull.addEventListener('click', () => {
    const on = document.fullscreenElement || document.webkitFullscreenElement;
    if (on) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen).call(fsRoot);
  });
} else {
  btnFull.classList.add('is-hidden'); // iOS iPhone: полноэкранного API нет
}

// ---------- Экскурсия (S15): 12 лучших карточек рассказывают сами себя ----------
const TOUR_CARDS = TOUR_IDS.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
const tour = createTour({
  cards: TOUR_CARDS,
  ui: {
    bar: document.getElementById('tourBar'),
    prev: document.getElementById('tourPrev'),
    play: document.getElementById('tourPlay'),
    next: document.getElementById('tourNext'),
    exit: document.getElementById('tourExit'),
    count: document.getElementById('tourCount'),
  },
  open: openCard,          // полный цикл: полёт, волна, панель, прогресс, нота
  close: () => cards.hide(),
});
const btnTour = document.getElementById('btnTour');
btnTour.addEventListener('click', () => {
  audio.unlock(); // клик — жест: экскурсию могли включить раньше звука
  if (tour.active()) { tour.stop(); return; }
  if (modes.active()) modes.exit();
  tour.start();
});
// Ручной выбор области чипом — тоже ручное взаимодействие
document.getElementById('chipsBar').addEventListener('click', () => tour.pause());

// ---------- Режимы (S14): Сон / Любовь / Страх / Музыка / Творчество ----------
// Пр.17: рентген живёт на шаге и учитывает ЗОНЫ шага: после пр.13 глубокие
// структуры невидимы без рентгена, а большинство зон сценариев — глубокие
// (таламус, гиппокамп, миндалина…), без него шаг не подсвечен вовсе.
function stepXray(s) {
  let deep = false;
  if (s) {
    for (const key of s.regions || []) {
      const ri = REGION_INDEX[key];
      if (ri !== undefined && REGIONS[ri].deep) { deep = true; break; }
    }
    if (!deep) {
      for (const id of s.markers || []) {
        const c = CARDS.find((x) => x.id === id);
        if (c && REGIONS[REGION_INDEX[c.region]].deep) { deep = true; break; }
      }
    }
  }
  if (deep !== deepAutoXray) { deepAutoXray = deep; applyXray(); }
}

// Пр.19: углы камеры шага — из якоря ПЕРВОЙ зоны шага: авторские theta/phi в
// контенте писались вслепую и уводили фокус в чужую долю (шаг про затылку —
// камера спереди). Радиус полёта остаётся авторским (r из сценария).
for (const m of MODES) {
  for (const s of m.steps) {
    const ri = s.regions ? REGION_INDEX[s.regions[0]] : undefined;
    if (ri === undefined) continue;
    const d = REGIONS[ri].dir;
    const len = Math.hypot(d[0], d[1], d[2]) || 1;
    s.cam = {
      theta: Math.atan2(d[0], d[2]),
      phi: Math.acos(d[1] / len),
      r: (s.cam && s.cam.r) || 2.7,
    };
  }
}

const modes = createModes({
  modes: MODES,
  rig,
  regions,
  markers,
  audio,
  dock: document.getElementById('modeDock'),
  overlay: document.getElementById('modeOverlay'),
  onStep: stepXray, // каждый шаг (аутро — onStep(null)) синхронизирует рентген
  onActive(on) {
    document.body.classList.toggle('mode-on', on);
    if (on && tour.active()) tour.stop(); // экскурсия и режим — не одновременно
    if (on) {
      cards.hide(); // карточка/хэш закроются штатно, сцена свободна
    } else {
      deepAutoXray = false; // страховка: на выходе глубина гаснет
      applyXray();
    }
  },
});

// ---------- Resize ----------
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  // DPR мог измениться (монитор) или быть занижен менеджером качества (S15)
  renderer.setPixelRatio(quality.dpr);
  renderer.setSize(w, h);
  camera.aspect = w / h;
  // Пр.18: вертикальный экран — держим горизонтальный обзор ландшафта (fov 42),
  // иначе мозг режется по ширине; кадр чуть выше центра — над доками и чипами
  if (camera.aspect < 1) {
    const half = Math.atan(Math.tan((CAMERA_FOV * Math.PI) / 360) / camera.aspect);
    camera.fov = Math.min(76, (half * 360) / Math.PI);
    camera.setViewOffset(w, h, 0, h * 0.04, w, h);
  } else {
    camera.fov = CAMERA_FOV;
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize(); // пр.18: старт на смартфоне — вертикальный кадр с первого мига

// ---------- Render-цикл ----------
let rafId = 0;
let running = false;
let last = performance.now();
let elapsed = 0;
let firstFrameDone = false;

// FPS-оверлей
let fpsVisible = false;
let fpsAcc = 0;
let fpsFrames = 0;

function frame(now) {
  if (!running) return;
  rafId = requestAnimationFrame(frame);

  const dt = Math.min((now - last) / 1000, DT_CLAMP);
  last = now;
  elapsed += dt;

  rig.update(dt);
  brain.update(dt, elapsed);
  regions.update(dt);
  markers.update(dt, elapsed);
  effects.update(dt, elapsed);
  intro.update(dt);
  quality.update(dt);

  renderer.render(scene, camera);

  if (!firstFrameDone) {
    firstFrameDone = true;
    // пр.22: прячем загрузчик, когда готовы и первый кадр, и шрифты (запас 1.2 с) —
    // иначе на телефоне после «загрузки» текст прыгает от подмены шрифта
    const hideLoader = () => {
      loader.classList.add('done');
      setTimeout(() => loader.classList.add('is-hidden'), 700);
    };
    const fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(hideLoader);
    dragHint.classList.add('show');
  }

  if (fpsVisible) {
    fpsAcc += dt;
    fpsFrames++;
    if (fpsAcc >= FPS_WINDOW) {
      fpsEl.textContent = `${Math.round(fpsFrames / fpsAcc)} fps · ${renderer.info.render.calls} calls · ${quality.label() || tier}`;
      fpsAcc = 0;
      fpsFrames = 0;
    }
  }
}

function start() {
  if (running) return;
  running = true;
  last = performance.now(); // иначе первый dt после паузы скакнёт
  rafId = requestAnimationFrame(frame);
}
function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

// Пауза рендера на скрытой вкладке — не греем CPU (RULES §3)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
  else start();
});

// ---------- Отладка: F — FPS-оверлей ----------
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.repeat) {
    fpsVisible = !fpsVisible;
    fpsEl.classList.toggle('is-hidden', !fpsVisible);
    if (fpsVisible) {
      fpsAcc = 0;
      fpsFrames = 0;
      fpsEl.textContent = `… fps · ${tier}`;
    }
  }
});

// пр.22: собираем шейдеры заранее, пока висит загрузчик, — первый кадр на телефоне
// без фриза (тот же труд, что обычно падает на первое рисование)
renderer.compile(scene, camera);

start();
