"use client";

// Client-side receipt list: search + kind filter over the server-rendered
// ledger rows is overkill; instead this wraps the existing static rows and
// hides non-matches by text content. Zero backend, works past 100 rows.
import { useEffect } from "react";

export function LedgerList({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const q = document.querySelector<HTMLInputElement>("[data-ledger-q]");
    const kinds = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-ledger-kind]"));
    const grid = document.getElementById("ledger-rows");
    if (!q || !grid) return;
    let kind = "all";
    const apply = () => {
      const needle = q.value.trim().toLowerCase();
      const rows = Array.from(grid.children) as HTMLElement[];
      let shown = 0;
      for (const row of rows) {
        const text = (row.textContent ?? "").toLowerCase();
        const rowKind = row.dataset.kind ?? "";
        const ok = (!needle || text.includes(needle)) && (kind === "all" || rowKind === kind);
        row.style.display = ok ? "" : "none";
        if (ok) shown += 1;
      }
      const empty = document.getElementById("ledger-empty");
      if (empty) empty.style.display = shown === 0 ? "" : "none";
      const count = document.getElementById("ledger-count");
      if (count) count.textContent = `${shown} of ${rows.length} receipts`;
    };
    const onQ = () => apply();
    q.addEventListener("input", onQ);
    const onKind = (e: Event) => {
      kind = (e.currentTarget as HTMLButtonElement).dataset.ledgerKind ?? "all";
      apply();
    };
    kinds.forEach((b) => b.addEventListener("click", onKind));
    apply();
    return () => {
      q.removeEventListener("input", onQ);
      kinds.forEach((b) => b.removeEventListener("click", onKind));
    };
  }, []);
  return <>{children}</>;
}
