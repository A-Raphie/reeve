import { CHAIN_LABEL, EXPLORER } from "@/lib/chain.mjs";
import { liveWrit } from "@/lib/ledger";
import { Clause, LiveDial, StatusChip } from "@/components/kit";
import { ScrollReveal, TaglineReveal } from "@/components/reveal";
import Link from "next/link";

const CATEGORIES = [
  {
    id: "rebalancer",
    name: "Rebalancing",
    does: "Manages LP ranges, resets positions automatically",
    where: "PancakeSwap V3",
  },
  {
    id: "grid",
    name: "Grid Trading",
    does: "Places and manages automated grid orders",
    where: "PancakeSwap",
  },
  {
    id: "yield",
    name: "Yield Optimisation",
    does: "Routes liquidity to the highest available APR",
    where: "Venus · Aave · Lista",
  },
  {
    id: "guard",
    name: "Health Factor Monitoring",
    does: "Protects lending positions from liquidation",
    where: "Venus · Aave",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Sign the writ",
    body: "Set the call allowlist, the daily spend cap, and the expiry. The session key registers in the Keystore: your limits become onchain fact, not a promise.",
  },
  {
    n: "2",
    title: "The agent works inside it",
    body: "Every action the agent takes is checked against your writ and receipted. Outside the writ, the call is refused onchain, with the rule cited.",
  },
  {
    n: "3",
    title: "Revoke the moment you want",
    body: "One transaction, effective immediately. The agent's authority ends mid-action if it has to, and nothing waits for anyone's approval.",
  },
];

const BENEFITS = [
  {
    title: "Your rules, enforced by the chain",
    body: "Allowlist, spend cap, and expiry are checked in the Keystore contracts. An agent cannot exceed what you signed, even if it tries.",
  },
  {
    title: "Revoke is one transaction",
    body: "No lockups, no exit queues, no support tickets. The grant dies instantly and takes effect mid-round if needed.",
  },
  {
    title: "Records are measured, not promised",
    body: "Every agent ships a track record: what it did, when, at what cost, against which writ. The receipts are onchain and inspectable.",
  },
  {
    title: "You never lose custody",
    body: "Sessions are noncustodial keys scoped to one wallet. The platform holds nothing; there is nothing to withdraw from.",
  },
];

const FAQ = [
  {
    q: "Which chain does this run on?",
    a: "BNB Smart Chain. The build executes on testnet while the agents are arming and cuts over to mainnet when they do; every receipt links to its transaction.",
  },
  {
    q: "Do I keep custody of my funds?",
    a: "Yes. A writ grants a scoped session key on your own wallet: specific calls, a spend cap, an expiry. The platform never holds funds, and you can revoke in one transaction.",
  },
  {
    q: "What actually stops the agent from overspending?",
    a: "The Keystore contracts check the writ onchain before the call executes. A call outside the allowlist, or spend past the cap, reverts with the clause that refused it.",
  },
  {
    q: "What happens when the cap runs out?",
    a: "The agent's next call is refused onchain and the writ records the refusal. You can raise the cap by signing a fresh writ; the old one stays void.",
  },
  {
    q: "What does hiring an agent cost?",
    a: "Gas only. A full grant, execute, and revoke cycle costs a few cents at normal BSC gas prices, and every fee is visible on the receipt.",
  },
  {
    q: "How is an agent's performance measured?",
    a: "The Agent Advantage Report runs real tasks with and without the agent and reports time, cost, and output quality, with the actual outputs attached.",
  },
];

function WritSheet({
  id,
  txHash,
  explorerTx,
  expiry,
  cap,
  live,
}: {
  id: string;
  txHash: string | null;
  explorerTx: string | null;
  expiry: number;
  cap: number;
  live: boolean;
}) {
  const days = Math.max(0, Math.floor((expiry * 1000 - Date.now()) / 86400000));
  const hours = Math.max(0, Math.floor(((expiry * 1000 - Date.now()) % 86400000) / 3600000));
  return (
    <div className="card relative" aria-label={live ? "Live writ" : "Specimen writ"}>
      {!live && (
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
      )}
      <div className="flex items-center justify-between px-6 pt-4">
        <span className="micro">Writ of limits · {live ? "live" : "specimen"}</span>
        <span className="serial" style={{ color: "var(--text-muted)" }}>
          {id}
        </span>
      </div>
      <div className="mt-4 px-6">
        <h2 className="text-2xl font-bold tracking-tight text-balance">
          You set the limits. The agent works inside them.
        </h2>
        <p className="caption mt-2 text-pretty">
          Grant and revoke stay with you. Every session key is registered onchain.
        </p>
      </div>
      <div className="mt-6">
        <Clause n="I" title="Allowed calls">
          <div className="serial text-pretty">pancakeSwap() · addLiquidity() · removeLiquidity()</div>
        </Clause>
        <Clause n="II" title="Daily spend cap">
          <div className="flex flex-wrap items-center gap-6">
            <LiveDial
              label="Spend · per day"
              used={0}
              cap={cap}
              ink="principal"
              format={(n) => `${n.toFixed(1)} USDT`}
            />
            <LiveDial label="Calls used" used={0} cap={20} ink="agent" format={(n) => `${n}`} />
          </div>
        </Clause>
        <Clause n="III" title="Expiry">
          <div className="serial">
            {live ? `expires in ${days}d ${hours}h · revocable at any moment` : "7 days · revocable at any moment"}
          </div>
        </Clause>
        <div className="flex items-center justify-between gap-3 border-t border-[color:var(--border-default)] px-6 py-3">
          {txHash && explorerTx ? (
            <a
              href={explorerTx}
              target="_blank"
              rel="noopener noreferrer"
              className="serial underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
              style={{ color: "var(--text-secondary)" }}
            >
              {txHash.slice(0, 12)}… · Keystore-registered
            </a>
          ) : (
            <span className="serial" style={{ color: "var(--text-muted)" }}>
              0x93ff157b…5531 · Keystore-registered
            </span>
          )}
          <StatusChip status={live ? "pass" : "pending"} label={live ? "in force" : "specimen"} />
        </div>
      </div>
    </div>
  );
}

function WritPanel() {
  const writ = liveWrit();
  if (writ) {
    return (
      <WritSheet
        id={writ.id}
        txHash={writ.grantTx}
        explorerTx={writ.explorerTx}
        expiry={writ.expiry}
        cap={50}
        live
      />
    );
  }
  return (
    <div>
      <WritSheet id="RW-SPEC-0001" txHash={null} explorerTx={null} expiry={0} cap={50} live={false} />
      <p className="caption mt-3 text-center">
        The first live writ is being granted on testnet. It replaces this specimen the moment it lands.
      </p>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-input)] focus:bg-[color:var(--bg-surface)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">Reeve</span>
          <div className="flex items-center gap-4">
            <span className="micro hidden sm:inline">{CHAIN_LABEL}</span>
            <a href="#desk" className="btn btn-primary text-base">
              Open the desk
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6">
        {/* Hero: one offer, one action, proof next to the claim (landing A4) */}
        <section className="grid items-center gap-16 py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="heading-gradient max-w-[680px] text-5xl font-bold leading-[1] tracking-[-0.04em] text-balance sm:text-6xl">
              Hire agents under a writ of limits.
            </h1>
            <p className="caption mt-6 max-w-[680px] text-lg text-pretty">
              Four live DeFi agents on BNB Chain: rebalancing, grid trading, yield,
              liquidation guard. You sign the limits they operate under, escrow
              settles the job, and the track record is measured, not promised.
            </p>
            <div className="mt-8">
              <a href="#desk" className="btn btn-primary">
                Open the desk
              </a>
            </div>
            <p className="micro mt-6">
              Sessions granted onchain ·{" "}
              <a
                href={`${EXPLORER}/address/0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]"
              >
                inspect the agents
              </a>
            </p>
          </div>
          <div className="rise rise-1">
            <WritPanel />
          </div>
        </section>

        {/* Tagline reveal (landing B11): its own moment, words activate on scroll */}
        <section className="border-t border-[color:var(--border-default)] py-24">
          <TaglineReveal
            text="Trust is not a feature. It is a signed contract."
            className="mx-auto max-w-[680px] text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl"
          />
        </section>

        {/* How it works: connected steps, not unrelated cards */}
        <section className="border-t border-[color:var(--border-default)] py-24">
          <h2 className="text-3xl font-bold tracking-tight text-balance">How a hire works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.n} className={i === 0 ? "md:col-span-1" : undefined}>
                <div className="card h-full p-6">
                  <span className="serial" style={{ color: "var(--accent-press)" }}>
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="caption mt-3 text-pretty">{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Benefits: outcome first, proof attached */}
        <section className="border-t border-[color:var(--border-default)] py-24">
          <h2 className="text-3xl font-bold tracking-tight text-balance">Why a writ beats a promise</h2>
          <div className="mt-12 grid gap-x-6 gap-y-10 md:grid-cols-2">
            {BENEFITS.map((b) => (
              <ScrollReveal key={b.title}>
                <h3 className="text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="caption mt-2 text-pretty">{b.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* The desk: the four mandated categories */}
        <section id="desk" className="scroll-mt-20 border-t border-[color:var(--border-default)] py-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-3xl font-bold tracking-tight">The desk</h2>
            <span className="micro">Four categories, equally deep</span>
          </div>
          <div className="desk-grid mt-8">
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                href={`/agent/${c.id}`}
                className="desk-cell grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 transition-colors hover:bg-[color:var(--bg-subtle)] sm:grid-cols-[14rem_1fr_auto_auto]"
              >
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {c.name}
                </span>
                <span className="caption hidden sm:block">{c.does}</span>
                <span className="serial hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                  {c.where}
                </span>
                <StatusChip status="pending" label="arming" />
              </Link>
            ))}
          </div>
          <p className="caption mt-3 text-pretty">
            Agents are arming: wallets are live and funded, first writs are being
            granted on testnet, and records appear as rounds execute.
          </p>
        </section>

        {/* FAQ: objections as a section (landing A4) */}
        <section className="border-t border-[color:var(--border-default)] py-24">
          <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
          <div className="mt-8 max-w-[680px]">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-[color:var(--border-default)] py-4">
                <summary className="cursor-pointer list-none text-base font-semibold tracking-tight marker:hidden">
                  <span className="serial mr-3" style={{ color: "var(--text-muted)" }}>
                    +
                  </span>
                  {f.q}
                </summary>
                <p className="caption mt-3 pl-7 text-pretty">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA: identical to the top (landing A2) */}
        <section className="border-t border-[color:var(--border-default)] py-24 text-center">
          <h2 className="mx-auto max-w-[680px] text-4xl font-bold tracking-tight text-balance">
            The desk is open. The limits are yours.
          </h2>
          <div className="mt-8">
            <a href="#desk" className="btn btn-primary">
              Open the desk
            </a>
          </div>
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
          <span className="micro">BSC testnet · mainnet at cutover</span>
        </div>
      </footer>
    </div>
  );
}
