// Reeve component kit. The ONLY source of UI primitives; screens import from
// here (query-before-create). Commodity shapes re-expressed on tokens; the
// writ + dials are bespoke (design.md signature). Zero raw hex rule applies.
import type { ReactNode } from "react";

export type Ink = "principal" | "agent";
export type Status = "pass" | "fail" | "pending" | "neutral";

const statusStyle: Record<Status, { bg: string; dot: string }> = {
  pass: { bg: "bg-[color:var(--status-success)]/10", dot: "bg-[color:var(--status-success)]" },
  fail: { bg: "bg-[color:var(--status-error)]/10", dot: "bg-[color:var(--status-error)]" },
  pending: { bg: "bg-[color:var(--status-pending)]/30", dot: "bg-[color:var(--status-pending)]" },
  neutral: { bg: "bg-[color:var(--bg-subtle)]", dot: "bg-[color:var(--status-neutral)]" },
};

export function StatusChip({ status, label }: { status: Status; label: string }) {
  const s = statusStyle[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 ${s.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      <span className="micro" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
    </span>
  );
}

/* The live dial: a clause limit as a physical gauge. Ink answers whose act
   the clause governs (principal gold / agent blue). Depletes as spend grows;
   the arc physically cannot pass full circle (escrow rule, hackathon-design
   signature catalog). */
export function LiveDial({
  label,
  used,
  cap,
  ink,
  format,
}: {
  label: string;
  used: number;
  cap: number;
  ink: Ink;
  format?: (n: number) => string;
}) {
  const pct = Math.min(used / cap, 1);
  const R = 26;
  const C = 2 * Math.PI * R;
  const color = ink === "principal" ? "var(--accent)" : "var(--agent)";
  const fmt = format ?? ((n: number) => n.toFixed(2));
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${label}: ${fmt(used)} of ${fmt(cap)}`}>
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--border-default)" strokeWidth="6" />
        <g transform={`rotate(-90 32 32)`}>
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${C * pct} ${C}`}
            strokeLinecap="butt"
          />
        </g>
        <text
          x="32"
          y="36"
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="13"
          fontWeight="700"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="micro">{label}</div>
        <div className="serial" style={{ color: "var(--text-primary)" }}>
          {fmt(used)} / {fmt(cap)}
        </div>
      </div>
    </div>
  );
}

export function ReceiptRow({
  ts,
  summary,
  detail,
  txHash,
  explorerTx,
  status,
}: {
  ts: string;
  summary: string;
  detail?: string;
  txHash?: string;
  explorerTx?: string;
  status: Status;
}) {
  return (
    <div className="desk-cell grid grid-cols-[7rem_1fr_auto] items-center gap-3 last:border-b-0">
      <span className="serial" style={{ color: "var(--text-muted)" }}>
        {ts}
      </span>
      <span className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
        {summary}
        {detail ? (
          <span className="caption"> · {detail}</span>
        ) : null}
      </span>
      <span className="flex items-center gap-3">
        {txHash && explorerTx ? (
          <a
            href={explorerTx}
            target="_blank"
            rel="noopener noreferrer"
            className="serial underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            {txHash.slice(0, 10)}…
          </a>
        ) : null}
        <StatusChip status={status} label={status === "pass" ? "done" : status === "fail" ? "refused" : "pending"} />
      </span>
    </div>
  );
}

/* Clause numbering in roman, employment-contract voice (design.md copy tone) */
export function Clause({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[color:var(--border-default)] px-5 py-4 first:border-t-0">
      <div className="flex items-baseline gap-3">
        <span className="serial" style={{ color: "var(--text-muted)" }}>
          {n}.
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </span>
      </div>
      <div className="mt-2 pl-7">{children}</div>
    </div>
  );
}
