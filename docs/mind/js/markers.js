// markers.js — 200 светящихся точек-карточек (S06–S09): размещение — прямо на
// отрисованных линиях узора (пр.10: пулы точек стримов/нитей, farthest-point),
// один THREE.Points с аддитивным шейдером (ядро + гало + пульс; дальняя от
// камеры сторона тише), hover с тултипом (десктоп), тап-выбор карточки:
// подсветка + полёт камеры; граф ближайших соседей и волна вспышек (S08);
// deep-точки сидят на глубоких структурах и оживают в рентгене (S09).
// Контент — источник истины: сколько карточек у региона, столько и точек.

import * as THREE from '../lib/three.module.min.js';
import { clamp, mulberry32 } from './utils.js';
import { REGIONS } from './regions.js';

const REG_N = REGIONS.length; // размер uniform-массива подсветки зон (пр.17)

// ---------- Тюнинг ----------
const MARKER_SEED = 42;  // seed размещения: смена — другая карта точек
const JITTER = 0.8;      // доля spread: разброс точек внутри зоны
const LIFT = 0.02;       // отрыв точки от поверхности вдоль нормали
const RAY_FROM = 3.2;    // лучи бросаем снаружи: изнутри FrontSide-меш не ловится
const RETRIES = 6;       // попыток размещения с сужающимся конусом при промахе
const DEEP_R = 0.5;      // deep-области: радиус внутри мозга (мешы и рентген — S09)
const SIZE = 0.06;       // базовый размер точки (мировые единицы; пр.9: крупнее —
                         // огоньки коры шумят, кликабельные точки должны читаться)
const SIZE_VAR = 0.3;    // разброс размеров точек (+30%)
const PULSE_SPEED = 1.6; // 1/с: мерцание точек (в противофазе через aPhase)
const HOVER_SIZE = 0.8;  // увеличение точки при hover
const HOVER_GLOW = 0.9;  // добавочная яркость при hover
const STATE_DIM = 0.26;  // яркость чужих точек при активной области (пр.9: тише)
const STATE_BOOST = 1.55; // яркость точек активной области
const PICK_BASE = 0.045; // базовый порог hover (мировые единицы)
const PICK_FAR = 3.2;    // дистанция камеры, начиная с которой порог растёт
const ACTIVE_BOOST = 2.2; // яркость выбранной точки (открыта карточка, S07)
const TAP_PX = 8;         // px: смещение до которого pointerup — тап, а не drag
const TAP_TOUCH = 1.6;    // порог выбора пальцем шире, чем курсором
const NEIGHBORS_K = 3;    // связей на точку: граф ближайших соседей (S08)
const FLASH_DECAY = 3.0;  // 1/с: затухание вспышки соседа
const FLASH_BOOST = 1.2;  // добавка яркости вспышки поверх обычного состояния
const FLASH_WAVE = 1.4;   // с задержки на единицу расстояния: дальний сосед вспыхивает позже
const DEEP_PICK = 0.4;    // порог свечения глубины, от которого deep-точки кликабельны (S09)
const FRONT_MIN = 0.5;    // пр.12: кликабельна вся ближняя половина — граница та же, что
                          // и растворение в шейдере: видно = кликабельно, полутонов нет
const FAR_SPAN = 1.1;     // пр.11: полуширина фронта (±1.1 от центра: 1=перед, 0=тыл)

// ---------- Шейдер точек ----------
const MARKER_VERT = /* glsl */`
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSize;
  attribute float aState; // множитель яркости: обычная / приглушена / активна
  attribute float aHover; // 0/1 — курсор над точкой
  attribute float aDeep;  // 1 — точка глубины: живёт только в рентгене (S09)
  attribute float aRegion; // индекс области точки — подсветка зоны (пр.17)
  uniform float uTime;
  uniform float uScale;   // пикселей на мировую единицу на дистанции 1
  uniform float uReveal;  // проявление сцены после интро (S09)
  uniform float uDeepGlow; // свечение глубины = прогресс рентгена (общий с мозгом)
  uniform float uRegionGlow[${REG_N}]; // тот же массив подсветки, что у коры (пр.17)
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Пр.11: front = 1 у камеры, 0 за мозгом. Пр.12: граница резкая, на самом
    // силуэте — вся ближняя половина горит полноценно, за лимбом точка тает за
    // 0.03 фронта. Видно = кликабельно: полупрозрачных «мёртвых» точек больше нет.
    vec4 ctr = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float front = clamp(0.5 + (mv.z - ctr.z) / ${(FAR_SPAN * 2).toFixed(1)}, 0.0, 1.0);
    float vis = mix(smoothstep(0.47, 0.5, front), 1.0, aDeep); // deep держит рентген
    // вне рентгена deep-точка — тлеющий фон (×0.135 и на треть мельче), не кнопка
    float deepOn = smoothstep(0.25, 0.6, uDeepGlow);
    float deepGate = mix(uDeepGlow * 0.45, uDeepGlow, deepOn);
    // пр.17: маркер горящей зоны (чип или шаг режима) вспыхивает поверх состояний
    float zoneGlow = 0.0;
    for (int i = 0; i < ${REG_N}; i++) {
      if (float(i) == aRegion) zoneGlow = uRegionGlow[i];
    }
    float pulse = 0.78 + 0.22 * sin(uTime * ${PULSE_SPEED.toFixed(1)} + aPhase);
    gl_PointSize = clamp(
      aSize * (1.0 + ${HOVER_SIZE.toFixed(1)} * aHover) * pulse * uScale / -mv.z
        * (0.6 + 0.4 * vis) * mix(1.0, 0.65, aDeep * (1.0 - deepOn))
        * (1.0 + 0.35 * zoneGlow),
      2.4, 90.0);
    vColor = aColor * (aState * pulse * (1.0 + ${HOVER_GLOW.toFixed(1)} * aHover))
      * mix(1.0, deepGate, aDeep) * uReveal * (0.05 + 0.95 * vis) * (1.0 + 0.35 * front)
      * (1.0 + 2.0 * zoneGlow);
    gl_Position = projectionMatrix * mv;
  }
`;

const MARKER_FRAG = /* glsl */`
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0; // 0 в центре, 1 на краю спрайта
    if (d > 1.0) discard;
    // Пр.9: крупнее ядро и шире гало — маркеры не тонут в огоньках коры
    float core = smoothstep(0.62, 0.08, d);  // яркое ядро
    float halo = pow(1.0 - d, 2.0) * 0.9;    // мягкое гало до краёв
    gl_FragColor = vec4(vColor * (core + halo), 1.0);
  }
`;

export function createMarkers({ cards, brain, camera, rig, canvas, regions, tooltip, onSelect, onHover, focusDist = 2.0 }) {
  const N = cards.length;
  console.log('markers:', N); // приёмка S06: счётчик в консоли при старте

  const surface = brain.surface;
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const phases = new Float32Array(N);
  const sizes = new Float32Array(N);
  const states = new Float32Array(N).fill(1);
  const hovers = new Float32Array(N);
  const deepFlags = new Float32Array(N); // 1 — точка глубины (S09)
  const regionOf = new Uint8Array(N); // индекс области — для hover-фильтра и подсветки
  const cardOf = new Array(N);
  const idxById = new Map(); // id карточки → индекс точки: выбор по ссылке #id (S07)

  // ---------- Размещение (один раз при старте; в кадре никаких new) ----------
  const ray = new THREE.Raycaster();
  const _o = new THREE.Vector3();
  const _n = new THREE.Vector3();
  const _t1 = new THREE.Vector3();
  const _t2 = new THREE.Vector3();
  const _tan = new THREE.Vector3();
  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  const _ref = new THREE.Vector3();

  // Луч «снаружи внутрь» по направлению dir: первое пересечение = внешняя
  // поверхность. Изнутри наружу не годится — FrontSide-меши выход изнутри не ловят.
  function surfaceHit(mesh, dir, out) {
    _o.copy(dir).multiplyScalar(RAY_FROM);
    ray.set(_o, _n.copy(dir).negate());
    const hits = ray.intersectObject(mesh, false);
    if (!hits.length) return false;
    out.copy(hits[0].point);
    if (hits[0].normal) out.addScaledVector(_n.copy(hits[0].normal).normalize(), LIFT);
    else out.addScaledVector(_t1.copy(out).normalize(), LIFT); // запасной путь: радиально
    return true;
  }

  // Deep-структура (S09): луч от точки за пределами структуры к её центру —
  // первое пересечение = ближняя сторона поверхности merged-меша глубины
  function deepHit(anchor, jd, out) {
    _t2.set(anchor.center[0], anchor.center[1], anchor.center[2]);
    _o.copy(_t2).addScaledVector(jd, anchor.radius * 2.4);
    ray.set(_o, _n.copy(_t2).sub(_o).normalize());
    const hits = ray.intersectObject(surface.deepMesh, false);
    if (!hits.length) return false;
    out.copy(hits[0].point);
    if (hits[0].normal) out.addScaledVector(hits[0].normal.normalize(), LIFT);
    return true;
  }

  // Случайное направление в конусе вокруг оси axis (равномерно по диску зоны)
  function coneDir(axis, maxA, rand, out) {
    _t1.set(0, 1, 0);
    if (Math.abs(axis.y) > 0.9) _t1.set(1, 0, 0);
    _t1.crossVectors(_t1, axis).normalize();
    _t2.crossVectors(axis, _t1);
    const cosA = 1 - Math.sqrt(rand()) * (1 - Math.cos(maxA));
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const phi = rand() * Math.PI * 2;
    out.copy(axis).multiplyScalar(cosA)
      .addScaledVector(_t1, Math.cos(phi) * sinA)
      .addScaledVector(_t2, Math.sin(phi) * sinA)
      .normalize();
  }

  // Точка на трубке ствола: параметр вдоль кривой + угол вокруг неё
  function stemPoint(u, ang, radius, out) {
    surface.stemCurve.getPoint(u, out);
    surface.stemCurve.getTangent(u, _tan);
    _ref.set(0, 1, 0);
    if (Math.abs(_tan.y) > 0.9) _ref.set(1, 0, 0); // опорный вектор не параллелен касательной
    _a.crossVectors(_tan, _ref).normalize();
    _b.crossVectors(_tan, _a);
    out.addScaledVector(_a, Math.cos(ang) * radius).addScaledVector(_b, Math.sin(ang) * radius);
  }

  const GOLDEN = 2.399963; // золотой угол: спираль вокруг ствола без сгустков
  const pos = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const jd = new THREE.Vector3();

  // ---------- Пулы отрисованных линий (пр.10) ----------
  // Кандидаты — точки стримов коры/мозжечка и нитей ствола: они уже стоят на
  // изолиниях узора. Выбор — farthest-point sampling: маркеры максимально
  // разнесены, раскладка детерминирована seed'ом области.
  function buildPool(geo, ri, toWorld) {
    const p = geo.attributes.position;
    const reg = geo.attributes.aRegion;
    const tmp = new Float32Array(p.count * 3); // верхняя оценка, подрежем
    let w = 0;
    for (let i = 0; i < p.count; i++) {
      if (reg.getX(i) !== ri) continue;
      tmp[w] = p.getX(i); tmp[w + 1] = p.getY(i); tmp[w + 2] = p.getZ(i);
      w += 3;
    }
    const pool = tmp.slice(0, w);
    if (toWorld) { // стримы мозжечка пеклись в его локальных координатах
      const v = new THREE.Vector3();
      for (let i = 0; i < w; i += 3) {
        v.set(pool[i], pool[i + 1], pool[i + 2]).applyMatrix4(toWorld);
        pool[i] = v.x; pool[i + 1] = v.y; pool[i + 2] = v.z;
      }
    }
    return pool;
  }

  function pickSpots(pool, count, rand) {
    const n = pool.length / 3;
    const sel = [];
    const mind = new Float32Array(n).fill(Infinity); // дистанция² до выбранных
    let cur = Math.floor(rand() * n);
    for (let c = 0; c < count && c < n; c++) {
      sel.push(cur);
      let best = -1;
      let bd = -1;
      for (let i = 0; i < n; i++) {
        const dx = pool[i * 3] - pool[cur * 3];
        const dy = pool[i * 3 + 1] - pool[cur * 3 + 1];
        const dz = pool[i * 3 + 2] - pool[cur * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < mind[i]) mind[i] = d2;
        if (mind[i] > bd) { bd = mind[i]; best = i; }
      }
      cur = best;
    }
    return sel;
  }

  const poolCache = new Map(); // ri → пул мировых позиций (строится один раз)
  function poolFor(ri) {
    if (!poolCache.has(ri)) {
      const key = REGIONS[ri].key;
      const src = key === 'brainstem' ? surface.spots.brainstem
        : key === 'cerebellum' ? surface.spots.cerebellum : surface.spots.cortex;
      const toWorld = key === 'cerebellum' ? surface.spots.cerebellumToWorld : null;
      poolCache.set(ri, buildPool(src, ri, toWorld));
    }
    return poolCache.get(ri);
  }

  let m = 0;
  REGIONS.forEach((r, ri) => {
    const rand = mulberry32((MARKER_SEED + ri * 131) >>> 0); // свой seed на область
    const regionCards = cards.filter((c) => c.region === r.key);
    dir.set(r.dir[0], r.dir[1], r.dir[2]).normalize();

    // Пр.10: точки прямо на отрисованных линиях (если пул области достаточен)
    const pool = r.cortex || r.key === 'cerebellum' || r.key === 'brainstem'
      ? poolFor(ri) : null;
    const sel = pool && pool.length / 3 >= regionCards.length
      ? pickSpots(pool, regionCards.length, rand)
      : null;

    regionCards.forEach((card, ci) => {
      if (r.key === 'brainstem') {
        if (sel) { // пр.10: на нитях-корнях
          pos.set(pool[sel[ci] * 3], pool[sel[ci] * 3 + 1], pool[sel[ci] * 3 + 2]);
        } else {
          // Ствол — тонкая трубка: конус+луч часто промахивается, поэтому точки
          // идут прямо по кривой, виток за витком (равномерно и детерминированно)
          const n = regionCards.length;
          const u = clamp((ci + 0.5) / n + (rand() - 0.5) / n, 0.02, 0.98);
          stemPoint(u, ci * GOLDEN + rand() * 0.6, surface.stemRadius + LIFT, pos);
        }
      } else if (r.cortex || r.key === 'cerebellum') {
        if (sel) { // пр.10: на изолиниях узора своей доли
          pos.set(pool[sel[ci] * 3], pool[sel[ci] * 3 + 1], pool[sel[ci] * 3 + 2]);
        } else {
          const mesh = r.cortex ? surface.cortex : surface.cerebellum;
          let placed = false;
          let maxA = r.spread * JITTER;
          for (let a = 0; a < RETRIES && !placed; a++) {
            coneDir(dir, maxA, rand, jd);
            placed = surfaceHit(mesh, jd, pos);
            if (!placed) maxA *= 0.7; // промах — конус уже, следующая попытка
          }
          if (!placed && !surfaceHit(mesh, dir, pos)) pos.copy(dir).multiplyScalar(1.02);
        }
      } else {
        // Глубина (S09): прилипаем к поверхности своей структуры; у зеркальных
        // пар точки чередуют стороны, чтобы светились обе половины
        const anchor = surface.deepAnchors[r.key];
        let placed = false;
        if (anchor) {
          let maxA = r.spread * JITTER;
          for (let a = 0; a < RETRIES && !placed; a++) {
            coneDir(dir, maxA, rand, jd);
            if (anchor.mirror && (ci & 1)) jd.x = -jd.x;
            placed = deepHit(anchor, jd, pos);
            if (!placed) maxA *= 0.7;
          }
          if (!placed) {
            coneDir(dir, r.spread * JITTER * 0.5, rand, jd);
            if (anchor.mirror && (ci & 1)) jd.x = -jd.x;
            placed = deepHit(anchor, jd, pos);
          }
        }
        if (!placed) pos.copy(jd).multiplyScalar(DEEP_R); // страховка: шар внутри
      }

      positions[m * 3] = pos.x;
      positions[m * 3 + 1] = pos.y;
      positions[m * 3 + 2] = pos.z;
      colors[m * 3] = ((r.color >> 16) & 255) / 255; // сырой sRGB, как у чипов
      colors[m * 3 + 1] = ((r.color >> 8) & 255) / 255;
      colors[m * 3 + 2] = (r.color & 255) / 255;
      phases[m] = rand() * Math.PI * 2;
      sizes[m] = SIZE * (1 - SIZE_VAR / 2 + rand() * SIZE_VAR);
      regionOf[m] = ri;
      deepFlags[m] = r.deep ? 1 : 0;
      cardOf[m] = card;
      idxById.set(card.id, m);
      m++;
    });
  });

  // ---------- Граф соседей (S08): K ближайших точек — связи-линии и волна вспышек ----------
  // Считается один раз при старте: 200×200 дистанций и сортировка — копейки вне кадра.
  const neighbors = new Array(N);
  for (let i = 0; i < N; i++) {
    const cand = [];
    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      cand.push({ j, d2: dx * dx + dy * dy + dz * dz });
    }
    cand.sort((a, b) => a.d2 - b.d2);
    const list = new Array(Math.min(NEIGHBORS_K, cand.length));
    for (let k = 0; k < list.length; k++) list[k] = cand[k].j;
    neighbors[i] = list;
  }

  // ---------- Объект Points ----------
  const geo = new THREE.BufferGeometry();
  const hoverAttr = new THREE.BufferAttribute(hovers, 1);
  const stateAttr = new THREE.BufferAttribute(states, 1);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aState', stateAttr);
  geo.setAttribute('aHover', hoverAttr);
  geo.setAttribute('aDeep', new THREE.BufferAttribute(deepFlags, 1));
  geo.setAttribute('aRegion', new THREE.BufferAttribute(regionOf, 1)); // пр.17: зона
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.6); // вручную: всё в пределах мозга

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uReveal: brain.reveal,   // общий с мозгом объект {value}: интро ведёт всех (S09)
      uDeepGlow: brain.deepGlow, // рентген: deep-точки проявляются вместе со структурами
      uRegionGlow: { value: brain.region.glow }, // пр.17: подсветка зон — общая с мозгом
    },
    vertexShader: MARKER_VERT,
    fragmentShader: MARKER_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending, // глубина коры по-прежнему прячет дальние точки
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // один объект всегда у центра кадра

  // uScale: пиксели кадра на мировую единицу на дистанции 1 — зависит от высоты
  let canvasH = 0;
  function syncScale() {
    if (canvas.height === canvasH) return;
    canvasH = canvas.height;
    mat.uniforms.uScale.value = canvasH / (2 * Math.tan((camera.fov * Math.PI / 180) * 0.5));
  }

  // ---------- Состояния точек: выбранная карточка > режим (S14) > активная область ----------
  let activeKeyCache = null;
  let selectedIdx = -1; // открыта карточка этой точки (S07)
  let modeSet = null;   // Set индексов: точки горят в режиме, остальные приглушены
  const baseStates = new Float32Array(N).fill(1); // состояние без вспышек (S08)
  const flash = new Float32Array(N);              // яркость вспышки соседа, затухает в update
  const pendingFlashes = [];                      // { j, wait } — отложенные волной клика

  function applyStates() {
    const key = regions.activeKey;
    for (let i = 0; i < N; i++) {
      if (selectedIdx >= 0) baseStates[i] = i === selectedIdx ? ACTIVE_BOOST : STATE_DIM;
      else if (modeSet) baseStates[i] = modeSet.has(i) ? STATE_BOOST : STATE_DIM;
      else baseStates[i] = key ? (cardOf[i].region === key ? STATE_BOOST : STATE_DIM) : 1;
    }
    activeKeyCache = key;
    writeStates();
  }

  // Атрибут = база + вспышка: вспышки живут отдельно и гаснут в update, база не портится
  function writeStates() {
    for (let i = 0; i < N; i++) states[i] = baseStates[i] + flash[i] * FLASH_BOOST;
    stateAttr.needsUpdate = true;
  }

  // ---------- Тап-выбор (S07 + рентген S09; пр.12: граница = видимость) ----------
  // Кора — аддитивное стекло: deep-точки кликабельны только в рентгене.
  // Пр.10 мерил клики сферой-окклюдером, а гасила яркость другая граница —
  // оставалось кольцо видимых, но мёртвых точек. Пр.12: один критерий — фронт
  // точки, та же формула, что в шейдере: кликабельна вся ближняя половина,
  // дальняя и не видна, и не выбирается (сфера-окклюдер больше не нужна).
  function frontOf(i) {
    if (deepFlags[i]) return 1; // deep фронтом не гейтится — их держит рентген
    const e = camera.matrixWorldInverse.elements; // третья строка вью-матрицы
    return 0.5 + (e[2] * positions[i * 3] + e[6] * positions[i * 3 + 1]
      + e[10] * positions[i * 3 + 2]) / (FAR_SPAN * 2);
  }

  function pick(clientX, clientY, touch) {
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.params.Points.threshold = PICK_BASE * clamp(rig.getState().radius / PICK_FAR, 1, 2.2)
      * (touch ? TAP_TOUCH : 1);
    const hits = ray.intersectObject(points, false);
    if (!hits.length) return -1;
    const deepOff = brain.deepGlow.value < DEEP_PICK; // рентген не включён — глубина заперта
    for (let h = 0; h < hits.length; h++) {
      const i = hits[h].index;
      if (REGIONS[regionOf[i]].deep && deepOff) continue; // глубина недоступна вне рентгена
      if (frontOf(i) < FRONT_MIN) continue; // пр.12: тыл невидим — и не кликается
      return i;
    }
    return -1;
  }

  // Тап ≠ drag: до TAP_PX смещения и ровно один палец (щипок зума не считается).
  // armed страхует от pointerup мимо канваса (палец приехал с панели карточки).
  let downCount = 0;
  let multi = false;
  let armed = false;
  let downX = 0;
  let downY = 0;
  function onTapDown(e) {
    downCount++;
    if (downCount > 1) { multi = true; return; }
    downX = e.clientX;
    downY = e.clientY;
    multi = false;
    armed = true;
  }
  function onTapUp(e) {
    downCount = Math.max(0, downCount - 1);
    if (downCount > 0 || !armed) return;
    armed = false;
    const wasMulti = multi;
    multi = false;
    if (wasMulti) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_PX) return; // это был drag
    const i = pick(e.clientX, e.clientY, e.pointerType === 'touch');
    if (onSelect) onSelect(i >= 0 ? cardOf[i] : null); // null — тап мимо: решение за main
  }
  function onTapCancel() {
    downCount = Math.max(0, downCount - 1);
    if (downCount === 0) { multi = false; armed = false; }
  }
  canvas.addEventListener('pointerdown', onTapDown);
  canvas.addEventListener('pointerup', onTapUp);
  canvas.addEventListener('pointercancel', onTapCancel);

  // ---------- Выбор точки: состояние + полёт камеры + волна вспышек ----------
  function markerDist(a, b) {
    const dx = positions[a * 3] - positions[b * 3];
    const dy = positions[a * 3 + 1] - positions[b * 3 + 1];
    const dz = positions[a * 3 + 2] - positions[b * 3 + 2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Соседи соседей вспыхивают с задержкой по расстоянию от клика — получается «волна»
  function flashCascade(i) {
    const seen = new Set([i]);
    for (const j of neighbors[i]) {
      const d1 = markerDist(i, j);
      pendingFlashes.push({ j, wait: d1 * FLASH_WAVE });
      for (const k of neighbors[j]) {
        if (seen.has(k)) continue;
        seen.add(k);
        pendingFlashes.push({ j: k, wait: (d1 + markerDist(j, k)) * FLASH_WAVE });
      }
    }
  }

  function selectCard(card) {
    const i = idxById.get(card.id);
    if (i === undefined) return;
    selectedIdx = i;
    applyStates();
    _t1.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    rig.focusPoint(_t1, focusDist); // камера вдоль радиуса точки — точка в центре кадра
    flashCascade(i); // соседи отвечают волной вспышек (S08)
  }
  function deselect() {
    if (selectedIdx < 0) return;
    selectedIdx = -1;
    applyStates();
  }

  // Режимы (S14): перечисленные id карточек горят ярче, остальные приглушены;
  // пустой список/null — снять. Неизвестные id молча пропускаем (защита от опечатки).
  function setModeSet(ids) {
    modeSet = null;
    if (ids && ids.length) {
      modeSet = new Set();
      for (const id of ids) {
        const i = idxById.get(id);
        if (i !== undefined) modeSet.add(i);
      }
      if (!modeSet.size) modeSet = null;
    }
    applyStates();
  }

  // ---------- Hover + тултип (только десктоп) ----------
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ndc = new THREE.Vector2();
  let hasPointer = false;
  let hoverIdx = -1;

  const tipTitle = document.createElement('div');
  tipTitle.className = 'tooltip__title';
  const tipSub = document.createElement('div');
  tipSub.className = 'tooltip__sub';
  tooltip.replaceChildren(tipTitle, tipSub);

  function setHover(i) {
    if (i === hoverIdx) return;
    if (onHover) onHover(i >= 0); // звуковой тик (S14): навели/сняли
    if (hoverIdx >= 0) hovers[hoverIdx] = 0;
    hoverIdx = i;
    if (i >= 0) hovers[i] = 1;
    hoverAttr.needsUpdate = true;
    canvas.style.cursor = i >= 0 ? 'pointer' : '';
    if (i >= 0) {
      const card = cardOf[i];
      const r = REGIONS[regionOf[i]];
      tipTitle.textContent = card.title || r.name;
      tipSub.textContent = card.title && card.title !== r.name ? r.name : 'заглушка — контент в S10–S13';
      tooltip.classList.remove('is-hidden');
    } else {
      tooltip.classList.add('is-hidden');
    }
  }

  function onMove(e) {
    hasPointer = true;
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
  }
  function onLeave() {
    hasPointer = false;
  }
  if (canHover) {
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
  }

  return {
    object: points,
    selectCard,
    deselect,
    setModeSet,                     // подсветка списка точек в режимах (S14)
    neighbors,                      // граф K-ближайших: связи и вспышки (S08 → effects.js)
    positions,                      // геометрия точек — для эффектов
    colors,                         // цвета точек — для ударной волны
    regionOf,                       // индекс области каждой точки — фильтры связей
    getSelected: () => selectedIdx, // effects.js: созвездие выбранной точки
    update(dt, t) {
      mat.uniforms.uTime.value = t;
      syncScale();

      const key = regions.activeKey;
      if (key !== activeKeyCache) applyStates();

      // S08: очередь волны догорает — дошедшие вспыхивают, горящие равномерно тухнут
      if (pendingFlashes.length) {
        for (let p = pendingFlashes.length - 1; p >= 0; p--) {
          pendingFlashes[p].wait -= dt;
          if (pendingFlashes[p].wait <= 0) {
            flash[pendingFlashes[p].j] = 1;
            pendingFlashes.splice(p, 1);
          }
        }
      }
      let anyFlash = pendingFlashes.length > 0;
      if (!anyFlash) {
        for (let i = 0; i < N; i++) if (flash[i] > 0) { anyFlash = true; break; }
      }
      if (anyFlash) {
        const damp = Math.exp(-FLASH_DECAY * dt);
        for (let i = 0; i < N; i++) {
          if (flash[i] > 0) {
            flash[i] *= damp;
            if (flash[i] < 0.02) flash[i] = 0; // погасла окончательно
          }
        }
        writeStates();
      }

      // Пересчёт hover каждый кадр: сцена крутится и под курсором без движения мыши
      if (!canHover || !hasPointer || rig.isDragging()) {
        setHover(-1);
        return;
      }
      ray.setFromCamera(ndc, camera);
      ray.params.Points.threshold = PICK_BASE * clamp(rig.getState().radius / PICK_FAR, 1, 2.2);
      const hits = ray.intersectObject(points, false);
      const deepOff = brain.deepGlow.value < DEEP_PICK; // вне рентгена deep не ховерится
      let idx = -1;
      for (let h = 0; h < hits.length; h++) {
        const i = hits[h].index;
        // пр.11: гейт как в pick() (был инвертирован — deep подписывалась вне
        // рентгена, но не открывалась, а в рентгене наоборот)
        if (REGIONS[regionOf[i]].deep && deepOff) continue;
        if (frontOf(i) < FRONT_MIN) continue; // пр.12: тыл не подсвечивается
        idx = i;
        break;
      }
      setHover(idx);
    },
    dispose() {
      if (canHover) {
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
      }
      canvas.removeEventListener('pointerdown', onTapDown);
      canvas.removeEventListener('pointerup', onTapUp);
      canvas.removeEventListener('pointercancel', onTapCancel);
      setHover(-1);
      deselect();
      geo.dispose();
      mat.dispose();
      points.removeFromParent();
    },
  };
}
