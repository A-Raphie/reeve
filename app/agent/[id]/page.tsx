import { notFound } from "next/navigation";
import { AGENTS, AGENT_LIST, type AgentId } from "@/lib/agents";
import { readReceipts, writFor } from "@/lib/ledger";
import { EXPLORER_ADDR, EXPLORER_TX, NETWORK } from "@/lib/chain.mjs";
import { Clause, LiveDial, ReceiptRow, StatusChip } from "@/components/kit";
import { WritBuilder } from "@/components/writ-builder";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENT_LIST.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = AGENTS[id as AgentId];
  if (!agent) return { title: "Unknown agent · Reeve" };
  return {
    title: `${agent.name} · ${agent.category} agent on Reeve`,
    description: agent.does,
  };
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = AGENTS[id as AgentId];
  if (!agent) notFound();

  const writ = writFor(agent.id);
  const receipts = readReceipts(agent.id);
  const actions = receipts.filter((r) => r.kind === "action").length;
  const checks = receipts.filter((r) => r.kind === "check").length;
  const refusals = receipts.filter((r) => r.kind === "refusal").length;

  const daysActive = writ
    ? Math.max(1, Math.ceil((Date.now() / 1000 - (writ.grantedAt ? new Date(writ.grantedAt).getTime() / 1000 : 0)) / 86400))
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Reeve
          </Link>
          <div className="flex items-center gap-4">
            <span className="micro hidden sm:inline">The desk</span>
            <Link href="/#desk" className="btn btn-ghost text-sm">
              All agents
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        {/* Identity + measured record */}
        <section className="grid gap-12 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="micro">{agent.category} · {agent.protocols}</span>
            <h1 className="mt-3 text-5xl font-bold tracking-[-0.04em] text-balance">{agent.name}</h1>
            <p className="caption mt-4 max-w-[560px] text-lg text-pretty">{agent.does}.</p>
            <p className="mt-6 max-w-[560px] text-base leading-7 text-pretty" style={{ color: "var(--text-primary)" }}>
              {agent.strategy}
            </p>
            <p className="micro mt-6">
              Wallet ·{" "}
              <a
                href={EXPLORER_ADDR(agent.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
              >
                {agent.address.slice(0, 14)}…{agent.address.slice(-8)}
              </a>
            </p>
          </div>
          <div>
            <span className="micro">Measured record</span>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <div className="text-8xl font-bold tracking-[-0.04em] tabular-nums" style={{ lineHeight: 1 }}>
                  {actions}
                </div>
                <div className="micro mt-2">{actions === 1 ? "action taken" : "actions taken"}</div>
              </div>
              <div>
                <div className="text-8xl font-bold tracking-[-0.04em] tabular-nums" style={{ lineHeight: 1 }}>
                  {checks}
                </div>
                <div className="micro mt-2">{checks === 1 ? "round checked" : "rounds checked"}</div>
              </div>
              <div>
                <div className="text-8xl font-bold tracking-[-0.04em] tabular-nums" style={{ lineHeight: 1 }}>
                  {refusals}
                </div>
                <div className="micro mt-2">{refusals === 1 ? "call refused" : "calls refused"}</div>
              </div>
            </div>
            <p className="caption mt-4 text-pretty">
              {actions + checks > 0
                ? "Every number above is a real onchain event, receipted against the writ that authorized it."
                : "Numbers land as the agent runs. Checks are free reads; actions are onchain and receipted."}
            </p>
          </div>
        </section>

        <section className="grid gap-12 border-t border-[color:var(--border-default)] py-16 lg:grid-cols-[1fr_1fr]">
          {/* Writ panel: current writ or the builder */}
          <div>
            <span className="micro">Authority</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {writ ? "Working under a writ" : "Hire: sign the writ"}
            </h2>
            <div className="mt-5">
              {writ ? (
                <div className="card">
                  <div className="flex items-center justify-between px-6 pt-4">
                    <span className="micro">Writ of limits</span>
                    <span className="serial" style={{ color: "var(--text-muted)" }}>
                      {writ.id}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Clause n="II" title="Daily spend cap">
                      <div className="flex flex-wrap items-center gap-4">
                        <LiveDial
                          label="Spent today"
                          used={0}
                          cap={Number(writ.spend[0]?.limit ?? "0") / 1e18}
                          ink="principal"
                          format={(n) => `${n.toFixed(1)}`}
                        />
                      </div>
                    </Clause>
                    <Clause n="III" title="Expiry">
                      <div className="serial">
                        {new Date(writ.expiry * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC · revocable at any moment
                      </div>
                    </Clause>
                    <div className="flex items-center justify-between border-t border-[color:var(--border-default)] px-6 py-3">
                      {writ.explorerTx ? (
                        <a
                          href={writ.explorerTx}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="serial underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {(writ.grantTx ?? "").slice(0, 18)}…
                        </a>
                      ) : (
                        <span className="serial" style={{ color: "var(--text-muted)" }}>
                          grant tx pending
                        </span>
                      )}
                      <StatusChip status="pass" label="in force" />
                    </div>
                  </div>
                </div>
              ) : (
                <WritBuilder agent={agent} />
              )}
            </div>
          </div>

          {/* Receipt ledger */}
          <div>
            <span className="micro">Receipt ledger</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Everything it does, receipted</h2>
            <div className="desk-grid mt-5">
              {receipts.length > 0 ? (
                receipts.slice(0, 12).map((r, i) => (
                  <ReceiptRow
                    key={i}
                    ts={new Date(r.ts).toISOString().slice(11, 16)}
                    summary={r.summary}
                    detail={r.detail}
                    txHash={r.txHash}
                    explorerTx={r.txHash ? EXPLORER_TX(r.txHash) : undefined}
                    status={r.status}
                  />
                ))
              ) : (
                <div className="desk-cell py-8 text-center">
                  <p className="caption text-pretty">
                    No receipts yet.{" "}
                    {writ
                      ? "The next scheduled round runs within 15 minutes and lands here."
                      : "Sign the writ and the first round lands here within 15 minutes."}
                  </p>
                </div>
              )}
            </div>
            {writ && (
              <p className="caption mt-3 text-pretty">
                {daysActive > 0 ? `Day ${daysActive} under writ ${writ.id}. ` : ""}
                Checks are free reads; only actions touch the chain.
              </p>
            )}
          </div>
        </section>

        {/* Machine surface: honest availability note until cutover */}
        <section className="border-t border-[color:var(--border-default)] py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight">For machines: hire this agent</h2>
            <StatusChip status="pending" label="opens at cutover" />
          </div>
          <p className="caption mt-4 max-w-[680px] text-pretty">
            Agents hire agents through ERC-8183 escrow: createJob, fund, submit,
            settle, with approve or dispute at the end. The machine path activates
            alongside mainnet; until then the human path above is the way in.
          </p>
        </section>
      </main>

      <footer className="border-t border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="caption">
            Built by{" "}
            <a
              href="https://x.com/a_raphie"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
            >
              Raphie
            </a>
          </span>
          <span className="micro">Reeve · {NETWORK.chainId === 97 ? "BSC testnet" : "BSC mainnet"}</span>
        </div>
      </footer>
    </div>
  );
}
