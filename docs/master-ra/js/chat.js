/* Мастерская РА — демо-чат с ботом «Искра» */
(function () {
  "use strict";

  const host = document.getElementById("chat-root");
  if (!host) return;

  const $ = FR.$;

  const ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.9 8.9 0 0 1-3.8-.8L3 21l1.9-5.6a8.3 8.3 0 0 1-.9-3.9A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>';
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';
  const ICON_VK = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.1 17.6c-5.3 0-8.4-3.7-8.5-9.8h2.7c.1 4.5 2.1 6.4 3.7 6.8V7.8h2.5v3.9c1.6-.2 3.2-1.9 3.8-3.9h2.5c-.4 2.4-2.1 4.1-3.3 4.8 1.2.6 3.1 2.1 3.9 4.9h-2.8c-.6-1.9-2-3.4-4.1-3.6v3.7h-.4Z"/></svg>';
  const ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.1 14.9l-.5-.3-3 .8.8-2.9-.3-.5A8 8 0 0 1 12 4Zm-3.1 4.2c-.6 0-.9.4-.9 1 0 1.6 1.2 4.2 3.9 4.9 1.9.5 2.6-.1 2.9-.8.2-.5-.2-1-.7-1.2l-1.1-.5c-.4-.2-.7 0-.9.3l-.4.5c-.2.2-.4.3-.7.1-1-.5-1.8-1.3-2.2-2.3-.1-.3 0-.5.2-.7l.5-.4c.2-.2.3-.5.2-.8l-.4-1.2c-.1-.4-.3-.4-.4-.4Z"/></svg>';
  const ICON_CALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.7a2 2 0 0 1 1.6 2Z"/></svg>';

  host.innerHTML = `
    <button class="chat-fab" id="chat-fab" aria-label="Открыть чат">
      ${ICON_CHAT}
      <span class="chat-fab__dot" title="Мы онлайн"></span>
    </button>
    <div class="chat" id="chat" role="dialog" aria-label="Чат с магазином" aria-hidden="true">
      <div class="chat__head">
        <div class="chat__ava">${(CHAT.botName || "И").slice(0, 1)}</div>
        <div class="chat__title">
          <b>${FR.esc(CHAT.botName)} — помощник</b>
          <span>онлайн, отвечает сразу</span>
        </div>
        <button class="chat__close" id="chat-close" aria-label="Закрыть чат">${ICON_CLOSE}</button>
      </div>
      <div class="chat__body" id="chat-body"></div>
      <div class="chat__quick" id="chat-quick"></div>
      <form class="chat__form" id="chat-form">
        <input type="text" id="chat-input" placeholder="Напишите вопрос…" autocomplete="off" maxlength="300">
        <button class="chat__send" type="submit" aria-label="Отправить">${ICON_SEND}</button>
      </form>
    </div>`;

  const fab = $("#chat-fab"), win = $("#chat"), body = $("#chat-body"),
        quick = $("#chat-quick"), form = $("#chat-form"), input = $("#chat-input");

  let opened = false;

  const time = () =>
    new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  function scroll() { body.scrollTop = body.scrollHeight; }

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = "msg msg--" + who;
    div.innerHTML = FR.esc(text) + '<span class="msg-time">' + time() + "</span>";
    body.appendChild(div);
    scroll();
  }

  function addContacts() {
    const div = document.createElement("div");
    div.className = "msg msg--contacts";
    div.innerHTML = `
      <a class="contact-btn" href="${SHOP.vk}" target="_blank" rel="noopener">${ICON_VK} Написать в VK</a>
      <a class="contact-btn" href="${SHOP.whatsapp}" target="_blank" rel="noopener">${ICON_WA} WhatsApp</a>
      <a class="contact-btn" href="${SHOP.phoneHref}">${ICON_CALL} ${FR.esc(SHOP.phone)}</a>`;
    body.appendChild(div);
    scroll();
  }

  function botReply(text, withContacts) {
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(typing);
    scroll();
    const delay = 550 + Math.min(text.length * 7, 900);
    setTimeout(() => {
      typing.remove();
      addMsg(text, "bot");
      if (withContacts) addContacts();
    }, delay);
  }

  function answer(q) {
    const s = q.toLowerCase();
    let best = null, bestScore = 0;
    for (const rule of CHAT.rules) {
      const score = rule.keys.reduce((n, k) => n + (s.includes(k) ? k.length : 0), 0);
      if (score > bestScore) { bestScore = score; best = rule; }
    }
    if (best) botReply(best.a, /написать|связ|мастер|заказ/);
    else botReply(CHAT.fallback, true);
  }

  function send(text) {
    addMsg(text, "user");
    answer(text);
    quick.innerHTML = "";
  }

  function renderQuick() {
    quick.innerHTML = "";
    (CHAT.quick || []).forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.addEventListener("click", () => send(q));
      quick.appendChild(b);
    });
  }

  function open() {
    win.classList.add("is-open");
    win.setAttribute("aria-hidden", "false");
    fab.classList.add("is-hidden");
    if (!opened) {
      opened = true;
      botReply(CHAT.welcome);
      renderQuick();
    }
    setTimeout(() => input.focus(), 240);
  }

  function close() {
    win.classList.remove("is-open");
    win.setAttribute("aria-hidden", "true");
    fab.classList.remove("is-hidden");
  }

  fab.addEventListener("click", open);
  $("#chat-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && win.classList.contains("is-open")) close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = "";
    send(v);
  });

  /* авто-открытие через 6 секунд (демо-эффект), один раз за сессию */
  try {
    if (!sessionStorage.getItem("fr_chat_seen")) {
      setTimeout(() => {
        if (!opened && window.innerWidth > 640) {
          sessionStorage.setItem("fr_chat_seen", "1");
          fab.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }],
            { duration: 600, iterations: 2 }
          );
        }
      }, 6000);
    }
  } catch (e) { /* noop */ }
})();
