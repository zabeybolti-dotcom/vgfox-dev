// cameraRig.js — своя лёгкая орбит-камера (вместо OrbitControls из examples):
// drag-вращение, колесо/щипок-зум, инерция, полёты flyTo, auto-rotate при простое.
// Никаких панорам и twist'а (границы S02). target всегда в центре мозга.

import { clamp, lerp, easeInOutQuint, shortestAngle } from './utils.js';

// ---------- Тюнинг ----------
const PHI_MIN = 0.3;            // рад: не залезаем на полюса (искажение near pole)
const PHI_MAX = Math.PI - 0.3;
const R_MIN = 1.6;              // зум: от поверхности коры
const R_MAX = 6.5;              // зум: до «мозг как планета»
const DRAG_SPEED = 0.0055;      // рад вращения на пиксель drag
const WHEEL_SPEED = 0.0011;     // экспонента радиуса на пиксель колеса
const PINCH_SPEED = 0.0055;     // экспонента радиуса на пиксель щипка
const INERTIA_DECAY = 4.2;      // 1/с: затухание скорости после отпускания
const V_MAX = 6;                // рад/с: защита от безумных фликов
const R_LERP = 9;               // 1/с: подтягивание radius к цели (зум)
const IDLE_DELAY = 10;          // с простоя до auto-rotate
const AUTO_ROTATE_SPEED = 0.05; // рад/с
const DRAG_HINT_PX = 10;        // суммарное смещение, после которого это «настоящий drag»

export function createCameraRig(camera, dom, opts = {}) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onUserInput = opts.onUserInput || null;   // любой ввод (скип интро, отмена тур-паузы…)
  const onFirstDrag = opts.onFirstDrag || null;   // один раз: пользователь начал вращать

  const st = {
    theta: opts.theta ?? 0,
    phi: clamp(opts.phi ?? 1.35, PHI_MIN, PHI_MAX),
    radius: clamp(opts.radius ?? 3.4, R_MIN, R_MAX),
    targetR: clamp(opts.radius ?? 3.4, R_MIN, R_MAX),
    vTheta: 0,
    vPhi: 0,
    idle: 0,
    fly: null, // { t, dur, from:{theta,phi,r}, to:{theta,phi,r} }
  };

  // ---------- Ввод ----------
  const pointers = new Map(); // pointerId -> { x, y }
  let pinchDist = 0;
  let movedPx = 0;
  let firstDragFired = false;
  let lastMoveTime = 0;

  function resetIdle() { st.idle = 0; }

  function cancelFly() {
    if (st.fly) st.fly = null;
  }

  function userActed() {
    resetIdle();
    cancelFly();
    if (onUserInput) onUserInput();
  }

  function onPointerDown(e) {
    try { dom.setPointerCapture(e.pointerId); } catch (err) { /* прокатит и без capture */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = pointers.values();
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      st.vTheta = 0;
      st.vPhi = 0;
    }
    movedPx = 0;
    lastMoveTime = e.timeStamp;
    userActed();
  }

  function onPointerMove(e) {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;

    if (pointers.size === 1) {
      st.theta -= dx * DRAG_SPEED;
      st.phi = clamp(st.phi - dy * DRAG_SPEED, PHI_MIN, PHI_MAX);
      movedPx += Math.abs(dx) + Math.abs(dy);
      if (!firstDragFired && movedPx > DRAG_HINT_PX && onFirstDrag) {
        firstDragFired = true;
        onFirstDrag();
      }
      // скорость для инерции: угол / время между событиями
      const dt = (e.timeStamp - lastMoveTime) / 1000;
      lastMoveTime = e.timeStamp;
      if (dt > 1 / 240 && dt < 1 / 24) {
        st.vTheta = clamp((-dx * DRAG_SPEED) / dt, -V_MAX, V_MAX);
        st.vPhi = clamp((-dy * DRAG_SPEED) / dt, -V_MAX, V_MAX);
      }
    } else if (pointers.size === 2) {
      const [a, b] = pointers.values();
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && d > 0) {
        st.targetR = clamp(st.targetR * Math.exp((pinchDist - d) * PINCH_SPEED), R_MIN, R_MAX);
      }
      pinchDist = d;
    }
    resetIdle();
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 1) {
      // остались на одном пальце — продолжаем вращение без скачка
      const [only] = pointers.values();
      lastMoveTime = e.timeStamp;
      void only;
    } else if (pointers.size === 0) {
      lastMoveTime = 0;
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 33 : 1; // deltaMode=1: строки, а не пиксели
    st.targetR = clamp(st.targetR * Math.exp(e.deltaY * scale * WHEEL_SPEED), R_MIN, R_MAX);
    userActed();
  }

  function onContextMenu(e) {
    e.preventDefault(); // длинный тап на тач-экранах не должен звать меню
  }

  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('pointercancel', onPointerUp);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', onContextMenu);

  // ---------- Полёты ----------

  function flyTo(to = {}, dur = 1.6) {
    const theta = to.theta ?? st.theta;
    const phi = clamp(to.phi ?? st.phi, PHI_MIN, PHI_MAX);
    const r = clamp(to.r ?? st.radius, R_MIN, R_MAX);
    st.fly = {
      t: 0,
      dur: Math.max(0.2, dur),
      from: { theta: st.theta, phi: st.phi, r: st.radius },
      to: { theta: shortestAngle(theta, st.theta), phi, r },
    };
    st.vTheta = 0;
    st.vPhi = 0;
    st.targetR = r;
    resetIdle();
  }

  // Камера встаёт снаружи вдоль направления на точку — точка оказывается в центре кадра
  function focusPoint(pos, dist = 2.1, dur = 1.2) {
    const len = Math.hypot(pos.x, pos.y, pos.z) || 1;
    const theta = Math.atan2(pos.x, pos.z);
    const phi = Math.acos(clamp(pos.y / len, -1, 1));
    flyTo({ theta, phi, r: len + dist }, dur);
  }

  // ---------- Кадр ----------

  function update(dt) {
    st.idle += dt;

    if (st.fly) {
      const f = st.fly;
      f.t += dt / f.dur;
      const k = easeInOutQuint(clamp(f.t, 0, 1));
      st.theta = lerp(f.from.theta, f.to.theta, k);
      st.phi = lerp(f.from.phi, f.to.phi, k);
      st.radius = lerp(f.from.r, f.to.r, k);
      st.targetR = st.radius; // чтобы после полёта зум не тянул радиус назад
      if (f.t >= 1) st.fly = null;
    } else {
      if (pointers.size === 0) {
        // инерция после отпускания
        st.theta += st.vTheta * dt;
        st.phi = clamp(st.phi + st.vPhi * dt, PHI_MIN, PHI_MAX);
        const damp = Math.exp(-INERTIA_DECAY * dt);
        st.vTheta *= damp;
        st.vPhi *= damp;
        if (Math.abs(st.vTheta) < 0.0005) st.vTheta = 0;
        if (Math.abs(st.vPhi) < 0.0005) st.vPhi = 0;
        // авто-вращение при долгом простое
        if (!reducedMotion && st.idle > IDLE_DELAY) st.theta += AUTO_ROTATE_SPEED * dt;
      }
      // плавный зум
      st.radius += (st.targetR - st.radius) * Math.min(1, R_LERP * dt);
    }

    st.phi = clamp(st.phi, PHI_MIN, PHI_MAX);
    st.radius = clamp(st.radius, R_MIN, R_MAX);

    const sp = Math.sin(st.phi);
    camera.position.set(
      st.radius * sp * Math.sin(st.theta),
      st.radius * Math.cos(st.phi),
      st.radius * sp * Math.cos(st.theta)
    );
    camera.lookAt(0, 0, 0);
  }

  function dispose() {
    dom.removeEventListener('pointerdown', onPointerDown);
    dom.removeEventListener('pointermove', onPointerMove);
    dom.removeEventListener('pointerup', onPointerUp);
    dom.removeEventListener('pointercancel', onPointerUp);
    dom.removeEventListener('wheel', onWheel);
    dom.removeEventListener('contextmenu', onContextMenu);
    pointers.clear();
  }

  return {
    update,
    flyTo,
    focusPoint,
    cancelFly,
    dispose,
    isDragging: () => pointers.size > 0,
    getState: () => st,
  };
}
