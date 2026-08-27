/**
 * Registro del service worker. Solo se activa en la app publicada:
 * nunca en desarrollo, dentro de un iframe ni en las previsualizaciones
 * de Lovable, donde podría servir HTML antiguo.
 */
const SW_URL = "/sw.js";

function blockedHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    blockedHost(window.location.hostname) ||
    new URLSearchParams(window.location.search).has("sw") ;

  if (refused) {
    void unregisterExisting();
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* sin service worker la app sigue funcionando online */
    });
  });
}
