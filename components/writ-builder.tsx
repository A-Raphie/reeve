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
    try {
      const [{ createClient, createPrivateKeySigner, serializeSession }, { NETWORK }] = await Promise.all([
        import("@altananetwork/sdk"),
        import("@/lib/chain.mjs"),
      ]);
      const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });

      // The delegator's own passkey wallet: noncustodial, created in this browser.
      const wallet = await client.createPasskeyWallet({ name: "Reeve" });
      const sessionSigner = createPrivateKeySigner();

      const expiry = Math.floor(Date.now() / 1000) + days * 24 * 3600;
      const grant = await client.grantSession({
        wallet,
        signer: wallet.signer,
        sessionSigner,
        permissions: {
          calls: [{ to: agent.address as `0x${string}` }],
          spend: [{ limit: BigInt(Math.floor(cap)) * 10n ** 18n, period: "day" }],
        },
        expiry,
        register: true,
      });

      const id = `RW-${Date.now().toString(36).toUpperCase()}`;
      const session = serializeSession(grant);
      await fetch("/api/writ", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          id,
          session,
          sessionKey: sessionSigner._privateKey,
          tx: grant.transactionHash ?? null,
        }),
      }).catch(() => null); // ledger index defers gracefully on read-only hosts

      setResult({ id, tx: grant.transactionHash ?? null });
      setPhase("granted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("NotAllowed")
          ? "The passkey prompt was dismissed. Nothing was signed; try again when ready."
          : "Signing failed before anything reached the chain. No funds moved. Try again.",
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
            {phase === "signing" ? "Waiting for your passkey…" : `Sign the writ · cap ${cap} USDT · ${days} days`}
          </button>
          <p className="caption mt-3 text-pretty">
            Signing locks in these rules onchain. Your keys stay yours, and you
            can cancel the agent any time with one click.
          </p>
        </div>
      </div>
    </div>
  );
}
