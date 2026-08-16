import Link from "next/link";

const games = [
  {
    href: "/casino/slots",
    title: "Aurum Reels",
    tag: "Tragamonedas visual",
    copy: "Carretes animados. Aquí se piden notificaciones de jackpot.",
  },
  {
    href: "/casino/roulette",
    title: "Orbita",
    tag: "Ruleta",
    copy: "Rueda real. El jackpot regional pide geolocalización.",
  },
  {
    href: "/casino/blackjack",
    title: "Mesa 21",
    tag: "Blackjack",
    copy: "Cartas ilustradas. Mesa en vivo pide cámara; el chat pide micrófono.",
  },
];

export default function CasinoPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--gold)]">Lobby</p>
      <h1 className="mt-2 font-serif text-5xl">Mesas abiertas</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Cada juego integra un permiso de forma natural. Antes del diálogo nativo verás una alerta
        explicando qué va a pasar.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 transition hover:border-[var(--gold)]/50"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">{game.tag}</p>
            <h2 className="mt-2 font-serif text-3xl">{game.title}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">{game.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
