"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getMySynergyAction } from "@/app/actions/synergy-actions";

type Ctx = {
  points: number | null;
  setPoints: (n: number) => void;
  refresh: () => void;
};

const SynergyContext = createContext<Ctx | null>(null);
const KEY = "abtalks_synergy";
const TTL_MS = 60_000;

function readCache(): { n: number; t: number } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as { n: number; t: number }) : null;
  } catch {
    return null;
  }
}

export function SynergyProvider({ children }: { children: React.ReactNode }) {
  const [points, setPointsState] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    return readCache()?.n ?? null;
  });

  const writeCache = useCallback((n: number) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ n, t: Date.now() }));
    } catch {}
  }, []);

  const setPoints = useCallback(
    (n: number) => {
      setPointsState(n);
      writeCache(n);
    },
    [writeCache],
  );

  const refresh = useCallback(() => {
    void getMySynergyAction().then((res) => setPoints(res.points));
  }, [setPoints]);

  useEffect(() => {
    const cached = readCache();
    if (!cached || Date.now() - cached.t > TTL_MS) refresh();
  }, [refresh]);

  return (
    <SynergyContext.Provider value={{ points, setPoints, refresh }}>
      {children}
    </SynergyContext.Provider>
  );
}

export function useSynergy(): Ctx {
  const ctx = useContext(SynergyContext);
  if (!ctx) return { points: null, setPoints: () => {}, refresh: () => {} };
  return ctx;
}
