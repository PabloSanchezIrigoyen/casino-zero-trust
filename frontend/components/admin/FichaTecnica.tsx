import { Children, type ReactNode } from "react";
import type { Visitor } from "@/lib/types";
import { formatShown, isEmptyValue } from "@/lib/visible";

function Dato({ label, value }: { label: string; value: unknown }) {
  if (isEmptyValue(value)) return null;
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-all text-sm">{formatShown(value)}</p>
    </div>
  );
}

function Bloque({ title, children }: { title: string; children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-[var(--gold)]">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{items}</div>
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
  const sistemaTxt = [visitor.deviceOs, visitor.osVersion || sistema.osVersion].filter(Boolean).join(" ");
  const pantallaFisica = pantalla.pantalla || (visitor.screenWidth ? `${visitor.screenWidth}×${visitor.screenHeight}` : null);
  const redBajada =
    red.bajadaMbps != null && red.latenciaMs != null ? `${red.bajadaMbps} Mbps · ${red.latenciaMs} ms` : red.bajadaMbps != null ? `${red.bajadaMbps} Mbps` : null;
  const gpuTxt = visitor.gpuRenderer || gpu.renderizador;
  const gpuVendor = visitor.gpuVendor || gpu.proveedor;
  const etiquetas = Array.isArray(medios.etiquetas) ? medios.etiquetas.filter(Boolean) : medios.etiquetas;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl">Ficha técnica</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Solo se muestran datos que el navegador sí entregó. Lo que no expone no aparece.
        </p>
      </div>

      <Bloque title="Red e IP">
        <Dato label="IPv4 pública" value={visitor.publicIpv4 || red.ipv4Publica || visitor.publicIp} />
        <Dato label="IPv6 pública" value={visitor.publicIpv6 || red.ipv6Publica} />
        {visitor.lastIp && visitor.lastIp !== (visitor.publicIpv4 || visitor.publicIp) ? (
          <Dato label="IP de la conexión al servidor" value={visitor.lastIp} />
        ) : null}
        <Dato label="IP local Wi‑Fi" value={visitor.localIps || red.ipsLocalesWebRTC} />
        <Dato label="IP pública + puerto (STUN)" value={red.ipsStunPublicas} />
        <Dato label="Tipo de conexión" value={visitor.connectionType || red.conexion} />
        <Dato label="Bajada / latencia" value={redBajada} />
      </Bloque>

      <Bloque title="Máquina y sistema">
        <Dato label="Modelo" value={visitor.deviceModel} />
        <Dato label="Sistema" value={sistemaTxt} />
        <Dato label="Arquitectura" value={visitor.architecture || sistema.arquitectura} />
        <Dato label="Núcleos CPU" value={visitor.cpuCores || maquina.nucleosCPU} />
        <Dato label="RAM aproximada (GB)" value={visitor.deviceMemoryGb || maquina.memoriaRAMAproxGB} />
        <Dato label="GPU" value={gpuTxt} />
        <Dato label="Proveedor GPU" value={gpuVendor && gpuVendor !== gpuTxt ? gpuVendor : null} />
        <Dato label="Plataforma" value={sistema.plataforma} />
      </Bloque>

      <Bloque title="Navegador y pantalla">
        <Dato label="Navegador" value={visitor.browser} />
        <Dato label="Idiomas" value={navegador.idiomas || visitor.language} />
        <Dato label="Zona horaria" value={visitor.timezone || sistema.zonaHoraria} />
        <Dato label="Pantalla" value={pantallaFisica} />
        <Dato label="Ventana" value={pantalla.ventana} />
        <Dato
          label="Pixel ratio / color"
          value={pantalla.pixelRatio != null ? `${pantalla.pixelRatio} · ${pantalla.colorDepth} bits` : null}
        />
      </Bloque>

      <Bloque title="Cámara y micrófono">
        <Dato label="Dispositivos" value={etiquetas} />
        <Dato label="Client-Hint modelo" value={servidor.clientHintModelo} />
        <Dato label="Client-Hint plataforma" value={servidor.clientHintPlataforma} />
      </Bloque>
    </section>
  );
}
