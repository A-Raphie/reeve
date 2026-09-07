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

/* Structured rejection (beui/Clasp grammar): a refusal is the system working,
   so it renders as a machine-readable card with the cited clause, never as an error. */
export function RefusalCard({
  attempt,
  clause,
  code,
  detail,
}: {
  attempt: string;
  clause: string;
  code: string;
  detail: string;
}) {
  return (
    <div className="card p-4" style={{ borderColor: "rgb(var(--accent-rgb) / 0.4)" }}>
      <div className="flex items-center justify-between gap-3">
        <span className="micro" style={{ color: "var(--status-error)" }}>refused before broadcast</span>
        <span className="serial">{code}</span>
      </div>
      <p className="mt-2 text-sm text-pretty" style={{ color: "var(--text-primary)" }}>{attempt}</p>
      <div className="mt-3 border-t border-[color:var(--border-default)] pt-3">
        <div className="micro" style={{ fontSize: "0.625rem" }}>clause that refused it</div>
        <div className="serial mt-1" style={{ color: "var(--text-primary)" }}>{clause}</div>
        <div className="caption mt-2 text-pretty">{detail}</div>
      </div>
    </div>
  );
}

/* Count-up numeral (transitions.dev number-pop grammar): tabular, interruptible
   via reduced-motion, settles fast (700ms) so it never blocks reading. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: "tabular-nums",
        animation: "number-pop 700ms cubic-bezier(0.32, 0.72, 0, 1) both",
      }}
    >
      {value}
    </span>
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
  children: React.ReactNode;
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
