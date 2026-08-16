import Link from "next/link";

const games = [
  {
    href: "/casino/slots",
    title: "Aurum Reels",
    tag: "Tragamonedas visual",
    copy: "Carretes animados. Si quieres, puedes activar avisos de jackpot (una sola vez).",
  },
  {
    href: "/casino/roulette",
    title: "Orbita",
    tag: "Ruleta",
    copy: "Rueda real. Solo fichas ficticias: la ubicación ya se pidió al entrar.",
  },
  {
    href: "/casino/blackjack",
    title: "Mesa 21",
    tag: "Blackjack",
    copy: "Cartas ilustradas. La mesa en vivo pide cámara; el chat pide micrófono.",
  },
];

export default function CasinoPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--gold)]">Lobby</p>
      <h1 className="mt-2 font-serif text-3xl sm:text-5xl">Mesas abiertas</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
        Ubicación y cookies ya quedaron en los términos de entrada. Cámara, micrófono y avisos solo
        se piden si tú los activas en un juego, con una alerta clara antes.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 transition hover:border-[var(--gold)]/50 sm:rounded-3xl sm:p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">{game.tag}</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl">{game.title}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">{game.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
