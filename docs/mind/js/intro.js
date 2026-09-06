// intro.js — интро-слёт (S09): тысячи частиц стартуют рассеянной сферой вокруг
// пустой сцены и по индивидуальным задержкам стекаются к вершинам коры; в конце
// растворяются, проявляя мозг (общая uReveal). Любой тап по канвасу — мгновенный
// конец; prefers-reduced-motion и вход по ссылке #id — интро отключено.

import * as THREE from '../lib/three.module.min.js';
import { mulberry32 } from './utils.js';

// ---------- Тюнинг ----------
const INTRO = { low: 4000, medium: 7000, high: 12000 }; // частиц по тиру (RULES §3)
const INTRO_DUR = 2.6;   // с: сам слёт
const INTRO_FADE = 0.7;  // с: растворение частиц + проявление мозга
const START_R0 = 2.5;    // стартовая оболочка: от (камера на r≈3.4 — внутри облака)
const START_R1 = 4.0;    // и до
const MAX_DELAY = 0.35;  // доля длительности: персональный разбег старта частиц
const TARGET_LIFT = 0.015; // отрыв точки приземления от поверхности коры
const INTRO_SEED = 9;    // seed выборки вершин — свой узор слёта

const INTRO_VERT = /* glsl */`
  attribute vec3 aTarget;  // position — старт, aTarget — вершина коры
  attribute float aDelay;  // 0..0.35: разбег старта
  attribute float aSeed;
  uniform float uT;     // 0..1 общий прогресс слёта
  uniform float uFade;  // 1..0 растворение в конце
  varying float vTw;
  varying float vSeed;

  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    // локальный прогресс: у каждой частицы своё «окно» внутри общего таймлайна
    float local = clamp((uT - aDelay) / (1.0 - ${MAX_DELAY.toFixed(2)}), 0.0, 1.0);
    vec3 p = mix(position, aTarget, easeInOutCubic(local));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // в полёте искристее, у цели — спокойнее; всё гаснет общим uFade
    vTw = (0.65 + 0.35 * sin(uT * 40.0 + aSeed * 20.0)) * uFade;
    vSeed = aSeed;
    gl_PointSize = clamp(1.6 + 2.4 * aSeed, 1.0, 4.0); // фикс. пиксели: дешёво и чётко
    gl_Position = projectionMatrix * mv;
  }
`;
const INTRO_FRAG = /* glsl */`
  varying float vTw;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = pow(1.0 - d, 2.2) * vTw;
    vec3 c = mix(vec3(0.45, 0.68, 1.0), vec3(0.85, 0.95, 1.0), vSeed);
    gl_FragColor = vec4(c * a, a);
  }
`;

export function createIntro({ scene, canvas, tier, brain, skip }) {
  if (skip || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    brain.reveal.value = 1; // без интро мозг виден сразу
    return { update() {}, finish() {}, get done() { return true; } };
  }

  // Цели — вершины коры: равномерный проход по буферу, дешёвая псевдослучайная
  // добавка внутри шага убирает муар регулярной сетки
  const cortexPos = brain.surface.cortex.geometry.attributes.position;
  const M = INTRO[tier] || INTRO.medium;
  const rand = mulberry32(INTRO_SEED);
  const start = new Float32Array(M * 3);
  const target = new Float32Array(M * 3);
  const delay = new Float32Array(M);
  const seed = new Float32Array(M);
  const stride = cortexPos.count / M;
  for (let i = 0; i < M; i++) {
    const vi = Math.min(cortexPos.count - 1, Math.floor((i + rand()) * stride));
    const tx = cortexPos.getX(vi);
    const ty = cortexPos.getY(vi);
    const tz = cortexPos.getZ(vi);
    const len = Math.hypot(tx, ty, tz) || 1;
    const k = (len + TARGET_LIFT) / len; // садятся НА поверхность, не в неё
    target[i * 3] = tx * k;
    target[i * 3 + 1] = ty * k;
    target[i * 3 + 2] = tz * k;

    const u = rand() * 2 - 1;
    const ph = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = START_R0 + (START_R1 - START_R0) * rand();
    start[i * 3] = s * Math.cos(ph) * r;
    start[i * 3 + 1] = u * r;
    start[i * 3 + 2] = s * Math.sin(ph) * r;
    delay[i] = rand() * MAX_DELAY;
    seed[i] = rand();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFade: { value: 1 } },
    vertexShader: INTRO_VERT,
    fragmentShader: INTRO_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let phase = 0; // 0 — слёт, 1 — растворение
  let t = 0;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    brain.reveal.value = 1;
    scene.remove(points);
    geo.dispose(); // частицы выгружены полностью — критерий приёмки S09
    mat.dispose();
    window.removeEventListener('pointerdown', onSkip, true);
  }

  // Скип: любой тап/клик по канвасу. Слушатель на window в фазе перехвата срабатывает
  // ДО слушателей маркеров на канвасе, чтобы этим же тапом не открыть карточку.
  function onSkip(e) {
    if (e.target !== canvas) return; // тапы по кнопкам HUD не глотаем
    e.stopPropagation();
    finish();
  }
  window.addEventListener('pointerdown', onSkip, true);

  function update(dt) {
    if (done) return;
    if (phase === 0) {
      t += dt / INTRO_DUR;
      mat.uniforms.uT.value = Math.min(1, t);
      if (t >= 1) { phase = 1; t = 0; }
    } else {
      t += dt / INTRO_FADE;
      const q = Math.min(1, t);
      mat.uniforms.uFade.value = 1 - q;
      // мозг проявляется на разгоне, пока частицы ещё тают, — без пустого кадра
      brain.reveal.value = 1 - (1 - q) * (1 - q);
      if (q >= 1) finish();
    }
  }

  return { update, finish, get done() { return done; } };
}
