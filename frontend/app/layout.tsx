import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { LabSessionProvider } from "@/context/LabSession";
import { SiteHeader } from "@/components/SiteHeader";
import { LabGate } from "@/components/LabGate";
import { ConsentBar } from "@/components/ConsentBar";
import { Toasts } from "@/components/Toasts";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Casino Zero Trust · Laboratorio ético",
  description: "Laboratorio WEB de privacidad, permisos y ciberseguridad. No es un sitio malicioso.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${sans.variable} ${serif.variable} font-[Outfit,sans-serif] antialiased`}>
        <LabSessionProvider>
          <SiteHeader />
          <LabGate />
          <Toasts />
          <ConsentBar />
          <main className="mx-auto min-h-[calc(100vh-80px)] max-w-6xl px-4 py-8">{children}</main>
        </LabSessionProvider>
      </body>
    </html>
  );
}
