// modes.js — движок «живых режимов» (S14): очередь шагов, на каждом — полёт камеры,
// каскадная подсветка областей и точек, строка нарратива, авто-переход по паузе.
// Тап по канвасу или по панели — следующий шаг; Esc или крестик — выход с полным
// сбросом состояний (подсветки, точек, пэда, рентгена возвращает main.js через onActive).
// Сами сценарии — данные в js/data/content-modes.js (RULES §4: тут только механика).

// ---------- Тюнинг ----------
const FADE_MS = 500;      // мс: затухание/появление строки текста (синхронно с CSS)
const OUTRO_PAUSE = 8;    // с: сколько висит финальная строка перед авто-выходом
const FLY_SHARE = 0.5;    // полёт камеры занимает не больше этой доли паузы шага
const READ_BASE = 1.5;    // с: фикс. время на появление строки (пр.20)
const READ_CPS = 18;      // симв/с: темп неспешного чтения — пауза не короче чтения

// Пр.20: шаг держится, пока строку успеешь прочитать, даже если автор паузы скромнее
function hold(s) {
  return Math.max(s.pause || 4, READ_BASE + (s.text ? s.text.length : 0) / READ_CPS);
}

export function createModes({ modes, rig, regions, markers, audio, dock, overlay, onActive, onStep }) {
  // ---------- DOM ----------
  const nameEl = overlay.querySelector('#modeName');
  const textEl = overlay.querySelector('#modeText');
  const exitBtn = overlay.querySelector('#modeExit');

  // Кнопки режимов строим из данных: цвет и подпись — из MODES, не хардкод
  const btns = modes.map((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-btn';
    // --rc «r, g, b» — тот же приём, что у чипов областей
    b.style.setProperty('--rc', `${(m.color >> 16) & 255}, ${(m.color >> 8) & 255}, ${m.color & 255}`);
    const dot = document.createElement('span');
    dot.className = 'mode-btn__dot';
    b.append(dot, document.createTextNode(m.name));
    b.addEventListener('click', () => start(m));
    dock.appendChild(b);
    return b;
  });

  // ---------- Состояние прогона ----------
  let cur = null; // { mode, stepIdx }
  let gen = 0;    // поколение прогона: таймеры прошлого прогона молчат
  let timer = 0;

  function active() { return !!cur; }

  // Смена строки: сперва растворить, потом подменить текст и проявить
  function setText(s) {
    textEl.classList.add('is-fading');
    const g = gen;
    setTimeout(() => {
      if (g !== gen) return; // вышли из режима, пока текст гас
      textEl.textContent = s;
      textEl.classList.remove('is-fading');
    }, FADE_MS);
  }

  function showStep(i) {
    const s = cur.mode.steps[i];
    cur.stepIdx = i;
    const dt = hold(s); // пр.20: пауза шага не короче времени чтения строки
    if (s.cam) rig.flyTo(s.cam, Math.max(1.2, dt * FLY_SHARE));
    regions.glowSet(s.regions || []);
    markers.setModeSet(s.markers || null);
    if (onStep) onStep(s); // пр.17: шаг с deep-зоной сам включает рентген (main.js)
    setText(s.text);
    const g = gen;
    timer = setTimeout(() => { if (g === gen) advance(); }, dt * 1000);
  }

  // Тап или таймер: следующий шаг; на финальной строке тап — сразу выход.
  // clearTimeout страхует от гонки: тапом перебили авто-переход — старый таймер молчит.
  function advance() {
    if (!cur) return;
    clearTimeout(timer);
    if (cur.finished) { exit(); return; }
    if (cur.stepIdx + 1 < cur.mode.steps.length) {
      showStep(cur.stepIdx + 1);
      return;
    }
    finish();
  }

  function finish() {
    cur.finished = true;
    const g = gen;
    markers.setModeSet(null);
    if (onStep) onStep(null); // аутро: зон не показываем — рентген гаснет (пр.17)
    setText(cur.mode.outro);
    timer = setTimeout(() => { if (g === gen) exit(); }, OUTRO_PAUSE * 1000);
  }

  function start(mode) {
    if (cur) exit(); // перезапуск из режима — с чистыми состояниями
    gen++;
    cur = { mode, stepIdx: -1 };
    if (onActive) onActive(true, mode);
    if (audio) audio.startPad(mode.color);
    nameEl.textContent = mode.name;
    overlay.classList.remove('is-hidden');
    showStep(0);
  }

  function exit() {
    if (!cur) return;
    cur = null;
    gen++;
    clearTimeout(timer);
    regions.glowClear();
    markers.setModeSet(null);
    if (audio) audio.stopPad();
    overlay.classList.add('is-hidden');
    if (onActive) onActive(false, null);
  }

  // Панель режима: клик — «дальше», крестик — выход (клик мимо панели летит в канвас)
  function onOverlayClick(e) {
    if (e.target === exitBtn) exit();
    else advance();
  }
  overlay.addEventListener('click', onOverlayClick);

  function onKey(e) {
    if (e.key === 'Escape' && cur) exit();
  }
  window.addEventListener('keydown', onKey);

  return {
    start,
    next: advance, // канвасный тап форвардит main.js: во время режима тап = «дальше»
    exit,
    active,
    dispose() {
      window.removeEventListener('keydown', onKey);
      overlay.removeEventListener('click', onOverlayClick);
      btns.forEach((b) => b.remove());
      exit();
    },
  };
}
