/* Мастерская РА — общие компоненты: шапка, подвал, тосты, анимации */
(function () {
  "use strict";

  /* ---------- утилиты ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  window.FR = {
    $, $$, fmt, esc,
    catName(slug) {
      const c = (window.CATEGORIES || []).find((c) => c.slug === slug);
      return c ? c.name : "";
    },
    product(id) {
      return (window.PRODUCTS || []).find((p) => p.id === String(id));
    },
  };

  const ICONS = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a0d02" stroke-width="0" stroke-linejoin="round"><path fill="#1a0d02" d="M12 2c.6 3.2-.9 5-2.4 6.6C8 10.3 6.5 12 6.5 14.6A5.9 5.9 0 0 0 12.4 20.5c3 0 5.4-2.3 5.4-5.3 0-1.8-.8-3.2-1.7-4.4-.2 1-.8 1.9-1.8 2.3.4-2.9-.7-6.5-2.3-9.1Z"/><path fill="#1a0d02" d="M12 22c-4 0-7-3-7-7 0-3.3 2-5.3 3.6-7C10 6.4 11 5 10.8 3c2.8 1.6 5.2 4.5 6 7.6.7 2.6.3 5-.4 6.5A7 7 0 0 1 12 22Z" opacity=".55"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  };
  window.FR.icon = (name) => ICONS[name] || "";

  /* ---------- шапка ---------- */
  function renderHeader() {
    const page = document.body.dataset.page || "";
    const host = $("#app-header");
    if (!host) return;

    const links = [
      ["index.html", "Главная", "home"],
      ["catalog.html", "Каталог", "catalog"],
      ["blog.html", "Блог", "blog"],
      ["about.html", "О мастерской", "about"],
    ];
    const nav = links
      .map(([href, label, key]) =>
        `<a href="${href}" class="${page === key ? "is-active" : ""}">${label}</a>`)
      .join("");

    host.innerHTML = `
      <header class="header">
        <div class="container header__inner">
          <a class="logo" href="index.html" aria-label="Мастерская РА — на главную">
            <img class="logo__mark" src="img/logo.png" alt="Эмблема мастерской РА" width="42" height="42">
            <span>
              <span class="logo__name">Мастерская&nbsp;РА</span><br>
              <span class="logo__sub">огненный реквизит · с ${SHOP.since}</span>
            </span>
          </a>
          <nav class="nav" aria-label="Основная навигация">${nav}</nav>
          <div class="header__spacer"></div>
          <form class="search" role="search" action="catalog.html" method="get">
            <span class="search__icon">${ICONS.search}</span>
            <input type="search" name="q" placeholder="Поиск по каталогу…" aria-label="Поиск по каталогу" autocomplete="off">
          </form>
          <a class="cart-link" href="cart.html" aria-label="Корзина">
            ${ICONS.cart}
            <span class="cart-link__count" id="cart-count" aria-live="polite">0</span>
          </a>
          <button class="burger" id="burger" aria-label="Меню" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
        <div class="mobile-menu" id="mobile-menu">
          <form class="search" role="search" action="catalog.html" method="get" style="margin-bottom:8px">
            <span class="search__icon">${ICONS.search}</span>
            <input type="search" name="q" placeholder="Поиск по каталогу…" aria-label="Поиск по каталогу">
          </form>
          ${links.map(([href, label, key]) =>
            `<a href="${href}" class="${page === key ? "is-active" : ""}">${label}</a>`).join("")}
        </div>
      </header>`;

    const burger = $("#burger");
    const menu = $("#mobile-menu");
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open);
    });

    /* поиск: Enter ведёт в каталог с ?q= */
    $$(".header .search input").forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const q = inp.value.trim();
        location.href = q ? "catalog.html?q=" + encodeURIComponent(q) : "catalog.html";
      });
    });
  }

  /* ---------- подвал ---------- */
  function renderFooter() {
    const host = $("#app-footer");
    if (!host) return;

    host.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer__grid">
            <div class="footer__about">
              <a class="logo" href="index.html">
                <img class="logo__mark" src="img/logo.png" alt="Эмблема мастерской РА" width="42" height="42">
                <span>
                  <span class="logo__name">Мастерская&nbsp;РА</span><br>
                  <span class="logo__sub">${esc(SHOP.tagline)} · ${esc(SHOP.city)}</span>
                </span>
              </a>
              <p>${esc(SHOP.tagline)} с ${SHOP.since} года. Изготавливаем пои, веера, роупдарты
                 и сценический реквизит для файр-шоу — вручную и с любовью к пламени.</p>
              <div class="socials" style="margin-top:16px">
                <a href="${SHOP.vk}" target="_blank" rel="noopener" aria-label="Мы в VK" title="Мы в VK">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.1 17.6c-5.3 0-8.4-3.7-8.5-9.8h2.7c.1 4.5 2.1 6.4 3.7 6.8V7.8h2.5v3.9c1.6-.2 3.2-1.9 3.8-3.9h2.5c-.4 2.4-2.1 4.1-3.3 4.8 1.2.6 3.1 2.1 3.9 4.9h-2.8c-.6-1.9-2-3.4-4.1-3.6v3.7h-.4Z"/></svg>
                </a>
                <a href="${SHOP.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.1 14.9l-.5-.3-3 .8.8-2.9-.3-.5A8 8 0 0 1 12 4Zm-3.1 4.2c-.6 0-.9.4-.9 1 0 1.6 1.2 4.2 3.9 4.9 1.9.5 2.6-.1 2.9-.8.2-.5-.2-1-.7-1.2l-1.1-.5c-.4-.2-.7 0-.9.3l-.4.5c-.2.2-.4.3-.7.1-1-.5-1.8-1.3-2.2-2.3-.1-.3 0-.5.2-.7l.5-.4c.2-.2.3-.5.2-.8l-.4-1.2c-.1-.4-.3-.4-.4-.4Z"/></svg>
                </a>
                <a href="${SHOP.phoneHref}" aria-label="Позвонить" title="Позвонить">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.7a2 2 0 0 1 1.6 2Z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Каталог</h4>
              <ul>
                ${CATEGORIES.slice(0, 6).map((c) =>
                  `<li><a href="catalog.html?cat=${c.slug}">${esc(c.name)}</a></li>`).join("")}
                <li><a href="catalog.html">Все товары →</a></li>
              </ul>
            </div>
            <div>
              <h4>Информация</h4>
              <ul>
                <li><a href="about.html">О мастерской</a></li>
                <li><a href="blog.html">Блог</a></li>
                <li><a href="cart.html">Корзина</a></li>
                <li><a href="${SHOP.market}" target="_blank" rel="noopener">Мы в VK</a></li>
              </ul>
            </div>
            <div>
              <h4>Контакты</h4>
              <ul>
                <li><a class="footer__phone" href="${SHOP.phoneHref}">${esc(SHOP.phone)}</a></li>
                <li>${esc(SHOP.city)}</li>
                <li>${esc(SHOP.delivery)}</li>
                <li style="color:var(--ok)">Отвечаем ~15 минут</li>
              </ul>
            </div>
          </div>
          <div class="footer__bottom">
            <span>© ${new Date().getFullYear()} ${esc(SHOP.name)} — ${esc(SHOP.brand)}. Демо-сайт.</span>
            <span>Сделано с 🔥 для любителей пламени</span>
          </div>
        </div>
      </footer>`;
  }

  /* ---------- счётчик корзины ---------- */
  function updateCartBadge() {
    const el = $("#cart-count");
    if (!el) return;
    const n = window.Cart ? Cart.count() : 0;
    el.textContent = n;
    el.classList.toggle("is-visible", n > 0);
  }
  document.addEventListener("cart:changed", updateCartBadge);

  /* ---------- тосты ---------- */
  window.FR.toast = function (msg, type) {
    let box = $(".toasts");
    if (!box) {
      box = document.createElement("div");
      box.className = "toasts";
      document.body.appendChild(box);
    }
    const t = document.createElement("div");
    t.className = "toast" + (type ? " toast--" + type : "");
    t.innerHTML = (type === "ok" ? ICONS.check : type === "err" ? ICONS.info : ICONS.flame) +
      "<span>" + esc(msg) + "</span>";
    box.appendChild(t);
    setTimeout(() => {
      t.classList.add("is-out");
      setTimeout(() => t.remove(), 260);
    }, 3200);
  };

  /* ---------- карточка товара ---------- */
  window.FR.productCard = function (p, delayClass) {
    const badge = p.badge === "new" ? '<span class="badge badge--new">Новинка</span>'
      : p.badge === "hit" ? '<span class="badge badge--hit">Хит</span>' : "";
    const discount = p.oldPrice
      ? `<span class="p-card__discount">−${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : "";
    const stars = ICONS.star;
    return `
      <article class="p-card reveal ${delayClass || ""}">
        <a class="p-card__media" href="product.html?id=${p.id}" aria-label="${esc(p.name)}">
          <img src="${p.imgs[0]}" alt="${esc(p.name)}" loading="lazy">
          <span class="p-card__badges">${badge}</span>
          ${discount}
        </a>
        <div class="p-card__body">
          <span class="p-card__cat">${esc(FR.catName(p.cat))}</span>
          <h3 class="p-card__name"><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
          <div class="p-card__rating">${stars}<span>${p.rating.toFixed(1)} · ${p.reviews} отзывов</span></div>
          <div class="p-card__foot">
            <div class="price">
              <b>${fmt(p.price)}</b>
              ${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ""}
            </div>
            <button class="btn-add js-add" data-id="${p.id}" type="button">
              ${ICONS.plus}<span>В корзину</span>
            </button>
          </div>
        </div>
      </article>`;
  };

  /* ---------- reveal-анимации ---------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    els.forEach((el) => io.observe(el));
    window.FR.reveal = () => $$(".reveal:not(.is-in)").forEach((el) => io.observe(el));
  }

  /* ---------- canvas с искрами ---------- */
  function initSparks() {
    const canvas = document.getElementById("sparks");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    let W, H, sparks = [], raf;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const COLORS = ["#ffb347", "#ff7a1a", "#ff4d00", "#ffd27a", "#ff8f45"];

    function spawn() {
      sparks.push({
        x: W * 0.62 + Math.random() * W * 0.45,
        y: H + 10,
        vx: (Math.random() - 0.68) * 0.9,
        vy: -(1.1 + Math.random() * 2.2),
        size: 0.6 + Math.random() * 2.2,
        life: 0,
        max: 130 + Math.random() * 160,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        flick: Math.random() < 0.4,
      });
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      if (sparks.length < 90 && Math.random() < 0.5) spawn();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx + Math.sin((s.life + s.y) * 0.012) * 0.35;
        s.y += s.vy;
        s.vy *= 0.996;
        s.vx *= 0.997;
        const t = s.life / s.max;
        if (t >= 1 || s.y < -20) { sparks.splice(i, 1); continue; }
        const alpha = s.flick ? (0.35 + Math.sin(s.life * 0.35) * 0.3) * (1 - t) : (1 - t) * 0.85;
        ctx.globalAlpha = Math.max(alpha, 0);
        ctx.fillStyle = s.c;
        ctx.shadowColor = s.c;
        ctx.shadowBlur = s.size * 3.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - t * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    frame();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else frame();
    });
  }

  /* ---------- запуск ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    updateCartBadge();
    initReveal();
    initSparks();
  });
})();
