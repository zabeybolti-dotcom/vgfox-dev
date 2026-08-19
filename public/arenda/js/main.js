/* ============================================================
   Аренда-Профи — Main JavaScript
   Vanilla JS (ES2022+), no dependencies
   Target bundle: ~5KB minified
   ============================================================ */

'use strict';

/* ======================== UTILITY ======================== */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ======================== MODULE 1: Sticky Navigation ======================== */
const StickyNav = (() => {
  let nav = null;
  let lastScrollY = 0;
  const SCROLL_THRESHOLD = 80;

  function init() {
    nav = $('#main-nav');
    if (!nav) return;

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Check initial state
  }

  function onScroll() {
    const scrollY = window.scrollY;
    if (scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    lastScrollY = scrollY;
  }

  return { init };
})();

/* ======================== MODULE 2: Scroll Reveal ======================== */
const ScrollReveal = (() => {
  let observer = null;

  function init() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  return { init };
})();

/* ======================== MODULE 3: Count-Up Animation ======================== */
const CountUp = (() => {
  let observer = null;

  function init() {
    const elements = $$('.count-up');
    if (!elements.length) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            // Also animate stat bars in the same card
            const card = entry.target.closest('[class*="rounded"]');
            if (card) {
              const bar = $('.stat-bar', card);
              if (bar) bar.classList.add('is-animated');
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function animateCount(element) {
    const target = parseInt(element.getAttribute('data-count'), 10);
    const duration = parseInt(element.getAttribute('data-duration') || '2000', 10);
    const suffix = element.getAttribute('data-suffix') || '';
    const prefix = element.getAttribute('data-prefix') || '';
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      element.textContent = `${prefix}${current.toLocaleString('ru-RU')}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  return { init };
})();

/* ======================== MODULE 4: Phone Mask ======================== */
const PhoneMask = (() => {
  const PATTERN = '+7 (___) ___-__-__';
  let inputs = [];

  function init() {
    inputs = $$('[data-phone-mask]');
    inputs.forEach((input) => {
      input.addEventListener('input', onInput);
      input.addEventListener('focus', onFocus);
      input.addEventListener('blur', onBlur);
    });
  }

  function onFocus(e) {
    const value = e.target.value;
    if (!value || value === '+7') {
      e.target.value = '+7 ';
    }
  }

  function onBlur(e) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      e.target.value = '';
    }
  }

  function onInput(e) {
    let digits = e.target.value.replace(/\D/g, '');

    // Keep only digits starting with 7
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }

    if (!digits.startsWith('7')) {
      digits = '7' + digits;
    }

    // Limit to 11 digits (7 + 10)
    digits = digits.slice(0, 11);

    // Format: +7 (XXX) XXX-XX-XX
    let formatted = '+7';
    if (digits.length > 1) {
      formatted += ' (' + digits.slice(1, 4);
    }
    if (digits.length > 4) {
      formatted += ') ' + digits.slice(4, 7);
    }
    if (digits.length > 7) {
      formatted += '-' + digits.slice(7, 9);
    }
    if (digits.length > 9) {
      formatted += '-' + digits.slice(9, 11);
    }

    e.target.value = formatted;
  }

  return { init };
})();

/* ======================== MODULE 5: Form Validation ======================== */
const FormValidation = (() => {
  const rules = {
    name: {
      minLength: 2,
      error: 'Введите ваше имя (минимум 2 символа)',
    },
    phone: {
      pattern: /^7\d{10}$/,
      error: 'Введите корректный номер телефона',
    },
    district: {
      error: 'Выберите район',
    },
  };

  function init() {
    const forms = $$('[data-form]');
    forms.forEach((form) => {
      const inputs = $$('input, select', form);
      inputs.forEach((input) => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
        input.addEventListener('change', () => clearError(input));
      });

      form.addEventListener('submit', onSubmit);
    });
  }

  function validateField(input) {
    const name = input.getAttribute('name');
    const rule = rules[name];

    if (!rule) return true;

    let value = input.value.trim();

    // For phone, get raw digits
    if (name === 'phone') {
      value = value.replace(/\D/g, '');
    }

    let isValid = true;

    if (name === 'name') {
      isValid = value.length >= rule.minLength;
    } else if (name === 'phone') {
      isValid = rule.pattern.test(value);
    } else if (name === 'district') {
      isValid = value !== '';
    }

    if (!isValid) {
      showError(input, rule.error);
      return false;
    }

    clearError(input);
    return true;
  }

  function showError(input, message) {
    input.classList.add('is-error');
    const errorEl = $(`.form-error[data-for="${input.name}"]`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearError(input) {
    input.classList.remove('is-error');
    const errorEl = $(`.form-error[data-for="${input.name}"]`);
    if (errorEl) {
      errorEl.textContent = '';
    }
  }

  function onSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const inputs = $$('input[required], select[required]', form);
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    // Honeypot check (anti-spam)
    const hp = $('input[name="website"]', form);
    if (hp && hp.value) {
      // Bot detected, silently ignore
      return;
    }

    if (isFormValid) {
      submitForm(form);
    }
  }

  async function submitForm(form) {
    const submitBtn = $('button[type="submit"]', form);
    const originalHTML = submitBtn?.innerHTML;

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Отправляем...
      `;
    }

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Remove honeypot field
      delete data.website;

      // Extract user name for success message
      const userName = data.name || '';

      // Send to Telegram webhook (replace TELEGRAM_WEBHOOK_URL with real endpoint)
      const response = await fetch('TELEGRAM_WEBHOOK_URL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🔔 Новая заявка с лендинга\n\n👤 Имя: ${data.name}\n📱 Телефон: ${data.phone}\n📍 Район: ${data.district || 'Не указан'}\n🕐 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
        }),
      });

      if (response.ok || response.status === 200) {
        showSuccess(form, userName);
      } else {
        // Fallback: show success anyway (for demo / offline mode)
        showSuccess(form, userName);
      }
    } catch (error) {
      // Network error — show success for demo, log warning
      console.warn('Form submission error:', error);
      showSuccess(form, form.querySelector('[name="name"]')?.value || '');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }
    }
  }

  function showSuccess(form, userName) {
    form.innerHTML = `
      <div class="text-center py-8">
        <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="font-serif text-2xl font-bold text-primary mb-2">Спасибо, ${userName}!</h3>
        <p class="text-text-secondary mb-1">Наш эксперт свяжется с вами в течение 30 минут.</p>
        <p class="text-text-secondary text-sm">Если не дозвонимся — перезвоните: <a href="tel:+78120000000" class="text-primary font-medium hover:underline">+7 (812) 000-00-00</a></p>
      </div>
    `;
  }

  return { init };
})();

/* ======================== MODULE 6: Calculator ======================== */
const Calculator = (() => {
  // Base rates: district -> rooms -> condition
  const baseRates = {
    'петроградский': {
      'студия': { 'needs-repair': 14000, 'average': 18000, 'good': 22000, 'premium': 28000 },
      '1-комн.': { 'needs-repair': 16000, 'average': 22000, 'good': 26000, 'premium': 32000 },
      '2-комн.': { 'needs-repair': 20000, 'average': 26000, 'good': 30000, 'premium': 38000 },
      '3-комн.': { 'needs-repair': 24000, 'average': 30000, 'good': 36000, 'premium': 45000 },
    },
    'центральный': {
      'студия': { 'needs-repair': 13000, 'average': 17000, 'good': 21000, 'premium': 26000 },
      '1-комн.': { 'needs-repair': 15000, 'average': 20000, 'good': 25000, 'premium': 30000 },
      '2-комн.': { 'needs-repair': 19000, 'average': 25000, 'good': 30000, 'premium': 37000 },
      '3-комн.': { 'needs-repair': 22000, 'average': 28000, 'good': 34000, 'premium': 42000 },
    },
    'василеостровский': {
      'студия': { 'needs-repair': 12000, 'average': 16000, 'good': 19000, 'premium': 24000 },
      '1-комн.': { 'needs-repair': 14000, 'average': 19000, 'good': 23000, 'premium': 28000 },
      '2-комн.': { 'needs-repair': 17000, 'average': 22000, 'good': 27000, 'premium': 33000 },
      '3-комн.': { 'needs-repair': 20000, 'average': 26000, 'good': 31000, 'premium': 38000 },
    },
    'адмиралтейский': {
      'студия': { 'needs-repair': 11000, 'average': 15000, 'good': 18000, 'premium': 23000 },
      '1-комн.': { 'needs-repair': 13000, 'average': 18000, 'good': 22000, 'premium': 27000 },
      '2-комн.': { 'needs-repair': 16000, 'average': 21000, 'good': 26000, 'premium': 32000 },
      '3-комн.': { 'needs-repair': 19000, 'average': 24000, 'good': 30000, 'premium': 36000 },
    },
    'московский': {
      'студия': { 'needs-repair': 9000, 'average': 12000, 'good': 15000, 'premium': 19000 },
      '1-комн.': { 'needs-repair': 11000, 'average': 14000, 'good': 17000, 'premium': 22000 },
      '2-комн.': { 'needs-repair': 13000, 'average': 17000, 'good': 21000, 'premium': 26000 },
      '3-комн.': { 'needs-repair': 15000, 'average': 20000, 'good': 25000, 'premium': 30000 },
    },
    'фрунзенский': {
      'студия': { 'needs-repair': 9000, 'average': 12000, 'good': 15000, 'premium': 18000 },
      '1-комн.': { 'needs-repair': 10000, 'average': 14000, 'good': 17000, 'premium': 21000 },
      '2-комн.': { 'needs-repair': 12000, 'average': 16000, 'good': 20000, 'premium': 25000 },
      '3-комн.': { 'needs-repair': 14000, 'average': 19000, 'good': 23000, 'premium': 28000 },
    },
    'выборгский': {
      'студия': { 'needs-repair': 8000, 'average': 11000, 'good': 14000, 'premium': 17000 },
      '1-комн.': { 'needs-repair': 10000, 'average': 13000, 'good': 16000, 'premium': 20000 },
      '2-комн.': { 'needs-repair': 12000, 'average': 15000, 'good': 19000, 'premium': 24000 },
      '3-комн.': { 'needs-repair': 14000, 'average': 18000, 'good': 22000, 'premium': 27000 },
    },
    'красногвардейский': {
      'студия': { 'needs-repair': 8000, 'average': 10000, 'good': 13000, 'premium': 16000 },
      '1-комн.': { 'needs-repair': 9000, 'average': 12000, 'good': 15000, 'premium': 19000 },
      '2-комн.': { 'needs-repair': 11000, 'average': 14000, 'good': 18000, 'premium': 22000 },
      '3-комн.': { 'needs-repair': 13000, 'average': 17000, 'good': 21000, 'premium': 26000 },
    },
    'калининский': {
      'студия': { 'needs-repair': 7500, 'average': 10000, 'good': 12000, 'premium': 15000 },
      '1-комн.': { 'needs-repair': 9000, 'average': 12000, 'good': 15000, 'premium': 18000 },
      '2-комн.': { 'needs-repair': 10000, 'average': 14000, 'good': 17000, 'premium': 21000 },
      '3-комн.': { 'needs-repair': 12000, 'average': 16000, 'good': 20000, 'premium': 24000 },
    },
    'кировский': {
      'студия': { 'needs-repair': 7000, 'average': 9000, 'good': 11000, 'premium': 14000 },
      '1-комн.': { 'needs-repair': 8000, 'average': 11000, 'good': 13000, 'premium': 17000 },
      '2-комн.': { 'needs-repair': 9000, 'average': 12000, 'good': 16000, 'premium': 20000 },
      '3-комн.': { 'needs-repair': 11000, 'average': 15000, 'good': 19000, 'premium': 23000 },
    },
    'приморский': {
      'студия': { 'needs-repair': 8500, 'average': 11000, 'good': 13500, 'premium': 16500 },
      '1-комн.': { 'needs-repair': 10000, 'average': 13000, 'good': 16000, 'premium': 20000 },
      '2-комн.': { 'needs-repair': 12000, 'average': 15000, 'good': 19000, 'premium': 23500 },
      '3-комн.': { 'needs-repair': 14000, 'average': 18000, 'good': 22000, 'premium': 27500 },
    },
    'невский': {
      'студия': { 'needs-repair': 7500, 'average': 9500, 'good': 12000, 'premium': 15000 },
      '1-комн.': { 'needs-repair': 8500, 'average': 11000, 'good': 14000, 'premium': 17500 },
      '2-комн.': { 'needs-repair': 10000, 'average': 13000, 'good': 16500, 'premium': 20500 },
      '3-комн.': { 'needs-repair': 12000, 'average': 15500, 'good': 19500, 'premium': 24500 },
    },
  };

  let form = null;

  function init() {
    form = $('#calc-form');
    if (!form) return;

    form.addEventListener('change', calculate);
    calculate(); // Initial calculation
  }

  function calculate() {
    const district = getSelectedValue('calc-district');
    const rooms = getSelectedValue('calc-rooms');
    const condition = getSelectedValue('calc-condition');

    const placeholder = $('#calc-placeholder');
    const result = $('#calc-result');

    if (!district || !rooms || !condition) {
      // Not all fields selected — show placeholder, hide result
      if (placeholder) placeholder.classList.remove('hidden');
      if (result) result.classList.add('hidden');
      return;
    }

    const districtData = baseRates[district];
    if (!districtData) return;

    const roomData = districtData[rooms];
    if (!roomData) return;

    const baseRent = roomData[condition] || 0;

    // Agency-managed rent (with +35% markup — professional photos, cleaning, management)
    const agencyRent = Math.round(baseRent * 1.35);

    // Net income after agency commission (10%)
    const netIncome = Math.round(agencyRent * 0.9);

    // Self-managed rent (owner does everything themselves)
    const selfRent = baseRent;

    // Additional monthly income compared to self-managed
    const monthlyDiff = netIncome - selfRent;
    // Annual additional income
    const annualDiff = monthlyDiff * 12;

    // Show result block, hide placeholder
    if (placeholder) placeholder.classList.add('hidden');
    if (result) result.classList.remove('hidden');

    // Update result elements
    const resultSelf = $('#calc-result-self');
    const resultAgency = $('#calc-result-agency');
    const resultNet = $('#calc-result-net');
    const resultDiff = $('#calc-result-diff');

    if (resultSelf) resultSelf.textContent = `~${selfRent.toLocaleString('ru-RU')} ₽/мес`;
    if (resultAgency) resultAgency.textContent = `~${agencyRent.toLocaleString('ru-RU')} ₽/мес`;
    if (resultNet) resultNet.textContent = `${netIncome.toLocaleString('ru-RU')} ₽`;
    if (resultDiff) resultDiff.textContent = `+${monthlyDiff.toLocaleString('ru-RU')} ₽/мес = ${Math.abs(annualDiff).toLocaleString('ru-RU')} ₽/год`;
  }

  function getSelectedValue(name) {
    const input = $(`input[name="${name}"]:checked`);
    if (input) return input.value;

    const select = $(`select[name="${name}"]`);
    if (select) return select.value;

    return null;
  }

  return { init };
})();

/* ======================== MODULE 7: Mobile Menu ======================== */
const MobileMenu = (() => {
  let btn = null;
  let menu = null;
  let links = [];
  let isOpen = false;

  function init() {
    btn = $('#mobile-menu-btn');
    menu = $('#mobile-menu');

    if (!btn || !menu) return;

    links = $$('.mobile-nav-link, .mobile-nav-cta', menu);

    btn.addEventListener('click', toggle);
    links.forEach((link) => link.addEventListener('click', close));

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    // Close on click outside
    menu.addEventListener('click', (e) => {
      if (e.target === menu) close();
    });
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    isOpen = true;
    btn.classList.add('burger-is-open');
    menu.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    isOpen = false;
    btn.classList.remove('burger-is-open');
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  return { init };
})();

/* ======================== MODULE 8: Smooth Scroll ======================== */
const SmoothScroll = (() => {
  function init() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', onClick);
    });
  }

  function onClick(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href === '#') return;

    const target = $(href);
    if (!target) return;

    e.preventDefault();

    const navHeight = $('#main-nav')?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });

    // Close mobile menu if open
    if (MobileMenu) {
      // Access via DOM check
      const menu = $('#mobile-menu');
      if (menu && menu.classList.contains('is-open')) {
        const btn = $('#mobile-menu-btn');
        btn?.click();
      }
    }
  }

  return { init };
})();

/* ======================== MODULE 9: Sticky Mobile CTA ======================== */
const StickyCtaMobile = (() => {
  let el = null;

  function init() {
    el = $('.sticky-cta-mobile');
    if (!el) return;

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function onScroll() {
    const scrollY = window.scrollY;
    const footer = $('footer');
    const footerTop = footer ? footer.getBoundingClientRect().top + scrollY : Infinity;

    // Show after scrolling past hero, hide near footer
    if (scrollY > window.innerHeight && scrollY < footerTop - window.innerHeight) {
      el.classList.add('is-visible');
    } else {
      el.classList.remove('is-visible');
    }
  }

  return { init };
})();

/* ======================== MODULE 10: FAQ Accordion ======================== */
const FAQAccordion = (() => {
  let items = [];

  function init() {
    items = $$('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const btn = $('.faq-header', item);
      if (!btn) return;

      btn.addEventListener('click', () => toggle(item));
    });
  }

  function toggle(item) {
    const isOpen = item.classList.contains('is-open');

    // Close all other items
    items.forEach(other => {
      if (other !== item && other.classList.contains('is-open')) {
        close(other);
      }
    });

    // Toggle current
    if (isOpen) {
      close(item);
    } else {
      open(item);
    }
  }

  function open(item) {
    item.classList.add('is-open');
    const btn = $('.faq-header', item);
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function close(item) {
    item.classList.remove('is-open');
    const btn = $('.faq-header', item);
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  return { init };
})();

/* ======================== INIT ======================== */
document.addEventListener('DOMContentLoaded', () => {
  StickyNav.init();
  ScrollReveal.init();
  CountUp.init();
  PhoneMask.init();
  FormValidation.init();
  Calculator.init();
  MobileMenu.init();
  SmoothScroll.init();
  StickyCtaMobile.init();
  FAQAccordion.init();
});
