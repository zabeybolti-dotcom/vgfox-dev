// deep.js — глубокие структуры мозга (S09 → S16 пр.7): гиппокамп, амигдалы,
// таламус, базальные ганглии, гипоталамус, эпифиз, мозолистое тело, островок,
// обонятельные луковицы. Отрисовка — «золотые туманности»: объёмные облака
// частиц (ядро светлее, край рваный) + пунктирные потоки, связывающие
// структуры в единую живую систему. Сплошной «призрак» из рендера удалён:
// merged-меш остался невидимой мишенью лучей deep-маркеров (Raycaster
// видимости не проверяет) — и минус один draw call.

import * as THREE from '../lib/three.module.min.js';
import { REGIONS, REGION_INDEX } from './regions.js';
import { clamp, mulberry32 } from './utils.js';

// ---------- Тюнинг (анатомия в константах — правится без ковыряния в коде) ----------
// Оси: X — лево/право (пары зеркалятся), Y — верх/низ, Z — перед/зад (лоб z>0).
const BLOB_SEGS = [20, 14];  // сегменты сфер мишени: мешей мало, этого хватает
const TUBE_SEG = 28;         // сегментов вдоль трубки мишени
const TUBE_RADIAL = 8;       // по окружности
const DEEP_SEED = 23;        // seed облаков: смена = другой «звёздный» узор

// Гиппокамп: изогнутая нить от амигдалы назад-вниз, вдоль височной доли
const HIPPO_CURVE = [
  [0.30, -0.20, 0.12],
  [0.33, -0.29, -0.06],
  [0.27, -0.31, -0.24],
  [0.18, -0.24, -0.38],
];
const HIPPO_RADIUS = 0.048;

// Базальные ганглии: изогнутый столб, огибающий таламус сбоку-спереди
const BG_CURVE = [
  [0.27, 0.28, 0.20],
  [0.31, 0.10, 0.16],
  [0.29, -0.08, 0.05],
];
const BG_RADIUS = 0.052;

// Мозолистое тело: арка-мост в плоскости x=0, над таламусом
const CC_CURVE = [
  [0, 0.06, 0.44],
  [0, 0.30, 0.16],
  [0, 0.31, -0.18],
  [0, 0.12, -0.40],
];
const CC_RADIUS = 0.036;

// Парные и одиночные «капли»: pos — центр, scale — радиусы по осям
const DEEP_BLOBS = [
  { key: 'thalamus',     pos: [0.13, 0.02, -0.05], scale: [0.09, 0.12, 0.16], mirror: true },
  { key: 'amygdala',     pos: [0.30, -0.20, 0.16], scale: [0.07, 0.09, 0.10], mirror: true },
  { key: 'hypothalamus', pos: [0, -0.12, 0.10],    scale: [0.08, 0.06, 0.09], mirror: false },
  { key: 'pineal',       pos: [0, 0.06, -0.16],    scale: [0.05, 0.05, 0.05], mirror: false },
  { key: 'insula',       pos: [0.52, -0.06, 0.05], scale: [0.06, 0.16, 0.18], mirror: true },
  { key: 'olfactory',    pos: [0.16, -0.50, 0.70], scale: [0.05, 0.05, 0.09], mirror: true },
];
const DEEP_TUBES = [
  { key: 'hippocampus',  curve: HIPPO_CURVE, radius: HIPPO_RADIUS, mirror: true },
  { key: 'basalGanglia', curve: BG_CURVE,    radius: BG_RADIUS,    mirror: true },
  { key: 'corpusCallosum', curve: CC_CURVE,  radius: CC_RADIUS,    mirror: false },
];

// Потоки-связи: пунктирные струи от таламуса (узел всей системы) к соседям
// и вниз к стволу — внутренности читаются связанными, а не болтающимися
const DEEP_STREAMS = [
  { pts: [[0.13, 0.06, 0.0], [0.21, 0.12, 0.10], [0.28, 0.13, 0.16]], mirror: true },        // → ганглии
  { pts: [[0.12, -0.04, 0.0], [0.24, -0.14, 0.10], [0.30, -0.21, 0.15]], mirror: true },     // → амигдала
  { pts: [[0.11, -0.04, -0.04], [0.21, -0.20, -0.14], [0.27, -0.30, -0.26]], mirror: true }, // → гиппокамп
  { pts: [[0, 0.05, -0.02], [0, -0.06, 0.05]], mirror: false },                              // → гипоталамус
  { pts: [[0, -0.15, 0.10], [0, -0.30, -0.10], [0, -0.44, -0.30]], mirror: false },          // → ствол
  { pts: [[0, 0.10, -0.05], [0, 0.26, 0.12], [0, 0.30, -0.16]], mirror: false },             // → мозолистое тело
];
const STREAM_COLOR = 0xffe9c2; // потоки чуть светлее структур — «бегущие сигналы»
const STREAM_N = { low: 26, medium: 42, high: 60 }; // точек на струю по тиру
const CLOUD_K = { low: 0.65, medium: 1, high: 1.4 }; // плотность облаков по тиру
const CLOUD_N = { // точек на структуру (до зеркалирования)
  thalamus: 950, amygdala: 400, hypothalamus: 300, pineal: 130, insula: 900,
  olfactory: 260, hippocampus: 520, basalGanglia: 480, corpusCallosum: 700,
};

// ---------- Шейдер частиц: ядро теплее-белее, край — цвет структуры;
// поток пульсирует бегущей волной от начала струи к концу ----------
const DEEP_VERT = /* glsl */`
  uniform float uTime;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSize;
  attribute float aEdge; // 0 ядро → 1 край облака
  attribute float aFlow; // ≥0 — точка потока: позиция вдоль струи
  varying vec3 vColor;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.6 + 0.4 * sin(uTime * 1.9 + aPhase * 6.2831);
    float run = aFlow >= 0.0 ? pow(0.5 + 0.5 * sin(uTime * 2.6 - aFlow * 18.85), 4.0) : 0.0;
    vA = tw + run * 1.4; // мерцание всех + бегущий свет в потоках
    gl_PointSize = clamp(aSize * (1.0 + run * 0.8), 1.0, 7.0);
    vColor = mix(aColor + vec3(0.30, 0.26, 0.18), aColor, aEdge);
    gl_Position = projectionMatrix * mv;
  }
`;
const DEEP_FRAG = /* glsl */`
  uniform float uGlow;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float d2 = dot(c, c);
    float core = smoothstep(0.25, 0.0, d2);  // тёплое белое ядро
    float halo = smoothstep(1.0, 0.2, d2);   // золотое гало — рваный край
    vec3 col = vColor * (0.35 + 0.75 * vA) * halo
             + (vColor * 0.85 + vec3(0.9, 0.93, 1.0) * 0.30) * core * vA;
    gl_FragColor = vec4(col * uGlow * uReveal, 1.0); // аддитив — альфа не участвует
  }
`;

// Цвет в шейдер — сырой sRGB, как палитры brain.js (без линейной конверсии)
function srgbVec3(hex) {
  return new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

// Слияние геометрий мишени в одну: позиции/нормали/индексы со сдвигом.
function mergeParts(parts) {
  let vCount = 0;
  let iCount = 0;
  for (let i = 0; i < parts.length; i++) {
    vCount += parts[i].geo.attributes.position.count;
    iCount += parts[i].geo.index.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const idx = new Uint32Array(iCount);
  let vo = 0;
  let io = 0;
  for (let i = 0; i < parts.length; i++) {
    const g = parts[i].geo;
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    const gi = g.index.array;
    for (let k = 0; k < gi.length; k++) idx[io + k] = gi[k] + vo;
    vo += g.attributes.position.count;
    io += gi.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

export function createDeep(reveal = { value: 1 }, tier = 'medium') {
  const parts = [];
  const anchors = {}; // key → { center, radius, mirror }: откуда лучить маркеры
  const _m4 = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();

  function regionColor(key) {
    const i = REGION_INDEX[key];
    return srgbVec3(i !== undefined ? REGIONS[i].color : 0xffc878);
  }

  // ---------- Мишень лучей (как в S09, но из рендера скрыта) ----------
  function pushBlob(key, p, sc) {
    const g = new THREE.SphereGeometry(1, BLOB_SEGS[0], BLOB_SEGS[1]);
    _m4.compose(_p.set(p[0], p[1], p[2]), _q.identity(), _s.set(sc[0], sc[1], sc[2]));
    g.applyMatrix4(_m4);
    parts.push({ geo: g });
  }

  function tubeAnchor(key, pts, radius) {
    // центр — середина кривой, радиус — дальняя точка + толщина
    const c = [0, 0, 0];
    for (const p of pts) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length; }
    let r = 0;
    for (const p of pts) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]));
    anchors[key] = { center: c, radius: r + radius, mirror: false };
  }

  for (const t of DEEP_TUBES) {
    const curve = new THREE.CatmullRomCurve3(t.curve.map((a) => new THREE.Vector3(a[0], a[1], a[2])));
    parts.push({ geo: new THREE.TubeGeometry(curve, TUBE_SEG, t.radius, TUBE_RADIAL, false) });
    if (t.mirror) {
      const mc = t.curve.map((a) => new THREE.Vector3(-a[0], a[1], a[2]));
      parts.push({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mc), TUBE_SEG, t.radius, TUBE_RADIAL, false) });
    }
    tubeAnchor(t.key, t.curve, t.radius);
    anchors[t.key].mirror = t.mirror; // маркеры пары чередуют стороны (markers.js)
  }
  for (const b of DEEP_BLOBS) {
    pushBlob(b.key, b.pos, b.scale);
    if (b.mirror) pushBlob(b.key, [-b.pos[0], b.pos[1], b.pos[2]], b.scale);
    anchors[b.key] = { center: b.pos.slice(), radius: Math.max(b.scale[0], b.scale[1], b.scale[2]), mirror: b.mirror };
  }
  const pickGeo = mergeParts(parts);
  for (const p of parts) p.geo.dispose(); // массивы скопированы — оригиналы не нужны
  const mesh = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
  mesh.visible = false; // лучится, но не рисуется (как мишени коры в brain.js)
  mesh.frustumCulled = false;

  // ---------- «Золотые туманности»: облака структур + потоки-связи ----------
  const rand = mulberry32(DEEP_SEED);
  const ck = CLOUD_K[tier] || 1;
  const sn = STREAM_N[tier] || STREAM_N.medium;
  const streams = [];
  for (const s of DEEP_STREAMS) {
    streams.push(s.pts);
    if (s.mirror) streams.push(s.pts.map((p) => [-p[0], p[1], p[2]]));
  }
  let total = 0;
  for (const t of DEEP_TUBES) total += Math.round(CLOUD_N[t.key] * ck) * (t.mirror ? 2 : 1);
  for (const b of DEEP_BLOBS) total += Math.round(CLOUD_N[b.key] * ck) * (b.mirror ? 2 : 1);
  total += streams.length * sn;

  const pArr = new Float32Array(total * 3);
  const cArr = new Float32Array(total * 3);
  const phArr = new Float32Array(total);
  const szArr = new Float32Array(total);
  const edArr = new Float32Array(total);
  const flArr = new Float32Array(total);
  let k = 0;
  function push(x, y, z, c, edge, flow = -1) {
    pArr[k * 3] = x; pArr[k * 3 + 1] = y; pArr[k * 3 + 2] = z;
    cArr[k * 3] = c.x; cArr[k * 3 + 1] = c.y; cArr[k * 3 + 2] = c.z;
    phArr[k] = rand();
    szArr[k] = 1.1 + Math.pow(rand(), 2) * 2.2; // редкие крупные искры
    edArr[k] = edge;
    flArr[k] = flow;
    k++;
  }

  const _d = new THREE.Vector3();
  function dir3() { // равномерное направление на сфере
    const u = rand() * 2 - 1;
    const ph = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return _d.set(s * Math.cos(ph), u, s * Math.sin(ph));
  }

  // Капля-облако: плотнее к центру (r = u^1.6), рваный светящийся край
  function cloudBlob(n, center, sc, c) {
    for (let i = 0; i < n; i++) {
      const v = dir3();
      const r = Math.pow(rand(), 1.6);
      push(center[0] + v.x * r * sc[0], center[1] + v.y * r * sc[1], center[2] + v.z * r * sc[2], c, r);
    }
  }

  // Нить-«трубка»: точки вдоль кривой с рваным радиальным разбросом
  const _t = new THREE.Vector3();
  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  const _ref = new THREE.Vector3(0, 1, 0);
  function toCurve(pts) {
    return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  }
  function cloudTube(n, pts, radius, c) {
    const curve = toCurve(pts);
    for (let i = 0; i < n; i++) {
      const t = rand();
      curve.getPoint(t, _p);
      curve.getTangent(t, _t);
      _a.crossVectors(_t, _ref).normalize();
      _b.crossVectors(_t, _a);
      const ang = rand() * Math.PI * 2;
      const r = radius * Math.pow(rand(), 0.6);
      push(
        _p.x + (_a.x * Math.cos(ang) + _b.x * Math.sin(ang)) * r,
        _p.y + (_a.y * Math.cos(ang) + _b.y * Math.sin(ang)) * r,
        _p.z + (_a.z * Math.cos(ang) + _b.z * Math.sin(ang)) * r,
        c, r / radius,
      );
    }
  }

  // Поток: стратифицированные точки вдоль струи; aFlow = позиция → бегущий свет
  function streamCloud(n, pts, c) {
    const curve = toCurve(pts);
    for (let i = 0; i < n; i++) {
      const t = clamp((i + rand() * 0.8) / n, 0, 1);
      curve.getPoint(t, _p);
      push(_p.x + (rand() - 0.5) * 0.014, _p.y + (rand() - 0.5) * 0.014,
        _p.z + (rand() - 0.5) * 0.014, c, 0.35 + rand() * 0.3, t);
    }
  }

  const streamCol = srgbVec3(STREAM_COLOR);
  for (const t of DEEP_TUBES) {
    const c = regionColor(t.key);
    const n = Math.round(CLOUD_N[t.key] * ck);
    cloudTube(n, t.curve, t.radius, c);
    if (t.mirror) cloudTube(n, t.curve.map((p) => [-p[0], p[1], p[2]]), t.radius, c);
  }
  for (const b of DEEP_BLOBS) {
    const c = regionColor(b.key);
    const n = Math.round(CLOUD_N[b.key] * ck);
    cloudBlob(n, b.pos, b.scale, c);
    if (b.mirror) cloudBlob(n, [-b.pos[0], b.pos[1], b.pos[2]], b.scale, c);
  }
  for (const pts of streams) streamCloud(sn, pts, streamCol);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(cArr, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phArr, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(szArr, 1));
  geo.setAttribute('aEdge', new THREE.BufferAttribute(edArr, 1));
  geo.setAttribute('aFlow', new THREE.BufferAttribute(flArr, 1));

  // uGlow — общий {value}: brain.js ведёт его по рентгену; uReveal — интро-объект
  const uniforms = {
    uGlow: { value: 0 },
    uTime: { value: 0 },
    uReveal: reveal,
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: DEEP_VERT,
    fragmentShader: DEEP_FRAG,
    transparent: true,
    depthWrite: false, // туманности не заслоняют ни друг друга, ни маркеры
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  return {
    mesh,
    points,
    anchors,
    glow: uniforms.uGlow,
    setGlow(v) { uniforms.uGlow.value = v; },
    update(t) { uniforms.uTime.value = t; },
    dispose() {
      geo.dispose();
      mat.dispose();
      pickGeo.dispose();
      mesh.material.dispose();
      mesh.removeFromParent();
      points.removeFromParent();
    },
  };
}
