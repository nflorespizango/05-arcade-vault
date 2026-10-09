"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// localStorage["av_user"]   -> { name: string } | ausente (invitado)
// localStorage["av_scores"] -> { game, score, name, at }[]
const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const DEFAULT_NAME = "PLAYER1";
const MAX_NAME_LENGTH = 10;

export interface SessionUser {
  name: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

interface SessionContextValue {
  user: SessionUser | null;
  login: (name: string) => void;
  logout: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Mayúsculas, máximo 10 caracteres, por defecto PLAYER1.
function normalizeName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.trim().toUpperCase().slice(0, MAX_NAME_LENGTH) : "";
  return name || DEFAULT_NAME;
}

function readUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "name" in parsed) {
      return { name: normalizeName(parsed.name) };
    }
  } catch {
    // localStorage no disponible o JSON corrupto: se opera como invitado.
  }
  return null;
}

function readScores(): SavedScore[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedScore[]) : [];
  } catch {
    return [];
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Estado inicial neutro (invitado) igual en servidor y cliente; el
  // almacenamiento se lee después de hidratar para evitar desajustes.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(readUser());
  }, []);

  const login = useCallback((name: string) => {
    const next = { name: normalizeName(name) };
    setUser(next);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      // Sin persistencia: la sesión dura lo que dure la pestaña.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Nada que limpiar.
    }
  }, []);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const list = readScores();
      list.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(list));
    } catch {
      // La puntuación no se guarda si el almacenamiento falla.
    }
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, saveScore }),
    [user, login, logout, saveScore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
