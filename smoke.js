/* Комплект forschungszulage-festsetzung. Счётчики и форма заводятся основной сессией (П-84);
   до этого поля пусты и страница горит красной полосой. */
window.SMOKE = {
  KIT: "forschungszulage-festsetzung",
  METRIKA_ID: "",
  GA_ON: true,  /* в России — только Метрика (П-84, 152-ФЗ) */
  GA4_ID: "",
  FORM_ID: "",  /* Яндекс.Форма «сообщить о запуске», одно поле; после отправки — переход на pay.html?sent=1 */
  CONSENT_BANNER: false,  /* баннера нет — решение Владельца 06.10.2026 */
  WEBVISOR: false
};

/* Прибор активности смоука — П-84 дела и навык sozdanie-smoka (forma-i-celi.md §3).
   Замер — активность посетителей: Яндекс Метрика везде, Google Analytics — только
   на зарубежных страницах (GA_ON); в России — одна Метрика (152-ФЗ).
   Канонические имена: cta_click (главная кнопка), payment_click (каждая кнопка,
   которая поведёт к оплате — числитель исхода; второй оффер — payment_click_new),
   click_<имя> (каждая прочая кнопка и ссылка; кнопка оплаты шлёт и своё
   click_pay_<тариф>), feature_<имя> (функции), form_start / form_submit_click
   (намерение), email_submit (почта о запуске на pay.html), scroll_25/50/75/100,
   price_view. Время на странице — штатный показатель обоих счётчиков.

   Разметка страницы:
     data-ev="имя [имя2]" — события клика (a, button, summary), через пробел
     data-view="имя"      — блок виден наполовину, один раз за просмотр
     data-ev-focus="имя"  — первое касание поля (намерение), один раз
     <body data-page="pay"> — честный экран оплаты: pay_view с тарифом / функцией;
                              почта о запуске — Яндекс.Форма FORM_ID в #email-box,
                              возврат с формы на pay.html?sent=1 → email_submit
     #consent             — баннер согласия (CONSENT_BANNER), сейчас выключен

   Пустой счётчик или форма — красная полоса: страницу с неработающим прибором
   не публикуют. Контактов Владельца нет. */

(function () {
  var S = window.SMOKE || {};
  var loaded = false;
  var sent = {};

  function alarm(text) {
    function put() {
      if (!document.body) return;
      var d = document.createElement("div");
      d.setAttribute("role", "alert");
      d.style.cssText = "background:#b00020;color:#fff;padding:10px 16px;"
        + "font:600 14px/1.45 system-ui,-apple-system,Segoe UI,Arial,sans-serif;text-align:center";
      d.appendChild(document.createTextNode(text));
      document.body.insertBefore(d, document.body.firstChild);
    }
    if (document.body) { put(); } else { document.addEventListener("DOMContentLoaded", put); }
  }

  /* Метки визита (utm_*, gclid, yclid) живут в sessionStorage и не теряются
     при переходах внутри сайта: знаменатель — клики рекламы. */
  var MARKS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "yclid"];
  function query() {
    var q = {}, s = (location.search || "").replace(/^\?/, ""), parts = s ? s.split("&") : [], i, p;
    for (i = 0; i < parts.length; i++) {
      p = parts[i].split("=");
      if (p[0]) { try { q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || "").replace(/\+/g, " ")); } catch (e) {} }
    }
    return q;
  }
  function marks() {
    var out = {}, saved = {}, q = query(), i;
    try { saved = JSON.parse(sessionStorage.getItem("smoke_marks_" + S.KIT) || "{}") || {}; } catch (e) {}
    for (i = 0; i < MARKS.length; i++) { if (q[MARKS[i]] || saved[MARKS[i]]) out[MARKS[i]] = q[MARKS[i]] || saved[MARKS[i]]; }
    try { sessionStorage.setItem("smoke_marks_" + S.KIT, JSON.stringify(out)); } catch (e) {}
    return out;
  }
  function keepMarks() {
    var m = marks(), a = [], k, list, i, h, pos, base, hash;
    for (k in m) { if (m.hasOwnProperty(k)) a.push(encodeURIComponent(k) + "=" + encodeURIComponent(m[k])); }
    if (!a.length) return;
    list = document.querySelectorAll("a[href]");
    for (i = 0; i < list.length; i++) {
      h = list[i].getAttribute("href");
      if (!h || /^(https?:|mailto:|tel:|#|\/\/)/i.test(h)) continue;
      pos = h.indexOf("#"); hash = pos >= 0 ? h.slice(pos) : ""; base = pos >= 0 ? h.slice(0, pos) : h;
      list[i].setAttribute("href", base + (base.indexOf("?") >= 0 ? "&" : "?") + a.join("&") + hash);
    }
  }

  function loadCounters() {
    if (loaded) return;
    loaded = true;
    if (S.METRIKA_ID) {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0];
        k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      try {
        ym(S.METRIKA_ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: !!S.WEBVISOR });
      } catch (e) {}
    }
    if (S.GA_ON && S.GA4_ID) {
      var g = document.createElement("script");
      g.async = 1; g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(S.GA4_ID);
      (document.head || document.documentElement).appendChild(g);
      gtag("js", new Date());
      gtag("config", S.GA4_ID);
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };

  /* Единая точка события: цель Метрики «Целевое событие» с тем же
     идентификатором (условие «Совпадает») и, за рубежом, событие GA4. */
  function track(name, params) {
    params = params || {};
    params.kit = S.KIT;
    try { if (S.METRIKA_ID && window.ym) ym(S.METRIKA_ID, "reachGoal", name, params); } catch (e) {}
    try { if (S.GA_ON && S.GA4_ID && window.gtag) gtag("event", name, params); } catch (e) {}
    try { console.log("[smoke] " + name, params); } catch (e) {}
  }
  function once(name, params) { if (!sent[name]) { sent[name] = 1; track(name, params); } }
  window.smokeTrack = track;

  function consent() {
    var box = document.getElementById("consent"), v = "";
    if (!S.CONSENT_BANNER) { loadCounters(); return; }
    gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    try { v = localStorage.getItem("smoke_consent_" + S.KIT) || ""; } catch (e) {}
    if (v === "yes") { gtag("consent", "update", { analytics_storage: "granted" }); loadCounters(); return; }
    if (v === "no" || !box) return;
    box.hidden = false;
    box.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("[data-consent]") : null, ans;
      if (!b) return;
      ans = b.getAttribute("data-consent");
      try { localStorage.setItem("smoke_consent_" + S.KIT, ans); } catch (e) {}
      box.hidden = true;
      if (ans === "yes") { gtag("consent", "update", { analytics_storage: "granted" }); loadCounters(); }
    });
  }

  function wireClicks() {
    document.addEventListener("click", function (ev) {
      var el = ev.target.closest ? ev.target.closest("a,button,summary") : null, names, p, i;
      if (!el || el.hasAttribute("data-consent")) return;
      names = (el.getAttribute("data-ev") || "click_other").split(/\s+/);
      p = { label: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60) };
      if (el.getAttribute("href")) p.href = el.getAttribute("href").split("?")[0];
      for (i = 0; i < names.length; i++) { if (names[i]) track(names[i], p); }
    }, true);
  }

  /* Намерение «начал заполнять»: значения полей никуда не уходят. */
  function wireIntents() {
    function f(ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest("[data-ev-focus]") : null;
      if (el) once(el.getAttribute("data-ev-focus"));
    }
    document.addEventListener("focusin", f, true);
    document.addEventListener("change", f, true);
  }

  function wireScroll() {
    var steps = [25, 50, 75, 100];
    function f() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight, pct, i;
      pct = max > 0 ? Math.round(100 * (window.pageYOffset || h.scrollTop) / max) : 100;
      if (pct >= 99) pct = 100;
      for (i = 0; i < steps.length; i++) { if (pct >= steps[i]) once("scroll_" + steps[i]); }
    }
    window.addEventListener("scroll", f, { passive: true });
  }

  function wireViews() {
    var list = document.querySelectorAll("[data-view]"), io, i;
    if (!list.length || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (es) {
      for (var j = 0; j < es.length; j++) {
        if (es[j].isIntersecting) { once(es[j].target.getAttribute("data-view")); io.unobserve(es[j].target); }
      }
    }, { threshold: 0.5 });
    for (i = 0; i < list.length; i++) io.observe(list[i]);
  }

  /* Честный экран оплаты и почта о запуске (П-84, «Поле почты для желающих»):
     поле необязательное, приёмник — Яндекс.Форма одним полем; форма после
     отправки ведёт на pay.html?sent=1 — тогда уходит email_submit. В исход
     не входит. Пока FORM_ID пуст — поля нет и горит полоса. */
  function payPage() {
    if (!document.body || document.body.getAttribute("data-page") !== "pay") return;
    var q = query(), i, w, shown = document.querySelectorAll("[data-show]"), box = document.getElementById("email-box");
    if (q.sent === "1") {
      track("email_submit");
    } else {
      track("pay_view", { plan: q.plan || "", feature: q.f || "", intent: q.intent || "" });
    }
    for (i = 0; i < shown.length; i++) {
      w = shown[i].getAttribute("data-show");
      if ((q.plan && w === "plan") || (q.f && w === "feature") || (q.intent && w === "intent") || (q.sent === "1" && w === "sent")) shown[i].hidden = false;
    }
    if (!box || q.sent === "1") { if (box) box.hidden = true; return; }
    if (!S.FORM_ID) {
      box.hidden = true;
      alarm("ПОЧТА О ЗАПУСКЕ НЕ ПОДКЛЮЧЕНА: в smoke.js пусто FORM_ID (Яндекс.Форма одним полем, П-84).");
      return;
    }
    var s = document.createElement("script");
    s.src = "https://forms.yandex.ru/_static/embed.js";
    document.body.appendChild(s);
    var f = document.createElement("iframe");
    f.src = "https://forms.yandex.ru/u/" + encodeURIComponent(S.FORM_ID) + "?iframe=1";
    f.name = "ya-form-" + S.FORM_ID;
    f.title = "email";
    f.setAttribute("frameborder", "0");
    f.style.cssText = "border:0;display:block;width:100%;min-height:220px";
    box.querySelector("[data-form-slot]").appendChild(f);
  }

  var miss = [];
  if (!S.METRIKA_ID) miss.push("METRIKA_ID");
  if (S.GA_ON && !S.GA4_ID) miss.push("GA4_ID");
  if (miss.length) {
    alarm("ПРИБОР НЕ РАБОТАЕТ: в smoke.js пусто " + miss.join(" и ") + " — события активности не собираются (П-84).");
  }

  function start() {
    keepMarks(); consent(); wireClicks(); wireIntents(); wireScroll(); wireViews(); payPage();
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
