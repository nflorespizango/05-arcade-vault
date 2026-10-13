"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Retraso de la transición en ms, para escalonar tarjetas. */
  delay?: number;
  /** Para bloques puramente decorativos. */
  "aria-hidden"?: boolean;
}

// El HTML del servidor solo lleva `reveal` (contenido visible). Tras montar, el
// cliente añade `reveal-armed` (oculta) y `in` (muestra) al entrar al viewport.
// Las clases se manejan por ref, no por estado, para no depender del render y
// conservar `in` si Next oculta/reactiva la ruta con <Activity>.
export function Reveal({ children, className = "", delay, "aria-hidden": ariaHidden }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.classList.contains("in")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.classList.add("reveal-armed");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);

    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden={ariaHidden}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
