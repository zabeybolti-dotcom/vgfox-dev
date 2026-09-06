// regions.js — 20 областей мозга: данные (якоря, цвета), анимация подсветки, чипы.
// REGIONS — источник правды: brain.js строит по ним uniform-массивы шейдера,
// S06 разместит вокруг якорей маркеры, карточки контента ссылаются ключами region.

import * as THREE from '../lib/three.module.min.js';

// Порядок массива = порядок чипов и индексы uniform-массивов в шейдере brain.js
// (менять порядок нельзя — индексы прошиты в GLSL-циклы и разметку aRegion).
// dir — направление якоря от центра мозга (z>0 — лоб, y>0 — макушка);
// spread — угловой радиус зоны подсветки (рад);
// cortex — есть ли у региона свои вершины на поверхности коры (для aRegion);
// deep — структура скрыта внутри (S09 прикрепит к ней собственные маркеры).
// Кора — неоновый спектр от циана к коралу (спереди назад); глубина и «древние» — янтарь.
export const REGIONS = [
  // --- Кора, спереди назад ---
  { key: 'prefrontal',     name: 'Префронтальная кора', short: 'Префронтальная',  color: 0x00e8ff, dir: [0, 0.42, 1],        spread: 0.52, cortex: true,  deep: false, blurb: 'Планирует будущее и сдерживает импульсы' },
  { key: 'frontal',        name: 'Лобная доля',         short: 'Лобная',          color: 0x2fb4ff, dir: [0.62, 0.05, 0.72],  spread: 0.50, cortex: true,  deep: false, blurb: 'Личность, инициатива, рабочая память' },
  { key: 'motor',          name: 'Моторная кора',       short: 'Моторная',        color: 0x5f7bff, dir: [0.38, 0.62, 0.42],  spread: 0.44, cortex: true,  deep: false, blurb: 'Отдаёт команды мышцам' },
  { key: 'broca',          name: 'Зона Брока',          short: 'Брока',           color: 0x8a5cff, dir: [0.68, 0.02, 0.52],  spread: 0.34, cortex: true,  deep: false, blurb: 'Собирает речь из слов' },
  { key: 'parietal',       name: 'Теменная доля',       short: 'Теменная',        color: 0xb44dff, dir: [0.42, 0.62, -0.42], spread: 0.52, cortex: true,  deep: false, blurb: 'Карта тела и пространство вокруг' },
  { key: 'occipital',      name: 'Затылочная доля',     short: 'Затылочная',      color: 0xd63bff, dir: [0.05, 0.28, -1],    spread: 0.50, cortex: true,  deep: false, blurb: 'Превращает свет в картинку' },
  { key: 'temporal',       name: 'Височная доля',       short: 'Височная',        color: 0xf03ccc, dir: [0.88, -0.32, 0.02], spread: 0.50, cortex: true,  deep: false, blurb: 'Память, смысл и лица' },
  { key: 'auditory',       name: 'Слуховая кора',       short: 'Слуховая',        color: 0xff3ca8, dir: [0.62, -0.38, -0.4], spread: 0.36, cortex: true,  deep: false, blurb: 'Слышит музыку и речь' },
  { key: 'wernicke',       name: 'Зона Вернике',        short: 'Вернике',         color: 0xff3c7a, dir: [0.7, 0.05, -0.55],  spread: 0.34, cortex: true,  deep: false, blurb: 'Понимает чужую речь' },
  { key: 'insula',         name: 'Островковая доля',    short: 'Островок',        color: 0xff5e6e, dir: [0.86, -0.1, 0.1],   spread: 0.34, cortex: false, deep: true,  blurb: 'Чувствует тело изнутри' },
  // --- Глубина (янтарные акценты) ---
  { key: 'hippocampus',    name: 'Гиппокамп',           short: 'Гиппокамп',       color: 0xffb45e, dir: [0.4, -0.22, -0.32], spread: 0.36, cortex: false, deep: true,  blurb: 'Машинист памяти: сегодня — в навсегда' },
  { key: 'amygdala',       name: 'Миндалевидное тело',  short: 'Миндалина',       color: 0xff9e4f, dir: [0.42, -0.26, 0.14], spread: 0.32, cortex: false, deep: true,  blurb: 'Тревожная кнопка: страх и азарт' },
  { key: 'thalamus',       name: 'Таламус',             short: 'Таламус',         color: 0xffc878, dir: [0.18, 0.18, -0.08], spread: 0.34, cortex: false, deep: true,  blurb: 'Привратник сознания: фильтрует сигналы' },
  { key: 'hypothalamus',   name: 'Гипоталамус',         short: 'Гипоталамус',     color: 0xffb36a, dir: [0.08, -0.18, 0.14], spread: 0.30, cortex: false, deep: true,  blurb: 'Термостат, часы и голод' },
  { key: 'basalGanglia',   name: 'Базальные ганглии',   short: 'Базальные ганглии', color: 0xffd98c, dir: [0.32, 0.1, 0.24],  spread: 0.36, cortex: false, deep: true,  blurb: 'Автопилот привычек и движений' },
  { key: 'corpusCallosum', name: 'Мозолистое тело',     short: 'Мозолистое',      color: 0xffe6a8, dir: [0, 0.28, -0.02],    spread: 0.40, cortex: false, deep: true,  blurb: 'Мост между полушариями' },
  { key: 'pineal',         name: 'Эпифиз',              short: 'Эпифиз',          color: 0xfff2c8, dir: [0, 0.12, -0.28],    spread: 0.26, cortex: false, deep: true,  blurb: 'Внутренние часы: мелатонин' },
  // --- Задний мозг: «древние» структуры, тоже янтарь ---
  { key: 'cerebellum',     name: 'Мозжечок',            short: 'Мозжечок',        color: 0xf0a860, dir: [0, -0.52, -0.85],   spread: 0.46, cortex: false, deep: false, blurb: 'Координатор точных движений' },
  { key: 'brainstem',      name: 'Ствол мозга',         short: 'Ствол',           color: 0xe89058, dir: [0, -0.85, -0.2],    spread: 0.34, cortex: false, deep: false, blurb: 'Дыхание и пульс — то, что не выключается' },
  { key: 'olfactory',      name: 'Обонятельная луковица', short: 'Обоняние',      color: 0xffca80, dir: [0.3, -0.5, 0.82],    spread: 0.28, cortex: false, deep: true,  blurb: 'Запахи идут к эмоциям напрямую' },
];

// Ключ → индекс (индекс = позиция в шейдерных массивах и в панели чипов)
export const REGION_INDEX = {};
REGIONS.forEach((r, i) => { REGION_INDEX[r.key] = i; });

// Фронт волны подсветки в покое — чуть за краем зоны (в долях spread);
// brain.js инициализирует им uniform-массив, тут же им же ограничиваем рост
export const WAVE_REST = 1.15;

// ---------- Тюнинг ----------
const GLOW_RISE = 5.0;   // 1/с: скорость разгорания области
const GLOW_FALL = 3.0;   // 1/с: затухание после снятия
const WAVE_FROM = 0.18;  // стартовый фронт волны при активации (каскад от центра)
const WAVE_SPEED = 1.6;  // spread/с: скорость расходящегося фронта
const FOCUS_DIST = 1.6;  // на каком расстоянии от якоря замирает камера
const SURFACE_R = 1.05;  // примерный радиус коры в направлении якоря (для полёта)

export function createRegions({ brain, rig, chips }) {
  // Значения этих массивов — те же объекты, что в uniforms шейдера brain.js:
  // пишем сюда — светится меш (единый источник состояния).
  const glow = brain.region.glow;
  const wave = brain.region.wave;
  const target = new Float32Array(REGIONS.length); // 0/1: куда стремится glow
  let active = -1;

  // Позиции якорей для полётов камеры — считаем один раз, в кадре нет new
  const anchorPos = REGIONS.map((r) =>
    new THREE.Vector3(r.dir[0], r.dir[1], r.dir[2]).normalize().multiplyScalar(SURFACE_R));

  // ---------- Чипы ----------
  const chipEls = REGIONS.map((r, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'region-chip';
    b.title = r.blurb;
    // --rc «r, g, b» — цвет области для рамок/точки через rgba(var(--rc), …)
    b.style.setProperty('--rc', `${(r.color >> 16) & 255}, ${(r.color >> 8) & 255}, ${r.color & 255}`);
    b.setAttribute('aria-pressed', 'false');
    const dot = document.createElement('span');
    dot.className = 'region-chip__dot';
    b.appendChild(dot);
    b.appendChild(document.createTextNode(r.short));
    b.addEventListener('click', () => toggle(i));
    return b;
  });
  const frag = document.createDocumentFragment();
  chipEls.forEach((el) => frag.appendChild(el));
  chips.appendChild(frag);

  // Активный чип — в центр скроллера (на узких экранах он мог быть за краем)
  function centerChip(i) {
    const el = chipEls[i];
    const left = el.offsetLeft - (chips.clientWidth - el.offsetWidth) / 2;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    chips.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  }

  // fly=false — только подсветка/чип, без полёта камеры (пр.11: карточка летит
  // к своей точке через markers.selectCard, полёт к якорю доли её перебивал)
  function toggle(i, fly = true) {
    if (active === i) { clearFocus(); return; } // повторный клик — снять подсветку
    if (active >= 0) {
      target[active] = 0;
      chipEls[active].classList.remove('region-chip--active');
      chipEls[active].setAttribute('aria-pressed', 'false');
    }
    active = i;
    target[i] = 1;
    wave[i] = WAVE_FROM; // каскад: фронт волны стартует от центра якоря
    chipEls[i].classList.add('region-chip--active');
    chipEls[i].setAttribute('aria-pressed', 'true');
    if (fly) rig.focusPoint(anchorPos[i], FOCUS_DIST);
    centerChip(i);
  }

  // Публичное API: режимы (S14) и карточки (S07) будут звать это программно
  function focusRegion(key, fly = true) {
    const i = REGION_INDEX[key];
    if (i !== undefined && i !== active) toggle(i, fly);
  }
  function clearFocus() {
    if (active < 0) return;
    target[active] = 0;
    chipEls[active].classList.remove('region-chip--active');
    chipEls[active].setAttribute('aria-pressed', 'false');
    active = -1;
  }

  // Режимы (S14): разжечь набор областей разом — без чипов и полётов камеры.
  // Каждая получает свой волновой каскад от якоря (WAVE_FROM), гаснут вместе в glowClear.
  function glowSet(keys) {
    clearFocus(); // если горел чип — погасить и его
    target.fill(0);
    for (const key of keys) {
      const i = REGION_INDEX[key];
      if (i !== undefined) {
        target[i] = 1;
        wave[i] = WAVE_FROM;
      }
    }
  }
  function glowClear() {
    clearFocus();
    target.fill(0);
  }

  return {
    focusRegion,
    clearFocus,
    glowSet, // подсветка набора областей для режимов (S14)
    glowClear,
    get activeKey() { return active >= 0 ? REGIONS[active].key : null; },
    update(dt) {
      for (let i = 0; i < REGIONS.length; i++) {
        const rate = target[i] > glow[i] ? GLOW_RISE : GLOW_FALL;
        glow[i] += (target[i] - glow[i]) * Math.min(1, rate * dt);
        if (target[i] > 0.5 && wave[i] < WAVE_REST) {
          wave[i] = Math.min(WAVE_REST, wave[i] + WAVE_SPEED * dt);
        }
      }
    },
    dispose() {
      for (const el of chipEls) el.remove(); // слушатели уходят вместе с узлами
      clearFocus();
    },
  };
}
