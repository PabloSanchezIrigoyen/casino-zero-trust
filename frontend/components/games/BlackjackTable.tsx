"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLab } from "@/context/LabSession";

const SUITS = [
  { id: "S", mark: "♠", color: "#141414" },
  { id: "H", mark: "♥", color: "#c23b3b" },
  { id: "D", mark: "♦", color: "#c23b3b" },
  { id: "C", mark: "♣", color: "#141414" },
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

type Card = { rank: string; suit: (typeof SUITS)[number] };

function deck(): Card[] {
  const cards = SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function value(cards: Card[]) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (["J", "Q", "K"].includes(card.rank)) total += 10;
    else total += Number(card.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function CardView({ card, hidden }: { card?: Card; hidden?: boolean }) {
  if (!card) return <div className="h-24 w-[4.25rem] shrink-0 rounded-xl border border-white/10 bg-black/20 sm:h-28 sm:w-20" />;
  if (hidden) {
    return (
      <div className="grid h-24 w-[4.25rem] shrink-0 place-items-center rounded-xl border border-[var(--gold)]/40 bg-[linear-gradient(135deg,#3b2a12,#1a140c)] font-serif text-[var(--gold)] sm:h-28 sm:w-20">
        ZT
      </div>
    );
  }
  return (
    <div className="flex h-24 w-[4.25rem] shrink-0 flex-col justify-between rounded-xl border border-white/15 bg-[#f7f1e4] p-1.5 text-black shadow-lg sm:h-28 sm:w-20 sm:p-2">
      <span className="text-xs font-bold sm:text-sm" style={{ color: card.suit.color }}>
        {card.rank}
      </span>
      <span className="text-center text-2xl sm:text-3xl" style={{ color: card.suit.color }}>
        {card.suit.mark}
      </span>
      <span className="text-right text-xs font-bold sm:text-sm" style={{ color: card.suit.color }}>
        {card.rank}
      </span>
    </div>
  );
}

async function showStream(video: HTMLVideoElement, stream: MediaStream) {
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.srcObject = stream;
  try {
    await video.play();
  } catch {
    // El navegador a veces espera el primer frame antes de dejar autoplay.
  }
}

export function BlackjackTable() {
  const { requestCamera, requestMicrophone, visitor } = useLab();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [level, setLevel] = useState(0);
  const [shoe, setShoe] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [hidden, setHidden] = useState(true);
  const [status, setStatus] = useState("Pide cartas. El dealer queda cubierto hasta plantarte.");

  const start = () => {
    const next = deck();
    const p = [next[0], next[2]];
    const d = [next[1], next[3]];
    setShoe(next.slice(4));
    setPlayer(p);
    setDealer(d);
    setHidden(true);
    setStatus("Tu turno. Pide o plántate.");
  };

  const hit = () => {
    if (!hidden || shoe.length === 0) return;
    const [card, ...rest] = shoe;
    const next = [...player, card];
    setPlayer(next);
    setShoe(rest);
    if (value(next) > 21) {
      setHidden(false);
      setStatus("Te pasaste de 21.");
    }
  };

  const stand = () => {
    let hand = [...dealer];
    let rest = [...shoe];
    while (value(hand) < 17 && rest.length) {
      hand = [...hand, rest[0]];
      rest = rest.slice(1);
    }
    setDealer(hand);
    setShoe(rest);
    setHidden(false);
    const pv = value(player);
    const dv = value(hand);
    if (dv > 21 || pv > dv) setStatus(`Ganas. Tú ${pv} · dealer ${dv}`);
    else if (pv === dv) setStatus(`Empate ${pv}`);
    else setStatus(`Dealer gana. Tú ${pv} · dealer ${dv}`);
  };

  cameraStreamRef.current = cameraStream;
  micStreamRef.current = micStream;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) {
      setPreviewReady(false);
      return;
    }
    const onPlaying = () => setPreviewReady(true);
    const onMeta = () => {
      void showStream(video, cameraStream);
    };
    video.addEventListener("playing", onPlaying);
    video.addEventListener("loadedmetadata", onMeta);
    void showStream(video, cameraStream);
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [cameraStream]);

  useEffect(() => {
    if (!micStream) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(micStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevel(Math.round(data.reduce((a, b) => a + b, 0) / data.length));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      void ctx.close();
    };
  }, [micStream]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const live = Boolean(cameraStream);

  const tableNote = useMemo(() => {
    if (live) return "CÁMARA ACTIVA · el preview no se oculta";
    return "Mesa clásica. La cámara solo se enciende si la pides.";
  }, [live]);

  return (
    <div className="felt rounded-2xl border border-[var(--line)] p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold-2)]">Blackjack</p>
          <h2 className="font-serif text-2xl sm:text-3xl">Mesa 21</h2>
        </div>
        <p className="text-xs text-[var(--gold-2)]">{tableNote}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-white/60">Dealer {hidden ? "" : value(dealer)}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dealer.map((card, i) => (
              <CardView key={i} card={card} hidden={hidden && i === 1} />
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs uppercase tracking-widest text-white/60 sm:mt-6">Tú {player.length ? value(player) : ""}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {player.map((card, i) => (
              <CardView key={i} card={card} />
            ))}
          </div>
          <p className="mt-4 text-sm">{status}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={start} className="min-h-11 rounded-xl bg-[var(--gold)] px-3 py-2 font-semibold text-black sm:px-4">
              Repartir
            </button>
            <button type="button" onClick={hit} className="min-h-11 rounded-xl border border-white/20 px-3 py-2 sm:px-4">
              Pedir
            </button>
            <button type="button" onClick={stand} className="min-h-11 rounded-xl border border-white/20 px-3 py-2 sm:px-4">
              Plantarse
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-red-500/40 bg-black">
            <div className="flex items-center justify-between px-3 py-2 text-[11px]">
              <span className={live ? "animate-[pulse-live_1s_infinite] text-red-400" : "text-white/50"}>
                {live ? "● EN VIVO" : "○ cámara apagada"}
              </span>
              <span>{visitor?.cameraStatus}</span>
            </div>
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                disablePictureInPicture
                className="aspect-video min-h-[160px] w-full bg-black object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {live && !previewReady ? (
                <p className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-white/70">
                  Cámara encendida. Esperando la imagen…
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const stream = await requestCamera("Mesa en vivo de Blackjack. Preview visible. No se almacena video.");
              if (!stream) return;
              cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
              setPreviewReady(false);
              setCameraStream(stream);
              if (videoRef.current) void showStream(videoRef.current, stream);
            }}
            className="min-h-11 w-full rounded-xl border border-red-400/40 px-3 py-2 text-sm"
          >
            Sentarme en mesa en vivo
          </button>
          <button
            type="button"
            onClick={async () => {
              const stream = await requestMicrophone("Chat de voz en la mesa. Autorización independiente. No se guarda audio.");
              setMicStream(stream);
            }}
            className="min-h-11 w-full rounded-xl border border-white/15 px-3 py-2 text-sm"
          >
            Abrir chat de voz
          </button>
          <div className="h-2 overflow-hidden rounded-full bg-black/50">
            <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, level)}%` }} />
          </div>
          <p className="text-[11px] text-white/60">
            El medidor solo se mueve si el micrófono está realmente concedido.
          </p>
        </div>
      </div>
    </div>
  );
}
