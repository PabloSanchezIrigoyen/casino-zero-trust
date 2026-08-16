import type { Visitor } from "@/lib/types";

function texto(value: unknown) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return { empty: true, text: "El navegador no lo expone" };
  }
  if (Array.isArray(value)) return { empty: false, text: value.join(", ") };
  if (typeof value === "object") return { empty: false, text: JSON.stringify(value) };
  return { empty: false, text: String(value) };
}

function Dato({ label, value }: { label: string; value: unknown }) {
  const shown = texto(value);
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`mt-1 break-all text-sm ${shown.empty ? "text-[var(--muted)]" : ""}`}>{shown.text}</p>
    </div>
  );
}

export function FichaTecnica({ visitor }: { visitor: Visitor }) {
  const profile = visitor.techProfile || {};
  const red = (profile.red || {}) as Record<string, unknown>;
  const gpu = (profile.gpu || {}) as Record<string, unknown>;
  const maquina = (profile.maquina || {}) as Record<string, unknown>;
  const sistema = (profile.sistema || {}) as Record<string, unknown>;
  const navegador = (profile.navegador || {}) as Record<string, unknown>;
  const pantalla = (profile.pantalla || {}) as Record<string, unknown>;
  const medios = (profile.medios || {}) as Record<string, unknown>;
  const servidor = (profile.servidor || {}) as Record<string, unknown>;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-3xl">Ficha técnica real</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Un sitio web no puede leer la etiqueta HP/Dell de una laptop con Windows. En celular Android
          a veces sí sale el modelo. En PC lo más preciso suele ser la GPU, el sistema, las IPs y el
          nombre de la cámara/micrófono después de aceptar el permiso.
        </p>
      </div>

      <h3 className="text-sm uppercase tracking-wide text-[var(--gold)]">Red e IP</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Dato label="IPv4 pública" value={visitor.publicIpv4 || red.ipv4Publica || visitor.publicIp} />
        <Dato label="IPv6 pública" value={visitor.publicIpv6 || red.ipv6Publica} />
        <Dato label="IP de la conexión al servidor" value={visitor.lastIp || servidor.ipSocket} />
        <Dato label="IPs locales (WebRTC)" value={visitor.localIps || red.ipsLocalesWebRTC} />
        <Dato label="Tipo de conexión" value={visitor.connectionType || red.conexion} />
        <Dato label="Bajada / latencia" value={red.bajadaMbps != null ? `${red.bajadaMbps} Mbps · ${red.latenciaMs} ms` : null} />
      </div>

      <h3 className="text-sm uppercase tracking-wide text-[var(--gold)]">Máquina y sistema</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Dato label="Modelo que sí entrega el navegador" value={visitor.deviceModel} />
        <Dato label="Sistema" value={`${visitor.deviceOs || ""} ${visitor.osVersion || sistema.osVersion || ""}`} />
        <Dato label="Arquitectura" value={visitor.architecture || sistema.arquitectura} />
        <Dato label="Núcleos CPU" value={visitor.cpuCores || maquina.nucleosCPU} />
        <Dato label="RAM aproximada (GB)" value={visitor.deviceMemoryGb || maquina.memoriaRAMAproxGB} />
        <Dato label="GPU" value={visitor.gpuRenderer || gpu.renderizador} />
        <Dato label="Proveedor GPU" value={visitor.gpuVendor || gpu.proveedor} />
        <Dato label="Plataforma" value={sistema.plataforma} />
      </div>

      <h3 className="text-sm uppercase tracking-wide text-[var(--gold)]">Navegador y pantalla</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Dato label="Navegador" value={visitor.browser} />
        <Dato label="User-Agent completo" value={visitor.lastUserAgent || visitor.browserVersion || navegador.nombreCompleto} />
        <Dato label="Idiomas" value={navegador.idiomas || visitor.language} />
        <Dato label="Zona horaria" value={visitor.timezone || sistema.zonaHoraria} />
        <Dato label="Pantalla física" value={pantalla.pantalla || `${visitor.screenWidth}×${visitor.screenHeight}`} />
        <Dato label="Ventana" value={pantalla.ventana} />
        <Dato label="Pixel ratio / color" value={pantalla.pixelRatio != null ? `${pantalla.pixelRatio} · ${pantalla.colorDepth} bits` : null} />
        <Dato label="Pistas de cliente (Chrome)" value={navegador.pistasCliente} />
      </div>

      <h3 className="text-sm uppercase tracking-wide text-[var(--gold)]">Cámara, micrófono y cabeceras</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Dato label="Dispositivos de audio/video" value={medios.etiquetas} />
        <Dato label="Conteo cámara / mic / parlantes" value={`${medios.camaras ?? "?"} / ${medios.microfonos ?? "?"} / ${medios.parlantes ?? "?"}`} />
        <Dato label="Nota de medios" value={medios.nota} />
        <Dato label="Client-Hint modelo (cabecera)" value={servidor.clientHintModelo} />
        <Dato label="Client-Hint plataforma" value={servidor.clientHintPlataforma} />
        <Dato label="Accept-Language" value={servidor.idiomaAceptado} />
      </div>
    </section>
  );
}
