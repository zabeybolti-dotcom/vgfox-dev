/* Мастерская РА — стена блога (лента постов в стиле VK) */
(function () {
  "use strict";

  const wall = document.getElementById("blog-wall");
  if (!wall) return;

  const rubricsHost = document.getElementById("blog-rubrics");
  const RUBRICS = ["Новинки", "Мастерская", "Выступления"];
  let current = "Все";

  const ICON_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 0-6.9 5 5 0 0 1 7 0l.4.4.4-.4a5 5 0 0 1 7 0 4.8 4.8 0 0 1 0 6.9Z"/></svg>';
  const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICON_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>';

  /* детерминированные «статистика» поста */
  const seed = (id, k) => (parseInt(id, 10) * k) % 100;
  const likes = (id) => 5 + seed(id, 13) % 42;
  const views = (id) => 140 + seed(id, 37) % 760;

  function needClamp(p) {
    return p.title.length + p.text.length > 240 || p.text.split("\n").length > 7;
  }

  /* фото-сетка поста: раскладка 1/2/3/4+ как в ленте */
  function grid(p) {
    const ph = p.photos;
    const shown = ph.slice(0, 4);
    const rest = ph.length - shown.length;
    const cls = ["", "pg-1", "pg-2", "pg-3", "pg-4"][shown.length] || "pg-4";
    return `
      <div class="post__grid ${cls}">
        ${shown.map((src, i) => `
          <a class="post__ph ${i === shown.length - 1 && rest > 0 ? "post__more" : ""}"
             ${rest > 0 && i === shown.length - 1 ? 'data-n="' + rest + '"' : ""}
             href="blog-post.html?id=${p.id}" aria-label="Фото ${i + 1} к посту">
            <img src="${src}" alt="" loading="lazy">
          </a>`).join("")}
      </div>`;
  }

  function card(p, i) {
    return `
      <article class="post reveal reveal-d${Math.min(i, 3)} ${needClamp(p) ? "is-collapsed" : ""}" data-id="${p.id}">
        <div class="post__head">
          <div class="post__ava"><img src="img/logo.png" alt=""></div>
          <div class="post__who">
            <b>Мастерская РА</b>
            <span>${FR.esc(p.date)} · <i>${FR.esc(p.rubric)}</i></span>
          </div>
          <a class="post__open" href="blog-post.html?id=${p.id}" aria-label="Открыть пост отдельно" title="Открыть пост">↗</a>
        </div>

        <div class="post__body">
          <h2 class="post__title"><a href="blog-post.html?id=${p.id}" style="color:inherit">${FR.esc(p.title)}</a></h2>
          <div class="post__text">${FR.esc(p.text)}</div>
          ${needClamp(p) ? `
            <button class="post__expand" type="button" aria-expanded="false">
              Показать полностью ${ICON_CHEVRON}
            </button>` : ""}
          ${grid(p)}
        </div>

        <div class="post__foot">
          <div class="post__actions">
            <button class="pa-btn js-like" data-id="${p.id}" type="button" aria-label="Нравится">
              ${ICON_HEART}<span>${likes(p.id)}</span>
            </button>
            <span class="pa-btn pa-btn--static" title="Просмотры">
              ${ICON_EYE}<span>${views(p.id)}</span>
            </span>
          </div>
          <a class="btn btn--dark btn--sm" href="blog-post.html?id=${p.id}">Открыть пост</a>
        </div>
      </article>`;
  }

  function render() {
    const list = current === "Все" ? POSTS : POSTS.filter((p) => p.rubric === current);
    wall.innerHTML = list.map(card).join("");
    if (FR.reveal) FR.reveal();
  }

  /* ---------- события стены ---------- */
  wall.addEventListener("click", (e) => {
    /* развернуть / свернуть пост */
    const exp = e.target.closest(".post__expand");
    if (exp) {
      const post = exp.closest(".post");
      const collapsed = post.classList.toggle("is-collapsed");
      exp.setAttribute("aria-expanded", String(!collapsed));
      exp.innerHTML = (collapsed ? "Показать полностью" : "Свернуть") + " " + ICON_CHEVRON;
      return;
    }

    /* лайк (демо) */
    const like = e.target.closest(".js-like");
    if (like) {
      const num = like.querySelector("span");
      const liked = like.classList.toggle("is-liked");
      num.textContent = +num.textContent + (liked ? 1 : -1);
    }
  });

  /* ---------- рубрики: чипы + сайдбар ---------- */
  const all = ["Все"].concat(RUBRICS);
  const count = (r) => r === "Все" ? POSTS.length : POSTS.filter((p) => p.rubric === r).length;

  rubricsHost.innerHTML = all.map((r) => `
    <button class="chip ${r === current ? "is-active" : ""}" type="button" data-r="${FR.esc(r)}">
      ${FR.esc(r)}<span class="chip__count">${count(r)}</span>
    </button>`).join("");

  rubricsHost.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    current = btn.dataset.r;
    rubricsHost.querySelectorAll(".chip").forEach((c) =>
      c.classList.toggle("is-active", c === btn));
    render();
  });

  render();
})();
