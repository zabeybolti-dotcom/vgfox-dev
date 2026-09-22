/* Мастерская РА — оформление заказа + экран успеха */
(function () {
  "use strict";

  const root = document.getElementById("checkout-root");
  if (!root) return;

  /* ---------- экран успеха ---------- */
  function showSuccess(orderNum, t) {
    document.querySelector(".crumbs").style.display = "none";
    document.title = "Заказ " + orderNum + " принят — Мастерская РА";
    root.innerHTML = `
      <div class="success">
        <div class="success__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h1>Заказ принят!</h1>
        <div class="success__num">№ ${FR.esc(orderNum)}</div>
        <p>Спасибо! Мастерская свяжется с вами в течение 15 минут для подтверждения.
           Сумма заказа — <b style="color:var(--amber)">${FR.fmt(t.total)}</b>.
           Это демо: данные никуда не отправлялись.</p>
        <div class="success__actions">
          <a class="btn btn--fire btn--lg" href="catalog.html">Вернуться в каталог</a>
          <a class="btn btn--ghost btn--lg" href="blog.html">Почитать блог</a>
        </div>
        <p style="font-size:13px;margin-top:26px;color:var(--muted-2)">
          Пока ждёте — загляните в наш <a href="${SHOP.vk}" target="_blank" rel="noopener" style="color:var(--amber)">VK</a>,
          там фотографии реквизита в огне.
        </p>
      </div>`;
    window.scrollTo({ top: 0 });
  }

  const t0 = Cart.totals();
  if (!t0.items.length) {
    root.innerHTML = `
      <div class="section">
        <div class="empty" style="padding:80px 20px">
          <b>Корзина пуста</b>
          Сначала добавьте реквизит — потом оформим.
          <div style="margin-top:20px"><a class="btn btn--fire" href="catalog.html">В каталог</a></div>
        </div>
      </div>`;
    return;
  }

  /* ---------- форма ---------- */
  root.innerHTML = `
    <div class="section page-top" style="padding-bottom:0">
      <span class="kicker">Шаг 2 из 2</span>
      <h1>Оформление заказа</h1>
      <p class="page-top__lead">Заполните контакты — мастерская свяжется для подтверждения
         и уточнения деталей доставки.</p>
    </div>

    <div class="checkout-layout">
      <form class="form-card" id="order-form" novalidate>
        <h3>Получатель</h3>
        <div class="form-grid">
          <div class="field">
            <label for="f-name">Имя *</label>
            <input id="f-name" type="text" placeholder="Как к вам обращаться" required>
            <span class="field__err">Подскажите имя</span>
          </div>
          <div class="field">
            <label for="f-phone">Телефон *</label>
            <input id="f-phone" type="tel" placeholder="+7 (___) ___-__-__" required>
            <span class="field__err">Нужен телефон для связи</span>
          </div>
          <div class="field">
            <label for="f-city">Город *</label>
            <input id="f-city" type="text" placeholder="Санкт-Петербург" required>
            <span class="field__err">Укажите город доставки</span>
          </div>
          <div class="field">
            <label for="f-email">E-mail</label>
            <input id="f-email" type="email" placeholder="для статуса заказа">
          </div>
        </div>

        <h3 style="margin:26px 0 14px">Доставка</h3>
        <div class="radio-cards">
          <label class="radio-card">
            <input type="radio" name="delivery" value="Курьер/СДЭК до двери" checked>
            <span class="radio-card__dot"></span>
            <span><b>Курьер / СДЭК</b><span>до двери, 2–5 дней</span></span>
          </label>
          <label class="radio-card">
            <input type="radio" name="delivery" value="Пункт выдачи">
            <span class="radio-card__dot"></span>
            <span><b>Пункт выдачи</b><span>СДЭК / Boxberry, от 2 дней</span></span>
          </label>
          <label class="radio-card">
            <input type="radio" name="delivery" value="Почта России">
            <span class="radio-card__dot"></span>
            <span><b>Почта России</b><span>до отделений по всей РФ</span></span>
          </label>
          <label class="radio-card">
            <input type="radio" name="delivery" value="Самовывоз СПб">
            <span class="radio-card__dot"></span>
            <span><b>Самовывоз, СПб</b><span>по договорённости, бесплатно</span></span>
          </label>
        </div>

        <h3 style="margin:26px 0 14px">Комментарий</h3>
        <div class="field">
          <textarea id="f-comment" placeholder="Пожелания по длине, весу, материалу цепи, цвету петель…"></textarea>
        </div>
      </form>

      <aside class="summary">
        <h3>Ваш заказ</h3>
        ${t0.items.map((p) => `
          <div class="summary__row">
            <span>${FR.esc(p.name)} <span style="color:var(--muted-2)">×${p.qty}</span></span>
            <b>${FR.fmt(p.price * p.qty)}</b>
          </div>`).join("")}
        ${t0.discount ? `<div class="summary__row"><span>Промокод «${FR.esc(t0.promo)}»</span><b class="summary__save">−${FR.fmt(t0.discount)}</b></div>` : ""}
        <div class="summary__row"><span>Доставка</span><b>${t0.delivery === 0 ? '<span class="summary__save">бесплатно</span>' : FR.fmt(t0.delivery)}</b></div>
        <div class="summary__row summary__row--total"><span>К оплате</span><b>${FR.fmt(t0.total)}</b></div>
        <button class="btn btn--fire btn--lg btn--block" type="submit" form="order-form" id="submit-btn">
          Подтвердить заказ
        </button>
        <p class="summary__note">Нажимая кнопку, вы соглашаетесь с обработкой данных (демо)</p>
      </aside>
    </div>`;

  /* ---------- валидация и «отправка» ---------- */
  const form = document.getElementById("order-form");
  const phone = document.getElementById("f-phone");
  phone.addEventListener("input", () => {
    phone.value = phone.value.replace(/[^\d+()\s-]/g, "");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    [["f-name"], ["f-phone"], ["f-city"]].forEach(([id]) => {
      const el = document.getElementById(id);
      const bad = !el.value.trim() ||
        (id === "f-phone" && el.value.replace(/\D/g, "").length < 10);
      el.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) {
      FR.toast("Заполните подсвеченные поля", "err");
      document.querySelector(".is-invalid")?.focus();
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.innerHTML = "Отправляем…";

    setTimeout(() => {
      const num = "FR-" + String(Math.floor(100000 + Math.random() * 900000));
      showSuccess(num, Cart.totals());
      Cart.clear();
      FR.toast("Заказ " + num + " оформлен!", "ok");
    }, 1100);
  });
})();
