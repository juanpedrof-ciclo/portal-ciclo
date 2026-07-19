"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      // Un service worker cacheando "/" pelea con Turbopack HMR en dev
      // (chunks recompilados quedan servidos desde caché vieja) y provoca
      // loops de recarga. Se limpia cualquier registro previo de una
      // sesión anterior para no dejar al navegador atascado.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) registration.unregister();
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  }, []);

  return null;
}
