type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (name: string, data: EventData) => Promise<unknown> | void };
  }
}

function enabled() {
  try {
    return window.location.hostname === "flip.amureki.me" && !localStorage.getItem("umami.disabled");
  } catch {
    return false;
  }
}

const pending: { name: string; data: EventData }[] = [];
let failed = false;

export function trackEvent(name: string, data: EventData = {}) {
  if (!enabled()) {
    pending.length = 0;
    return;
  }
  if (failed) return;
  if (!window.umami) {
    if (pending.length < 50) pending.push({ name, data: { ...data } });
    return;
  }
  try {
    // Analytics failures must never interrupt gameplay or sharing.
    Promise.resolve(window.umami.track(name, data)).catch(() => {});
  } catch {}
}

if (enabled()) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://t.rsts.me/script.js";
  script.dataset.websiteId = "9412d984-ea57-4f4a-8f05-bb60930750d7";
  script.dataset.domains = "flip.amureki.me";
  script.onload = () => {
    if (!window.umami) failed = true;
    for (const event of pending.splice(0)) trackEvent(event.name, event.data);
  };
  script.onerror = () => {
    failed = true;
    pending.length = 0;
  };
  document.head.append(script);
}
