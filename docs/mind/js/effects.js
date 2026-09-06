// effects.js — «живой воздух» сцены (S08): фоновая пыль вокруг мозга, сеть
// связей-дуг между точками поверхности, бегущие импульсы-светлячки; кольцо-
// ударная волна — в shock.js. Пр.7: глубокие маркеры вне сети, связи дугами
// по поверхности (прямые хорды резали мозг насквозь).
// Всё аддитивное, без света и постобработки; дрейф пыли — в шейдере, импульсы — CPU
// (позиции пишутся в существующие буферы, никаких new в кадре — RULES §4).
// Связи и импульсы проявляются вместе с мозгом после интро (reveal, S09);
// пыль живёт с первого кадра — фону нечего «проявлять».

import * as THREE from '../lib/three.module.min.js';
import { REGIONS, REGION_INDEX } from './regions.js';
import { lerp } from './utils.js';
import { createShocks } from './shock.js';

// ---------- Тюнинг ----------
const DUST = { low: 600, medium: 1000, high: 1500 }; // частиц пыли по тиру
const DUST_R0 = 1.6;        // внутренний радиус оболочки пыли (сразу за мозгом)
const DUST_R1 = 3.2;        // внешний: камера крутится внутри облака
const DUST_COLOR = 0xa9c6e8; // S16: ледяная пыль — узлы созвездия, в тон плексусу
const LINK_OPACITY = 0.11;   // базовая сеть: на чёрном фоне чуть заметнее, чем было
const LINK_BRIGHT = 0.5;    // яркий слой связей активной области/точки
const IMPULSES = { low: 36, medium: 56, high: 80 }; // светлячков по тиру
const IMP_SIZE = 0.028;     // базовый размер импульса (мировые единицы)
const IMP_SPEED0 = 0.3;     // скорость пробега связи, доли связи в секунду
const IMP_SPEED1 = 0.65;

// ---------- Шейдеры ----------
const DUST_VERT = /* glsl */`
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uScale;
  varying float vTw;
  void main() {
    vec3 p = position;
    p.x += 0.05 * sin(uTime * 0.21 + aSeed * 7.0);  // медленный дрейф — бесплатно, в шейдере
    p.y += 0.04 * sin(uTime * 0.16 + aSeed * 13.0);
    p.z += 0.05 * sin(uTime * 0.24 + aSeed * 5.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vTw = 0.55 + 0.45 * sin(uTime * 0.7 + aSeed * 3.1); // мерцание
    gl_PointSize = clamp(aSize * uScale / -mv.z, 1.0, 6.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const DUST_FRAG = /* glsl */`
  uniform vec3 uColor;
  varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = pow(1.0 - d, 2.0) * 0.5 * vTw;
    gl_FragColor = vec4(uColor * a, a);
  }
`;
const IMP_VERT = /* glsl */`
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aProg; // 0..1 вдоль связи; <0 — ещё «в пути» к появлению
  uniform float uScale;
  uniform float uReveal; // проявление после интро (S09)
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // проявляются на старте связи и растворяются у финиша — без резких скачков
    vFade = smoothstep(0.0, 0.12, aProg) * (1.0 - smoothstep(0.85, 1.0, aProg)) * uReveal;
    vColor = aColor * (0.7 + 0.3 * vFade);
    gl_PointSize = clamp(aSize * uScale / -mv.z, 1.5, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const IMP_FRAG = /* glsl */`
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = smoothstep(0.6, 0.1, d);
    float a = core * vFade;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

export function createEffects({ scene, camera, canvas, tier, markers, regions, reveal }) {
  const pos = markers.positions;
  const col = markers.colors;
  const N = pos.length / 3;
  const rev = reveal || { value: 1 }; // общий {value} с мозгом — интро ведёт всю сцену

  // ---------- Пыль: оболочка случайных частиц, дрейф считает шейдер ----------
  const DC = DUST[tier];
  const dustPos = new Float32Array(DC * 3);
  const dustSeed = new Float32Array(DC);
  const dustSize = new Float32Array(DC);
  for (let i = 0; i < DC; i++) {
    const u = Math.random() * 2 - 1;
    const ph = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u); // равномерное направление на сфере
    const r = DUST_R0 + (DUST_R1 - DUST_R0) * Math.random();
    dustPos[i * 3] = s * Math.cos(ph) * r;
    dustPos[i * 3 + 1] = u * r;
    dustPos[i * 3 + 2] = s * Math.sin(ph) * r;
    dustSeed[i] = Math.random() * Math.PI * 2;
    dustSize[i] = 0.02 + Math.random() * 0.03;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uColor: { value: new THREE.Color(DUST_COLOR) },
    },
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  // ---------- Связи: уникальные пары из графа соседей markers.js ----------
  // пр.7: глубокие маркеры не участвуют — их «сеть» это золотые потоки deep.js,
  // а прямые хорды из глубины резали мозг насквозь. Оставшиеся связи выгнуты
  // дугой наружу (a → середина над поверхностью → b) — созвездие обнимает мозг
  const pairs = []; // { a, b, ri } — цвет связи = цвет области начала
  for (let i = 0; i < N; i++) {
    if (REGIONS[markers.regionOf[i]].deep) continue;
    for (const j of markers.neighbors[i]) {
      if (j > i && !REGIONS[markers.regionOf[j]].deep) pairs.push({ a: i, b: j, ri: markers.regionOf[i] });
    }
  }
  const P = pairs.length;
  const pairPos = new Float32Array(P * 12); // 2 сегмента на связь: a→mid, mid→b
  const pairMid = new Float32Array(P * 3);  // вершина дуги — по ней бегут импульсы
  const pairCol = new Float32Array(P * 12);
  const pairColB = new Float32Array(P * 12); // яркая версия для активного слоя
  for (let pi = 0; pi < P; pi++) {
    const p = pairs[pi];
    const a3 = p.a * 3;
    const b3 = p.b * 3;
    // вершина дуги: середина хорды, вытянутая чуть дальше радиуса концов
    const mx = (pos[a3] + pos[b3]) * 0.5;
    const my = (pos[a3 + 1] + pos[b3 + 1]) * 0.5;
    const mz = (pos[a3 + 2] + pos[b3 + 2]) * 0.5;
    const ml = Math.hypot(mx, my, mz) || 1;
    const mr = (Math.hypot(pos[a3], pos[a3 + 1], pos[a3 + 2])
      + Math.hypot(pos[b3], pos[b3 + 1], pos[b3 + 2])) * 0.52;
    const m3 = pi * 3;
    pairMid[m3] = (mx / ml) * mr;
    pairMid[m3 + 1] = (my / ml) * mr;
    pairMid[m3 + 2] = (mz / ml) * mr;
    const o = pi * 12;
    for (let v = 0; v < 3; v++) {
      pairPos[o + v] = pos[a3 + v];
      pairPos[o + 3 + v] = pairMid[m3 + v];
      pairPos[o + 6 + v] = pairMid[m3 + v];
      pairPos[o + 9 + v] = pos[b3 + v];
      pairCol[o + v] = pairCol[o + 3 + v] = pairCol[o + 6 + v] = pairCol[o + 9 + v] = col[a3 + v];
      pairColB[o + v] = pairColB[o + 3 + v] = pairColB[o + 6 + v] = pairColB[o + 9 + v] = Math.min(1, col[a3 + v] * 1.3 + 0.05);
    }
  }
  // Индексы связей по точке и по области — мгновенный фильтр для яркого слоя и импульсов
  const pointPairs = new Array(N);
  for (let i = 0; i < N; i++) pointPairs[i] = [];
  const regionPairs = new Array(REGIONS.length);
  for (let ri = 0; ri < regionPairs.length; ri++) regionPairs[ri] = [];
  const allPairs = new Array(P);
  for (let pi = 0; pi < P; pi++) {
    pointPairs[pairs[pi].a].push(pi);
    pointPairs[pairs[pi].b].push(pi);
    regionPairs[pairs[pi].ri].push(pi);
    allPairs[pi] = pi;
  }

  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(pairPos, 3));
  linkGeo.setAttribute('color', new THREE.BufferAttribute(pairCol, 3));
  const linkMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: LINK_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false, // дальние связи по-прежнему прячет глубина коры
  });
  const links = new THREE.LineSegments(linkGeo, linkMat);
  links.frustumCulled = false;
  scene.add(links);

  // Яркий слой: компактная выжимка нужных связей, перезаливается только по событию
  const brightPosArr = new Float32Array(P * 12);
  const brightColArr = new Float32Array(P * 12);
  const brightGeo = new THREE.BufferGeometry();
  const brightPosAttr = new THREE.BufferAttribute(brightPosArr, 3);
  const brightColAttr = new THREE.BufferAttribute(brightColArr, 3);
  brightGeo.setAttribute('position', brightPosAttr);
  brightGeo.setAttribute('color', brightColAttr);
  brightGeo.setDrawRange(0, 0);
  const brightMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: LINK_BRIGHT,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bright = new THREE.LineSegments(brightGeo, brightMat);
  bright.frustumCulled = false;
  scene.add(bright);

  function setBright(list) {
    if (!list || !list.length) {
      brightGeo.setDrawRange(0, 0);
      return;
    }
    for (let k = 0; k < list.length; k++) {
      const o = list[k] * 12;
      const d = k * 12;
      for (let v = 0; v < 12; v++) {
        brightPosArr[d + v] = pairPos[o + v];
        brightColArr[d + v] = pairColB[o + v];
      }
    }
    brightPosAttr.needsUpdate = true;
    brightColAttr.needsUpdate = true;
    brightGeo.setDrawRange(0, list.length * 4); // дуга = 2 сегмента = 4 вершины
  }

  // ---------- Импульсы-светлячки: бегут по связям, позиции пишет CPU ----------
  const IC = IMPULSES[tier];
  const impPosArr = new Float32Array(IC * 3);
  const impColArr = new Float32Array(IC * 3);
  const impSize = new Float32Array(IC);
  const impProg = new Float32Array(IC);
  const impLink = new Int32Array(IC);
  const impSpeed = new Float32Array(IC);
  const impFwd = new Uint8Array(IC); // 1: a→b, 0: b→a

  const impGeo = new THREE.BufferGeometry();
  const impPosAttr = new THREE.BufferAttribute(impPosArr, 3);
  const impColAttr = new THREE.BufferAttribute(impColArr, 3);
  impGeo.setAttribute('position', impPosAttr);
  impGeo.setAttribute('aColor', impColAttr);
  impGeo.setAttribute('aSize', new THREE.BufferAttribute(impSize, 1));
  impGeo.setAttribute('aProg', new THREE.BufferAttribute(impProg, 1));
  const impMat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, uReveal: rev },
    vertexShader: IMP_VERT,
    fragmentShader: IMP_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const impulses = new THREE.Points(impGeo, impMat);
  impulses.frustumCulled = false;
  scene.add(impulses);

  // prog0: Math.random() — старт по всей сети; 0 — обычный перезапуск;
  // отрицательное — пауза перед появлением (мягкое «стягивание» в область)
  function spawnImpulse(k, list, prog0) {
    impLink[k] = list[(Math.random() * list.length) | 0];
    impProg[k] = prog0;
    impSpeed[k] = IMP_SPEED0 + Math.random() * (IMP_SPEED1 - IMP_SPEED0);
    impFwd[k] = Math.random() < 0.5 ? 1 : 0;
    impSize[k] = IMP_SIZE * (0.6 + Math.random() * 0.5);
    const a3 = pairs[impLink[k]].a * 3; // светлячок цвета своей связи
    impColArr[k * 3] = col[a3];
    impColArr[k * 3 + 1] = col[a3 + 1];
    impColArr[k * 3 + 2] = col[a3 + 2];
  }

  // Связи активной области — для импульсов (при пустой области — вся сеть)
  function impulseList() {
    const key = regions.activeKey;
    if (!key) return allPairs;
    const ri = REGION_INDEX[key];
    if (ri !== undefined && regionPairs[ri].length) return regionPairs[ri];
    return allPairs;
  }

  // Яркий слой: созвездие выбранной точки > связи активной области > скрыт
  function brightList() {
    const sel = markers.getSelected();
    if (sel >= 0 && pointPairs[sel].length) return pointPairs[sel];
    const key = regions.activeKey;
    if (!key) return null;
    const ri = REGION_INDEX[key];
    return ri !== undefined ? regionPairs[ri] : null;
  }

  let impCacheKey = '\0';
  let brightCacheKey = '\0';
  for (let k = 0; k < IC; k++) spawnImpulse(k, allPairs, Math.random());
  impColAttr.needsUpdate = true;

  // ---------- Ударная волна: пул билборд-колец (модуль shock.js) ----------
  const shocks = createShocks(scene);

  // Кольцо в точке i, цветом её области (чуть светлее) — отклик на выбор карточки
  function shockAt(i) {
    if (i < 0 || i >= N) return;
    const k = i * 3;
    shocks.shockAt(pos[k], pos[k + 1], pos[k + 2], col[k], col[k + 1], col[k + 2]);
  }

  // uScale (пиксели на мировую единицу) — как в markers.js, зависит от высоты канваса
  let canvasH = 0;
  function syncScale() {
    if (canvas.height === canvasH) return;
    canvasH = canvas.height;
    const v = canvasH / (2 * Math.tan((camera.fov * Math.PI / 180) * 0.5));
    dustMat.uniforms.uScale.value = v;
    impMat.uniforms.uScale.value = v;
  }

  function update(dt, t) {
    syncScale();
    dustMat.uniforms.uTime.value = t;
    // LineBasicMaterial не умеет свою юниформу — opacity пишем из JS (две записи)
    linkMat.opacity = LINK_OPACITY * rev.value;
    brightMat.opacity = LINK_BRIGHT * rev.value;

    // яркий слой — только когда поменялся выбор/область (не каждый кадр)
    const bKey = markers.getSelected() >= 0 ? `p${markers.getSelected()}` : `r${regions.activeKey}`;
    if (bKey !== brightCacheKey) {
      setBright(brightList());
      brightCacheKey = bKey;
    }

    // импульсы: смена области — перерождаемся с задержкой, «стягиваемся» в неё
    const list = impulseList();
    const iKey = regions.activeKey || '';
    if (iKey !== impCacheKey) {
      for (let k = 0; k < IC; k++) spawnImpulse(k, list, -Math.random() * 0.7);
      impColAttr.needsUpdate = true;
      impCacheKey = iKey;
    }

    let colDirty = false;
    for (let k = 0; k < impActive; k++) {
      impProg[k] += impSpeed[k] * dt;
      if (impProg[k] >= 1) {
        spawnImpulse(k, list, 0);
        colDirty = true;
      }
      const raw = impProg[k];
      const pr = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      const q = impFwd[k] ? pr : 1 - pr;
      const li = impLink[k];
      const a3 = pairs[li].a * 3;
      const b3 = pairs[li].b * 3;
      const m3 = li * 3;
      // квадратичная дуга Безье a→mid→b: светлячок течёт по дуге связи
      impPosArr[k * 3] = lerp(lerp(pos[a3], pairMid[m3], q), lerp(pairMid[m3], pos[b3], q), q);
      impPosArr[k * 3 + 1] = lerp(lerp(pos[a3 + 1], pairMid[m3 + 1], q), lerp(pairMid[m3 + 1], pos[b3 + 1], q), q);
      impPosArr[k * 3 + 2] = lerp(lerp(pos[a3 + 2], pairMid[m3 + 2], q), lerp(pairMid[m3 + 2], pos[b3 + 2], q), q);
    }
    impPosAttr.needsUpdate = true;
    impGeo.attributes.aProg.needsUpdate = true;
    if (colDirty) impColAttr.needsUpdate = true;

    shocks.update(dt);
  }

  // ---------- Нагрузка (S15): менеджер качества просит долю пыли и импульсов ----------
  let impActive = IC, loadKey = 1;
  function setLoad(k) {
    const v = k < 0.2 ? 0.2 : k > 1 ? 1 : k;
    if (v === loadKey) return;
    loadKey = v;
    impActive = Math.max(1, Math.round(IC * v));
    impGeo.setDrawRange(0, impActive); // импульсы — рисуем и гоняем только активных
    dustGeo.setDrawRange(0, Math.max(1, Math.round(DC * v))); // пыль — просто рисуем половину (частицы случайны)
    for (let i = 0; i < impActive; i++) spawnImpulse(i, allPairs, Math.random()); // переселить светлячков
    impColAttr.needsUpdate = true;
  }

  function dispose() {
    scene.remove(dust);
    scene.remove(links);
    scene.remove(bright);
    scene.remove(impulses);
    shocks.dispose();
    dustGeo.dispose();
    dustMat.dispose();
    linkGeo.dispose();
    linkMat.dispose();
    brightGeo.dispose();
    brightMat.dispose();
    impGeo.dispose();
    impMat.dispose();
  }

  return {
    update,
    shockAt,
    setLoad,
    dispose,
  };
}
