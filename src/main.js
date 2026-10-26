// Vite entry point: create the app instance, initialize UI/i18n/history, then start the canvas render loop.
import "./styles/main.css";

var assetBaseUrl = new URL(import.meta.env.BASE_URL || "./", document.baseURI).href;
document.documentElement.style.setProperty("--lb-achievement-bg", 'url("' + assetBaseUrl + 'img/achievement.png")');
["gold", "silver", "bronze"].forEach(function (metal) {
  document.documentElement.style.setProperty("--lb-medal-" + metal + "-bg", 'url("' + assetBaseUrl + 'img/medals/' + metal + '.png")');
});

import { themeChange } from "theme-change";

import { createApp } from "./lightbot/app.js";

import { initCanvasView } from "./lightbot/lightbot.view.canvas.js";
import { initI18n } from "./lightbot/lightbot.view.canvas.ui.translate.js";
import { initDialogs } from "./lightbot/lightbot.view.canvas.ui.dialogs.js";
import { initHistory } from "./lightbot/lightbot.view.canvas.ui.history.js";

function runWhenDomReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

async function boot() {
  // `createApp()` is the composition root: it wires together all models + UI + rendering extensions.
  var app = createApp();
  themeChange(false);

  // Hook up DOM elements and event handlers once the document is ready.
  if (app.ui && app.ui.media && typeof app.ui.media.init === "function") app.ui.media.init();
  initDialogs({ ui: app.ui, achievements: app.achievements });

  // Apply translations before we initialize UI controls that use i18next.t().
  await initI18n();

  app.ui.editor.initEditor();
  app.ui.initButtons();
  app.ui.initSlider();

  // Start the render/update loop and then apply the initial route.
  initCanvasView(app);
  initHistory(app);
}

runWhenDomReady(function () {
  boot().catch(function (e) {
    console.error("Lightbot boot failed:", e);
  });
});

// Precache all local assets, including the original demonstrations and the nineteen objects.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    const status = document.getElementById('offlineStatus');
    try {
      const wasControlled = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (wasControlled) window.location.reload();
      }, { once: true });
      const registration = await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      if (registration.active) status.textContent = 'Disponível offline';
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data === 'offline-ready') status.textContent = 'Disponível offline';
      });
    } catch { status.textContent = 'Online · cache offline indisponível'; }
  });
}

import './styles/education.css';
