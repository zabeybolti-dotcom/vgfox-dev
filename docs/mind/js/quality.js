// quality.js — рантайм-менеджер качества (S15): EMA FPS, мягкий даунгрейд, один откат.
// Тир устройства выбран на старте (main.js); здесь только рантайм: если душно —
// шаг за шагом снижаем нагрузку, если запас появился — один раз возвращаем шаг назад.
// Решения пишем в консоль (console.info) — легко диагностировать «тормоза» у пользователя.

// ---------- Тюнинг ----------
const EMA_K = 0.06;  // вес нового кадра в среднем (≈полсекунды «памяти»)
const LOW_FPS = 40;  // ниже — душно, копим время до даунгрейда
const HIGH_FPS = 55; // выше — есть запас, копим время до отката
const LOW_SECS = 4;  // с низкого FPS до следующего шага вниз
const HIGH_SECS = 8; // с высокого FPS до единственного отката

export function createQuality({ renderer, effects, dprCap, lowDprCap }) {
  let ema = 60;          // начинаем оптимистично
  let lowT = 0;
  let highT = 0;
  let step = 0;          // 0 — штат; 1 — DPR −0.25; 2 — пыль/импульсы −50%; 3 — DPR-потолок Low
  let rolledBack = false; // откат разрешён один за сессию — без «пилы» вверх-вниз
  let dpr = Math.min(window.devicePixelRatio || 1, dprCap);

  function setDpr(v) {
    dpr = v;
    renderer.setPixelRatio(v);
  }

  // Состояние собирается заново из step — откат и даунгрейд идут одним путём
  function apply(reason) {
    const base = Math.min(window.devicePixelRatio || 1, dprCap);
    setDpr(step >= 1 ? Math.max(1, base - 0.25) : base);
    effects.setLoad(step >= 2 ? 0.5 : 1);
    if (step >= 3) setDpr(Math.min(dpr, lowDprCap));
    console.info(`[MIND] качество: шаг ${step}/3 (dpr ${dpr.toFixed(2)}) — ${reason}`);
  }

  function update(dt) {
    const fps = 1 / Math.max(dt, 1 / 120);
    ema += (fps - ema) * EMA_K;

    // Душно: копим время ниже порога — снижаем шаг
    if (step < 3) {
      if (ema < LOW_FPS) {
        lowT += dt;
        if (lowT >= LOW_SECS) {
          lowT = 0;
          step++;
          apply(`ema ${ema.toFixed(0)} fps < ${LOW_FPS}`);
        }
      } else {
        lowT = 0;
      }
    }

    // Запас: после даунгрейда fps держится высоко — один раз возвращаем шаг
    if (step > 0 && !rolledBack) {
      if (ema > HIGH_FPS) {
        highT += dt;
        if (highT >= HIGH_SECS) {
          highT = 0;
          rolledBack = true;
          step--;
          apply(`ema ${ema.toFixed(0)} fps > ${HIGH_FPS}, откат`);
        }
      } else {
        highT = 0;
      }
    }
  }

  return {
    update,
    get dpr() { return dpr; },
    // Подпись для FPS-оверлея: после шага 3 устройство фактически в тире Low
    label: () => (step >= 3 ? 'low' : null),
  };
}
