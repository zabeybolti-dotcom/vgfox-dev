/* ============================================================
   DENTARA — Скрипты
   01. Иконки Lucide
   02. Шапка (прозрачная -> с фоном)
   03. Бургер-меню
   04. Появление секций (IntersectionObserver)
   05. Активный пункт навигации (scrollspy)
   06. Форма записи
   07. Чат
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 01. Иконки Lucide ---------- */
  lucide.createIcons();

  /* ---------- 02. Шапка: прозрачная -> с фоном при скролле ---------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    if (window.scrollY > 60) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- 03. Бургер-меню ---------- */
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  const toggleMenu = () => {
    const open = mobileMenu.classList.toggle('open');
    burgerBtn.classList.toggle('open', open);
    burgerBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    burgerBtn.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  burgerBtn.addEventListener('click', toggleMenu);
  document.querySelectorAll('.mob-link').forEach(link =>
    link.addEventListener('click', closeMenu)
  );

  /* ---------- 04. Появление секций при скролле ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- 05. Активный пункт навигации (scrollspy) ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionIds = ['about', 'services', 'doctors', 'reviews', 'prices', 'contacts'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  // Отступ от верха, равный высоте фиксированной шапки (для точного совпадения)
  const HEADER_OFFSET = 96;

  function spy() {
    const pos = window.scrollY + HEADER_OFFSET + 10;
    let currentId = '';
    sections.forEach(sec => {
      if (sec.offsetTop <= pos) currentId = sec.id;
    });
    // Если доскроллили до низа — подсвечиваем последний пункт
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
      currentId = sections[sections.length - 1].id;
    }
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy);
  window.addEventListener('load', spy);
  spy();

  /* ---------- 06. Форма записи ---------- */
  const bookingForm = document.getElementById('bookingForm');
  const formSuccess = document.getElementById('formSuccess');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
      }
      formSuccess.classList.add('show');
      bookingForm.reset();
      setTimeout(() => formSuccess.classList.remove('show'), 6000);
    });
  }

  /* ============================================================
     ---------- 07. ЧАТ ----------
     ============================================================ */
  const chatToggle = document.getElementById('chatToggle');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose = document.getElementById('chatClose');
  const chatBody = document.getElementById('chatBody');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  let welcomeShown = false;
  let chatOpen = false;

  const chatToggleIcon = chatToggle.querySelector('i');

  const scrollChatDown = () => { chatBody.scrollTop = chatBody.scrollHeight; };

  function refreshIcons() {
    // Пересоздаём иконки внутри чата (включая замену на закрытие)
    lucide.createIcons();
  }

  function addOperatorMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-op';
    wrap.textContent = text;
    chatBody.appendChild(wrap);
    scrollChatDown();
  }

  function addUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-user';
    wrap.textContent = text;
    chatBody.appendChild(wrap);
    scrollChatDown();
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-op msg-op--typing';
    wrap.id = 'typingIndicator';
    wrap.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    chatBody.appendChild(wrap);
    scrollChatDown();
  }

  function hideTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  // Подбор ответа по ключевым словам
  function getResponse(text) {
    const msg = text.toLowerCase();

    if (/цена|стоимост|прайс|цены|сколько стоит|стоимость/.test(msg))
      return 'Основные цены вы можете найти в разделе «Цены» на нашем сайте. Для точного расчёта рекомендуем записаться на бесплатную консультацию — врач составит план лечения и назовёт стоимость.';

    if (/запис|приём|прием|консультаци|хочу записат/.test(msg))
      return 'Отлично! Вы можете оставить заявку в форме на странице или позвонить нам по телефону +7 (495) 123-45-67. Мы подберём удобное для вас время и перезвоним в течение 15 минут.';

    if (/имплант|имплантац/.test(msg))
      return 'Мы проводим имплантацию зубов от ведущих производителей. Стоимость — от 35 000 ₽ за установку имплантата. Приходите на бесплатную консультацию — врач составит полный план лечения.';

    if (/брекет|ортодонт|выравнивание|капы|элайнер/.test(msg))
      return 'Мы предлагаем различные системы брекетов: металлические, керамические, сапфировые, а также элайнеры. Стоимость лечения — от 80 000 ₽. Запишитесь на консультацию к ортодонту!';

    if (/бол|больно|страшн|боюсь|анестези/.test(msg))
      return 'Мы понимаем ваш страх и используем современные методы анестезии — лечение абсолютно безболезненное. Наши врачи имеют большой опыт работы с тревожными пациентами.';

    if (/работа|время|час|режим|график|график/.test(msg))
      return 'Мы работаем Пн–Сб с 9:00 до 21:00, воскресенье — выходной. Запишитесь в удобное время через форму на сайте или по телефону.';

    if (/привет|здравств|добрый|доброе|хай/.test(msg))
      return 'Здравствуйте! Рада вас приветствовать. Чем могу помочь? Могу рассказать об услугах, ценах или помочь записаться на приём.';

    if (/спасибо|благодар|огромное спасибо/.test(msg))
      return 'Пожалуйста! Если возникнут ещё вопросы — обращайтесь. Будем рады видеть вас в нашей клинике 😊';

    return 'Спасибо за вопрос! Для более подробной консультации рекомендуем записаться на приём к специалисту. Позвоните по телефону +7 (495) 123-45-67 или оставьте заявку на сайте.';
  }

  function openChat() {
    chatOpen = true;
    chatWindow.classList.add('open');
    // Меняем иконку кнопки на крестик
    chatToggleIcon.setAttribute('data-lucide', 'x');
    refreshIcons();
    chatInput.focus();

    if (!welcomeShown) {
      setTimeout(() => {
        addOperatorMessage('Здравствуйте! 👋 Я консультант клиники DENTARA. Чем могу помочь?');
        welcomeShown = true;
      }, 900);
    }
  }

  function closeChat() {
    chatOpen = false;
    chatWindow.classList.remove('open');
    chatToggleIcon.setAttribute('data-lucide', 'message-circle');
    refreshIcons();
  }

  chatToggle.addEventListener('click', () => {
    chatOpen ? closeChat() : openChat();
  });

  chatClose.addEventListener('click', closeChat);

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = '';
    showTyping();

    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      hideTyping();
      addOperatorMessage(getResponse(text));
    }, delay);
  });
});
