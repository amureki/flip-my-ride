(() => {
  try {
    if (localStorage.getItem("umami.disabled")) return;
  } catch {
    // Do not track when the browser cannot retain the exclusion setting.
    return;
  }

  if (window.location.hostname !== "flip.amureki.me") return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://t.rsts.me/script.js";
  script.dataset.websiteId = "9412d984-ea57-4f4a-8f05-bb60930750d7";
  script.dataset.domains = "flip.amureki.me";
  document.head.append(script);
})();
