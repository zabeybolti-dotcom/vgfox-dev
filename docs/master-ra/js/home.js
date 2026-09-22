/* Мастерская РА — главная страница */
(function () {
  "use strict";

  function renderCats() {
    const host = document.getElementById("home-cats");
    if (!host) return;
    host.innerHTML = CATEGORIES.slice(0, 10).map((c, i) => `
      <a class="cat-card reveal reveal-d${i % 4}" href="catalog.html?cat=${c.slug}">
        <img src="${c.cover}" alt="${FR.esc(c.name)}" loading="lazy">
        <div class="cat-card__body">
          <p class="cat-card__name">${FR.esc(c.name)}</p>
          <p class="cat-card__meta"><em>${c.count}</em> товаров · от ${FR.fmt(c.minPrice)}</p>
        </div>
      </a>`).join("");
  }

  function renderHits() {
    const host = document.getElementById("home-hits");
    if (!host) return;
    const hits = PRODUCTS
      .filter((p) => p.badge === "hit" || p.oldPrice)
      .sort((a, b) => (b.badge === "hit") - (a.badge === "hit") || b.pop - a.pop)
      .slice(0, 8);
    host.innerHTML = hits.map((p, i) => FR.productCard(p, "reveal-d" + (i % 4))).join("");
  }

  function renderReviews() {
    const host = document.getElementById("home-reviews");
    if (!host) return;
    const star = FR.icon("star");
    host.innerHTML = REVIEWS.slice(0, 3).map((r, i) => {
      const prod = FR.product(r.product);
      return `
      <article class="review reveal reveal-d${i}">
        <div class="review__stars">${star.repeat(r.rating)}</div>
        <p class="review__text">${FR.esc(r.text)}</p>
        ${prod ? `<a class="review__prod" href="product.html?id=${prod.id}">→ ${FR.esc(prod.name)}</a>` : ""}
        <div class="review__user">
          <div class="review__ava">${FR.esc(r.name.slice(0, 1))}</div>
          <div>
            <b>${FR.esc(r.name)}</b>
            <span>${FR.esc(r.city)}</span>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function renderBlog() {
    const host = document.getElementById("home-blog");
    if (!host) return;
    host.innerHTML = POSTS.slice(0, 3).map((p, i) => `
      <article class="post-card reveal reveal-d${i}">
        <a class="post-card__media" href="blog-post.html?id=${p.id}">
          <img src="${p.cover}" alt="${FR.esc(p.title)}" loading="lazy">
          <span class="post-card__rubric">${FR.esc(p.rubric)}</span>
        </a>
        <div class="post-card__body">
          <span class="post-card__date">${FR.esc(p.date)}</span>
          <h3 class="post-card__title"><a href="blog-post.html?id=${p.id}">${FR.esc(p.title)}</a></h3>
          <p class="post-card__text">${FR.esc(p.text)}</p>
          <a class="btn btn--dark btn--sm" href="blog-post.html?id=${p.id}">Читать</a>
        </div>
      </article>`).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCats();
    renderHits();
    renderReviews();
    renderBlog();
    if (FR.reveal) FR.reveal();
  });
})();
