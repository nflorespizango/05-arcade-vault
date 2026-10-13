"use client";

import { useEffect, useState, type FormEvent } from "react";

const EMPTY = { name: "", email: "", msg: "" };

// Formulario solo visual: no envía nada a ningún sitio (fuera de alcance de la SPEC 02).
export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // La vibración dura 400 ms; el cleanup evita setState tras desmontar o re-enviar.
  useEffect(() => {
    if (!shake) return;
    const id = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(id);
  }, [shake]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      return;
    }
    setSent(form.name.trim());
  };

  const reset = () => {
    setSent(null);
    setForm(EMPTY);
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit} noValidate>
      {!sent ? (
        <>
          <div className="field">
            <label htmlFor="cf-name">NOMBRE</label>
            <input
              id="cf-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="cf-email">CORREO ELECTRÓNICO</label>
            <input
              id="cf-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="cf-msg">MENSAJE</label>
            <textarea
              id="cf-msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>
          <button className="btn xl press" type="submit" style={{ width: "100%" }}>
            ▶ ENVIAR MENSAJE
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={reset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
