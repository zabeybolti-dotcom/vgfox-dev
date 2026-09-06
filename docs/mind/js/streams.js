// streams.js — пр.8: огоньки коры/мозжечка текут вдоль ИЗОЛИНИЙ поля складок.
// Точки больше не вершины параметрической сферы (та самая «сетка» широт и
// долгот): трассировщик ведёт линии по уровням поля — тем же, по которым
// топо-шейдер hololines.js рисует контуры, — и расставляет по каждой линии
// точки с параметром aFlow: в шейдере brain.js по нему бежит импульс света.
// Всё считается один раз при старте; в кадре — только uTime.

import * as THREE from '../lib/three.module.min.js';
import { clamp } from './utils.js';
import { cortexShape, cortexGyri, cerebellumRidges, RIDGE_NORM, CB_RIDGE_NORM } from './gyri.js';
import { bakeLobe, TOPO_LEVELS } from './hololines.js';

// Линий-изолиний по тирам (кора / мозжечок) и параметры трассировки.
// Шаг h заметно меньше размера складки: при крупном шаге RK2 неустойчив
// (линия прыгает через уровень и осциллирует). Мозжечку — мельче всех,
// у него фолии частотой 9. Калибровка плотности огоньков — эти цифры.
const LINES = {
  cortex: { low: 90, medium: 130, high: 170 },
  cb: { low: 26, medium: 38, high: 50 },
};
const TRACE = {
  cortex: { h: 0.03, steps: { low: 90, medium: 130, high: 170 } },
  cb: { h: 0.02, steps: { low: 80, medium: 110, high: 140 } },
};
const EPS = 0.01;    // конечная разность градиента (рад)
const MIN_PTS = 10;  // короче — не линия (плато поля / вырождение)
// Сетка дедупликации (ячеек на единицу direction): клетка чуть БОЛЬШЕ шага
// (~1.5 шага на клетку) — замыкание петли и встреча чужой линии ловятся
// точно, а соседние шаги одной линии законно делят клетку (prevCk в trace)
const CELLS = { cortex: 22, cb: 33 };

// ---------- Поля ridge 0..1 — ровно то, что печёт displaceRadially в brain.js ----------
const _s = new THREE.Vector3();

function cortexField(noise) {
  return function (d) {
    _s.copy(d);
    cortexShape(_s); // поле определено на сформированных координатах
    return clamp(-cortexGyri(noise, _s.x, _s.y, _s.z) / RIDGE_NORM, 0, 1);
  };
}

function cbField(noise) {
  return function (d) {
    return clamp(-cerebellumRidges(noise, d.x, d.y, d.z) / CB_RIDGE_NORM, 0, 1);
  };
}

// ---------- Трассировка изолинии на единичной сфере ----------
// Модульные векторы (однопоточный старт; в горячем цикле новые не создаются,
// кроме точек самих линий)
const _g = new THREE.Vector3();  // градиент поля (касательный)
const _t = new THREE.Vector3();  // направление вдоль изолинии
const _p = new THREE.Vector3();  // полушаг / новая точка
const _q = new THREE.Vector3();  // пробы для конечных разностей
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();

// Градиент поля в касательной плоскости: разности по двум осям e1, e2 ⟂ d.
// Возвращает |g| (≈0 — поле плоское, тут трассировать нельзя).
function gradAt(field, d, out) {
  _e1.set(0, 1, 0);
  if (Math.abs(d.y) > 0.9) _e1.set(1, 0, 0); // опорная ось не параллельна d
  _e1.cross(d).normalize();
  _e2.crossVectors(d, _e1);
  const f1 = field(_q.copy(d).addScaledVector(_e1, EPS).normalize())
          - field(_q.copy(d).addScaledVector(_e1, -EPS).normalize());
  const f2 = field(_q.copy(d).addScaledVector(_e2, EPS).normalize())
          - field(_q.copy(d).addScaledVector(_e2, -EPS).normalize());
  out.copy(_e1).multiplyScalar(f1).addScaledVector(_e2, f2).divideScalar(2 * EPS);
  return out.length();
}

// Подвести семя к целевому уровню вдоль градиента (Ньютон). Семена из плато
// (поле насыщено 0/1, градиент нулевой) отбраковываются СРАЗУ и ничего
// не помечают — иначе они «отравляли» бы карту дедупликации уровня.
function snapToLevel(field, d, level) {
  for (let it = 0; it < 10; it++) {
    const err = field(d) - level;
    if (Math.abs(err) < 0.02) return true;
    const gl = gradAt(field, d, _g);
    if (gl < 1e-4) return false;
    const step = clamp(-err / (gl * gl), -0.12, 0.12); // без длинных прыжков
    d.addScaledVector(_g, step).normalize();
  }
  return Math.abs(field(d) - level) < 0.05;
}

// Шаг изолинии: направление d×g (⟂ градиенту), схема RK2 (полушаг), затем
// ньютоновский возврат на уровень вдоль градиента. false — линия кончилась.
function isoStep(field, d, level, h) {
  if (gradAt(field, d, _g) < 1e-4) return false;
  _t.crossVectors(d, _g).normalize();
  _p.copy(d).addScaledVector(_t, h * 0.5).normalize();
  if (gradAt(field, _p, _g) < 1e-4) return false;
  _t.crossVectors(_p, _g).normalize();
  d.copy(_p).addScaledVector(_t, h * 0.5).normalize();
  for (let it = 0; it < 3; it++) { // корректор: убрать дрейф с уровня
    const err = field(d) - level;
    if (Math.abs(err) < 0.01) break;
    const gl = gradAt(field, d, _g);
    if (gl < 1e-4) return false;
    const step = clamp(-err / (gl * gl), -0.06, 0.06); // без прыжка через складку
    d.addScaledVector(_g, step).normalize();
  }
  return Math.abs(field(d) - level) < 0.03; // не вернулись — упёрлись в плато
}

// Ключ ячейки дедупликации: уровень + округлённый direction (близкие линии
// одного уровня занимают одни ячейки — вторая обрывается при встрече)
function cellKey(k, d, cell) {
  return k + ':' + Math.round(d.x * cell) + ',' + Math.round(d.y * cell) + ',' + Math.round(d.z * cell);
}

// Одна линия: семя прилипает к ближайшей изолинии (те же уровни, что в
// топо-шейдере), трассируется до замыкания петли / чужой линии / лимита.
// prevCk: шаг мельче клетки — соседние шаги делят клетку, это не «повтор».
function trace(field, seed, steps, visited, h, cell) {
  const f0 = field(seed);
  const k = clamp(Math.floor(f0 * TOPO_LEVELS), 0, TOPO_LEVELS - 1);
  const level = (k + 0.5) / TOPO_LEVELS;
  const d = seed.clone();
  if (!snapToLevel(field, d, level)) return null; // плато или не сошёлось
  const first = cellKey(k, d, cell);
  if (visited.has(first)) return null; // тут уже рисовали этот уровень
  visited.add(first);
  const pts = [d.clone()];
  let prevCk = first;
  for (let i = 0; i < steps; i++) {
    if (!isoStep(field, d, level, h)) break;
    pts.push(d.clone());
    const ck = cellKey(k, d, cell);
    if (ck !== prevCk) {
      if (visited.has(ck)) break; // петля замкнулась или рядом чужая линия
      visited.add(ck);
      prevCk = ck;
    }
  }
  return pts.length >= MIN_PTS ? { pts, level } : null;
}

// Равномерные семена по сфере (спираль Фибоначчи) — без сгустков у полюсов
function fibonacciSeeds(n) {
  const GA = Math.PI * (3 - Math.sqrt(5));
  const out = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * i + 1) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = GA * i;
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return out;
}

// Направление → точка поверхности (локальные координаты, как у мешей brain.js)
function cortexPoint(noise) {
  return function (d, out) {
    out.copy(d);
    cortexShape(out);
    const disp = cortexGyri(noise, out.x, out.y, out.z);
    out.multiplyScalar(1 + disp / (out.length() || 1));
  };
}

function cbPoint(noise) {
  return function (d, out) {
    out.copy(d); // мозжечок — единичная сфера, поле прямо на ней
    out.multiplyScalar(1 + cerebellumRidges(noise, d.x, d.y, d.z));
  };
}

// Сборка: линии → один BufferGeometry (position/normal/aRidge/aFlow + bakeLobe)
function buildStreams(field, count, kind, tier, toPoint, lobeKey) {
  const { h } = TRACE[kind];
  const steps = TRACE[kind].steps[tier] || TRACE[kind].steps.medium;
  const seeds = fibonacciSeeds(count * 8); // запас: большинство семян в плато
  const visited = new Set();
  const lines = [];
  const cell = CELLS[kind];
  for (let i = 0; i < seeds.length && lines.length < count; i++) {
    const line = trace(field, seeds[i], steps, visited, h, cell);
    if (line) lines.push(line);
  }
  let n = 0;
  for (let i = 0; i < lines.length; i++) n += lines[i].pts.length;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const ridge = new Float32Array(n);
  const flow = new Float32Array(n);
  const p = new THREE.Vector3();
  let w = 0;
  for (let i = 0; i < lines.length; i++) {
    const { pts, level } = lines[i];
    const last = pts.length - 1;
    for (let j = 0; j <= last; j++, w++) {
      toPoint(pts[j], p);
      pos[w * 3] = p.x; pos[w * 3 + 1] = p.y; pos[w * 3 + 2] = p.z;
      const len = p.length() || 1;
      nor[w * 3] = p.x / len; nor[w * 3 + 1] = p.y / len; nor[w * 3 + 2] = p.z / len;
      ridge[w] = level;      // уровень линии: глубокие борозды ярче (как у топо)
      flow[w] = j / last;    // доля длины — бегущий свет в BRAIN_VERT
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); // радиальные — rim
  geo.setAttribute('aRidge', new THREE.BufferAttribute(ridge, 1));
  geo.setAttribute('aFlow', new THREE.BufferAttribute(flow, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.6); // вручную
  bakeLobe(geo, lobeKey); // неон долей + швы (null — по ближайшему якорю коры)
  return geo;
}

export function makeCortexStreams(tier, noise) {
  return buildStreams(cortexField(noise), LINES.cortex[tier] || LINES.cortex.medium, 'cortex', tier, cortexPoint(noise), null);
}

export function makeCbStreams(tier, noise) {
  return buildStreams(cbField(noise), LINES.cb[tier] || LINES.cb.medium, 'cb', tier, cbPoint(noise), 'cerebellum');
}
