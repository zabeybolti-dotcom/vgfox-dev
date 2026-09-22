/* Мастерская РА — страница поста блога */
(function () {
  "use strict";

  const root = document.getElementById("post-root");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id");
  const p = POSTS.find((x) => x.id === id) || POSTS[0];

  document.title = p.title + " — блог Мастерская РА";

  document.getElementById("post-crumbs").innerHTML = `
    <a href="index.html">Главная</a><span>/</span>
    <a href="blog.html">Блог</a><span>/</span>
    <b>${FR.esc(p.title)}</b>`;

  const idx = POSTS.findIndex((x) => x.id === p.id);
  const prev = POSTS[idx + 1];
  const next = POSTS[idx - 1];

  root.innerHTML = `
    <article class="post-layout">
      <div class="post-meta">
        <span class="chip">${FR.esc(p.rubric)}</span>
        <span>${FR.esc(p.date)}</span>
        <span>·</span>
        <span>мастерская РА</span>
      </div>
      <h1 style="margin:14px 0 0">${FR.esc(p.title)}</h1>
      <div class="post-hero"><img src="${p.photos[0]}" alt="${FR.esc(p.title)}"></div>
      <div class="post-body">${FR.esc(p.text)}</div>
      ${p.photos.length > 1 ? `
        <div class="post-gallery">
          ${p.photos.slice(1).map((src) => `
            <a href="${src}" target="_blank" rel="noopener">
              <img src="${src}" alt="${FR.esc(p.title)} — фото" loading="lazy">
            </a>`).join("")}
        </div>` : ""}
      <div class="post-nav">
        ${prev ? `<a class="btn btn--ghost" href="blog-post.html?id=${prev.id}">← ${FR.esc(prev.title.slice(0, 26))}…</a>` : "<span></span>"}
        ${next ? `<a class="btn btn--ghost" href="blog-post.html?id=${next.id}">${FR.esc(next.title.slice(0, 26))}… →</a>` : ""}
      </div>
    </article>

    <div class="cta" style="margin:56px 0 70px">
      <div>
        <h2>Понравился реквизит?</h2>
        <p>Всё, что появляется в блоге, доступно к заказу — в стандартном или кастомном исполнении.</p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a class="btn btn--fire btn--lg" href="catalog.html">В каталог</a>
        <a class="btn btn--ghost btn--lg" href="${SHOP.vk}" target="_blank" rel="noopener">Мы в VK</a>
      </div>
    </div>`;

  /* ещё посты */
  const more = POSTS.filter((x) => x.id !== p.id).slice(0, 3);
  if (more.length) {
    document.getElementById("more-root").hidden = false;
    document.getElementById("more-grid").innerHTML = more.map((m, i) => `
      <article class="post-card reveal reveal-d${i}">
        <a class="post-card__media" href="blog-post.html?id=${m.id}">
          <img src="${m.cover}" alt="${FR.esc(m.title)}" loading="lazy">
          <span class="post-card__rubric">${FR.esc(m.rubric)}</span>
        </a>
        <div class="post-card__body">
          <span class="post-card__date">${FR.esc(m.date)}</span>
          <h3 class="post-card__title"><a href="blog-post.html?id=${m.id}">${FR.esc(m.title)}</a></h3>
          <p class="post-card__text">${FR.esc(m.text.split("\n")[0])}</p>
        </div>
      </article>`).join("");
    if (FR.reveal) FR.reveal();
  }
})();
