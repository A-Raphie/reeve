import { CHAIN_LABEL, EXPLORER } from "@/lib/chain.mjs";
import { liveWrit, readReceipts } from "@/lib/ledger";
import { Clause, LiveDial, StatusChip } from "@/components/kit";
import { TaglineReveal } from "@/components/reveal";
import Link from "next/link";

const CATEGORIES = [
  { id: "rebalancer", name: "Rebalancing", does: "Manages LP ranges, resets positions automatically", where: "PancakeSwap V3" },
  { id: "grid", name: "Grid Trading", does: "Places and manages automated grid orders", where: "PancakeSwap" },
  { id: "yield", name: "Yield Optimisation", does: "Routes liquidity to the highest available APR", where: "Venus · Aave · Lista" },
  { id: "guard", name: "Health Factor Monitoring", does: "Protects lending positions from liquidation", where: "Venus · Aave" },
];

const STATS = [
  { n: "200,000+", label: "agents registered on BNB Chain", detail: "The marketplace to hire them did not exist. That is the brief." },
  { n: "3", label: "clauses between you and a rogue agent", detail: "Call allowlist · daily spend cap · expiry. All checked onchain." },
  { n: "1", label: "transaction to revoke everything", detail: "No exit queues, no lockups. Authority dies instantly, mid-round if needed." },
  { n: "0", label: "keys ever held by the platform", detail: "Sessions are noncustodial scoped keys on your own wallet. Nothing to withdraw from." },
];

const STEPS = [
  { n: "1", title: "Sign the writ", body: "Set the call allowlist, the daily spend cap, and the expiry. The session key registers in the Keystore: your limits become onchain fact, not a promise." },
  { n: "2", title: "The agent works inside it", body: "Every action is checked against your writ and receipted. Outside the writ, the call is refused onchain, with the clause that refused it cited." },
  { n: "3", title: "Revoke the moment you want", body: "One transaction, effective immediately. The agent's authority ends mid-action if it has to, and nothing waits for anyone's approval." },
];

const BENEFITS = [
  { title: "Your rules, enforced by the chain", body: "Allowlist, spend cap, and expiry live in the Keystore contracts. An agent cannot exceed what you signed, even if it tries." },
  { title: "Revoke is one transaction", body: "The grant dies instantly and takes effect mid-round. No support tickets, no waiting periods." },
  { title: "Records are measured, not promised", body: "What it did, when, at what cost, against which writ. The receipts are public and inspectable." },
  { title: "You never lose custody", body: "Sessions are scoped keys on your own wallet. The platform holds nothing." },
];

const FAQ = [
  { q: "Which chain does this run on?", a: "BNB Smart Chain. The build executes on testnet while the agents are arming and cuts over to mainnet when they do; every receipt links to its transaction." },
  { q: "Do I keep custody of my funds?", a: "Yes. A writ grants a scoped session key on your own wallet: specific calls, a spend cap, an expiry. The platform never holds funds, and you can revoke in one transaction." },
  { q: "What actually stops the agent from overspending?", a: "The Keystore contracts check the writ onchain before the call executes. A call outside the allowlist, or spend past the cap, reverts with the clause that refused it." },
  { q: "What happens when the cap runs out?", a: "The agent's next call is refused onchain and the writ records the refusal. You can raise the cap by signing a fresh writ; the old one stays void." },
  { q: "What does hiring an agent cost?", a: "Gas only. A full grant, execute, and revoke cycle costs a few cents at normal BSC gas prices, and every fee is visible on the receipt." },
  { q: "How is an agent's performance measured?", a: "The Agent Advantage Report runs real tasks with and without the agent and reports time, cost, and output quality, with the actual outputs attached." },
];

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="section-header">
      <span className="section-num">{num} /</span>
      <span className="section-label">{label}</span>
    </div>
  );
}

function StatusReadout({ live }: { live: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[color:var(--border-default)] px-6 py-3">
      <div>
        <div className="micro" style={{ fontSize: "0.625rem" }}>this writ</div>
        <div className="serial" style={{ color: live ? "var(--status-success)" : "var(--text-muted)" }}>
          {live ? "IN FORCE" : "SPECIMEN"}
        </div>
      </div>
      <div>
        <div className="micro" style={{ fontSize: "0.625rem" }}>your limits</div>
        <div className="serial">ENFORCED ONCHAIN</div>
      </div>
      <div>
        <div className="micro" style={{ fontSize: "0.625rem" }}>it can spend</div>
        <div className="serial">UP TO 50 USDT / DAY</div>
      </div>
      <div>
        <div className="micro" style={{ fontSize: "0.625rem" }}>take it back</div>
        <div className="serial">ANY TIME · 1 CLICK</div>
      </div>
    </div>
  );
}

function WritPanel() {
  const writ = liveWrit();
  if (writ) {
    const days = Math.max(0, Math.floor((writ.expiry * 1000 - Date.now()) / 86400000));
    return (
      <div className="card relative" aria-label="Live writ">
        <div className="flex items-center justify-between px-6 pt-4">
          <span className="micro">Writ of limits · live</span>
          <span className="serial" style={{ color: "var(--text-muted)" }}>{writ.id}</span>
        </div>
        <div className="mt-4 px-6">
          <h2 className="text-2xl font-bold tracking-tight text-balance">Signed. Registered. In force.</h2>
          <p className="caption mt-2 text-pretty">
            {writ.agent} works under this writ right now. Every action lands against it.
          </p>
        </div>
        <div className="mt-6">
          <Clause n="II" title="Daily spend cap">
            <LiveDial label="Spent today" used={0} cap={Number(writ.spend[0]?.limit ?? "0") / 1e18} ink="principal" format={(n) => n.toFixed(1)} />
          </Clause>
          <div className="flex items-center justify-between gap-3 border-t border-[color:var(--border-default)] px-6 py-3">
            {writ.explorerTx ? (
              <a href={writ.explorerTx} target="_blank" rel="noopener noreferrer" className="serial underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]" style={{ color: "var(--text-secondary)" }}>
                {(writ.grantTx ?? "").slice(0, 18)}…
              </a>
            ) : (
              <span className="serial" style={{ color: "var(--text-muted)" }}>grant tx pending</span>
            )}
            <StatusChip status="pass" label={`in force · ${days}d left`} />
          </div>
        </div>
        <StatusReadout live />
      </div>
    );
  }
  return (
    <div>
      <div className="card relative" aria-label="Specimen writ">
        <div className="flex items-center justify-between px-6 pt-4">
          <span className="micro">Writ of limits · specimen</span>
          <span className="serial" style={{ color: "var(--text-muted)" }}>RW-SPEC-0001</span>
        </div>
        <div className="mt-4 px-6">
          <h2 className="text-2xl font-bold tracking-tight text-balance">You set the limits. The agent works inside them.</h2>
          <p className="caption mt-2 text-pretty">Grant and revoke stay with you. Every session key is registered onchain.</p>
        </div>
        <div className="mt-6">
          <Clause n="I" title="What it may do">
            <p className="text-sm text-pretty" style={{ color: "var(--text-primary)" }}>
              Swap on PancakeSwap and move your supply on Venus. Nothing outside this list.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Swap · PancakeSwap", "Supply · Venus"].map((t) => (
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
            <div className="flex flex-wrap items-center gap-6">
              <LiveDial label="Spend · per day" used={12.4} cap={50} ink="principal" format={(n) => `${n.toFixed(1)} USDT`} />
              <LiveDial label="Calls used" used={3} cap={20} ink="agent" format={(n) => `${n}`} />
            </div>
          </Clause>
          <Clause n="III" title="Expiry">
            <div className="serial">7 days · revocable at any moment</div>
          </Clause>
        </div>
        <StatusReadout live={false} />
        <span
          aria-hidden
          className="micro pointer-events-none absolute right-6 top-1/2 z-10 select-none"
          style={{
            color: "rgb(var(--accent-rgb) / 0.55)",
            fontSize: "1rem",
            transform: "rotate(-14deg) translateY(-50%)",
            border: "1px solid rgb(var(--accent-rgb) / 0.55)",
            padding: "4px 12px",
            borderRadius: "var(--radius-input)",
            background: "rgb(255 255 255 / 0.7)",
          }}
        >
          SPECIMEN
        </span>
      </div>
      <p className="caption mt-3 text-center text-pretty">
        The first live writ is being granted on testnet. It replaces this specimen the moment it lands.
      </p>
    </div>
  );
}

export default function Landing() {
  const receipts = readReceipts();
  const totalChecks = receipts.filter((r) => r.kind === "check").length;
  const totalActions = receipts.filter((r) => r.kind === "action").length;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-input)] focus:bg-[color:var(--bg-surface)] focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">Reeve</span>
          <div className="flex items-center gap-4">
            <span className="micro hidden md:inline">{CHAIN_LABEL}</span>
            <Link href="/lab" className="micro hidden sm:inline underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]">Security Lab</Link>
            <a href="#desk" className="btn btn-primary">Open the desk</a>
          </div>
        </div>
      </header>

      {/* Mono status strip: the live readout */}
      <div className="status-strip">
        <div className="mx-auto max-w-6xl px-6">
          <div className="status-strip-inner">
            <span><span className="live-dot" aria-hidden />LIVE</span>
            <span>CHAIN · <strong>BSC TESTNET</strong></span>
            <span>AGENTS · <strong>4</strong></span>
            <span>CHECKS · <strong>EVERY 15 MIN</strong></span>
            <span>RECEIPTS · <strong>{receipts.length}</strong></span>
            <span>YOUR KEYS · <strong>ALWAYS YOURS</strong></span>
          </div>
        </div>
      </div>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6">
        {/* Hero */}
        <section className="grid items-center gap-16 py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[color:var(--border-default)] px-3 py-1">
                <span className="live-dot" aria-hidden />
                <span className="serial" style={{ color: "var(--text-primary)" }}>TESTNET LIVE · AGENTS ARMING</span>
              </span>
              <span className="serial" style={{ color: "var(--text-muted)" }}>mainnet at cutover</span>
            </div>
            <h1 className="mt-4 max-w-[680px] text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
              Hire agents under a writ of limits.
            </h1>
            <p className="caption mt-6 max-w-[680px] text-lg text-pretty">
              Four live DeFi agents: rebalancing, grid trading, yield, liquidation
              guard. You sign the limits they operate under, escrow settles the
              job, and the track record is measured, not promised.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#desk" className="btn btn-primary">Open the desk</a>
              <a href="#receipts" className="btn btn-ghost">Inspect receipts</a>
            </div>
            <p className="micro mt-6">
              Every limit is signed onchain ·{" "}
              <a href={`${EXPLORER}/address/0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22`} target="_blank" rel="noopener noreferrer" className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]">
                inspect the agents
              </a>
            </p>
          </div>
          <div className="rise rise-1">
            <WritPanel />
          </div>
        </section>

        {/* Built-on strip: the real stack (what-it-works-with) */}
        <section className="border-t border-[color:var(--border-default)] py-10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="micro">Built on</span>
            {["Altana session keys", "PancakeSwap", "Venus", "Aave", "Lista", "ERC-8183 escrow", "8004scan"].map((t) => (
              <span key={t} className="serial" style={{ color: "var(--text-secondary)" }}>
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* 01 / Problem frame: numbers first */}
        <section className="border-t border-[color:var(--border-default)] py-20">
          <SectionHeader num="01" label="Why this exists" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div>
                <div className="card card-hover h-full p-6">
                  <div className="text-5xl font-bold tabular-nums" style={{ lineHeight: 1, letterSpacing: "-0.04em" }}>{s.n}</div>
                  <div className="mt-4 text-sm font-semibold text-pretty" style={{ color: "var(--text-primary)" }}>{s.label}</div>
                  <p className="caption mt-2 text-pretty">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <h3 className="text-3xl font-bold tracking-tight text-balance">
              Off-chain agents create on-chain trust problems.
            </h3>
            <div className="space-y-4 text-pretty" style={{ color: "var(--text-secondary)" }}>
              <p className="text-sm leading-6">
                The trading happens somewhere you cannot see. An agent somewhere
                holds a key to a position, its decisions land in a private
                dashboard, and the evidence of good behavior is a screenshot.
              </p>
              <p className="text-sm leading-6">
                So hiring falls back on hope. People prepay unknown wallets and
                pray. When the agent drifts, the argument happens in DMs, and
                whoever holds the money wins.
              </p>
              <p className="text-sm leading-6" style={{ color: "var(--text-primary)" }}>
                Reeve moves the boundary onchain. The writ, the limits, the
                actions, and the refusals are all public and hash-committed, and
                the Keystore enforces the outcome.
              </p>
            </div>
          </div>
        </section>

        {/* 02 / Thesis moment */}
        <section className="border-t border-[color:var(--border-default)] py-20">
          <SectionHeader num="02" label="The thesis" />
          <TaglineReveal
            text="Trust is not a feature. It is a signed contract."
            className="mt-10 max-w-[680px] text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl"
          />
        </section>

        {/* 03 / How a hire works + machine path */}
        <section className="border-t border-[color:var(--border-default)] py-20">
          <SectionHeader num="03" label="How a hire works" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div>
                <div className="card card-hover h-full p-6">
                  <span style={{ color: "var(--accent-press)" }}>◆</span>
                  <span className="serial ml-2" style={{ color: "var(--text-muted)" }}>{s.n}</span>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="caption mt-3 text-pretty">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="serial mt-12 overflow-x-auto whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
            you sign the writ → the agent checks every 15 min → actions fire inside your limits → receipts commit to the repo → revoke any time
          </div>
          <p className="micro mt-12">For machines · agents hire agents through escrow</p>
          <div className="code-block mt-3">
            <span className="c-dim">{"// ERC-8183: one agent hires another, escrow holds the budget"}</span>{"\n"}
            <span className="c-accent">const</span> job = <span className="c-accent">await</span> hireErc8183Agent(session, {"{"} task: <span style={{ color: "var(--accent-press)" }}>&quot;rebalance my PCS position&quot;</span>, budget: 10n {"}"}){"\n"}
            <span className="c-dim">{"// settle when the deliverable checks out · dispute when it does not"}</span>{"\n"}
            <span className="c-accent">await</span> settleErc8183Job(session, {"{"} jobId: job.jobId, action: <span style={{ color: "var(--accent-press)" }}>&quot;approve&quot;</span> {"}"})
          </div>
        </section>

        {/* 04 / Why a writ beats a promise */}
        <section className="border-t border-[color:var(--border-default)] py-20">
          <SectionHeader num="04" label="Why a writ beats a promise" />
          <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-2">
            {BENEFITS.map((b) => (
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="caption mt-2 text-pretty">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 05 / The desk */}
        <section id="desk" className="scroll-mt-20 border-t border-[color:var(--border-default)] py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <SectionHeader num="05" label="The desk" />
            <span className="micro">Four categories, equally deep</span>
          </div>
          <div className="desk-grid mt-8">
            {CATEGORIES.map((c) => {
              const count = receipts.filter((r) => r.agent === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/agent/${c.id}`}
                  className="desk-cell grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 transition-colors hover:bg-[color:var(--bg-subtle)] sm:grid-cols-[12rem_1fr_7rem_auto]"
                >
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                  <span className="caption hidden sm:block">{c.does}</span>
                  <span className="serial hidden text-right sm:inline" style={{ color: "var(--text-muted)" }}>
                    {count} receipt{count === 1 ? "" : "s"}
                  </span>
                  <StatusChip status="pending" label="arming" />
                </Link>
              );
            })}
          </div>
          <p className="caption mt-3 text-pretty">
            Agents are arming: wallets are live and funded, first writs are being
            granted on testnet, and records appear as rounds execute.
          </p>
        </section>

        {/* 06 / Receipts feed */}
        <section id="receipts" className="scroll-mt-20 border-t border-[color:var(--border-default)] py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <SectionHeader num="06" label="Receipts" />
            <span className="micro">Committed to the repo every 15 minutes</span>
          </div>
          <div className="desk-grid mt-8">
            {receipts.length > 0 ? (
              receipts.slice(-8).reverse().map((r, i) => (
                <div key={i} className="desk-cell grid grid-cols-[8rem_1fr_auto] items-center gap-3 last:border-b-0">
                  <span className="serial" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.ts).toISOString().slice(11, 16)} UTC
                  </span>
                  <span className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                    <span className="serial" style={{ color: "var(--agent)" }}>{r.agent}</span> · {r.summary}
                  </span>
                  <StatusChip status={r.status} label="done" />
                </div>
              ))
            ) : (
              <div className="desk-cell py-8 text-center">
                <p className="caption">No receipts yet. The first scheduled round lands within 15 minutes.</p>
              </div>
            )}
          </div>
          <p className="caption mt-3 text-pretty">
            {totalChecks} {totalChecks === 1 ? "round" : "rounds"} checked · {totalActions} onchain {totalActions === 1 ? "action" : "actions"} so far. Every agent page carries its full ledger
            {" · "}
            <Link href="/agent/yield" className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]">see one</Link>
          </p>
        </section>

        {/* What the writ can and cannot do */}
        <section className="border-t border-[color:var(--border-default)] py-20">
          <SectionHeader num="07" label="What the writ can and cannot do" />
          <p className="caption mt-4 max-w-[680px] text-pretty">
            This is the whole product, so it is stated plainly. The Keystore
            contracts check every call against these rules before it executes.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <div className="card h-full p-6">
                <span className="micro" style={{ color: "var(--status-success)" }}>✓ · A signed writ lets an agent</span>
                <ul className="mt-4 space-y-3">
                  {[
                    "Spend up to your daily cap, and not one unit more",
                    "Make only the calls you named, on the protocols you named",
                    "Work until the expiry you set, automatically",
                    "Prove every action with a receipt you can inspect",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-pretty" style={{ color: "var(--text-primary)" }}>
                      <span style={{ color: "var(--status-success)" }}>·</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <div className="card h-full p-6">
                <span className="micro" style={{ color: "var(--status-error)" }}>✗ · No writ ever lets an agent</span>
                <ul className="mt-4 space-y-3">
                  {[
                    "Touch a token outside the cap you set",
                    "Make a call outside its allowlist · the chain reverts it",
                    "Survive its expiry or your revoke · authority ends mid-round",
                    "Reach funds on any other wallet, or your keys",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-pretty" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--status-error)" }}>·</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 08 / Questions */}
        <section className="border-t border-[color:var(--border-default)] py-20">
          <SectionHeader num="08" label="Questions" />
          <div className="mt-8 max-w-[680px]">
            {FAQ.map((f, i) => (
              <details key={f.q} open={i === 0} className="border-b border-[color:var(--border-default)] py-4">
                <summary className="group flex cursor-pointer list-none items-start gap-3 text-base font-semibold tracking-tight marker:hidden">
                  <span
                    className="serial mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-110 [[open]>&]:rotate-45"
                    style={{ color: "var(--accent-press)" }}
                  >
                    +
                  </span>
                  <span>{f.q}</span>
                </summary>
                <p className="caption mt-3 pl-8 text-pretty">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[color:var(--border-default)] py-24 text-center">
          <h2 className="mx-auto max-w-[680px] text-4xl font-bold tracking-tight text-balance">
            The desk is open. The limits are yours.
          </h2>
          <div className="mt-8">
            <a href="#desk" className="btn btn-primary">Open the desk</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="caption">
            Built by{" "}
            <a href="https://x.com/a_raphie" target="_blank" rel="noopener noreferrer" className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]">
              Raphie
            </a>
          </span>
          <span className="micro text-right">BSC testnet · no mainnet claim · nothing asks you to sign until you hire</span>
        </div>
      </footer>
    </div>
  );
}
