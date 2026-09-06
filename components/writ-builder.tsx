"use client";

// The writ builder: the product's signature interaction. Edit the clauses,
// sign with a passkey (noncustodial), session registers in the Keystore.
// States per ui-craft: editing -> signing (pending on the control) -> granted
// (the success moment: serial + tx footer) / failed (inline, retry).
import { useState } from "react";
import { Clause, StatusChip } from "@/components/kit";
import type { Agent } from "@/lib/agents";

type Phase = "editing" | "signing" | "granted" | "failed";

export function WritBuilder({ agent }: { agent: Agent }) {
  const [cap, setCap] = useState(agent.defaultCap);
  const [days, setDays] = useState(7);
  const [phase, setPhase] = useState<Phase>("editing");
  const [result, setResult] = useState<{ id: string; tx: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sign() {
    setPhase("signing");
    setError(null);
    // Safety net: WebAuthn prompts can hang in embedded browsers. 45s max wait.
    const timeout = setTimeout(() => {
      setError("The signature request timed out. Nothing was signed. Try again.");
      setPhase("failed");
    }, 45_000);
    try {
      const res = await fetch("/api/writ/grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, cap, days }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? "the chain refused the grant");
      }
      clearTimeout(timeout);
      setResult({ id: body.id, tx: body.tx ?? null });
      setPhase("granted");
    } catch (e) {
      clearTimeout(timeout);
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("timed out")
          ? msg
          : `Signing did not reach the chain: ${msg.slice(0, 120)}. No funds moved. Try again.`,
      );
      setPhase("failed");
    }
  }

  if (phase === "granted" && result) {
    return (
      <div className="card p-6 text-center">
        <div className="flex justify-center">
          <StatusChip status="pass" label="writ in force" />
        </div>
        <p className="mt-4 text-lg font-semibold tracking-tight">The writ is registered onchain.</p>
        <p className="caption mt-2 text-pretty">
          {agent.name} may now work under clauses I to III. Every action lands in
          the receipt ledger below, and revocation stays one click away.
        </p>
        <div className="serial mt-4" style={{ color: "var(--text-muted)" }}>
          {result.id}
          {result.tx ? " · " + result.tx.slice(0, 18) + "…" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between px-6 pt-4">
        <span className="micro">Writ of limits · {agent.writTitle}</span>
        <span className="serial" style={{ color: "var(--text-muted)" }}>
          {agent.address.slice(0, 10)}…{agent.address.slice(-6)}
        </span>
      </div>
      <div className="mt-4">
        <Clause n="I" title="What it may do">
          <p className="text-sm text-pretty" style={{ color: "var(--text-primary)" }}>
            {agent.writPlain}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {agent.scopes.map((t) => (
              <span key={t} className="rounded-[var(--radius-pill)] border border-[color:var(--border-default)] px-2.5 py-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {t}
              </span>
            ))}
            <span className="rounded-[var(--radius-pill)] border border-[color:var(--border-strong)] px-2.5 py-1 text-xs" style={{ color: "var(--status-error)" }}>
              everything else · refused
            </span>
          </div>
        </Clause>
        <Clause n="II" title="Daily spend cap">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10000}
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
              disabled={phase === "signing"}
              className="input max-w-32"
              aria-label="Daily spend cap"
            />
            <span className="caption">USDT per day · enforced onchain</span>
          </div>
        </Clause>
        <Clause n="III" title="Expiry">
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                disabled={phase === "signing"}
                className="btn text-sm"
                style={
                  days === d
                    ? { background: "var(--accent)", color: "var(--accent-foreground)", border: "1px solid var(--accent-press)" }
                    : { background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-primary)" }
                }
              >
                {d} days
              </button>
            ))}
          </div>
        </Clause>
        <div className="border-t border-[color:var(--border-default)] px-6 py-4">
          {error && (
            <p className="caption mb-3" style={{ color: "var(--status-error)" }} role="alert">
              {error}
            </p>
          )}
          <button onClick={sign} disabled={phase === "signing"} className="btn btn-primary w-full">
            {phase === "signing"
              ? "Registering the session onchain…"
              : `Sign the writ · cap ${cap} USDT · ${days} days`}
          </button>
          <p className="caption mt-3 text-pretty">
            Signing locks these rules onchain with the demo operator key and
            registers a scoped session in the Keystore. Revocation stays one
            click; self-custodied passkey signing lands at the mainnet cutover.
          </p>
        </div>
      </div>
    </div>
  );
}
