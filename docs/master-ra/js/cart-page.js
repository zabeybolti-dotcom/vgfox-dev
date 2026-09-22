/* Мастерская РА — страница корзины */
(function () {
  "use strict";

  const root = document.getElementById("cart-root");
  if (!root) return;

  function render() {
    const t = Cart.totals();

    if (!t.items.length) {
      root.innerHTML = `
        <div class="cart-layout">
          <div class="empty" style="padding:80px 20px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6"/></svg>
            <b>Пока пусто</b>
            Самое время выбрать реквизит — каталог ждёт.
            <div style="margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a class="btn btn--fire" href="catalog.html">В каталог</a>
              <a class="btn btn--ghost" href="catalog.html?badge=hit">Смотреть хиты</a>
            </div>
          </div>
        </div>`;
      return;
    }

    const toFree = t.freeDeliveryFrom - (t.subtotal - t.discount);
    root.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="cart-items">
            ${t.items.map((p) => `
              <div class="cart-item" data-id="${p.id}">
                <a class="cart-item__img" href="product.html?id=${p.id}">
                  <img src="${p.imgs[0]}" alt="${FR.esc(p.name)}">
                </a>
                <div>
                  <p class="cart-item__name"><a href="product.html?id=${p.id}">${FR.esc(p.name)}</a></p>
                  <span class="cart-item__cat">${FR.esc(FR.catName(p.cat))} · ${FR.fmt(p.price)} / шт.</span>
                </div>
                <div class="cart-item__right">
                  <span class="cart-item__price">${FR.fmt(p.price * p.qty)}</span>
                  <div class="cart-item__row">
                    <div class="qty" style="transform:scale(.92)">
                      <button type="button" class="js-dec" data-id="${p.id}" aria-label="Уменьшить">−</button>
                      <input type="number" value="${p.qty}" min="1" max="99" data-id="${p.id}" class="js-qty" aria-label="Количество">
                      <button type="button" class="js-inc" data-id="${p.id}" aria-label="Увеличить">+</button>
                    </div>
                    <button class="cart-item__del js-del" data-id="${p.id}" type="button" aria-label="Удалить">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              </div>`).join("")}
          </div>
          <div class="cart-tools">
            <a class="btn btn--ghost" href="catalog.html">← Продолжить покупки</a>
            <button class="btn btn--dark" type="button" id="clear-cart">Очистить корзину</button>
          </div>
        </div>

        <aside class="summary">
          <h3>Итого</h3>
          <div class="summary__row"><span>Товары (${t.items.reduce((s, p) => s + p.qty, 0)})</span><b>${FR.fmt(t.subtotal)}</b></div>
          ${t.discount ? `<div class="summary__row"><span>Промокод «${FR.esc(t.promo)}»</span><b class="summary__save">−${FR.fmt(t.discount)}</b></div>` : ""}
          <div class="summary__row">
            <span>Доставка</span>
            <b>${t.delivery === 0 ? '<span class="summary__save">бесплатно</span>' : FR.fmt(t.delivery)}</b>
          </div>
          ${toFree > 0 && t.delivery > 0
            ? `<div class="summary__row"><span style="font-size:12.5px;color:var(--muted-2)">До бесплатной доставки ещё ${FR.fmt(toFree)}</span><span></span></div>` : ""}
          <div class="summary__row summary__row--total"><span>К оплате</span><b>${FR.fmt(t.total)}</b></div>

          <form class="promo" id="promo-form">
            <input type="text" id="promo-input" placeholder="Промокод" value="${FR.esc(t.promo || "")}"
              aria-label="Промокод" autocomplete="off">
            <button class="btn btn--dark" type="submit">${t.promo ? "Снять" : "ОК"}</button>
          </form>
          <p id="promo-msg" class="${t.promo ? "promo__ok" : ""}" style="margin:0">
            ${t.promo ? FR.icon("check") + " Скидка 10% применена" : ""}
          </p>

          <a class="btn btn--fire btn--lg btn--block" href="checkout.html">Оформить заказ →</a>
          <p class="summary__note">Демо-режим: заказ никуда не отправляется, корзина хранится в вашем браузере</p>
        </aside>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const inc = e.target.closest(".js-inc");
    const dec = e.target.closest(".js-dec");
    const del = e.target.closest(".js-del");
    if (inc) {
      const row = inc.closest(".cart-item");
      const input = row.querySelector(".js-qty");
      Cart.set(inc.dataset.id, (+input.value || 1) + 1);
    } else if (dec) {
      const row = dec.closest(".cart-item");
      const input = row.querySelector(".js-qty");
      const v = (+input.value || 1) - 1;
      if (v < 1) return Cart.remove(dec.dataset.id);
      Cart.set(dec.dataset.id, v);
    } else if (del) {
      const row = del.closest(".cart-item");
      row.classList.add("is-removing");
      setTimeout(() => Cart.remove(del.dataset.id), 240);
    } else if (e.target.closest("#clear-cart")) {
      Cart.clear();
      FR.toast("Корзина очищена");
    }
  });

  root.addEventListener("change", (e) => {
    const input = e.target.closest(".js-qty");
    if (input) Cart.set(input.dataset.id, Math.max(1, +input.value || 1));
  });

  root.addEventListener("submit", (e) => {
    const form = e.target.closest("#promo-form");
    if (!form) return;
    e.preventDefault();
    const val = document.getElementById("promo-input").value;
    const msg = document.getElementById("promo-msg");
    if (Cart.promo() && !val) {
      Cart.clearPromo();
      msg.className = "";
      msg.textContent = "";
      return;
    }
    const res = Cart.applyPromo(val);
    msg.className = res.ok ? "promo__ok" : "promo__err";
    msg.textContent = res.ok ? FR.icon("check") + " " + res.msg : res.msg;
    if (res.ok) FR.toast(res.msg, "ok");
  });

  document.addEventListener("cart:changed", render);
  render();
})();
