export function estadoPermiso(state: string) {
  if (state === "granted" || state === "true") return "Concedido";
  if (state === "denied" || state === "false") return "Denegado";
  return "Pendiente";
}

export function dispositivo(type?: string | null) {
  if (type === "desktop") return "Computadora";
  if (type === "mobile") return "Celular";
  if (type === "tablet") return "Tablet";
  return type || "Desconocido";
}

export function nombrePermiso(permission: string) {
  const names: Record<string, string> = {
    camera: "Cámara",
    microphone: "Micrófono",
    location: "Ubicación",
    geolocation: "Ubicación",
    notifications: "Notificaciones",
    cookies: "Cookies",
    localStorage: "Almacenamiento local",
  };
  return names[permission] || permission;
}

export function estadoCookie(consent: boolean, decidedAt?: string | null) {
  if (consent) return "granted";
  if (decidedAt) return "denied";
  return "prompt";
}

export function estadoAlmacenamiento(visitor: {
  localStorageOk: boolean;
  cookieConsent: boolean;
  cookieConsentAt: string | null;
}) {
  if (visitor.localStorageOk || visitor.cookieConsent) return "granted";
  if (visitor.cookieConsentAt) return "denied";
  return "prompt";
}

export function enLinea(visitor: { enLinea?: boolean; lastSeenAt?: string }) {
  if (typeof visitor.enLinea === "boolean") return visitor.enLinea;
  return false;
}
