"use client";

// Runtime chain display: the server prerenders the CHAIN=testnet text at build
// time; on mount this swaps to the runtime truth from /api/chain. After the
// mainnet cutover the env var flips and every label follows without a copy edit.
import { useEffect, useState } from "react";

type ChainInfo = { short: string; origin: string };

export function ChainBits({ short, origin, as }: { short?: string; origin: string; as?: "origin" | "header" | "pill" }) {

  const [live, setLive] = useState<ChainInfo | null>(null);
  useEffect(() => {
    fetch("/api/chain", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && j.short && j.short !== (short ?? "")) setLive({ short: j.short, origin: j.origin });
      })
      .catch(() => null);
  }, [short]);
  if (as === "origin") {
    return (
      <p className="caption mt-3 text-pretty">
        {live ? live.origin : origin}
      </p>
    );
  }
  if (as === "pill") {
    const main = live ? live.short === "BSC MAINNET" : short === "BSC MAINNET";
    return (
      <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[color:var(--border-default)] px-3 py-1">
        <span className="live-dot" aria-hidden />
        <span className="serial" style={{ color: "var(--text-primary)" }}>
          {main ? "MAINNET LIVE · AGENTS EXECUTING" : "TESTNET LIVE · AGENTS ARMING"}
        </span>
      </span>
    );
  }
  if (as === "header") {
    return (
      <span className="micro hidden md:inline">
        {live ? "BNB Smart Chain" : short === "BSC MAINNET" ? "BNB Smart Chain" : "BNB Smart Chain Testnet"}
      </span>
    );
  }
  return (
    <span>
      CHAIN · <strong>{live ? live.short : short}</strong>
    </span>
  );
}

