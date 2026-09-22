/* Мастерская РА — карточка товара */
(function () {
  "use strict";

  const root = document.getElementById("p-root");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id");
  const p = FR.product(id);

  if (!p) {
    root.innerHTML = `
      <div class="nf">
        <div class="nf__code">404</div>
        <h1>Товар не найден</h1>
        <p>Возможно, ссылка устарела или товар переехал. Загляните в каталог — там 56 позиций.</p>
        <a class="btn btn--fire btn--lg" href="catalog.html">В каталог</a>
      </div>`;
    document.title = "Товар не найден — Мастерская РА";
    return;
  }

  document.title = p.name + " — Мастерская РА";

  const cat = FR.catName(p.cat);
  const star = FR.icon("star");

  /* -------- характеристики из описания -------- */
  function buildProps() {
    const props = [];
    const mats = [];
    if (/керамическ/i.test(p.desc)) mats.push("керамическое волокно");
    if (/кевлар/i.test(p.desc)) mats.push("кевлар");
    if (/нержаве/i.test(p.desc)) mats.push("нержавеющая сталь");
    if (/дюраль/i.test(p.desc)) mats.push("дюраль");
    if (/бук/i.test(p.desc)) mats.push("бук");
    props.push(["Материалы", mats.length ? mats.join(", ") : "керамическое волокно, нержавейка"]);

    const d = p.desc.match(/длина[^.\n]*?(\d+[.,]?\d*)\s*см/i);
    if (d) props.push(["Длина", d[1].replace(".", ",") + " см"]);
    const w = p.desc.match(/вес[^.\n]*?(\d+)\s*грамм/i);
    if (w) props.push(["Вес фитиля", "~" + w[1] + " г"]);

    props.push(["Гарантия", "бесплатный ремонт швов — 6 мес."]);
    props.push(["Доставка", "по РФ от 2 дней, СПб — самовывоз"]);
    return props;
  }

  root.innerHTML = `
    <div class="product">
      <div class="gallery reveal">
        <div class="gallery__main"><img id="g-main" src="${p.imgs[0]}" alt="${FR.esc(p.name)}"></div>
        ${p.imgs.length > 1 ? `<div class="gallery__thumbs" id="g-thumbs">
          ${p.imgs.map((src, i) => `
            <button class="gallery__thumb ${i === 0 ? "is-active" : ""}" data-src="${src}" type="button" aria-label="Фото ${i + 1}">
              <img src="${src}" alt="" loading="lazy">
            </button>`).join("")}
        </div>` : ""}
      </div>

      <div class="product__info reveal reveal-d1">
        <span class="product__cat">${FR.esc(cat)}</span>
        <h1 class="product__title">${FR.esc(p.name)}</h1>
        <div class="product__meta">
          <span class="product__rating">${star}<span>${p.rating.toFixed(1)} · ${p.reviews} отзывов</span></span>
          ${p.badge === "new" ? '<span class="badge badge--new">Новинка</span>' : ""}
          ${p.badge === "hit" ? '<span class="badge badge--hit">Хит</span>' : ""}
          <span style="color:var(--ok);font-size:14px">● В наличии</span>
        </div>

        <div class="product__price">
          <b>${FR.fmt(p.price)}</b>
          ${p.oldPrice ? `<s>${FR.fmt(p.oldPrice)}</s><span class="badge badge--hit">выгода ${FR.fmt(p.oldPrice - p.price)}</span>` : ""}
        </div>

        <div class="product__actions">
          <div class="qty">
            <button type="button" id="q-minus" aria-label="Уменьшить">−</button>
            <input type="number" id="q-val" value="1" min="1" max="99" aria-label="Количество">
            <button type="button" id="q-plus" aria-label="Увеличить">+</button>
          </div>
          <button class="btn btn--fire btn--lg js-add" data-id="${p.id}" type="button">
            ${FR.icon("cart")} В корзину
          </button>
        </div>

        <div class="product__desc">
          <h3>Описание</h3>
          <p class="desc-text">${FR.esc(p.desc)}</p>
          <ul class="props">
            ${buildProps().map(([k, v]) => `<li><span>${FR.esc(k)}</span><b>${FR.esc(v)}</b></li>`).join("")}
          </ul>
          <div class="notice">
            ${FR.icon("info")}
            <span>Нужна другая длина, вес или материал? Мастерская делает кастом под вас —
            напишите в чат или <a href="${SHOP.vk}" target="_blank" rel="noopener" style="color:var(--amber)">в VK</a>.</span>
          </div>
        </div>
      </div>
    </div>`;

  /* крошки */
  document.getElementById("p-crumbs").innerHTML = `
    <a href="index.html">Главная</a><span>/</span>
    <a href="catalog.html">Каталог</a><span>/</span>
    <a href="catalog.html?cat=${p.cat}">${FR.esc(cat)}</a><span>/</span>
    <b>${FR.esc(p.name)}</b>`;

  /* галерея */
  const main = document.getElementById("g-main");
  document.getElementById("g-thumbs")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".gallery__thumb");
    if (!btn) return;
    main.src = btn.dataset.src;
    main.closest(".gallery__main").animate(
      [{ opacity: 0.4 }, { opacity: 1 }], { duration: 250 });
    document.querySelectorAll(".gallery__thumb").forEach((t) =>
      t.classList.toggle("is-active", t === btn));
  });

  /* количество + добавление с учётом qty */
  const qVal = document.getElementById("q-val");
  document.getElementById("q-minus").addEventListener("click", () => {
    qVal.value = Math.max(1, (+qVal.value || 1) - 1);
  });
  document.getElementById("q-plus").addEventListener("click", () => {
    qVal.value = Math.min(99, (+qVal.value || 1) + 1);
  });
  /* перехватываем стандартную кнопку .js-add, чтобы учесть количество */
  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-add");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    Cart.add(p.id, Math.max(1, +qVal.value || 1));
  }, true);

  /* похожие */
  const related = PRODUCTS
    .filter((r) => r.cat === p.cat && r.id !== p.id)
    .sort((a, b) => b.pop - a.pop)
    .slice(0, 4);
  if (related.length) {
    document.getElementById("related-root").hidden = false;
    document.getElementById("related-grid").innerHTML =
      related.map((r) => FR.productCard(r)).join("");
    if (FR.reveal) FR.reveal();
  }
})();
