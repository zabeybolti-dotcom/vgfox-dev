// brain.js — процедурный мозг: силуэт (S03), извилины/шейдер/мозжечок/ствол (S04),
// подсветка областей через общие uniform-массивы (S05), проявление после интро
// и рентген-прозрачность коры (S09). S16 — тёмное тело, герой — линии: топо-
// изолинии извилин и швы долей (hololines.js, пр.6), точки — огоньки-потоки
// вдоль изолиний (streams.js, пр.8), глубина — золотые облака и потоки частиц
// (deep.js, пр.7), ствол — нити-корни. Форма и поля складок — gyri.js.
// Пр.9: подсветка области — по запечённому aRegion (светится узор своей доли,
// чужие гаснут, vCalm). Геометрия строится один раз при старте; в кадре — только uTime.
// Пр.10: aRegion — чистый Вороной (= швы), подсветка только по линиям узора,
// дальняя от камеры сторона тише, маркеры садятся прямо на отрисованные линии.

import * as THREE from '../lib/three.module.min.js';
import { clamp, smoothstep, createNoise3D } from './utils.js';
import { REGIONS, REGION_INDEX, WAVE_REST } from './regions.js';
import { bakeLobe, makeTopoMaterial, makeStemStrands } from './hololines.js';
import { GYRI_SEED, CB_SEED, RIDGE_NORM, CB_RIDGE_NORM, cortexShape, cortexGyri, cerebellumRidges } from './gyri.js';
import { makeCortexStreams, makeCbStreams } from './streams.js';
import { createDeep } from './deep.js';

// ---------- Мозжечок: постановка и мишень (поле фолий — в gyri.js) ----------
const CB_POS = [0, -0.38, -0.58];   // под затылочной долей, вплотную (пр.7)
const CB_SCALE = [0.58, 0.36, 0.42]; // широкий приплюснутый эллипсоид
const CB_SEGMENTS = [48, 32];        // меш маленький — сегментов достаточно

// ---------- Ствол (S04) ----------
const STEM_POINTS = [         // от дна мозга вниз с лёгким изгибом вперёд
  [0, -0.42, -0.30],
  [0, -0.66, -0.24],
  [0, -0.88, -0.13],
  [0, -1.04, -0.02],
];
const STEM_RADIUS = 0.095;
const STEM_TUBE = 48;         // сегментов вдоль кривой
const STEM_RADIAL = 10;       // сегментов по окружности

// ---------- Рентген и проявление (S09) ----------
const XRAY_DUR = 0.8;         // с: ход коры в прозрачность и обратно
const DEEP_FADE0 = 0.15;      // порог uXray, где глубина начинает вспыхивать
const DEEP_FADE1 = 0.85;      // …и где вспыхивает полностью

// Сегментация сферы по тирам (RULES §3: 112/144/192 по экватору)
const SEGMENTS = { low: 112, medium: 144, high: 192 };

// ---------- Области (S05) ----------
const REG_N = REGIONS.length;

// Общие uniform-объекты подсветки: {value} одни и те же у всех трёх материалов —
// запись в массивы (её делает regions.js) обновляет все меши разом.
const regionUniforms = {
  uRegionDirs: { value: REGIONS.map((r) => new THREE.Vector3(r.dir[0], r.dir[1], r.dir[2]).normalize()) },
  uRegionSpread: { value: REGIONS.map((r) => r.spread) },
  uRegionColors: { value: REGIONS.map((r) => srgbVec3(r.color)) },
  uRegionGlow: { value: new Array(REG_N).fill(0) },
  uRegionWave: { value: new Array(REG_N).fill(WAVE_REST) },
};

// ---------- Силуэт коры (S03) ----------
// Шаги силуэта — чистая функция cortexShape (gyri.js, пр.8): её же использует
// трассировщик изолиний, точки-потоки ложатся ровно на поверхность меша.
function deformCortex(geo) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); // точка единичной сферы
    cortexShape(v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// ---------- Извилины (S04) ----------
// Сдвиг вдоль РАДИУСА, а не вершинных нормалей: у сферы совпадающие вершины швов
// и полюсов получают разные нормали — вдоль нормалей они бы разошлись трещинами.
function displaceRadially(geo, dispFn, ridgeOut = null) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const d = dispFn(x, y, z);
    if (ridgeOut) ridgeOut[i] = d; // S16: сырой рельеф — борозды отрицательны
    const k = d / (Math.hypot(x, y, z) || 1);
    pos.setXYZ(i, x * (1 + k), y * (1 + k), z * (1 + k));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Ridged-поля складок коры и фолий мозжечка — gyri.js (пр.8): чистые функции
// без геометрии, их же использует трассировщик streams.js.

// ---------- Шейдер (S04 + области S05 + огоньки-точки S16) ----------
// Вершина одна для всех облаков точек мозга (кора/мозжечок/ствол).
const BRAIN_VERT = /* glsl */`
  uniform float uTime;
  uniform float uSelfRegion; // −1 — кора (подсветка по aRegion), ≥0 — меш сам регион
  uniform vec3 uRegionColors[${REG_N}];
  uniform float uRegionGlow[${REG_N}];
  attribute float aRidge;    // S16: рельеф (борозды → 1); у ствола нет = 0
  attribute float aFlow;     // пр.8: доля длины вдоль линии-потока (0..1)
  attribute vec3 aLobe;      // пр.4: неон доли — запечён по ближайшему якорю
  attribute float aBound;    // пр.4: шов между долями — подсвеченный контур
  attribute float aRegion;   // пр.9: индекс региона в REGIONS, −1 — «ничей»
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vRegion;
  varying float vPhase;
  varying vec3 vLobe;        // неон доли (из aLobe) — горит всегда
  varying float vVein;       // жила борозды — белое ядро точки
  varying float vBound;      // шов долей — яркий контур
  varying float vGlow;       // итоговая яркость точки: база + жила + кромка
  varying float vCalm;       // пр.9: гашение чужих долей при активной области

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vPhase = hash13(position * 41.0);

    // Точка-«нейрон»: в бороздах ярче и крупнее, на кромке силуэта и швах — тоже,
    // каждая мерцает в своей фазе. Пр.8: точки стоят вдоль изолиний складок
    // (streams.js) — по aFlow бежит импульс, огоньки «текут» по извилинам.
    // Пр.9: импульс и потолок размера тише — маркеры-точки читаются поверх.
    // Пр.11: front = 1 у камеры, 0 за мозгом (в пр.10 знак был перевёрнут).
    // Пр.12: контраст сильнее — ближняя половина ярче прежнего, дальняя почти гаснет
    vec4 mv = viewMatrix * wp;
    vec4 ctr = viewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float front = clamp(0.5 + (mv.z - ctr.z) / 2.4, 0.0, 1.0);
    float ndv = abs(dot(normalize(vNormal), normalize(cameraPosition - wp.xyz)));
    float rim = pow(1.0 - ndv, 1.7);
    float vein = smoothstep(0.5, 0.95, aRidge);
    float tw = 0.62 + 0.38 * sin(uTime * 2.3 + vPhase * 6.2831);
    float run = pow(0.5 + 0.5 * sin(uTime * 2.4 - aFlow * 12.57), 4.0);
    vGlow = ((0.10 + 1.0 * vein + 1.05 * rim) * tw + run * 0.85) * (0.15 + 0.95 * front);
    gl_PointSize = clamp(1.3 + 2.6 * vein + 1.4 * rim + 1.2 * aBound + run * 1.0, 1.2, 4.4)
      * (0.75 + 0.25 * front);
    vVein = vein;

    // Подсветка своей доли (пр.9): glow её региона из общего массива. Светится
    // ровно отрисованный узор этой доли — точки и линии, без углового пятна.
    // Индекс только по циклу (constant-index-expression) — надёжно в GLSL ES 1.0
    float g = 0.0;
    float anyGlow = 0.0;
    vec3 rc = vec3(0.0);
    float self = uSelfRegion < 0.0 ? aRegion : uSelfRegion; // −1 — «ничей»
    for (int i = 0; i < ${REG_N}; i++) {
      if (float(i) == self) { rc = uRegionColors[i]; g = uRegionGlow[i]; }
      anyGlow = max(anyGlow, uRegionGlow[i]);
    }
    vRegion = rc * g;
    // При активной области чужие доли гаснут — карточка читается на спокойном фоне
    vCalm = 1.0 - 0.55 * anyGlow * (1.0 - min(1.0, g * 3.0));

    vLobe = aLobe;
    vBound = aBound;

    gl_Position = projectionMatrix * mv;
  }
`;

// Фрагмент облака точек: «неоновые огоньки» — яркое ядро в мягком гало,
// цвет доли насыщенный, белое ледяное ядро в бороздах, швы подсвечены;
// волна области вспыхивает поверх при активации
const DOTS_FRAG = /* glsl */`
  uniform float uReveal;
  varying float vGlow;
  varying float vVein;
  varying vec3 vLobe;
  varying vec3 vRegion;
  varying float vBound;
  varying float vCalm;

  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float d2 = dot(c, c);
    float core = smoothstep(0.3, 0.0, d2);   // яркое ядро огонька
    float halo = smoothstep(1.0, 0.15, d2);  // мягкое гало вокруг
    vec3 col = vLobe * (0.3 + 0.75 * vGlow) * halo
             + (vLobe * 0.7 + vec3(0.85, 1.0, 1.0) * 0.45) * core * (0.35 + 0.65 * vVein)
             + (vLobe * 1.2 + vec3(0.85, 1.0, 1.0) * 0.5) * vBound * halo * 0.6
             + vRegion * (core + halo); // пр.10: своей круглой формы, без квадратной заливки
    gl_FragColor = vec4(col * uReveal * vCalm, 1.0); // аддитив — альфа не участвует
  }
`;

// Цвет в шейдер — сырые sRGB-компоненты, без конвертации THREE.Color в линейное
// пространство: ShaderMaterial пишет значения как есть, палитра задумана в гамме
function srgbVec3(hex) {
  return new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

// Материал облака точек (S16): «мозг из огоньков» — неон доли, лёд в ядре
function makeDotsMaterial(selfRegion, state) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({
      uTime: { value: 0 },
      uSelfRegion: { value: selfRegion },
    }, state, regionUniforms),
    vertexShader: BRAIN_VERT,
    fragmentShader: DOTS_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export function createBrain(tier = 'medium') {
  const group = new THREE.Group();
  const seg = SEGMENTS[tier] || SEGMENTS.medium;
  const parts = []; // { geo, mat } — единый update(uTime) и dispose

  // Состояние проявления/рентгена — общие {value} для всех материалов мозга
  // и (через main.js) для маркеров и эффектов: одно поле — вся сцена согласована
  const reveal = { value: 0 }; // интро (S09) поднимет до 1; при скипе стартуем с 1
  const uXray = { value: 0 };
  const state = { uReveal: reveal, uXray };
  let xrayTarget = 0;
  // S16: яркость deep-точек для markers.js — жёсткий гейт «только рентген»,
  // отдельный от визуального свечения структур (оно теперь есть всегда)
  const markerDeepGlow = { value: 0 };

  // Кора: сфера по тиру → силуэт S03 → извилины S04
  const cortexGeo = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  deformCortex(cortexGeo);
  const gyriNoise = createNoise3D(GYRI_SEED);
  const ridge = new Float32Array(cortexGeo.attributes.position.count);
  displaceRadially(cortexGeo, (x, y, z) => cortexGyri(gyriNoise, x, y, z), ridge);
  // S16: борозды (смещение внутрь) → 0..1 — в шейдере светятся «трещинами неона»
  for (let i = 0; i < ridge.length; i++) ridge[i] = clamp(-ridge[i] / RIDGE_NORM, 0, 1);
  cortexGeo.setAttribute('aRidge', new THREE.BufferAttribute(ridge, 1));

  // aRegion печёт bakeLobe (пр.10): чистый ближайший якорь — граница света
  // совпадает с нарисованными швами; шейдеры (BRAIN_VERT/TOPO_VERT) читают её.
  bakeLobe(cortexGeo); // пр.4: неон долей + швы → атрибуты для точек и стенки

  // Меши-«мишени» (невидимы): поверхность точечная, а лучам маркеров
  // (размещение, нормали) нужен меш. Raycaster видимости не проверяет.
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const cortexMesh = new THREE.Mesh(cortexGeo, pickMat);
  cortexMesh.visible = false;
  group.add(cortexMesh);

  // Точки-огоньки коры (пр.8): НЕ вершины сферы (решётка широт/долгот!) —
  // потоки вдоль изолиний поля складок (streams.js), тот же узор, что рисуют
  // топо-линии; по aFlow бежит импульс света
  const streamGeo = makeCortexStreams(tier, gyriNoise);
  const cortexDotsMat = makeDotsMaterial(-1, state);
  const cortexDots = new THREE.Points(streamGeo, cortexDotsMat);
  cortexDots.renderOrder = -3;
  cortexDots.frustumCulled = false;
  group.add(cortexDots);
  parts.push({ geo: streamGeo, mat: cortexDotsMat });

  // Линии мозга (пр.6): топо-изолинии поля складок прямо на коре (hololines.js)
  // — тонкий неон повторяет каждую извилину, швы долей горят ярче. Сетка рёбер
  // триангуляции удалена: плотность линий теперь не зависит от тира
  const topoMat = makeTopoMaterial(-1, 1, state, regionUniforms);
  const cortexLines = new THREE.Mesh(cortexGeo, topoMat);
  cortexLines.renderOrder = -3;
  cortexLines.frustumCulled = false;
  group.add(cortexLines);
  parts.push({ geo: cortexGeo, mat: topoMat }); // геометрия общая с мишенью лучей

  // Мозжечок: единичная сфера → фолии (с жилами, как кора) → точки + мишень
  const cbGeo = new THREE.SphereGeometry(1, CB_SEGMENTS[0], CB_SEGMENTS[1]);
  const cbNoise = createNoise3D(CB_SEED);
  const cbRidge = new Float32Array(cbGeo.attributes.position.count);
  displaceRadially(cbGeo, (x, y, z) => cerebellumRidges(cbNoise, x, y, z), cbRidge);
  for (let i = 0; i < cbRidge.length; i++) cbRidge[i] = clamp(-cbRidge[i] / CB_RIDGE_NORM, 0, 1);
  cbGeo.setAttribute('aRidge', new THREE.BufferAttribute(cbRidge, 1));
  bakeLobe(cbGeo, 'cerebellum');
  const cbMesh = new THREE.Mesh(cbGeo, pickMat);
  cbMesh.visible = false;
  cbMesh.scale.set(CB_SCALE[0], CB_SCALE[1], CB_SCALE[2]);
  cbMesh.position.set(CB_POS[0], CB_POS[1], CB_POS[2]);
  group.add(cbMesh);
  // Фолии-огоньки (пр.8): пунктирные кольца вдоль изолиний поля фолий
  const cbStreamGeo = makeCbStreams(tier, cbNoise);
  const cbDotsMat = makeDotsMaterial(REGION_INDEX.cerebellum, state);
  const cbDots = new THREE.Points(cbStreamGeo, cbDotsMat);
  cbDots.renderOrder = -2; // после коры, до глубины и маркеров
  cbDots.frustumCulled = false;
  cbDots.scale.copy(cbMesh.scale);
  cbDots.position.copy(cbMesh.position);
  group.add(cbDots);
  parts.push({ geo: cbStreamGeo, mat: cbDotsMat });
  const cbTopoMat = makeTopoMaterial(REGION_INDEX.cerebellum, 0, state, regionUniforms);
  const cbLines = new THREE.Mesh(cbGeo, cbTopoMat); // фолии — те же изолинии
  cbLines.renderOrder = -2;
  cbLines.frustumCulled = false;
  cbLines.scale.copy(cbMesh.scale);
  cbLines.position.copy(cbMesh.position);
  group.add(cbLines);
  parts.push({ geo: cbGeo, mat: cbTopoMat });

  // Ствол: трубка-мишень по CatmullRom-кривой от дна мозга вниз; рисуются
  // только нити-«корни» (пр.7) — спиральные потоки огоньков + сердцевина
  const curve = new THREE.CatmullRomCurve3(STEM_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const stemGeo = new THREE.TubeGeometry(curve, STEM_TUBE, STEM_RADIUS, STEM_RADIAL, false);
  const stemMesh = new THREE.Mesh(stemGeo, pickMat);
  stemMesh.visible = false;
  group.add(stemMesh);
  const strandGeo = makeStemStrands(curve, tier, STEM_RADIUS);
  bakeLobe(strandGeo, 'brainstem');
  const stemDotsMat = makeDotsMaterial(REGION_INDEX.brainstem, state);
  const stemDots = new THREE.Points(strandGeo, stemDotsMat);
  stemDots.renderOrder = -2;
  stemDots.frustumCulled = false;
  group.add(stemDots);
  parts.push({ geo: strandGeo, mat: stemDotsMat });

  // Глубокие структуры (S09 → пр.7): золотые облака частиц + потоки-связи —
  // внутренности читаются сквозь тело всегда, рентген разгоняет до полной
  const deep = createDeep(reveal, tier);
  deep.mesh.renderOrder = -1; // после поверхностей, до маркеров
  group.add(deep.mesh);
  deep.points.renderOrder = -1;
  group.add(deep.points);

  // Мировые матрицы нужны сразу: маркеры (S06) лучат по мешам до первого кадра
  group.updateMatrixWorld(true);

  return {
    group,
    // Поверхности для размещения маркеров (S06): куда «приклеивать» точки
    surface: {
      cortex: cortexMesh,
      cerebellum: cbMesh,
      stem: stemMesh,
      stemCurve: curve,     // маркеры ствола идут по спирали вдоль самой кривой
      stemRadius: STEM_RADIUS,
      deepMesh: deep.mesh,  // merged-меш глубины (S09): deep-маркеры лучат по нему
      deepAnchors: deep.anchors, // key → { center, radius, mirror }
      // Пр.10: отрисованные линии как «посадочные» — точки стримов и нитей
      // уже лежат на узоре, markers.js ставит маркеры прямо на изолинии
      spots: {
        cortex: streamGeo,
        cerebellum: cbStreamGeo,
        cerebellumToWorld: cbMesh.matrixWorld, // стримы мозжечка — в его локальных
        brainstem: strandGeo,
      },
    },
    // Значения uniform-массивов подсветки; regions.js пишет в них каждый кадр
    region: {
      glow: regionUniforms.uRegionGlow.value,
      wave: regionUniforms.uRegionWave.value,
    },
    reveal,               // интро ведёт этим объектом проявление всей сцены (S09)
    deepGlow: markerDeepGlow, // гейт deep-точек для markers.js (яркость + кликабельность)
    setXray(on) { xrayTarget = on ? 1 : 0; },
    getXray() { return uXray.value; },
    update(dt, t) {
      for (let i = 0; i < parts.length; i++) parts[i].mat.uniforms.uTime.value = t;
      deep.update(t);

      // Рентген: линейный ход — короткий, предсказуемый, без «резины»
      const x = uXray.value;
      if (x !== xrayTarget) {
        const step = dt / XRAY_DUR;
        uXray.value = xrayTarget > x ? Math.min(xrayTarget, x + step) : Math.max(xrayTarget, x - step);
      }
      // Пр.13: глубина скрыта вне рентгена полностью (постоянный призрак DEEP_BASE
      // был визуальным шумом) — туманности и потоки вспыхивают только с рентгеном
      // или программным показом deep-карточки (оба ведёт uXray через main.js).
      // Deep-точки заперты тем же гейтом (markerDeepGlow).
      const g = smoothstep(DEEP_FADE0, DEEP_FADE1, uXray.value);
      deep.setGlow(g);
      markerDeepGlow.value = g;
    },
    dispose() {
      for (let i = 0; i < parts.length; i++) {
        parts[i].geo.dispose();
        parts[i].mat.dispose();
      }
      pickMat.dispose(); // общий невидимый материал мишеней
      stemGeo.dispose(); // мишень ствола — вне parts (рисуются только нити)
      deep.dispose();
    },
  };
}
