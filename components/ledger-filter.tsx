"use client";

// Ledger search + kind filter: receipts stay readable past ~100 rows.
// Client-side only (the ledger is static JSON), no backend needed.
import { useState } from "react";

export function LedgerFilter() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search receipts, e.g. revoked"
        aria-label="Search receipts"
        className="input max-w-64"
        data-ledger-q
      />
      <div className="flex gap-2" role="group" aria-label="Filter by kind">
        {["all", "check", "action", "refusal"].map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            data-ledger-kind={k}
            aria-pressed={kind === k}
            className="btn text-sm"
            style={
              kind === k
                ? { background: "var(--accent)", color: "var(--accent-foreground)", border: "1px solid var(--accent-press)" }
                : { background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-primary)" }
            }
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
