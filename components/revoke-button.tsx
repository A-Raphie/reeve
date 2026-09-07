"use client";

import { useState } from "react";

export function RevokeButton({ writId, agentName }: { writId: string; agentName: string }) {
  const [phase, setPhase] = useState<"idle" | "confirm" | "working" | "void">("idle");
  const [error, setError] = useState<string | null>(null);

  if (phase === "void") {
    return (
      <p className="caption" style={{ color: "var(--status-error)" }}>
        This writ is void. The agent's authority ended with the revoke
        transaction. The ledger below shows the revocation receipt.
      </p>
    );
  }

  if (phase === "confirm") {
    return (
      <div className="border-t border-[color:var(--border-default)] px-6 py-4">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Void this writ? {agentName}'s authority ends immediately — mid-round if needed.
        </p>
        <div className="mt-3 flex gap-3">
          <button onClick={async () => {
            setPhase("working");
            setError(null);
            const res = await fetch("/api/writ/void", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id: writId }),
            });
            const body = await res.json();
            if (!res.ok || !body.ok) {
              setError(body.error ?? "revoke failed");
              setPhase("confirm");
              return;
            }
            setPhase("void");
            setTimeout(() => window.location.reload(), 1500);
          }} disabled={false} className="btn bg-[color:var(--status-error)] text-white">
            Yes, void it now
          </button>
          <button onClick={() => setPhase("idle")} className="btn btn-ghost">
            Keep it in force
          </button>
        </div>
        {error && <p className="caption mt-2" style={{ color: "var(--status-error)" }} role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border-t border-[color:var(--border-default)] px-6 py-4">
      <button onClick={() => setPhase("confirm")} className="btn btn-ghost w-full">
        Revoke this writ · 1 click
      </button>
    </div>
  );
}
