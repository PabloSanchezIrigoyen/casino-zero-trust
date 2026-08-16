import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">
      <section>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--red)]">Proyecto 2 · Desarrollo WEB profesional</p>
        <h1 className="mt-3 font-serif text-5xl leading-tight md:text-6xl">
          Casino Zero Trust
        </h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">
          ¿Qué puede saber un sitio WEB sobre ti? Entra a un casino minimalista, acepta permisos con
          aviso y mira después exactamente qué quedó registrado.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/casino" className="rounded-xl bg-[var(--gold)] px-5 py-3 font-semibold text-black">
            Entrar al lobby
          </Link>
          <Link href="/awareness" className="rounded-xl border border-white/15 px-5 py-3">
            Ver concientización
          </Link>
        </div>
        <ul className="mt-10 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
          <li className="rounded-2xl border border-white/10 p-4">Cámara con preview visible</li>
          <li className="rounded-2xl border border-white/10 p-4">Micrófono independiente</li>
          <li className="rounded-2xl border border-white/10 p-4">Ubicación solo si se permite</li>
          <li className="rounded-2xl border border-white/10 p-4">Cookies y Local Storage explicados</li>
        </ul>
      </section>
      <aside className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[var(--gold)]/40 text-3xl text-[var(--gold)]">
          🛡
        </div>
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[var(--red)]">NO es un sitio malicioso</p>
        <p className="mt-2 font-serif text-3xl">Ético · Controlado · Educativo</p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Los datos son reales y cambian si vuelves, si cambias de laptop a celular o si revocas un
          permiso. El administrador los ve en el dashboard. El video y el audio nunca se guardan.
        </p>
      </aside>
    </div>
  );
}
