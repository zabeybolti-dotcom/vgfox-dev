// utils.js — математика, плавности, детерминированная случайность.
// Общий язык для всех модулей: никакого состояния, только чистые функции.

// ---------- Диапазоны и интерполяция ----------

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Плавный порог: 0 до edge0, 1 после edge1, мягкий переход между
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Эквивалентный угол target, ближайший к current (кратчайший путь по кругу)
export function shortestAngle(target, current) {
  const TAU = Math.PI * 2;
  return target + Math.round((current - target) / TAU) * TAU;
}

// ---------- Easing ----------

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

export function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// ---------- Детерминированная случайность ----------

// mulberry32: крошечный быстрый seeded RNG, одинаковый результат при одном seed
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Шум (S03) ----------
// Value noise 3D: в каждом узле целочисленной решётки — значение [0..1],
// между узлами — трилинейная интерполяция со сглаживанием.
// ВАЖНО: та же схема (значение в узлах + fbm 4 октавы) зеркалится в GLSL в S04.

// Фабрика шума: таблицу перестановок строим один раз на seed.
export function createNoise3D(seed = 1) {
  const rand = mulberry32(seed);
  // Перестановка 0..255, продублированная до 512 — классическая схема Перлина
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  // Псевдослучайное значение узла решётки → [0..1]; & 255 честно заворачивает и минусы
  function lattice(ix, iy, iz) {
    return perm[(perm[(perm[ix & 255] + iy) & 255] + iz) & 255] / 255;
  }

  return function noise3D(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    // Квинтическое сглаживание дробных частей — без сеточных артефактов
    const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
    // Восемь углов куба решётки
    const n000 = lattice(ix, iy, iz);
    const n100 = lattice(ix + 1, iy, iz);
    const n010 = lattice(ix, iy + 1, iz);
    const n110 = lattice(ix + 1, iy + 1, iz);
    const n001 = lattice(ix, iy, iz + 1);
    const n101 = lattice(ix + 1, iy, iz + 1);
    const n011 = lattice(ix, iy + 1, iz + 1);
    const n111 = lattice(ix + 1, iy + 1, iz + 1);
    // Трилинейная интерполяция → [0..1]
    const nx00 = n000 + (n100 - n000) * ux;
    const nx10 = n010 + (n110 - n010) * ux;
    const nx01 = n001 + (n101 - n001) * ux;
    const nx11 = n011 + (n111 - n011) * ux;
    return lerp(lerp(nx00, nx10, uy), lerp(nx01, nx11, uy), uz);
  };
}

// fbm: сумма октав шума с падающей амплитудой; результат нормирован в [0..1].
// 4 октавы, lacunarity 2, gain 0.5 — те же числа, что в GLSL-зеркале S04.
export function fbm3D(noise3D, x, y, z, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise3D(x * freq, y * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}
