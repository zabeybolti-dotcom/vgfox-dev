// tour.js — автоэкскурсия (S15): маршрут из 12 лучших точек (id-список — content-modes.js).
// Плей: перелёт к точке → карточка висит 6–8 c (дольше текст — дольше пауза) → следующая.
// Любое ручное взаимодействие ставит на паузу; пульт: назад / пауза-плей / вперёд / ×.
// Маршрут заканчивается сам: после последней точки пульт закрывается, сцена свободна.

// ---------- Тюнинг ----------
const DWELL_MIN = 6;            // с: минимальная пауза на карточке
const DWELL_MAX = 8;            // с: потолок для длинных текстов
const DWELL_PER_CHAR = 1 / 160; // с на символ текста сверх минимума

export function createTour({ cards, ui, open, close }) {
  const bar = ui.bar;
  const count = ui.count;
  const playBtn = ui.play;

  let idx = -1;       // текущая точка маршрута
  let timer = 0;      // авто-переход
  let playing = false;

  const active = () => !bar.classList.contains('is-hidden');

  function dwellOf(card) {
    const extra = (card.text ? card.text.length : 0) * DWELL_PER_CHAR;
    return Math.min(DWELL_MAX, DWELL_MIN + extra);
  }

  function renderBar() {
    count.textContent = `${idx + 1}/${cards.length}`;
    playBtn.textContent = playing ? '❚❚' : '▶';
    playBtn.title = playing ? 'Пауза' : 'Продолжить';
  }

  function show(i) {
    idx = ((i % cards.length) + cards.length) % cards.length; // вручную можно листать по кругу
    open(cards[idx]);
    renderBar();
    arm();
  }

  // Авто-переход: после последней точки маршрут сам заканчивается
  function advance() {
    if (idx >= cards.length - 1) { stop(); return; }
    show(idx + 1);
  }

  function arm() {
    clearTimeout(timer);
    if (playing) timer = setTimeout(advance, dwellOf(cards[idx]) * 1000);
  }

  function next() { if (active()) show(idx + 1); }
  function prev() { if (active()) show(idx - 1); }

  // Ручной жест (drag, тап, чип): пауза — камера и карточка остаются как есть
  function pause() {
    if (!active() || !playing) return;
    playing = false;
    clearTimeout(timer);
    renderBar();
  }

  function resume() {
    if (!active() || playing) return;
    playing = true;
    renderBar();
    arm(); // досидим на текущей точке полный интервал и поедем дальше
  }

  function start() {
    if (active()) return;
    bar.classList.remove('is-hidden');
    playing = true;
    show(0);
  }

  function stop() {
    if (!active()) return;
    clearTimeout(timer);
    playing = false;
    bar.classList.add('is-hidden');
    close(); // спрятать карточку, снять подсветки (main.js: cards.hide())
  }

  ui.prev.addEventListener('click', prev);
  ui.next.addEventListener('click', next);
  ui.exit.addEventListener('click', stop);
  playBtn.addEventListener('click', () => (playing ? pause() : resume()));

  function onKey(e) {
    if (e.key === 'Escape' && active()) stop();
  }
  window.addEventListener('keydown', onKey);

  return { start, stop, next, prev, pause, resume, active };
}
