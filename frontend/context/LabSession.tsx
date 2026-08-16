"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api, clearUserSession, getUserToken, persistUserSession } from "@/lib/api";
import { collectSignals, publicIp } from "@/lib/device";
import { collectTechProfile } from "@/lib/fingerprint";
import { capturePrecisePosition } from "@/lib/geolocation";
import { readBrowserPermissions, roundCoord } from "@/lib/permissions";
import type { PermissionState, Toast, Visitor } from "@/lib/types";

type LabContext = {
  visitor: Visitor | null;
  ready: boolean;
  loggedIn: boolean;
  cookieChoice: boolean | null;
  storageChoice: boolean | null;
  localStorageOk: boolean;
  toasts: Toast[];
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setCookieChoice: (accepted: boolean) => Promise<void>;
  setLocalStorageOk: (ok: boolean) => Promise<void>;
  requestCamera: (context: string) => Promise<MediaStream | null>;
  requestMicrophone: (context: string) => Promise<MediaStream | null>;
  requestLocation: (context: string) => Promise<void>;
  requestNotifications: (context: string) => Promise<void>;
  termsAccepted: boolean;
  completeTerms: (visitor?: Visitor | null) => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  sync: () => Promise<void>;
};

const Ctx = createContext<LabContext | null>(null);

export function LabSessionProvider({ children }: { children: React.ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [cookieChoice, setCookieChoiceState] = useState<boolean | null>(null);
  const [storageChoice, setStorageChoice] = useState<boolean | null>(null);
  const [localStorageOk, setLocalOk] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cachedPublicIp, setCachedPublicIp] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 7000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const payload = useCallback(async () => {
    const permissions = await readBrowserPermissions();
    const confirmed = Object.fromEntries(
      Object.entries(permissions).filter(([, state]) => state && state !== "prompt"),
    );
    const techProfile = await collectTechProfile();
    const red = techProfile.red;
    return {
      publicIp: (red.ipv4Publica as string) || cachedPublicIp || (await publicIp()),
      publicIpv4: red.ipv4Publica,
      publicIpv6: red.ipv6Publica,
      localIps: red.ipsLocalesWebRTC,
      techProfile,
      ...(cookieChoice !== null ? { cookieConsent: cookieChoice } : {}),
      ...(storageChoice !== null ? { localStorageOk } : {}),
      ...collectSignals(),
      ...confirmed,
    };
  }, [cachedPublicIp, cookieChoice, storageChoice, localStorageOk]);

  const sync = useCallback(async () => {
    if (!getUserToken()) return;
    const body = await payload();
    const data = (await api.heartbeat(body)) as { visitor: Visitor };
    setVisitor(data.visitor);
    setCookieChoiceState((current) => {
      if (current !== null) return current;
      if (data.visitor.cookieConsentAt) return Boolean(data.visitor.cookieConsent);
      return current;
    });
    persistUserSession(getUserToken(), data.visitor.visitorId, {
      cookies: cookieChoice === true,
      localStorage: localStorageOk,
    });
  }, [localStorageOk, cookieChoice, payload]);

  useEffect(() => {
    const cookies = localStorage.getItem("zt_cookies");
    const storage = localStorage.getItem("zt_storage");
    setLoggedIn(Boolean(getUserToken()));
    if (cookies === "1") setCookieChoiceState(true);
    else if (cookies === "0") setCookieChoiceState(false);
    setStorageChoice(storage === null ? null : storage === "1");
    setLocalOk(storage === "1");
    setTermsAccepted(sessionStorage.getItem("zt_terms") === "1");
    publicIp().then(setCachedPublicIp);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !loggedIn || isAdmin) return;
    void sync().catch((error) => {
      if (String(error.message).includes("sesión") || String(error.message).includes("Inicia")) {
        clearUserSession();
        setLoggedIn(false);
        setVisitor(null);
      }
      pushToast({
        title: "No hay conexión ahora",
        body: "Revisa tu red e inténtalo otra vez. Tus datos no se perdieron.",
        tone: "danger",
      });
    });
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void sync().catch(() => undefined);
    }, 12000);
    const onFocus = () => {
      if (!document.hidden) void sync().catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.hidden) api.leaveKeepAlive();
      else void sync().catch(() => undefined);
    };
    const onPageHide = () => api.leaveKeepAlive();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      api.leaveKeepAlive();
    };
  }, [ready, loggedIn, isAdmin, sync, pushToast]);

  const afterAuth = async (token: string, visitorId: string, next: Visitor) => {
    persistUserSession(token, visitorId, {
      cookies: cookieChoice === true,
      localStorage: localStorageOk,
    });
    setVisitor(next);
    setLoggedIn(true);
    if (next.cookieConsentAt) {
      setCookieChoiceState(Boolean(next.cookieConsent));
      setStorageChoice(Boolean(next.localStorageOk));
      setLocalOk(Boolean(next.localStorageOk));
    } else {
      const saved = localStorage.getItem("zt_cookies");
      if (saved === "1") setCookieChoiceState(true);
      else if (saved === "0") setCookieChoiceState(false);
      else setCookieChoiceState(null);
    }
  };

  const register = async (email: string, password: string) => {
    const data = await api.register({ email, password, ...(await payload()) });
    await afterAuth(data.token, data.visitor.visitorId, data.visitor as Visitor);
  };

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password, ...(await payload()) });
    await afterAuth(data.token, data.visitor.visitorId, data.visitor as Visitor);
  };

  const logout = () => {
    api.leaveKeepAlive();
    clearUserSession();
    sessionStorage.removeItem("zt_terms");
    setTermsAccepted(false);
    setLoggedIn(false);
    setVisitor(null);
    pushToast({
      title: "Hasta luego",
      body: "Cerramos tu sesión. Cuando vuelvas, entra otra vez con tu correo.",
      tone: "info",
    });
  };

  const persistEntryConsent = useCallback(async () => {
    try {
      setCookieChoiceState(true);
      setStorageChoice(true);
      setLocalOk(true);
      localStorage.setItem("zt_cookies", "1");
      localStorage.setItem("zt_storage", "1");
      const body = { ...(await payload()), cookieConsent: true, localStorageOk: true };
      const data = (await api.consent(body)) as { visitor: Visitor };
      setVisitor(data.visitor);
      persistUserSession(getUserToken(), data.visitor.visitorId, {
        cookies: true,
        localStorage: true,
      });
    } catch {
      // El laboratorio ya tiene la sesión; las cookies locales quedaron marcadas.
    }
  }, [payload]);

  const completeTerms = useCallback(
    (nextVisitor?: Visitor | null) => {
      sessionStorage.setItem("zt_terms", "1");
      setTermsAccepted(true);
      if (nextVisitor) setVisitor(nextVisitor);
      void persistEntryConsent();
    },
    [persistEntryConsent],
  );

  const setCookieChoice = async (accepted: boolean) => {
    try {
      const body = { ...(await payload()), cookieConsent: accepted, localStorageOk: accepted };
      const data = (await api.consent(body)) as { visitor: Visitor };
      setCookieChoiceState(accepted);
      setStorageChoice(accepted);
      setLocalOk(accepted);
      localStorage.setItem("zt_cookies", accepted ? "1" : "0");
      localStorage.setItem("zt_storage", accepted ? "1" : "0");
      setVisitor(data.visitor);
      persistUserSession(getUserToken(), data.visitor.visitorId, {
        cookies: accepted,
        localStorage: accepted,
      });
    } catch (error) {
      pushToast({
        title: "No pudimos guardar tu decisión",
        body: error instanceof Error ? error.message : "Inténtalo otra vez en un momento.",
        tone: "danger",
      });
    }
  };

  const setLocalStorageOk = async (ok: boolean) => {
    setLocalOk(ok);
    setStorageChoice(ok);
    localStorage.setItem("zt_storage", ok ? "1" : "0");
    const body = { ...(await payload()), localStorageOk: ok };
    const data = (await api.consent(body)) as { visitor: Visitor };
    setVisitor(data.visitor);
    persistUserSession(getUserToken(), data.visitor.visitorId, {
      cookies: cookieChoice === true,
      localStorage: ok,
    });
    pushToast({
      title: ok ? "Guardado en este teléfono o computadora" : "Sin guardado local",
      body: ok
        ? "Recordaremos que ya entraste en este navegador."
        : "No guardaremos preferencias en este dispositivo.",
      tone: ok ? "ok" : "warn",
    });
  };

  const reportPermission = async (
    permission: string,
    status: PermissionState,
    context: string,
    extra: Record<string, unknown> = {},
  ) => {
    const body = { ...(await payload()), permission, status, context, ...extra };
    const data = (await api.permissions(body)) as { visitor: Visitor };
    setVisitor(data.visitor);
  };

  const requestCamera = async (context: string) => {
    pushToast({
      title: "Vamos a pedir la cámara",
      body: "Verás el diálogo del navegador. El video se muestra aquí y no se graba.",
      tone: "info",
    });
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      await reportPermission("camera", "granted", context, { cameraStatus: "granted" });
      pushToast({
        title: "Cámara encendida",
        body: "Mírate en el recuadro. Al salir de la mesa se apaga sola.",
        tone: "ok",
      });
      return stream;
    } catch {
      await reportPermission("camera", "denied", context, { cameraStatus: "denied" });
      pushToast({
        title: "Sin cámara, sin problema",
        body: "Puedes seguir jugando. El laboratorio anotó que no diste permiso.",
        tone: "warn",
      });
      return null;
    }
  };

  const requestMicrophone = async (context: string) => {
    pushToast({
      title: "Vamos a pedir el micrófono",
      body: "Es independiente de la cámara. Verás un medidor; no se guarda tu voz.",
      tone: "info",
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      await reportPermission("microphone", "granted", context, { microphoneStatus: "granted" });
      pushToast({
        title: "Micrófono listo",
        body: "Si el medidor se mueve, el permiso es real.",
        tone: "ok",
      });
      return stream;
    } catch {
      await reportPermission("microphone", "denied", context, { microphoneStatus: "denied" });
      pushToast({
        title: "Sin micrófono, sin problema",
        body: "Puedes seguir en la mesa. No hay captura en segundo plano.",
        tone: "warn",
      });
      return null;
    }
  };

  const requestLocation = async (context: string) => {
    if (visitor?.locationStatus === "granted" || visitor?.locationStatus === "denied") {
      pushToast({
        title: "Ubicación ya quedó en la entrada",
        body: "No la volvemos a pedir. La decisión de los términos sigue valiendo.",
        tone: "info",
      });
      return;
    }
    pushToast({
      title: "Ubicación",
      body: "En el celular suele ser GPS. En una computadora el navegador estima con la red.",
      tone: "info",
    });
    try {
      const pos = await capturePrecisePosition();
      await reportPermission("location", "granted", context, {
        locationStatus: "granted",
        locationLat: roundCoord(pos.coords.latitude),
        locationLng: roundCoord(pos.coords.longitude),
        locationAccuracy: pos.coords.accuracy,
      });
      pushToast({
        title: "Ubicación guardada",
        body:
          pos.coords.accuracy > 1000
            ? "Quedó una estimación de red: esta computadora no tiene GPS."
            : "Quedó el GPS de tu dispositivo, en metros.",
        tone: "ok",
      });
    } catch {
      await reportPermission("location", "denied", context, { locationStatus: "denied" });
      pushToast({
        title: "Sin ubicación, sin problema",
        body: "El casino no la usará. No te la volveremos a pedir.",
        tone: "warn",
      });
    }
  };

  const requestNotifications = async (context: string) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      await reportPermission("notifications", "granted", context, { notificationStatus: "granted" });
      pushToast({
        title: "Las alertas ya estaban activas",
        body: "No hace falta volver a pedir este permiso.",
        tone: "ok",
      });
      return;
    }
    pushToast({
      title: "¿Quieres avisos de jackpot?",
      body: "El navegador te preguntará. Son alertas de laboratorio, no apuestas reales.",
      tone: "info",
    });
    if (!("Notification" in window)) {
      await reportPermission("notifications", "denied", context, { notificationStatus: "denied" });
      return;
    }
    const status = (await Notification.requestPermission()) as PermissionState;
    await reportPermission("notifications", status, context, { notificationStatus: status });
    if (status === "granted") {
      new Notification("Casino Zero Trust", { body: "Alertas de laboratorio activadas. No hay apuestas reales." });
      pushToast({
        title: "Alertas activadas",
        body: "Si ganas un jackpot ficticio, te avisaremos aquí.",
        tone: "ok",
      });
    } else {
      pushToast({
        title: "Sin avisos, sin problema",
        body: "Puedes seguir girando. El laboratorio anotó tu decisión.",
        tone: "warn",
      });
    }
  };

  const value = useMemo(
    () => ({
      visitor,
      ready,
      loggedIn,
      cookieChoice,
      storageChoice,
      localStorageOk,
      toasts,
      register,
      login,
      logout,
      setCookieChoice,
      setLocalStorageOk,
      requestCamera,
      requestMicrophone,
      requestLocation,
      requestNotifications,
      termsAccepted,
      completeTerms,
      pushToast,
      dismissToast,
      sync,
    }),
    [visitor, ready, loggedIn, cookieChoice, storageChoice, localStorageOk, termsAccepted, toasts, pushToast, dismissToast, sync, completeTerms],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLab() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLab fuera de LabSessionProvider");
  return ctx;
}
