"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api, clearUserSession, getUserToken, persistUserSession } from "@/lib/api";
import { collectSignals, publicIp } from "@/lib/device";
import { collectTechProfile } from "@/lib/fingerprint";
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
      ...permissions,
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
        title: "Sin conexión al laboratorio",
        body: error instanceof Error ? error.message : "El servidor no respondió.",
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

  const afterAuth = async (token: string, visitorId: string, next: Visitor, mode: "cuenta" | "sesión") => {
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
    pushToast({
      title: mode === "cuenta" ? "Cuenta creada" : "Sesión iniciada",
      body: "Los permisos se pedirán con aviso. Nada se activa en silencio.",
      tone: "ok",
    });
  };

  const register = async (email: string, password: string) => {
    const data = await api.register({ email, password, ...(await payload()) });
    await afterAuth(data.token, data.visitor.visitorId, data.visitor as Visitor, "cuenta");
  };

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password, ...(await payload()) });
    await afterAuth(data.token, data.visitor.visitorId, data.visitor as Visitor, "sesión");
  };

  const logout = () => {
    api.leaveKeepAlive();
    clearUserSession();
    setLoggedIn(false);
    setVisitor(null);
    pushToast({ title: "Sesión cerrada", body: "Vuelve a entrar con tu correo para seguir el laboratorio.", tone: "info" });
  };

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
      pushToast({
        title: accepted ? "Cookies y almacenamiento aceptados" : "Cookies y almacenamiento rechazados",
        body: accepted
          ? "Se guardó el consentimiento: cookie de sesión y datos en este navegador (localStorage)."
          : "No se guardó cookie ni datos en el disco de este navegador.",
        tone: accepted ? "ok" : "warn",
      });
    } catch (error) {
      pushToast({
        title: "No se pudieron guardar las cookies",
        body: error instanceof Error ? error.message : "Inténtalo de nuevo.",
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
      title: ok ? "Almacenamiento local autorizado" : "Almacenamiento local no autorizado",
      body: ok
        ? "Guardaremos la sesión, fichas y datos técnicos del navegador."
        : "No persistiremos preferencias en el disco del navegador.",
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
      title: "Cámara",
      body: "El navegador va a mostrar su propio diálogo. El preview quedará visible. No se graba ni se envía video.",
      tone: "info",
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      await reportPermission("camera", "granted", context, { cameraStatus: "granted" });
      pushToast({ title: "Cámara activa", body: "Mira el recuadro. Puedes cortar el stream cuando salgas.", tone: "ok" });
      return stream;
    } catch {
      await reportPermission("camera", "denied", context, { cameraStatus: "denied" });
      pushToast({ title: "Cámara denegada", body: "El laboratorio registró la negativa. No hay video oculto.", tone: "warn" });
      return null;
    }
  };

  const requestMicrophone = async (context: string) => {
    pushToast({
      title: "Micrófono",
      body: "Autorización independiente. Verás un medidor de audio. No se guarda voz.",
      tone: "info",
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      await reportPermission("microphone", "granted", context, { microphoneStatus: "granted" });
      pushToast({ title: "Micrófono activo", body: "El indicador de nivel confirma que el permiso es real.", tone: "ok" });
      return stream;
    } catch {
      await reportPermission("microphone", "denied", context, { microphoneStatus: "denied" });
      pushToast({ title: "Micrófono denegado", body: "Quedó documentado. No hay captura en segundo plano.", tone: "warn" });
      return null;
    }
  };

  const requestLocation = async (context: string) => {
    pushToast({
      title: "Ubicación",
      body: "Pide GPS preciso del teléfono. En iPhone: Ajustes → Safari → Ubicación → Precisión activada. No es una IP.",
      tone: "info",
    });
    if (!("geolocation" in navigator)) {
      await reportPermission("location", "denied", context, { locationStatus: "denied" });
      return;
    }
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await reportPermission("location", "granted", context, {
            locationStatus: "granted",
            locationLat: roundCoord(pos.coords.latitude),
            locationLng: roundCoord(pos.coords.longitude),
            locationAccuracy: pos.coords.accuracy,
          });
          pushToast({
            title: "Ubicación autorizada",
            body: "Se guardó el GPS del dispositivo (metros), no la ciudad del proveedor de internet.",
            tone: "ok",
          });
          resolve();
        },
        async () => {
          await reportPermission("location", "denied", context, { locationStatus: "denied" });
          pushToast({ title: "Ubicación denegada", body: "El casino no usará geolocalización.", tone: "warn" });
          resolve();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  };

  const requestNotifications = async (context: string) => {
    pushToast({
      title: "Notificaciones",
      body: "Es el permiso nativo del navegador. Úsalo solo si quieres alertas de mesa.",
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
      pushToast({ title: "Notificaciones activas", body: "Recibirás avisos educativos de jackpot/mesa.", tone: "ok" });
    } else {
      pushToast({ title: "Notificaciones no concedidas", body: "El estado quedó registrado.", tone: "warn" });
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
      pushToast,
      dismissToast,
      sync,
    }),
    [visitor, ready, loggedIn, cookieChoice, storageChoice, localStorageOk, toasts, pushToast, dismissToast, sync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLab() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLab fuera de LabSessionProvider");
  return ctx;
}
