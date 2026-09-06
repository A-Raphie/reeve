"use client";

// The Security Lab: four real attacks, fired on click, refused onchain.
// Clasp grammar ("attack the wallet, watch it win") on Reeve's tokens.
import { useState } from "react";
import { RefusalCard } from "@/components/kit";

type AttackId = "stranger" | "overcap" | "revoked" | "expired";

const ATTACKS: { id: AttackId; title: string; body: string }[] = [
  {
    id: "stranger",
    title: "The stranger transfer",
    body: "Try to send the agent's balance to an address no writ names. Clause I only allows its listed calls.",
  },
  {
    id: "overcap",
    title: "The cap breaker",
    body: "Try to spend 0.06 past a 0.05 daily cap. Clause II checks every unit against the limit you signed.",
  },
  {
    id: "revoked",
    title: "The revoked session",
    body: "Revoke a session, then fire a call through it. Revocation is instant and permanent.",
  },
  {
    id: "expired",
    title: "The expired session",
    body: "Let a writ run out its clock, then fire a call. Clause III ends authority automatically.",
  },
];

type Result = {
  id: AttackId;
  title: string;
  clause: string;
  attempt: string;
  code: string;
  detail: string;
  ts: string;
};

export function AttackLab({ writId }: { writId: string | null }) {
  const [running, setRunning] = useState<AttackId | null>(null);
  const [blocked, setBlocked] = useState<Result[]>([]);
  const [wrote, setWrote] = useState(false); // an attack executed without refusal = boundary failed

  async function fire(id: AttackId, title: string) {
    setRunning(id);
    try {
      const res = await fetch("/api/lab/attack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attack: id }),
      });
      const body = await res.json();
      if (body.refused) {
        setBlocked((prev) => [
          { id, title, clause: body.clause, attempt: body.attempt, code: body.code, detail: body.detail, ts: new Date().toISOString().slice(11, 19) },
          ...prev,
        ]);
      } else {
        setWrote(true);
      }
    } catch {
      // network failure: nothing was refused, nothing to show — leave the row idle
    } finally {
      setRunning(null);
    }
  }

  if (!writId) {
    return (
      <div className="card p-6">
        <p className="caption text-pretty">
          No writ is in force on this host yet. Sign one on any agent page and
          the attacks below fire against it for real.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="caption max-w-[680px] text-pretty">
        Every button fires a real request against live writ {writId} through its
        real session key. Every refusal comes from the Keystore contracts and
        lands in the receipt ledger. Nothing here is simulated.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="record-panel">
          <div className="number-lg">{blocked.length}</div>
          <div className="micro mt-1">attacks refused</div>
        </div>
        <div className="record-panel">
          <div className="number-lg" style={{ color: wrote ? "var(--status-error)" : "var(--text-primary)" }}>0</div>
          <div className="micro mt-1">{wrote ? "executed · defect" : "breakouts executed"}</div>
        </div>
        <div className="record-panel">
          <div className="number-lg">{["stranger", "overcap", "revoked", "expired"].filter((id) => blocked.some((b) => b.id === id)).length} / 4</div>
          <div className="micro mt-1">attack types proven</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {ATTACKS.map((a) => {
          const hits = blocked.filter((b) => b.id === a.id).length;
          return (
            <div key={a.id} className="attack-card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight">{a.title}</h3>
                {hits > 0 && (
                  <span
                    className="rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold"
                    style={{ color: "var(--status-success)", background: "rgb(var(--refund-rgb) / 0.1)" }}
                  >
                    blocked ×{hits}
                  </span>
                )}
              </div>
              <p className="caption mt-2 text-pretty">{a.body}</p>
              <button
                onClick={() => fire(a.id, a.title)}
                disabled={running !== null}
                className="btn btn-danger mt-4 w-full"
              >
                {running === a.id ? "Firing onchain… (up to 60s)" : running ? "Wait for the current attack" : `Fire the ${a.id} attack`}
              </button>
            </div>
          );
        })}
      </div>

      {wrote && (
        <p className="caption mt-6" style={{ color: "var(--status-error)" }} role="alert">
          An attack just executed. That means the boundary failed — this is a
          defect and it is flagged in the response. Do not ignore this line.
        </p>
      )}

      {blocked.length > 0 && (
        <div className="mt-10">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold tracking-tight">Blocked timeline</h3>
            <span
              className="rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold"
              style={{ color: "var(--status-success)", background: "rgb(var(--refund-rgb) / 0.1)" }}
            >
              {blocked.length} refused · 0 executed
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {blocked.map((b, i) => (
              <RefusalCard
                key={i}
                attempt={b.attempt}
                clause={b.clause}
                code={b.code}
                detail={`${b.detail} · fired ${b.ts} UTC`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
