// shock.js — кольцо-ударная волна при выборе точки (S08; вынесено из
// effects.js в пр.7 ради лимита строк RULES §5). Пул билборд-квадов:
// раздувание + квадратичное растворение, аддитив, без постобработки.

import * as THREE from '../lib/three.module.min.js';
import { lerp, easeOutCubic } from './utils.js';

// ---------- Тюнинг ----------
const SHOCK_POOL = 6;       // одновременно живущих колец; дальше — перезапись старых
const SHOCK_DUR = 0.7;      // с: жизнь кольца
const SHOCK_SCALE0 = 0.3;   // стартовый размер квадрата кольца
const SHOCK_SCALE1 = 1.6;   // конечный: видимый радиус кольца ≈ 0.4 мира

const SHOCK_VERT = /* glsl */`
  uniform float uScale;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // билборд: вращение меша отброшено, остаётся позиция; квад раздувается uScale'ом
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uScale;
    gl_Position = projectionMatrix * mv;
  }
`;
const SHOCK_FRAG = /* glsl */`
  uniform float uT;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0; // 0 центр, 1 край квада
    float ring = smoothstep(0.64, 0.5, d) * smoothstep(0.36, 0.5, d);
    float a = ring * (1.0 - uT) * (1.0 - uT); // квадратичное растворение
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * (1.25 - uT * 0.35), a);
  }
`;

export function createShocks(scene) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const shocks = [];
  for (let s = 0; s < SHOCK_POOL; s++) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: 1 },
        uScale: { value: SHOCK_SCALE0 },
        uColor: { value: new THREE.Color(1, 1, 1) },
      },
      vertexShader: SHOCK_VERT,
      fragmentShader: SHOCK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    shocks.push({ mesh, mat, t: 1 });
  }
  let turn = 0;

  // Кольцо в точке (x,y,z) цветом её области, чуть светлее — отклик на выбор
  function shockAt(x, y, z, r, g, b) {
    const s = shocks[turn];
    turn = (turn + 1) % SHOCK_POOL;
    s.mesh.position.set(x, y, z);
    s.mat.uniforms.uColor.value.setRGB(
      Math.min(1, r * 0.7 + 0.3),
      Math.min(1, g * 0.7 + 0.3),
      Math.min(1, b * 0.7 + 0.3),
    );
    s.t = 0;
    s.mesh.visible = true;
  }

  function update(dt) {
    for (let s = 0; s < SHOCK_POOL; s++) {
      const sh = shocks[s];
      if (!sh.mesh.visible) continue;
      sh.t += dt / SHOCK_DUR;
      if (sh.t >= 1) {
        sh.mesh.visible = false;
        continue;
      }
      sh.mat.uniforms.uT.value = sh.t;
      sh.mat.uniforms.uScale.value = lerp(SHOCK_SCALE0, SHOCK_SCALE1, easeOutCubic(sh.t));
    }
  }

  function dispose() {
    for (const s of shocks) {
      scene.remove(s.mesh);
      s.mat.dispose();
    }
    geo.dispose();
  }

  return { shockAt, update, dispose };
}
