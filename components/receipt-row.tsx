"use client";

import { useState, type ReactNode } from "react";
import { StatusChip, type Status } from "./kit";

export function ReceiptRow({
  ts,
  summary,
  detail,
  txHash,
  explorerTx,
  status,
  kind,
}: {
  ts: string;
  summary: string;
  detail?: string;
  txHash?: string;
  explorerTx?: string;
  status: Status;
  kind?: string;
}) {
  const [open, setOpen] = useState(false);
  const chip = kind === "refusal" ? { status: "fail" as Status, label: "refused" }
    : status === "pass" ? { status: "pass" as Status, label: "done" }
    : { status, label: status };
  return (
    <div className="desk-cell grid grid-cols-[7rem_1fr_auto] items-center gap-3 last:border-b-0">
      <span className="serial" style={{ color: "var(--text-muted)" }}>
        {ts}
      </span>
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-left"
        aria-expanded={open}
        title={summary}
      >
        <span className={open ? "block text-sm" : "block truncate text-sm"} style={{ color: "var(--text-primary)" }}>
          {summary}
        </span>
        {detail ? (
          <span className={open ? "caption block" : "caption block truncate"}> · {detail}</span>
        ) : null}
      </button>
      <span className="flex items-center gap-3">
        {txHash && explorerTx ? (
          <a
            href={explorerTx}
            target="_blank"
            rel="noopener noreferrer"
            className="serial underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {txHash.slice(0, 10)}…
          </a>
        ) : null}
        <StatusChip status={chip.status} label={chip.label} />
      </span>
    </div>
  );
}
