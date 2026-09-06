import { notFound } from "next/navigation";
import { AGENTS, AGENT_LIST, type AgentId } from "@/lib/agents";
import { readReceipts, writFor } from "@/lib/ledger";
import { EXPLORER_ADDR, EXPLORER_TX, NETWORK } from "@/lib/chain.mjs";
import { Clause, CountUp, LiveDial, ReceiptRow, StatusChip } from "@/components/kit";
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

      <main className="mx-auto relative w-full max-w-6xl flex-1 px-6">
        <span className="corner-serial hidden sm:block">REEVE/{agent.id.toUpperCase()} · {writ ? writ.id : "NO-WRIT"}</span>
        {/* Identity + measured record */}
        <section className="grid gap-12 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="micro">{agent.name} · {agent.category} · {agent.protocols}</span>
              <span className="rounded-[var(--radius-pill)] border border-[color:var(--border-default)] px-2.5 py-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                provenance · {writ ? "writ-verified" : "live wallet"}
              </span>
            </div>
            <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em] text-balance">{agent.job}</h1>
            <p className="caption mt-4 max-w-[560px] text-lg text-pretty">{agent.does}.</p>
            <p className="caption mt-6 max-w-[560px] text-base leading-7 text-pretty">
              {agent.strategy}
            </p>
            <div className="mt-8 max-w-[560px]">
              <div className="section-header">
                <span className="section-num">✓</span>
                <span className="section-label">What has been established</span>
              </div>
              <ul className="mt-3 space-y-2">
                {agent.established.map((e) => (
                  <li key={e} className="flex gap-2 text-sm text-pretty" style={{ color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--status-success)" }}>·</span>{e}
                  </li>
                ))}
              </ul>
              <div className="section-header mt-6">
                <span className="section-num" style={{ color: "var(--text-muted)" }}>—</span>
                <span className="section-label">What has not</span>
              </div>
              <ul className="mt-3 space-y-2">
                {agent.notEstablished.map((e) => (
                  <li key={e} className="flex gap-2 text-sm text-pretty" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>·</span>{e}
                  </li>
                ))}
              </ul>
            </div>
            <p className="micro mt-8">
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
            <div className="record-panel mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <CountUp value={actions} className="block text-7xl font-bold tracking-[-0.04em] tabular-nums" />
                  <div className="micro mt-2">{actions === 1 ? "action taken" : "actions taken"}</div>
                </div>
                <div>
                  <CountUp value={checks} className="block text-7xl font-bold tracking-[-0.04em] tabular-nums" />
                  <div className="micro mt-2">{checks === 1 ? "round checked" : "rounds checked"}</div>
                </div>
                <div>
                  <CountUp value={refusals} className="block text-7xl font-bold tracking-[-0.04em] tabular-nums" />
                  <div className="micro mt-2">{refusals === 1 ? "call refused" : "calls refused"}</div>
                </div>
              </div>
              <div className="mt-5 border-t border-[color:var(--border-default)] pt-4">
                <p className="text-sm font-semibold text-pretty" style={{ color: "var(--text-primary)" }}>
                  {refusals > 0 ? (
                    <>
                      Clean boundary:{" "}
                      <span className="act-agent">{refusals}</span> out-of-writ{" "}
                      {refusals === 1 ? "call" : "calls"} refused by the chain ·{" "}
                      <span className="act-principal">{actions}</span> executed
                      inside your limits.
                    </>
                  ) : actions + checks > 0 ? (
                    <>
                      Every action so far stayed inside the writ. {checks}{" "}
                      {checks === 1 ? "round" : "rounds"} checked on schedule.
                    </>
                  ) : (
                    <>
                      Numbers land as the agent runs. Checks are free reads;
                      actions are onchain and receipted.
                    </>
                  )}
                </p>
                <p className="caption mt-2 text-pretty">
                  Every number above is a real onchain event, receipted against the writ that authorized it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-12 border-t border-[color:var(--border-default)] py-16 lg:grid-cols-[1fr_1fr]">
          {/* Writ panel: current writ or the builder */}
          <div>
            <span className="micro">Authority</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {writ ? "Working under your rules" : "Hire: set the rules it works under"}
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
          <span className="micro text-right">
            BSC testnet · no mainnet claim · no wallet needed to read
          </span>
        </div>
      </footer>
    </div>
  );
}
