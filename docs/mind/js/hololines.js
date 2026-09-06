// hololines.js — S16, правка 6: «линии мозга» — топо-изолинии извилин.
// Линии рисует фрагментный шейдер поверхности по запечённому полю складок
// aRidge (горизонтали карты): тонкий неон повторяет каждую извилину, а там,
// где aBound пересекает 0.5, — яркий ледяной шов, отделяющий доли друг от
// друга. Сетка-триангуляции (рёбра сферы, пр.4) удалена: она не про мозг.
// Пр.7: цвет долей перетекает градиентом (смесь двух ближайших якорей),
// тут же генерируются нити-«корни» ствола (makeStemStrands).
// Пр.9: bakeLobe печёт aRegion — подсветка области идёт по узору отрисованной
// доли (не угловым пятном), чужие доли при активной области гаснут (vCalm).
// Пр.10: aRegion — чистый Вороной (кто из якорей ближе), ровно как швы — граница
// света совпадает с нарисованным швом; vRegion горит только на линиях узора;
// дальняя от камеры сторона тише (vFront).

import * as THREE from '../lib/three.module.min.js';
import { REGIONS, REGION_INDEX } from './regions.js';
import { mulberry32 } from './utils.js';

// Шов доли: если два ближайших якоря почти равноудалены (разница углов меньше
// BOUND_FAR рад) — вершина на границе; BOUND_NEAR — плато полной яркости шва
const BOUND_NEAR = 0.05;
const BOUND_FAR = 0.2;

const REG_N = REGIONS.length;

// Число уровней изолиний: единый источник для топо-шейдера (тут) и трассировщика
// огоньков-потоков (streams.js, пр.8) — линии и точки всегда совпадают узором
export const TOPO_LEVELS = 5;

// Цвет в шейдер — сырые sRGB-компоненты (как в brain.js, без линейной конверсии)
function srgbVec3(hex) {
  return new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

// Запечь цвет доли, «граничность» и индекс региона в атрибуты aLobe/aBound/aRegion.
// regionKey — сплошной цвет (мозжечок/ствол); null — по ближайшему корковому якорю.
export function bakeLobe(geo, regionKey = null) {
  const pos = geo.attributes.position;
  const n = pos.count;
  const lobe = new Float32Array(n * 3);
  const bound = new Float32Array(n);
  const region = new Float32Array(n); // пр.10: индекс в REGIONS — чистый ближайший якорь

  if (regionKey) {
    const r = REGIONS.find((x) => x.key === regionKey);
    const c = srgbVec3(r ? r.color : 0xffc878);
    const ri = r ? REGION_INDEX[regionKey] : -1;
    for (let i = 0; i < n; i++) {
      lobe[i * 3] = c.x;
      lobe[i * 3 + 1] = c.y;
      lobe[i * 3 + 2] = c.z;
      region[i] = ri;
    }
  } else {
    const anchors = [];
    REGIONS.forEach((r, idx) => {
      if (r.cortex) {
        anchors.push({
          idx,
          dir: new THREE.Vector3(r.dir[0], r.dir[1], r.dir[2]).normalize(),
          col: srgbVec3(r.color),
        });
      }
    });
    const p = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      p.fromBufferAttribute(pos, i).normalize();
      let b1 = Infinity;
      let i1 = 0;
      let b2 = Infinity;
      let i2 = 0;
      for (let a = 0; a < anchors.length; a++) {
        const d = Math.acos(Math.max(-1, Math.min(1, p.dot(anchors[a].dir))));
        if (d < b1) { b2 = b1; i2 = i1; b1 = d; i1 = a; } else if (d < b2) { b2 = d; i2 = a; }
      }
      // пр.7: плавный переход цвета — глубина доли чистая, у шва смесь соседей
      // (вместо жёсткой радуги); шов-линия рисуется поверх отдельно
      const t = Math.min(1, Math.max(0, (b2 - b1 - BOUND_NEAR) / (BOUND_FAR - BOUND_NEAR)));
      const s = t * t * (3 - 2 * t);
      const c1 = anchors[i1].col;
      const c2 = anchors[i2].col;
      lobe[i * 3] = c1.x * s + c2.x * (1 - s);
      lobe[i * 3 + 1] = c1.y * s + c2.y * (1 - s);
      lobe[i * 3 + 2] = c1.z * s + c2.z * (1 - s);
      bound[i] = 1 - s; // 1 на шве → 0 в глубине доли
      region[i] = anchors[i1].idx; // пр.10: чистый Вороной — ровно ячейка внутри швов
    }
  }
  geo.setAttribute('aLobe', new THREE.BufferAttribute(lobe, 3));
  geo.setAttribute('aBound', new THREE.BufferAttribute(bound, 1));
  geo.setAttribute('aRegion', new THREE.BufferAttribute(region, 1));
}

// ---------- Шейдер топо-линий: неон доли по изолиниям складок + швы ----------
// Вершина готовит то же, что точкам brain.js: долю, шов, поле складок и
// подсветку региона — пр.9, по запечённому aRegion (узор доли), не угловым пятном
const TOPO_VERT = /* glsl */`
  uniform float uTime;
  uniform float uSelfRegion; // −1 — кора (подсветка по aRegion), ≥0 — сам регион
  uniform vec3 uRegionColors[${REG_N}];
  uniform float uRegionGlow[${REG_N}];
  attribute float aRidge;    // поле складок: 0 гребень → 1 дно борозды
  attribute vec3 aLobe;      // неон доли — запечён по ближайшему якорю
  attribute float aBound;    // шов между долями: 1 на границе → 0 в глубине
  attribute float aRegion;   // пр.9: индекс региона в REGIONS, −1 — «ничей»
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vRegion;
  varying float vPhase;
  varying vec3 vLobe;
  varying float vVein;
  varying float vBound;
  varying float vRidge;
  varying float vCalm;       // пр.9: гашение чужих долей при активной области
  varying float vFront;      // пр.10: 1 — передняя сторона, 0 — дальняя (тише)
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
    vLobe = aLobe;
    vBound = aBound;
    vRidge = aRidge;                        // сырого поля хватает на изолинии
    vVein = smoothstep(0.5, 0.95, aRidge);  // глубокие борозды — ярче

    // Подсветка своей доли (пр.9): glow её региона из общего массива. Индекс
    // только по циклу (constant-index-expression) — надёжно и в GLSL ES 1.0
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

    // Пр.11: дальняя сторона тише (в пр.10 знак был перевёрнут — ярче был тыл);
    // front = 1 у камеры, 0 за мозгом
    vec4 mv = viewMatrix * wp;
    vec4 ctr = viewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vFront = clamp(0.5 + (mv.z - ctr.z) / 2.4, 0.0, 1.0);

    gl_Position = projectionMatrix * mv;
  }
`;

const TOPO_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uReveal;
  uniform float uXray;
  uniform float uXrayFade;   // 1 — кора (гаснет в рентгене), 0 — мозжечок
  uniform float uLevels;     // плотность: уровней изолиний на диапазон складок
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vRegion;
  varying float vPhase;
  varying vec3 vLobe;
  varying float vVein;
  varying float vBound;
  varying float vRidge;
  varying float vCalm;
  varying float vFront;

  void main() {
    // Изолиния — близость vRidge к уровню k/uLevels (k целое), как горизонтали
    // на карте. fwidth даёт постоянную толщину в пикселях и сглаживание;
    // ε страхует ровное поле (у сплошных долей aBound = 0 и шва нет)
    float rn = vRidge * uLevels;
    float fw = fwidth(rn) + 1e-4;
    float fold = 1.0 - smoothstep(0.8 * fw, 1.8 * fw, abs(fract(rn) - 0.5));
    float bw = fwidth(vBound) + 1e-4;
    float seam = 1.0 - smoothstep(bw, 2.2 * bw, abs(vBound - 0.5));

    // Линии складок — неон доли (глубже борозда — ярче), швы — тот же цвет
    // со льдом и запасом яркости; кромка силуэта добавляет объём, всё мерцает.
    // Пр.10: подсветка доли только по отрисованным линиям и швам — пятна-заливки
    // нет; дальняя от камеры сторона линий тише.
    float ndv = abs(dot(normalize(vNormal), normalize(cameraPosition - vWorldPos)));
    float rim = pow(1.0 - ndv, 2.0);
    float tw = 0.82 + 0.18 * sin(uTime * 1.7 + vPhase * 6.2831);
    vec3 col = vLobe * (0.4 + 0.68 * vVein) * fold;
    col += (vLobe * 0.7 + vec3(0.85, 1.0, 1.0) * 0.75) * seam * 1.15;
    col = (col + vRegion * 1.2 * max(fold, seam)) * (0.75 + 0.6 * rim) * tw;
    col *= 0.15 + 0.85 * vFront; // пр.12: дальняя сторона почти гаснет
    // пр.14: плёнка-стекло между изолиниями — поверхность читается телом
    // (к кромке силуэта гуще — объём); в рентгене тает почти в ноль
    vec3 glass = vLobe * (0.15 + 0.16 * rim) * tw;
    col += glass * (0.15 + 0.85 * vFront) * (1.0 - 0.9 * uXray * uXrayFade);
    col *= 1.0 - 0.3 * uXray * uXrayFade;
    gl_FragColor = vec4(col * uReveal * vCalm, 1.0); // аддитив — альфа не участвует
  }
`;

// Материал топо-линий: reveal/xray и массивы областей — общие {value} сцены
export function makeTopoMaterial(selfRegion, xrayFade, state, regionUniforms) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({
      uTime: { value: 0 },
      uSelfRegion: { value: selfRegion },
      uLevels: { value: TOPO_LEVELS }, // калибровка плотности линий (общая с streams.js)
      uXrayFade: { value: xrayFade },
    }, state, regionUniforms),
    vertexShader: TOPO_VERT,
    fragmentShader: TOPO_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

// ---------- Нити-«корни» ствола (пр.7) ----------
// Спиральные потоки точек вдоль кривой ствола + сердцевина; сама трубка
// остаётся в brain.js невидимой мишенью лучей — рисуются только живые нити.
const STEM_SEED = 13;         // seed узора: смена = другая намотка витков
const STEM_STRANDS = 3;       // спиральных нитей (+ сердцевина)
const STEM_STEPS = { low: 34, medium: 44, high: 56 }; // точек на нить по тиру

export function makeStemStrands(curve, tier, radius) {
  const steps = STEM_STEPS[tier] || STEM_STEPS.medium;
  const rand = mulberry32(STEM_SEED);
  const n = (STEM_STRANDS + 1) * steps;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const ridge = new Float32Array(n); // у нитей нет поля складок — ровный ноль
  const flow = new Float32Array(n);  // пр.8: u вдоль нити — импульс стекает вниз
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const ref = new THREE.Vector3(0, 1, 0);
  let k = 0;
  for (let s = -1; s < STEM_STRANDS; s++) { // s = −1 — сердцевина
    const phase = s * (Math.PI * 2 / STEM_STRANDS);
    for (let i = 0; i < steps; i++) {
      const u = (i + 0.5) / steps;
      curve.getPoint(u, p);
      curve.getTangent(u, tan);
      a.crossVectors(tan, ref).normalize();
      b.crossVectors(tan, a);
      const ang = u * 12.57 + phase + (rand() - 0.5) * 0.9; // ~2 витка на длину
      const r = s < 0 ? 0.1 : (0.55 + rand() * 0.3) * radius;
      p.addScaledVector(a, Math.cos(ang) * r).addScaledVector(b, Math.sin(ang) * r);
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      const len = Math.hypot(p.x, p.y, p.z) || 1;
      nor[k * 3] = p.x / len; nor[k * 3 + 1] = p.y / len; nor[k * 3 + 2] = p.z / len;
      flow[k] = u;
      k++;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); // радиальные — для rim
  geo.setAttribute('aRidge', new THREE.BufferAttribute(ridge, 1));
  geo.setAttribute('aFlow', new THREE.BufferAttribute(flow, 1));
  return geo;
}
