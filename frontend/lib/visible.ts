const HIDDEN = [
  /^el navegador no lo expone$/i,
  /^desconocid/i,
  /^no disponible$/i,
  /^bloqueado$/i,
  /casi nunca entregan/i,
  /^sin modelo/i,
  /^n\/a$/i,
  /^\?\s*\/\s*\?/,
];

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "boolean" || typeof value === "number") return false;
  if (Array.isArray(value)) return value.filter((item) => !isEmptyValue(item)).length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  const text = String(value).trim();
  if (!text || text === "—" || text === "-" || text === "null" || text === "undefined") return true;
  return HIDDEN.some((pattern) => pattern.test(text));
}

export function formatShown(value: unknown): string {
  if (Array.isArray(value)) return value.filter((item) => !isEmptyValue(item)).map(String).join(", ");
  return String(value).trim();
}
