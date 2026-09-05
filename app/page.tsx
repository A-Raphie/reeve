import { CHAIN_LABEL, EXPLORER } from "@/lib/chain.mjs";
import { Clause, LiveDial, StatusChip } from "@/components/kit";

const CATEGORIES = [
  {
    name: "Rebalancing",
    does: "Manages LP ranges, resets positions automatically",
    where: "PancakeSwap V3",
  },
  {
    name: "Grid Trading",
    does: "Places and manages automated grid orders",
    where: "PancakeSwap",
  },
  {
    name: "Yield Optimisation",
    does: "Routes liquidity to the highest available APR",
    where: "Venus · Aave · Lista",
  },
  {
    name: "Health Factor Monitoring",
    does: "Protects lending positions from liquidation",
    where: "Venus · Aave",
  },
];

/* Specimen writ: a sample document so the landing shows the product's
   subject before any wallet connects. Clearly labeled SPECIMEN; real writs
   appear when a user signs (on-screen data is labeled, never faked). */
function WritSpecimen() {
  return (
    <div className="card relative" aria-label="Specimen writ">
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="micro">Writ of limits · specimen</span>
        <span className="serial" style={{ color: "var(--text-muted)" }}>
          RW-SPEC-0001
        </span>
      </div>
      <div className="mt-3 px-5">
        <h2 className="text-xl font-bold tracking-tight">
          You set the limits. The agent works inside them.
        </h2>
        <p className="caption mt-1">
          Grant and revoke stay with you. Every session key is registered onchain.
        </p>
      </div>
      <div className="mt-4">
        <Clause n="I" title="Allowed calls">
          <div className="serial">pancakeSwap() · addLiquidity() · removeLiquidity()</div>
        </Clause>
        <Clause n="II" title="Daily spend cap">
          <div className="flex flex-wrap items-center gap-4">
            <LiveDial
              label="Spend · per day"
              used={12.4}
              cap={50}
              ink="principal"
              format={(n) => `${n.toFixed(1)} USDT`}
            />
            <LiveDial label="Calls used" used={3} cap={20} ink="agent" format={(n) => `${n}`} />
          </div>
        </Clause>
        <Clause n="III" title="Expiry">
          <div className="serial">expires in 6d 23h · revocable at any moment</div>
        </Clause>
        <div className="flex items-center justify-between border-t border-[color:var(--border-default)] px-5 py-3">
          <span className="serial" style={{ color: "var(--text-muted)" }}>
            0x93ff157b…5531 · Keystore-registered
          </span>
          <StatusChip status="pass" label="in force" />
        </div>
      </div>
      <span
        aria-hidden
        className="micro pointer-events-none absolute inset-x-0 top-[4.6rem] select-none text-center"
        style={{ color: "rgb(var(--accent-rgb) / 0.30)", fontSize: "1.1rem", transform: "rotate(-5deg)" }}
      >
        SPECIMEN
      </span>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">Reeve</span>
          <div className="flex items-center gap-4">
            <span className="micro hidden sm:inline">{CHAIN_LABEL}</span>
            <a href="#desk" className="btn btn-primary">
              Open the desk
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              Hire agents under a writ of limits.
            </h1>
            <p className="caption mt-5 max-w-md text-base leading-relaxed">
              Four live DeFi agents: rebalancing, grid trading, yield, liquidation
              guard. Every hire is an onchain employment contract: you sign the
              limits, jobs settle through escrow, and each agent ships a measured
              track record.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#desk" className="btn btn-primary">
                Open the desk
              </a>
              <a
                href={`${EXPLORER}/address/0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                See a live agent onchain
              </a>
            </div>
          </div>
          <WritSpecimen />
        </section>

        <section id="desk" className="scroll-mt-20 pb-20">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">The desk</h2>
            <span className="micro">Four categories, equally deep</span>
          </div>
          <div className="desk-grid mt-5">
            {CATEGORIES.map((c) => (
              <div
                key={c.name}
                className="desk-cell grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[14rem_1fr_auto_auto]"
              >
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {c.name}
                </span>
                <span className="caption hidden sm:block">{c.does}</span>
                <span className="serial hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                  {c.where}
                </span>
                <StatusChip status="pending" label="arming" />
              </div>
            ))}
          </div>
          <p className="caption mt-3">
            Agents are arming: wallets live, sessions being granted, first rounds
            executing on testnet. Records appear as they run.
          </p>
        </section>
      </main>

      <footer className="border-t border-[color:var(--border-default)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
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
