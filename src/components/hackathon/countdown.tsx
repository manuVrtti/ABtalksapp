"use client";

import { useEffect, useState } from "react";

export function Countdown({ targetIso }: { targetIso: string }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    setMounted(true);
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-1 sm:gap-3">
      {mounted ? (
        <>
          <Unit val={pad(time.d)} label="Days" />
          <Sep />
          <Unit val={pad(time.h)} label="Hrs" />
          <Sep />
          <Unit val={pad(time.m)} label="Min" />
          <Sep />
          <Unit val={pad(time.s)} label="Sec" />
        </>
      ) : (
        <>
          <Unit val="--" label="Days" />
          <Sep />
          <Unit val="--" label="Hrs" />
          <Sep />
          <Unit val="--" label="Min" />
          <Sep />
          <Unit val="--" label="Sec" />
        </>
      )}
    </div>
  );
}

function Unit({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1.5">
      <div
        className="flex min-w-[36px] items-center justify-center rounded-lg border border-[#1E1B37] px-1.5 py-1 shadow-[0_4px_10px_rgba(0,0,0,0.1)] sm:min-w-[64px] sm:rounded-xl sm:px-3 sm:py-2.5"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(118, 74, 194, 1) 0%, rgba(62, 34, 111, 1) 50%, rgba(0, 0, 0, 1) 100%)",
        }}
      >
        <span
          className="text-sm font-bold tabular-nums tracking-tight text-white sm:text-2xl"
          style={{ fontFamily: "var(--font-hackathon-mono), monospace" }}
        >
          {val}
        </span>
      </div>
      <span className="text-[7px] font-semibold uppercase tracking-[0.12em] text-[#BCBCBC] sm:text-[9px] sm:tracking-[0.16em]">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span className="-mt-3 text-sm font-light text-[#7364E6]/50 sm:-mt-4 sm:text-xl">
      :
    </span>
  );
}
