export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-4 text-sm leading-7 text-[var(--muted)]">
      <h1 className="font-serif text-5xl text-[var(--ink)]">Aviso de privacidad del laboratorio</h1>
      <p>
        Casino Zero Trust es un ejercicio académico. El responsable es el equipo del Proyecto 2. La
        finalidad es demostrar, con APIs oficiales, qué puede observar un sitio web si el usuario
        consiente.
      </p>
      <p>
        <strong className="text-[var(--ink)]">Datos técnicos:</strong> hora de entrada, IP de red y
        pública, user-agent, tipo de dispositivo, resolución, idioma, zona horaria y estados de
        permiso.
      </p>
      <p>
        <strong className="text-[var(--ink)]">No se tratan:</strong> contraseñas reales, video, audio,
        fotos, contactos, ni contenido privado. La ubicación se redondea si se concede.
      </p>
      <p>
        La base jurídica del ejercicio es el consentimiento informado que das al entrar. Puedes
        pedir al administrador que borre tu visitorId desde el dashboard.
      </p>
    </article>
  );
}
