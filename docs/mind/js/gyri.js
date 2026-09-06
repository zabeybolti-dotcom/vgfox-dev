// gyri.js — пр.8: форма силуэта коры и поля складок (кора/мозжечок).
// Чистые функции без геометрии: нужны и brain.js (меши-мишени, топо-линии),
// и трассировщику изолиний streams.js — один источник правды про форму.

import { lerp, smoothstep, fbm3D } from './utils.js';

// ---------- Параметры силуэта (S03, RULES §5) ----------
const SCALE_X = 0.82;        // эллипсоид: уже, чем выше
const SCALE_Y = 0.75;        // сплюснут сверху
const SCALE_Z = 1.05;        // вытянут вперёд-назад
const FRONTAL_NARROW = 0.82; // лоб (z>0) уже затылка во столько раз
const FLAT_BOTTOM = 0.72;    // дно приплюснуто (височные доли снизу)
const FISSURE_DEPTH = 0.16;  // глубина продольной щели между полушариями
const FISSURE_SIGMA = 0.09;  // ширина щели по x (сигма гауссианы)
const FISSURE_MASK_TOP = 0.3;// выше этой y щель на полную глубину (плавный ввод)

// ---------- Извилины коры (S04, пр.7: крупнее и плавнее) ----------
export const GYRI_SEED = 7;      // seed шума: смена = другая «карта складок»
export const GYRI_FREQ = 2.2;    // базовый масштаб складок
export const GYRI_WARP = 0.3;    // сила domain warp — изломанность складок
export const GYRI_OCT = 3;       // октавы fbm: меньше — плавнее поле
const GYRI_SHARP = 2.0;          // острота гребней (степень ridged-функции)
const GYRI_CENTER = 0.55;        // центр смещения: гребни наружу, борозды внутрь
const GYRI_AMP = 0.07;           // амплитуда рельефа вдоль радиуса
export const RIDGE_NORM = GYRI_CENTER * GYRI_AMP; // |смещение| борозды → 0..1

// ---------- Фолии мозжечка (S04) ----------
export const CB_SEED = 11;
const CB_FREQ_X = 1.5;               // фолии растянуты по x → частота вдоль него низкая
const CB_FREQ_YZ = 9.0;              // мелкие горизонтальные рёбра по y и z
const CB_SHARP = 2.0;
const CB_CENTER = 0.55;
const CB_AMP = 0.06;                 // в локальных координатах единичной сферы
export const CB_RIDGE_NORM = CB_CENTER * CB_AMP;

// Силуэт коры: единичный вектор сферы → деформированная точка (шаги 1–4 S03).
// Радиальное смещение извилин НЕ входит — его делает displaceRadially в brain.js.
// Меняет v на месте (подходит и THREE.Vector3, и простой {x,y,z}).
export function cortexShape(v) {
  // 1) лоб уже затылка: плавно сжимаем x к переднему полюсу (z>0)
  v.x *= lerp(1, FRONTAL_NARROW, smoothstep(0, 1, v.z));
  // 2) плоское дно: нижняя половина плавно сплющивается (без излома на экваторе)
  v.y *= lerp(1, FLAT_BOTTOM, smoothstep(0, 0.8, -v.y));
  // 3) основной эллипсоид
  v.x *= SCALE_X;
  v.y *= SCALE_Y;
  v.z *= SCALE_Z;
  // 4) продольная щель: гауссова канавка вдоль x≈0, только сверху
  const top = smoothstep(0, FISSURE_MASK_TOP, v.y);
  v.y -= FISSURE_DEPTH * Math.exp(-(v.x * v.x) / (2 * FISSURE_SIGMA * FISSURE_SIGMA)) * top;
  return v;
}

// Ridged fbm с domain warp: гребень — где fbm проходит через центр своего
// диапазона. Второй fbm (q) на удвоенной частоте «ломает» вход первого,
// поэтому складки не превращаются в правильные кольца. Вход — координаты
// ПОСЛЕ cortexShape (так делал displaceRadially, так же делает streams.js).
export function cortexGyri(noise3D, x, y, z) {
  const f2 = GYRI_FREQ * 2;
  const qx = fbm3D(noise3D, x * f2 + 5.2, y * f2 + 1.3, z * f2, GYRI_OCT) - 0.5;
  const qy = fbm3D(noise3D, x * f2 + 9.7, y * f2 + 7.1, z * f2 + 3.9, GYRI_OCT) - 0.5;
  const qz = fbm3D(noise3D, x * f2 + 2.4, y * f2 + 8.8, z * f2 + 6.5, GYRI_OCT) - 0.5;
  const f = fbm3D(noise3D, x * GYRI_FREQ + GYRI_WARP * qx, y * GYRI_FREQ + GYRI_WARP * qy, z * GYRI_FREQ + GYRI_WARP * qz, GYRI_OCT) * 2 - 1;
  return (Math.pow(1 - Math.abs(f), GYRI_SHARP) - GYRI_CENTER) * GYRI_AMP;
}

// Фолии мозжечка: тот же ridged-принцип, но шум растянут по x → рёбра горизонтальные
export function cerebellumRidges(noise3D, x, y, z) {
  const f = fbm3D(noise3D, x * CB_FREQ_X, y * CB_FREQ_YZ, z * CB_FREQ_YZ) * 2 - 1;
  return (Math.pow(1 - Math.abs(f), CB_SHARP) - CB_CENTER) * CB_AMP;
}
