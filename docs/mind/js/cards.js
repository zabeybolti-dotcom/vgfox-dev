// cards.js — панель карточки и прогресс (S07): наполнение полей из записи контента,
// закрытие (крестик / Esc / свайп вниз на таче), кольцо «N/200» с тиком на новой точке,
// история открытий в localStorage. Сама точка и полёт камеры — markers.js / main.js.

import { REGIONS, REGION_INDEX } from './regions.js';

// ---------- Тюнинг ----------
const LS_KEY = 'mind.opened'; // localStorage: массив id открытых карточек
const SWIPE_ENGAGE = 12;      // px вниз, после которых жест считается свайпом закрытия
const SWIPE_CLOSE = 72;       // px: суммарный свайп вниз, закрывающий карточку
const TYPE_LABELS = { fact: 'факт', story: 'история', myth: 'миф', number: 'число' };

export function createCards({ panel, progress, total, onClose }) {
  // ---------- DOM ----------
  const regionEl = panel.querySelector('#cardRegion');
  const titleEl = panel.querySelector('#cardTitle');
  const typeEl = panel.querySelector('#cardType');
  const textEl = panel.querySelector('#cardText');
  const storyWrap = panel.querySelector('#cardStoryWrap');
  const storyBtn = panel.querySelector('#cardStoryBtn');
  const storyText = panel.querySelector('#cardStory');
  const closeBtn = panel.querySelector('#cardClose');
  const barEl = progress.querySelector('#progressBar');
  const numEl = progress.querySelector('#progressNum');
  progress.querySelector('.progress__of').textContent = `/${total}`; // из данных, не хардкод

  // Чип области внутри карточки — та же разметка, что у чипов внизу (цвет через --rc)
  const chip = document.createElement('span');
  chip.className = 'region-chip';
  const chipDot = document.createElement('span');
  chipDot.className = 'region-chip__dot';
  const chipLabel = document.createElement('span');
  chip.append(chipDot, chipLabel);
  regionEl.replaceChildren(chip);

  // ---------- Прогресс: localStorage + SVG-кольцо ----------
  const CIRC = 2 * Math.PI * 16; // длина окружности r=16 в viewBox 40

  function loadOpened() {
    try {
      const v = JSON.parse(localStorage.getItem(LS_KEY));
      if (Array.isArray(v)) return new Set(v.filter((x) => typeof x === 'string'));
    } catch (e) { /* приватный режим — просто живём без хранения */ }
    return new Set();
  }
  const opened = loadOpened();

  function renderProgress() {
    const n = Math.min(opened.size, total);
    numEl.textContent = n;
    progress.setAttribute('aria-label', `Открыто ${n} из ${total} точек`);
    barEl.style.strokeDasharray = `${CIRC}`;
    barEl.style.strokeDashoffset = `${CIRC * (1 - n / total)}`;
  }

  // Приятный «тик»: кольцо подпрыгивает на каждой новой точке
  function tickRing() {
    progress.classList.remove('progress--tick');
    void progress.offsetWidth; // форсируем reflow — CSS-анимация стартует заново
    progress.classList.add('progress--tick');
  }

  function markOpened(id) {
    if (opened.has(id)) return false;
    opened.add(id);
    try { localStorage.setItem(LS_KEY, JSON.stringify([...opened])); } catch (e) { /* см. loadOpened */ }
    return true;
  }

  // ---------- История: раскрытие по кнопке ----------
  let storyOpen = false;
  function onStoryClick() {
    storyOpen = !storyOpen;
    storyText.classList.toggle('is-hidden', !storyOpen);
    storyBtn.textContent = storyOpen ? 'Свернуть историю' : 'Читать историю';
  }
  storyBtn.addEventListener('click', onStoryClick);
  function resetStory() {
    storyOpen = false;
    storyText.classList.add('is-hidden');
    storyBtn.textContent = 'Читать историю';
  }

  // ---------- Открытие / закрытие ----------
  let current = null;

  function show(card) {
    current = card;
    const r = REGIONS[REGION_INDEX[card.region]] || REGIONS[0];
    chip.style.setProperty('--rc', `${(r.color >> 16) & 255}, ${(r.color >> 8) & 255}, ${r.color & 255}`);
    chipLabel.textContent = r.name;
    titleEl.textContent = card.title || r.name;
    typeEl.textContent = TYPE_LABELS[card.type] || TYPE_LABELS.fact;
    textEl.textContent = card.text;
    if (card.story) {
      storyWrap.classList.remove('is-hidden');
      storyText.textContent = card.story;
    } else {
      storyWrap.classList.add('is-hidden'); // у заглушек истории нет — блока тоже нет
    }
    resetStory();
    panel.scrollTop = 0;
    panel.classList.remove('is-hidden');
    panel.setAttribute('aria-hidden', 'false');
    if (markOpened(card.id)) tickRing();
    renderProgress();
  }

  function hide() {
    if (!current) return;
    current = null;
    panel.classList.add('is-hidden');
    panel.setAttribute('aria-hidden', 'true');
    if (onClose) onClose(); // main.js: снять выбор точки, погасить область, убрать хэш
  }

  // Esc закрывает открытую карточку (модал «О проекте» оживёт в S15)
  function onKey(e) {
    if (e.key === 'Escape' && current) hide();
  }
  window.addEventListener('keydown', onKey);

  // Крестик в углу карточки — то же закрытие, что Esc/свайп (пр.9: был не привязан)
  function onCloseClick() { hide(); }
  closeBtn.addEventListener('click', onCloseClick);

  // ---------- Свайп вниз (только тач): миримся со скроллом контента ----------
  // Жест включается после SWIPE_ENGAGE px вниз при scrollTop === 0: до этого браузер
  // скроллит карточку как обычно (и сам присылает pointercancel — тогда просто сбрасываем).
  let touchId = null; // pointerId пальца, начавшего жест
  let swipeY = 0;
  let swiping = false;

  function onDown(e) {
    if (e.pointerType !== 'touch' || touchId !== null) return;
    try { panel.setPointerCapture(e.pointerId); } catch (err) { /* без capture тоже живём */ }
    touchId = e.pointerId;
    swipeY = e.clientY;
    swiping = false;
    panel.style.transition = ''; // зачистка на случай оборванного прошлого жеста
    panel.style.transform = '';
  }
  function onMove(e) {
    if (e.pointerId !== touchId) return;
    const dy = e.clientY - swipeY;
    if (!swiping) {
      if (dy < SWIPE_ENGAGE || panel.scrollTop > 0) return; // сперва — скролл контента
      swiping = true;
      panel.style.transition = 'none'; // палец ведёт панель напрямую
    }
    panel.style.transform = `translateY(${Math.max(0, dy) * 0.75}px)`; // с сопротивлением
  }
  function onUp(e) {
    if (e.pointerId !== touchId) return;
    const dy = e.clientY - swipeY;
    touchId = null;
    if (!swiping) return;
    swiping = false;
    panel.style.transition = '';
    panel.style.transform = '';
    if (e.type === 'pointerup' && dy > SWIPE_CLOSE) hide();
  }
  panel.addEventListener('pointerdown', onDown);
  panel.addEventListener('pointermove', onMove);
  panel.addEventListener('pointerup', onUp);
  panel.addEventListener('pointercancel', onUp);

  renderProgress(); // стартовое состояние кольца — из localStorage

  return {
    show,
    hide,
    get currentId() { return current ? current.id : null; },
    dispose() {
      window.removeEventListener('keydown', onKey);
      panel.removeEventListener('pointerdown', onDown);
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerup', onUp);
      panel.removeEventListener('pointercancel', onUp);
      storyBtn.removeEventListener('click', onStoryClick);
      closeBtn.removeEventListener('click', onCloseClick);
    },
  };
}
