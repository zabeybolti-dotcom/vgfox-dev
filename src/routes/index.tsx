import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ArrowDown, MoreVertical, Send, FileText, Mail, ChevronRight } from "lucide-react";
import heroBg from "/11.webp";
import priborImg from "/pribor.jpg";
import brandImg from "/2.webp";
import nedvizhImg from "/nedvizh-hero-v3.webp";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1200&q=85",
      },
    ],
  }),
});

// ============================================================================
//  CONTACTS
// ============================================================================
const TELEGRAM_URL = "https://t.me/vgfox";
const MAX_PROFILE_URL = "https://max.ru/u/f9LHodD0cOJ2yR33xJludOlyCzNjw-y9WtGopPG0wTpcHV2Kbc5hKHO_Jzs"; // ← точная ссылка на профиль MAX
const EMAIL = "info@vgfox.ru";
const EMAIL_URL = `mailto:${EMAIL}`;

// ============================================================================
//  PROJECTS_DATA — редактируется здесь, рендерится через .map()
// ============================================================================
const PROJECTS_DATA: {
  id: number;
  title: string;
  subtitle: string;
  result: string;
  image: string;
  link?: string;
}[] = [
  {
    id: 1,
    title: "Аренда-Профи — управление арендой квартир в Санкт-Петербурге",
    subtitle: "Лендинг · Недвижимость",
    result: "Конверсионный лендинг с интерактивным калькулятором дохода, AIDA-воронкой и автоматическим приёмом заявок в Telegram для агентства по сдаче квартир.",
    image: nedvizhImg,
    link: "https://n.vgfox.ru",
  },
  {
    id: 2,
    title: "ПРИБОР-Т1 — хроматический тюнер",
    subtitle: "Android · Музыка",
    result: "Высокоточный музыкальный настройщик для Android с живой неоновой аудио-волной и эталонной точностью.",
    image: priborImg,
  },
  {
    id: 3,
    title: "NailBookBot — бот автозаписи для бьюти-мастеров",
    subtitle: "Telegram-бот · Автоматизация",
    result: "Экономия до 15 часов на переписках с клиентами в неделю",
    image:
      "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=2200&q=85",
  },
  {
    id: 4,
    title: "Редизайн и цифровая айдентика бренда",
    subtitle: "Брендинг · Айдентика",
    result: "Разработка премиального визуального стиля, шрифтовой системы и гайдлайнов для технологичных ИИ-продуктов.",
    image: brandImg,
  },
];

// ============================================================================

function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />
      <Hero />
      <Services />
      <Portfolio />
      <Philosophy />
      <Contact />
    </div>
  );
}

/* -------------------------------- NAV ----------------------------------- */
function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#services", label: "Услуги" },
    { href: "#portfolio", label: "Портфолио" },
    { href: "#philosophy", label: "Подход" },
    { href: "#contact", label: "Контакты" },
  ];

  const go = (href: string) => {
    setOpen(false);
    setTimeout(() => {
      document
        .querySelector(href)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto h-11 sm:h-12 px-4 sm:px-6 flex items-center justify-between text-[13px]">
          <a
            href="#top"
            className="apple-link tracking-widest uppercase text-[12px] font-normal"
          >
            vgfox.ru
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="apple-link text-[12px] text-white/80 hover:text-white transition-colors duration-300"
            >
              Главная
            </button>
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className="apple-link text-[12px] text-white/80"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:block w-16" />

          <button
            className="md:hidden apple-link -mr-2 p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden bg-black pt-11"
          >
            <div className="px-6 py-6 flex flex-col divide-y divide-white/[0.06]">
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                onClick={() => {
                  setOpen(false);
                  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60);
                }}
                className="text-left py-5 text-[22px] font-medium tracking-tight"
              >
                Главная
              </motion.button>
              {links.map((l, i) => (
                <motion.button
                  key={l.href}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + (i + 1) * 0.04 }}
                  onClick={() => go(l.href)}
                  className="text-left py-5 text-[22px] font-medium tracking-tight"
                >
                  {l.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------- HERO ---------------------------------- */
function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100dvh] flex items-center justify-center text-center bg-black overflow-hidden"
    >
      <img
        src={heroBg}
        alt="AI Waves"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-80"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 px-4 sm:px-6"
      >
        <p className="font-mono uppercase tracking-[0.24em] text-[11px] sm:text-[13px] text-apple-gray">
          VGFOX DEV
        </p>
        <h1 className="h-display mt-3 sm:mt-4 text-[32px] sm:text-[56px] lg:text-[72px] text-white">
          Цифровые решения
          <br className="hidden sm:block" /> для бизнеса.
        </h1>
        <p className="mt-4 sm:mt-5 mx-auto max-w-[640px] text-[16px] sm:text-[20px] lg:text-[22px] leading-snug tracking-tight text-apple-gray">
          Разрабатываю сайты под ключ, мобильные приложения и Telegram-ботов,
          которые приносят прибыль.
        </p>

        <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-[15px] sm:text-[17px]">
          <AppleLink href={TELEGRAM_URL} external>
            Обсудить проект в Telegram
          </AppleLink>
          <button
            onClick={() =>
              document
                .querySelector("#services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="apple-link inline-flex items-center gap-1.5 text-white"
          >
            Мои услуги <ArrowDown className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </motion.div>
    </section>
  );
}



/* ------------------------------ SERVICES -------------------------------- */
function Services() {
  const items = [
    {
      title: "Telegram-боты",
      desc: "Автоматизация сложных бизнес-процессов, умные воронки продаж и поддержка клиентов 24/7.",
    },
    {
      title: "Android-приложения",
      desc: "Проектирование интерфейсов, разработка логики и публикация в сторы под ключ.",
    },
    {
      title: "Сайты и e-commerce",
      desc: "Быстрые, технологичные интернет-магазины и лендинги, готовые к запуску рекламы.",
    },
    {
      title: "Дизайн чего угодно",
      desc: "Графика, фирменный стиль, логотипы и глубокий UX/UI для компаний любого масштаба.",
    },
  ];

  return (
    <section id="services" className="bg-black">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-16 text-center">
          Один эксперт. Четыре направления.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/[0.05] hover:border-white/20 transition-all duration-300"
            >
              <h3 className="text-2xl font-semibold mb-3 text-white">
                {item.title}
              </h3>
              <p className="text-[#86868b] text-base leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ PORTFOLIO ------------------------------- */
function Portfolio() {
  return (
    <section id="portfolio" className="bg-black py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-16 text-center">
          Избранные концепты.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROJECTS_DATA.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {p.id === 2 ? (
                <div className="block group">
                  <div className="overflow-hidden rounded-2xl mb-4">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-[240px] md:h-[280px] object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div>
                    <span className="inline-block bg-white/10 backdrop-blur-md text-white rounded-full px-3 py-1 text-xs">
                      {p.subtitle}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-3 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {p.result}
                    </p>
                    <a
                      href="https://www.rustore.ru/catalog/app/com.wavestudio.pribort1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0066cc] hover:text-[#0077ed] text-sm font-medium inline-flex items-center gap-1 mt-2 transition-colors"
                    >
                      Смотреть в RuStore &gt;
                    </a>
                  </div>
                </div>
              ) : p.id === 3 ? (
                <div className="block group">
                  <div className="overflow-hidden rounded-2xl mb-4 w-full h-[240px] md:h-[280px]">
                    <div className="w-full h-full bg-[#0e1621] font-sans flex flex-col">
                      <div className="w-full h-12 bg-[#17212b] flex items-center justify-between px-3 border-b border-black/10 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-sm">
                            ✨
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white leading-tight">Запись к Мастеру</p>
                            <p className="text-[10px] text-[#7da3c5] leading-tight">бот</p>
                          </div>
                        </div>
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-end gap-1.5 overflow-hidden">
                        <div className="bg-[#182533] rounded-xl p-2.5 space-y-1.5 self-start w-full max-w-[90%]">
                          {[
                            "Педикюр полный (гигиена+покрытие) — 2000₽",
                            "Педикюр пальчики — 1200₽",
                            "Снятие чужого материала — 500₽",
                            "Дизайн (один палец) — 100₽",
                            "Японский маникюр — 1000₽",
                          ].map((text) => (
                            <div
                              key={text}
                              className="bg-[#2b5278] text-white text-[11px] leading-tight rounded-lg px-3 py-2 text-center cursor-pointer hover:bg-[#366c9e] transition-colors"
                            >
                              {text}
                            </div>
                          ))}
                        </div>
                        <div className="bg-[#2b5278] text-white rounded-2xl rounded-tr-none p-3 text-[11px] max-w-[80%] self-end relative shadow-sm mt-1">
                          🛠 Мои записи
                          <span className="text-[9px] text-[#7da3c5] absolute bottom-1 right-2 flex items-center gap-0.5">
                            12:36
                            <svg className="w-3 h-3" viewBox="0 0 16 11" fill="none">
                              <path d="M11.071 10.142l4.605-4.605-1.41-1.41-3.195 3.195-3.195-3.195-1.41 1.41 4.605 4.605z" fill="#7da3c5"/>
                            </svg>
                          </span>
                        </div>
                        <div className="bg-[#202b36] text-white border border-white/5 rounded-2xl rounded-tl-none p-3 text-[11px] max-w-[88%] self-start relative shadow-sm leading-relaxed">
                          📅 Ваши записи:<br />
                          🔹 Снятие чужого материала — 11.07.2026 в 14:00
                          <span className="text-[9px] text-neutral-500 absolute bottom-1 right-2 flex items-center gap-0.5">
                            12:36
                            <svg className="w-3 h-3" viewBox="0 0 16 11" fill="none">
                              <path d="M11.071 10.142l4.605-4.605-1.41-1.41-3.195 3.195-3.195-3.195-1.41 1.41 4.605 4.605z" fill="#5c6a7a"/>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block bg-white/10 backdrop-blur-md text-white rounded-full px-3 py-1 text-xs">
                      {p.subtitle}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-3 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {p.result}
                    </p>
                    <a
                      href="https://t.me/mastermy17_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0066cc] hover:text-[#0077ed] text-sm font-medium inline-flex items-center gap-1 mt-2 transition-colors"
                    >
                      @mastermy17_bot &gt;
                    </a>
                  </div>
                </div>
              ) : (
                <a href={p.link ?? "#contact"} target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="overflow-hidden rounded-2xl mb-4">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-[240px] md:h-[280px] object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div>
                    <span className="inline-block bg-white/10 backdrop-blur-md text-white rounded-full px-3 py-1 text-xs">
                      {p.subtitle}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-3 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-neutral-300">
                      {p.result}
                    </p>
                  </div>
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ PHILOSOPHY ------------------------------ */
function Philosophy() {
  return (
    <section id="philosophy" className="bg-black py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-16 text-center">
          Один эксперт вместо целой студии.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Прямая связь — col-span-2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-2 bg-[#161617] rounded-3xl border border-white/[0.05] p-8 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Прямая связь</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">
                Коммуникация напрямую без менеджеров и испорченного телефона.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                Э
              </div>
              <div className="w-16 h-px bg-gradient-to-r from-purple-500/60 to-transparent" />
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                К
              </div>
            </div>
          </motion.div>

          {/* Card 2: Экономия бюджета */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#161617] rounded-3xl border border-white/[0.05] p-8 flex flex-col items-center justify-center text-center"
          >
            <span className="text-6xl md:text-7xl font-extrabold text-white tracking-tighter mb-4">
              −40%
            </span>
            <p className="text-sm text-neutral-400">
              Экономия бюджета. Никаких переплат за аренду офиса, налоги и раздутый штат студии.
            </p>
          </motion.div>

          {/* Card 3: Высокая скорость */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#161617] rounded-3xl border border-white/[0.05] p-8 flex flex-col"
          >
            <svg className="w-full h-20 mb-4" viewBox="0 0 200 60" fill="none">
              <polyline
                points="0,50 30,45 60,35 90,40 120,25 150,15 200,8"
                stroke="url(#speedGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <defs>
                <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>
            <p className="text-sm text-neutral-400">
              Высокая скорость. Быстрый запуск благодаря отсутствию цепочки согласований.
            </p>
          </motion.div>

          {/* Card 4: Единая ответственность — col-span-2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-2 bg-[#161617] rounded-3xl border border-white/[0.05] p-8"
          >
            <div className="flex flex-col md:flex-row gap-8 mb-6">
              <div className="flex-1">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Студия</p>
                <div className="flex flex-col gap-3">
                  {["Дизайнер задерживает макеты", "Кодер ждёт ТЗ", "Менеджер переводит стрелки"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-neutral-500">
                      <svg className="w-4 h-4 text-red-400/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-white/[0.06] hidden md:block" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Эксперт</p>
                <div className="flex items-center gap-2 text-sm text-white">
                  <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Один человек отвечает за всё
                </div>
              </div>
            </div>
            <p className="text-[#86868b] text-sm">
              Единая ответственность. Один человек отвечает за результат от идеи до релиза.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- CONTACT -------------------------------- */
function Contact() {
  const buttons = [
    {
      label: "Написать в Telegram",
      href: TELEGRAM_URL,
      external: true,
      icon: Send,
    },
    {
      label: "Написать в МАКС",
      href: MAX_PROFILE_URL,
      external: true,
      icon: FileText,
    },
    {
      label: `Отправить Email (${EMAIL})`,
      href: EMAIL_URL,
      external: false,
      icon: Mail,
    },
  ];

  return (
    <section id="contact" className="bg-black py-28 max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
        Связаться со мной.
      </h2>

      <p className="text-[#86868b] text-lg max-w-xl mx-auto mb-12">
        Обсудите ваш проект напрямую с разработчиком — без посредников и долгих согласований.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {buttons.map((b) => {
          const Icon = b.icon;
          return (
            <a
              key={b.label}
              href={b.href}
              target={b.external ? "_blank" : undefined}
              rel={b.external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-2 bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-full px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 group"
            >
              <Icon className="w-4 h-4" />
              <span>{b.label}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          );
        })}
      </div>

      <div className="border-t border-white/[0.05] mt-20 pt-8">
        <p className="text-[11px] text-neutral-500">
          © 2026 Вадим Георгиевич Лисицин | vgfox.ru. Все права защищены.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- HELPERS -------------------------------- */
function AppleLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="apple-link inline-flex items-center gap-1.5 text-white"
    >
      {children}
      <ArrowRight className="w-4 h-4" strokeWidth={2} />
    </a>
  );
}
