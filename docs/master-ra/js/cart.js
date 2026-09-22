/* Мастерская РА — корзина на localStorage */
(function () {
  "use strict";

  const KEY = "fr_cart";
  const PROMO_KEY = "fr_promo";
  const PROMOS = { FIRE: 0.10 }; // промокод FIRE — скидка 10%

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch { return {}; }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    dispatch();
  }
  function dispatch() {
    document.dispatchEvent(new CustomEvent("cart:changed"));
  }

  window.Cart = {
    PROMOS,

    items() {
      const raw = read();
      return Object.keys(raw)
        .map((id) => {
          const p = FR.product(id);
          return p ? { ...p, qty: Math.max(1, raw[id] | 0) } : null;
        })
        .filter(Boolean);
    },

    count() {
      const raw = read();
      return Object.values(raw).reduce((s, q) => s + (q | 0), 0);
    },

    add(id, qty) {
      const raw = read();
      raw[id] = (raw[id] | 0) + (qty || 1);
      write(raw);
      const p = FR.product(id);
      FR.toast("«" + (p ? p.name : "Товар") + "» в корзине", "ok");
    },

    set(id, qty) {
      const raw = read();
      qty = Math.max(1, qty | 0);
      if (raw[id]) { raw[id] = qty; write(raw); }
    },

    remove(id) {
      const raw = read();
      delete raw[id];
      write(raw);
    },

    clear() {
      localStorage.removeItem(KEY);
      localStorage.removeItem(PROMO_KEY);
      dispatch();
    },

    has(id) {
      return !!read()[id];
    },

    promo() {
      return localStorage.getItem(PROMO_KEY) || null;
    },

    applyPromo(code) {
      code = String(code || "").trim().toUpperCase();
      if (!code) { this.clearPromo(); return { ok: false, msg: "Введите промокод" }; }
      if (PROMOS[code]) {
        localStorage.setItem(PROMO_KEY, code);
        dispatch();
        return { ok: true, msg: "Промокод «" + code + "» применён: −" + Math.round(PROMOS[code] * 100) + "%" };
      }
      return { ok: false, msg: "Такого промокода нет. Попробуйте FIRE ;)" };
    },

    clearPromo() {
      localStorage.removeItem(PROMO_KEY);
      dispatch();
    },

    totals() {
      const items = this.items();
      const subtotal = items.reduce((s, p) => s + p.price * p.qty, 0);
      const code = this.promo();
      const rate = code && PROMOS[code] ? PROMOS[code] : 0;
      const discount = Math.round(subtotal * rate);
      const delivery = subtotal === 0 || subtotal - discount >= 7000 ? 0 : 450;
      return {
        items, subtotal, discount, delivery,
        promo: code || null,
        total: subtotal - discount + delivery,
        freeDeliveryFrom: 7000,
      };
    },
  };

  /* делегирование кнопок «В корзину» */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-add");
    if (!btn) return;
    e.preventDefault();
    Cart.add(btn.dataset.id, 1);
    btn.classList.add("is-in");
    const label = btn.querySelector("span");
    if (label) {
      const old = label.textContent;
      label.textContent = "В корзине ✓";
      setTimeout(() => { label.textContent = old; btn.classList.remove("is-in"); }, 1600);
    }
  });
})();
