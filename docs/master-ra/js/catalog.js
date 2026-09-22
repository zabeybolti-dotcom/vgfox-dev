/* Мастерская РА — каталог: фильтры, сортировка, поиск */
(function () {
  "use strict";

  const grid = document.getElementById("catalog-grid");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const state = {
    cat: params.get("cat") || "all",
    q: (params.get("q") || "").trim().toLowerCase(),
    min: parseFloat(params.get("min")) || null,
    max: parseFloat(params.get("max")) || null,
    badge: params.get("badge") || null,
    sale: params.get("sale") === "1",
    sort: params.get("sort") || "pop",
  };

  const fCats = document.getElementById("f-cats");
  const fCatSelect = document.getElementById("f-cat-select");
  const fMin = document.getElementById("f-min");
  const fMax = document.getElementById("f-max");
  const sortSel = document.getElementById("sort");
  const countEl = document.getElementById("grid-count");

  /* ---------- фильтры: рендер ---------- */
  function renderCatFilters() {
    const all = [{ slug: "all", name: "Все товары", count: PRODUCTS.length }]
      .concat(CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, count: c.count })));
    fCats.innerHTML = all.map((c) => `
      <div class="f-cat ${state.cat === c.slug ? "is-active" : ""}" data-cat="${c.slug}" role="button" tabindex="0">
        ${FR.esc(c.name)}<span>${c.count}</span>
      </div>`).join("");
    if (fCatSelect) fCatSelect.value = state.cat;
  }

  /* выпадающая категория над карточками (мобильные) */
  function initCatSelect() {
    if (!fCatSelect) return;
    const all = [{ slug: "all", name: "Все товары" }]
      .concat(CATEGORIES.map((c) => ({ slug: c.slug, name: c.name })));
    fCatSelect.innerHTML = all.map((c) =>
      `<option value="${c.slug}">${FR.esc(c.name)}</option>`).join("");
    fCatSelect.value = state.cat;
  }

  /* ---------- применение ---------- */
  function currentList() {
    let list = PRODUCTS.slice();

    if (state.cat !== "all") list = list.filter((p) => p.cat === state.cat);
    if (state.q) {
      list = list.filter((p) =>
        (p.name + " " + p.desc + " " + FR.catName(p.cat)).toLowerCase().includes(state.q));
    }
    if (state.min != null) list = list.filter((p) => p.price >= state.min);
    if (state.max != null) list = list.filter((p) => p.price <= state.max);
    if (state.badge) list = list.filter((p) => p.badge === state.badge);
    if (state.sale) list = list.filter((p) => p.oldPrice);

    const sorters = {
      "pop": (a, b) => b.pop - a.pop,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "name": (a, b) => a.name.localeCompare(b.name, "ru"),
      "new": (a, b) => (b.badge === "new") - (a.badge === "new") || b.pop - a.pop,
    };
    list.sort(sorters[state.sort] || sorters.pop);
    return list;
  }

  function render() {
    const list = currentList();

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8M8.5 11h5"/></svg>
          <b>Ничего не нашлось</b>
          Попробуйте смягчить фильтры или поискать по-другому.
        </div>`;
    } else {
      grid.innerHTML = list.map((p) => FR.productCard(p)).join("");
    }

    countEl.innerHTML = state.q
      ? `По запросу «<b>${FR.esc(state.q)}</b>» — ${list.length} ${plural(list.length)}`
      : `Показано <b>${list.length}</b> ${plural(list.length)} из ${PRODUCTS.length}`;

    /* заголовок и описание */
    const cat = CATEGORIES.find((c) => c.slug === state.cat);
    const title = document.getElementById("page-title");
    const desc = document.getElementById("page-desc");
    if (state.q) {
      title.textContent = "Поиск: " + state.q;
      document.title = "Поиск: " + state.q + " — Мастерская РА";
    } else if (cat) {
      title.textContent = cat.name;
      document.title = cat.name + " — каталог Мастерская РА";
      desc.textContent = cat.desc + ". От " + FR.fmt(cat.minPrice) + ".";
    }

    /* подсветка активных чипов */
    document.querySelectorAll("[data-badge]").forEach((ch) =>
      ch.classList.toggle("is-active", state.badge === ch.dataset.badge));
    document.querySelector("[data-sale]")?.classList.toggle("is-active", state.sale);

    if (FR.reveal) FR.reveal();
  }

  function plural(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "товар";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "товара";
    return "товаров";
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.cat !== "all") p.set("cat", state.cat);
    if (state.q) p.set("q", state.q);
    if (state.min != null) p.set("min", state.min);
    if (state.max != null) p.set("max", state.max);
    if (state.badge) p.set("badge", state.badge);
    if (state.sale) p.set("sale", "1");
    if (state.sort !== "pop") p.set("sort", state.sort);
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  /* ---------- события ---------- */
  fCats.addEventListener("click", (e) => {
    const el = e.target.closest(".f-cat");
    if (!el) return;
    state.cat = el.dataset.cat;
    renderCatFilters();
    render();
    syncUrl();
  });
  fCats.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("f-cat")) e.target.click();
  });
  fCatSelect?.addEventListener("change", () => {
    state.cat = fCatSelect.value;
    renderCatFilters();
    render();
    syncUrl();
  });

  let deb;
  function onPrice() {
    clearTimeout(deb);
    deb = setTimeout(() => {
      state.min = parseFloat(fMin.value) || null;
      state.max = parseFloat(fMax.value) || null;
      render();
      syncUrl();
    }, 350);
  }
  fMin.addEventListener("input", onPrice);
  fMax.addEventListener("input", onPrice);

  sortSel.value = state.sort;
  sortSel.addEventListener("change", () => {
    state.sort = sortSel.value;
    render();
    syncUrl();
  });

  document.querySelectorAll("[data-badge]").forEach((ch) =>
    ch.addEventListener("click", () => {
      state.badge = state.badge === ch.dataset.badge ? null : ch.dataset.badge;
      render();
      syncUrl();
    }));
  document.querySelector("[data-sale]")?.addEventListener("click", () => {
    state.sale = !state.sale;
    render();
    syncUrl();
  });

  document.getElementById("f-reset").addEventListener("click", () => {
    state.cat = "all"; state.q = ""; state.min = null; state.max = null;
    state.badge = null; state.sale = false; state.sort = "pop";
    fMin.value = ""; fMax.value = ""; sortSel.value = "pop";
    const search = document.querySelector(".header .search input");
    if (search) search.value = "";
    renderCatFilters();
    render();
    syncUrl();
  });

  /* живой поиск из шапки (Enter обрабатывает main.js переходом).
     Шапка рендерится в main.js по DOMContentLoaded — вешаем тогда же. */
  function initHeaderSearch() {
    const headerSearch = document.querySelector(".header__inner .search input");
    if (!headerSearch) return;
    let qDeb;
    headerSearch.addEventListener("input", () => {
      clearTimeout(qDeb);
      qDeb = setTimeout(() => {
        state.q = headerSearch.value.trim().toLowerCase();
        render();
        syncUrl();
      }, 350);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeaderSearch);
  } else {
    initHeaderSearch();
  }

  renderCatFilters();
  initCatSelect();
  render();
})();
