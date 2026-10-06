/* Комплект forschungszulage-festsetzung. Аналитику ставит контейнер Google Tag Manager (СМ-09 «Смоков»):
   код контейнера стоит в каждой странице, smoke.js только кладёт события в dataLayer.
   Форма почты заводится основной сессией (П-84); пока FORM_ID пуст — красная полоса. */
window.SMOKE = {
  KIT: "forschungszulage-festsetzung",
  GTM_ID: "GTM-N2ZVHWW8",  /* контейнер Google Tag Manager этого комплекта; счётчики ставит он */
  FORM_ID: "6ac55c2b49af47e2f45f8ff9"   /* Яндекс.Форма «сообщить о запуске», одно поле; после отправки — переход на экран оплаты с ?sent=1 */
};

/* Прибор активности смоука — П-84 дела и навык sozdanie-smoka (forma-i-celi.md §3).
   На зарубежных страницах счётчики (Google Analytics, Метрика) ставит контейнер GTM;
   smoke.js НЕ грузит tag.js и gtag.js и не вызывает ym / gtag — иначе двойной счёт.
   Событие уходит одним путём: dataLayer.push({event: имя, ...параметры}).
   Канонические имена: cta_click (главная кнопка), payment_click (каждая кнопка,
   которая поведёт к оплате — числитель исхода; второй оффер — payment_click_new),
   click_<имя> (каждая прочая кнопка и ссылка; кнопка оплаты шлёт и своё
   click_pay_<тариф>), feature_<имя> (функции), form_start / form_submit_click
   (намерение), email_submit (почта о запуске на экране оплаты), scroll_25/50/75/100,
   price_view (открыт экран цен price.html), pay_view (открыт экран оплаты).

   Разметка страницы:
     data-ev="имя [имя2]" — события клика (a, button, summary), через пробел
     data-view="имя"      — блок виден наполовину, один раз за просмотр
     data-ev-focus="имя"  — первое касание поля (намерение), один раз
     <body data-page="pay"> — честный экран оплаты: pay_view с тарифом / функцией;
                              почта о запуске — Яндекс.Форма FORM_ID в #email-box,
                              возврат с формы на экран оплаты с ?sent=1 → email_submit

   Контейнер GTM своего номера не загрузился или FORM_ID пуст — красная полоса:
   страницу с неработающим прибором не публикуют. Контактов Владельца нет. */

(function () {
  var S = window.SMOKE || {};
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

  /* Единая точка события: только dataLayer. Теги GA4 и Метрики в контейнере GTM
     ловят событие по имени (custom event). */
  function track(name, params) {
    params = params || {};
    params.kit = S.KIT;
    window.dataLayer = window.dataLayer || [];
    try { window.dataLayer.push(Object.assign({ event: name }, params)); } catch (e) {}
    try { console.log("[smoke] " + name, params); } catch (e) {}
  }
  function once(name, params) { if (!sent[name]) { sent[name] = 1; track(name, params); } }
  window.smokeTrack = track;

  function wireClicks() {
    document.addEventListener("click", function (ev) {
      var el = ev.target.closest ? ev.target.closest("a,button,summary") : null, names, p, i;
      if (!el || el.hasAttribute("data-consent")) return;
      names = (el.getAttribute("data-ev") || "click_other").split(/\s+/);
      p = { label: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60) };
      if (el.getAttribute("href")) p.href = el.getAttribute("href").split("?")[0];
      for (i = 0; i < names.length; i++) { if (names[i]) track(names[i], Object.assign({}, p)); }
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
     отправки ведёт на экран оплаты с ?sent=1 — тогда уходит email_submit. В исход
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

  /* Аналитика подключена = контейнер своего номера загрузился (СМ-09).
     gtm.js грузится асинхронно — проверка после загрузки страницы с запасом. */
  function checkGtm() {
    if (!S.GTM_ID) {
      alarm("ПРИБОР НЕ РАБОТАЕТ: в smoke.js пусто GTM_ID — события активности не собираются (СМ-09, П-84).");
      return;
    }
    function test() {
      if (!(window.google_tag_manager && window.google_tag_manager[S.GTM_ID])) {
        alarm("ПРИБОР НЕ РАБОТАЕТ: контейнер " + S.GTM_ID + " не загрузился — события активности не собираются (СМ-09, П-84).");
      }
    }
    function later() { setTimeout(test, 4000); }
    if (document.readyState === "complete") { later(); } else { window.addEventListener("load", later); }
  }

  function start() {
    keepMarks(); wireClicks(); wireIntents(); wireScroll(); wireViews(); payPage(); checkGtm();
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
})();
