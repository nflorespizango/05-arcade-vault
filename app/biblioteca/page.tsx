import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";

export const metadata: Metadata = {
  title: "Biblioteca · Arcade Vault",
  description: "Explora todos los juegos del Vault y elige cuál jugar.",
};

export default function LibraryPage() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>
      <LibraryClient />
    </div>
  );
}
