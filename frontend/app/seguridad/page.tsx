const rows = [
  ["Permisos silenciosos", "Todo permiso pasa por diálogo nativo + alerta previa + preview visible."],
  ["Robo de sesión admin", "JWT de 12h, contraseña hasheada, rutas /api/admin protegidas."],
  ["XSS / inyección", "React escapa texto. Prisma parametriza SQL. No hay HTML libre del usuario."],
  ["Datos sensibles", "No se persisten streams ni contraseñas de jugadores. Solo estados."],
  ["CORS abierto", "El backend solo acepta el origen del frontend."],
  ["Cookies cross-site", "El visitorId viaja también por header X-Visitor-Id para no depender de third-party cookies."],
];

export default function SecurityPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl">Análisis de vulnerabilidades</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Entregable de seguridad: riesgos típicos de un casino web y cómo este laboratorio los mitiga.
      </p>
      <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">
        {rows.map(([risk, fix]) => (
          <div key={risk} className="grid gap-2 border-b border-white/5 p-4 md:grid-cols-2">
            <p className="font-semibold">{risk}</p>
            <p className="text-sm text-[var(--muted)]">{fix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
