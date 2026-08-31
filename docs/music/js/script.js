/* =========================================================
   Камертон — общий скрипт
   Навигация, анимации, чат-виджет, форма, карусель, галерея
   ========================================================= */
(function () {
  "use strict";

  /* -------------------------------------------------------
     0. Хелперы
     ------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);

  /* -------------------------------------------------------
     1. Шапка: уплотнение при скролле
     ------------------------------------------------------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -------------------------------------------------------
     2. Активная ссылка в навигации (скролл-спай)
     ------------------------------------------------------- */
  (function activeNav() {
    const links = $$(".nav-links a, .mobile-menu a");
    const map = {};
    links.forEach((l) => {
      const href = l.getAttribute("href");
      const id = href && href.startsWith("#") ? href.slice(1) : "";
      if (id) map[id] = l;
    });
    const ids = Object.keys(map);
    if (!ids.length) return;
    const secIds = ids.filter((id) => id !== "top");
    const secs = secIds.map((id) => document.getElementById(id)).filter(Boolean);
    const spy = () => {
      const y = window.scrollY + 170;
      let current = "top";
      secs.forEach((s) => {
        if (s.offsetTop <= y) current = s.id;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        current = secIds[secIds.length - 1];
      }
      links.forEach((l) => l.classList.remove("active"));
      const tgt = map[current];
      if (tgt) tgt.classList.add("active");
    };
    if (!secs.length) return;
    spy();
    let t;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(t);
        t = setTimeout(spy, 70);
      },
      { passive: true }
    );
  })();

  /* -------------------------------------------------------
     3. Мобильное меню
     ------------------------------------------------------- */
  const navToggle = $(".nav-toggle");
  const mobileMenu = $(".mobile-menu");
  if (navToggle && mobileMenu) {
    const syncMobileMenu = () => {
      const open = mobileMenu.classList.contains("open");
      document.body.style.overflow = open ? "hidden" : "";
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    navToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      syncMobileMenu();
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        syncMobileMenu();
      })
    );
  }

  /* -------------------------------------------------------
     3b. Плавный переход по якорям с учётом фиксированной шапки
     ------------------------------------------------------- */
  (function smoothAnchors() {
    const HEADER = 80;
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (href === "#") return;
      const el = document.getElementById(href.slice(1));
      if (!el) return;
      e.preventDefault();
      const target =
        el === document.body ? el : el.querySelector(".section-head") || el;
      const y =
        target === document.body
          ? 0
          : target.getBoundingClientRect().top + window.scrollY - HEADER;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  })();

  /* -------------------------------------------------------
     4. Появление блоков при скролле (IntersectionObserver)
     ------------------------------------------------------- */
  (function revealOnScroll() {
    const els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
  })();

  /* -------------------------------------------------------
     4b. Анимированные счётчики статистики
     ------------------------------------------------------- */
  (function counters() {
    const els = $$(".num[data-count]");
    if (!els.length) return;
    const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
    const animate = (el) => {
      const target = parseFloat(el.getAttribute("data-count")) || 0;
      const suffix = el.getAttribute("data-suffix") || "";
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target) + suffix;
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => (el.textContent = (el.getAttribute("data-count") || 0) + (el.getAttribute("data-suffix") || "")));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  })();

  /* -------------------------------------------------------
     5. Карусель отзывов
     ------------------------------------------------------- */
  (function reviewsCarousel() {
    const track = $(".reviews-track");
    if (!track) return;
    const slides = $$(".review", track);
    const dotsWrap = $(".review-dots");
    const prevBtn = $(".r-prev");
    const nextBtn = $(".r-next");
    let index = 0;
    const total = slides.length;
    const GAP = 24;

    const update = () => {
      const step = slides[0].offsetWidth + GAP;
      track.style.transform = `translateX(-${index * step}px)`;
      if (dotsWrap)
        $$(".dot", dotsWrap).forEach((d, i) => d.classList.toggle("active", i === index));
    };
    const goTo = (i) => {
      index = (i + total) % total;
      update();
    };

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", "Отзыв " + (i + 1));
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }
    if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));

    const auto = () => goTo(index + 1);
    let timer = setInterval(auto, 6000);
    const resetTimer = () => {
      clearInterval(timer);
      timer = setInterval(auto, 6000);
    };
    const wrap = $(".reviews-wrap");
    if (wrap) {
      wrap.addEventListener("mouseenter", () => clearInterval(timer));
      wrap.addEventListener("mouseleave", resetTimer);
    }
  })();

  /* -------------------------------------------------------
     6. Галерея + лайтбокс
     ------------------------------------------------------- */
  (function gallery() {
    const items = $$(".g-item[data-src]");
    if (!items.length) return;
    const lightbox = $(".lightbox");
    if (!lightbox) return;
    const img = $(".lightbox img");
    const lbClose = $(".lb-close");
    const lbPrev = $(".lb-prev");
    const lbNext = $(".lb-next");
    let current = 0;

    const show = (i) => {
      current = (i + items.length) % items.length;
      img.src = items[current].getAttribute("data-src");
      img.alt = items[current].querySelector("img").alt || "";
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    };
    const hide = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    };

    items.forEach((item, i) =>
      item.addEventListener("click", () => show(i))
    );
    if (lbClose) lbClose.addEventListener("click", hide);
    if (lbPrev) lbPrev.addEventListener("click", () => show(current - 1));
    if (lbNext) lbNext.addEventListener("click", () => show(current + 1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) hide();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") hide();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  })();

  /* -------------------------------------------------------
     7. Форма записи (валидация + успех)
     ------------------------------------------------------- */
  (function contactForm() {
    const form = $("#signupForm");
    if (!form) return;

    const fields = {
      name: $("#fname"),
      phone: $("#fphone"),
      instrument: $("#finstrument"),
      age: $("#fage"),
    };

    const validators = {
      name: (v) => v.trim().length >= 2,
      phone: (v) => /^[\d\s()+\-]{10,18}$/.test(v.trim()),
      instrument: (v) => v.trim().length > 0,
      age: (v) => v.trim() !== "",
    };

    const validateField = (key) => {
      const input = fields[key];
      if (!input) return true;
      const ok = validators[key] ? validators[key](input.value) : true;
      input.closest(".field").classList.toggle("error", !ok);
      return ok;
    };

    Object.keys(fields).forEach((key) => {
      const input = fields[key];
      if (!input) return;
      input.addEventListener("blur", () => validateField(key));
      input.addEventListener("input", () => {
        const f = input.closest(".field");
        if (f.classList.contains("error")) validateField(key);
      });
    });

    // Маска телефона на лету
    if (fields.phone) {
      fields.phone.addEventListener("input", () => {
        let digits = fields.phone.value.replace(/\D/g, "").slice(0, 10);
        if (!digits) { fields.phone.value = ""; return; }
        let out = "+7";
        if (digits.length > 0) out += " (" + digits.slice(0, 3);
        if (digits.length >= 4) out += ") " + digits.slice(3, 6);
        if (digits.length >= 6) out += "-" + digits.slice(6, 8);
        if (digits.length >= 8) out += "-" + digits.slice(8, 10);
        fields.phone.value = out;
      });
    }

    const consent = $("#fconsent");
    if (consent) {
      consent.addEventListener("change", () => {
        consent.closest(".consent").classList.remove("error");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let ok = true;
      Object.keys(fields).forEach((key) => {
        if (!validateField(key)) ok = false;
      });
      if (consent && !consent.checked) {
        ok = false;
        consent.closest(".consent").classList.add("error");
      }
      if (!ok) {
        const firstErr = $(".field.error input, .field.error select", form);
        if (firstErr) firstErr.focus();
        return;
      }
      form.classList.add("was-sent");
      $(".form-success", form).classList.add("show");
      form.reset();
      if (consent) consent.checked = false;
    });

    const again = $("#sendAnother");
    if (again) {
      again.addEventListener("click", () => {
        form.classList.remove("was-sent");
        $(".form-success", form).classList.remove("show");
        $("#fname", form).focus();
      });
    }
  })();

  /* -------------------------------------------------------
     7b. Фолбэк для изображений (если ссылка недоступна)
     ------------------------------------------------------- */
  (function imgFallback() {
    // Если фото не загрузилось — прячем его и показываем фирменную подложку
    document.addEventListener("error", (e) => {
      const t = e.target;
      if (t && t.tagName === "IMG") {
        t.style.display = "none";
        t.removeAttribute("src");
        t.removeAttribute("srcset");
      }
    }, true);
  })();

  /* -------------------------------------------------------
     8. Чат-виджет «Мила»
     ------------------------------------------------------- */
  (function chat() {
    const btn = $(".chat-btn");
    const win = $(".chat-window");
    const body = $(".chat-body");
    const quickWrap = $(".chat-quick");
    const input = $("#chatInput");
    const sendBtn = $(".chat-send");
    const closeBtn = $(".chat-close");
    if (!btn || !win) return;

    const greetings = [
      "Здравствуйте! Меня зовут Мила, я администратор школы «Камертон». Рада помочь! 🎵",
      "Добрый день! Подберу для вас занятие и расскажу всё о школе. Чем могу помочь? 🎶",
    ];

    const answers = {
      "Сколько стоит?":
        "Абонементы такие: разовое занятие — 1 200 ₽, 8 занятий в месяц — 8 500 ₽ (выгоднее на 18%), а 8 занятий × 2 раза в неделю — 15 500 ₽. На пробное занятие приходите бесплатно!",
      "Как записаться?":
        "Оставьте заявку на странице «Контакты» или просто скажите мне, и я передам ваш телефон администратору. Обычно перезваниваем в течение рабочего дня.",
      "С какого возраста?":
        "Мы принимаем ребят с 4 до 14 лет. Для малышей 4–6 лет есть подготовительное отделение и сольфеджио в игровой форме. Гитару советуем с 7 лет.",
      "Где вы находитесь?":
        "Мы по адресу: г. Москва, ул. Музыкальная, д. 12. Рядом метро, есть парковка. Приходите на экскурсию — покажем классы!",
    };

    const fallback =
      "Спасибо за сообщение! Я обязательно передам его администратору, и мы свяжемся с вами в ближайшее время. А пока загляните в разделы «Направления» или «Абонементы». 🤗";

    const STORAGE_KEY = "kamerTon_chat_history";

    let opened = false;
    let hasPending = false;

    const addMessage = (text, who) => {
      const m = document.createElement("div");
      m.className = "msg " + (who === "user" ? "user" : "bot");
      m.textContent = text;
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
      return m;
    };

    const showTyping = () => {
      const t = document.createElement("div");
      t.className = "typing";
      t.innerHTML = "<span></span><span></span><span></span>";
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      return t;
    };

    const botReply = (text, delay) => {
      const typing = showTyping();
      setTimeout(() => {
        typing.remove();
        addMessage(text, "bot");
        saveHistory();
      }, delay || 1200);
    };

    const saveHistory = () => {
      try {
        const msgs = $$(".msg", body).map((m) => ({
          t: m.textContent,
          w: m.classList.contains("user") ? "user" : "bot",
        }));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
      } catch (e) {}
    };

    const loadHistory = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
          addMessage(greetings[Math.floor(Math.random() * greetings.length)], "bot");
          return;
        }
        const msgs = JSON.parse(raw);
        if (!msgs.length) { addMessage(greetings[0], "bot"); return; }
        const hasIntro = msgs.some((m) => m.w === "bot" && /Здравствуйт/.test(m.t));
        msgs.forEach((m) => addMessage(m.t, m.w));
        if (!hasIntro) addMessage(greetings[0], "bot");
      } catch (e) {
        addMessage(greetings[0], "bot");
      }
    };

    const open = () => {
      win.classList.add("open");
      btn.classList.add("active", "reading");
      opened = true;
      if (!body.children.length) loadHistory();
    };
    const close = () => {
      win.classList.remove("open");
      btn.classList.remove("active");
      opened = false;
    };

    btn.addEventListener("click", () => {
      if (opened) close();
      else open();
    });
    if (closeBtn) closeBtn.addEventListener("click", close);

    const sendUser = (text) => {
      if (!text.trim()) return;
      hasPending = true;
      addMessage(text.trim(), "user");
      saveHistory();
      if (input) input.value = "";
      const known = answers[text.trim()];
      botReply(known || fallback, 1000 + Math.random() * 500);
    };

    if (sendBtn) sendBtn.addEventListener("click", () => sendUser(input.value));
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); sendUser(input.value); }
      });
    }

    // Быстрые кнопки
    if (quickWrap) {
      $$("button", quickWrap).forEach((b) =>
        b.addEventListener("click", () => {
          if (b.disabled) return;
          b.disabled = true;
          sendUser(b.textContent.trim());
        })
      );
    }
  })();

})();
