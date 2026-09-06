import Link from "next/link";
import { liveWrit } from "@/lib/ledger";
import { AttackLab } from "@/components/attack-lab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Lab · Reeve",
  description:
    "Fire real attacks at a live writ — out-of-scope calls, cap breakers, revoked and expired sessions — and watch the Keystore refuse every one onchain.",
};

export default function SecurityLab() {
  const writ = liveWrit();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">Reeve</Link>
          <div className="flex items-center gap-4">
            <span className="micro hidden sm:inline">Security Lab</span>
            <Link href="/#desk" className="btn btn-ghost text-sm">All agents</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="py-16">
          <span className="micro">Security Lab · live onchain</span>
          <h1 className="mt-3 max-w-[720px] text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-balance sm:text-6xl">
            Attack the writ. Watch it hold.
          </h1>
          <p className="caption mt-5 max-w-[680px] text-lg text-pretty">
            The paired app turns malicious. Every button below fires a real
            request against a live session on BNB Chain, and every refusal
            comes back from the Keystore contracts with the clause that caused
            it. Nothing here is simulated — and if an attack ever gets through,
            the page says so instead of pretending.
          </p>
          <p className="micro mt-6">
            Live writ · {writ ? writ.id : "none on this host"} · refusals are
            receipted publicly
          </p>
        </section>

        <section className="border-t border-[color:var(--border-default)] py-16">
          <AttackLab writId={writ ? writ.id : null} />
        </section>

        <section className="border-t border-[color:var(--border-default)] py-16">
          <h2 className="text-2xl font-bold tracking-tight">Read the receipts</h2>
          <p className="caption mt-3 max-w-[680px] text-pretty">
            Every refusal on this page is also in the public receipt ledger and
            the underlying attempts are visible on the block explorer.{" "}
            <Link href="/agent/yield" className="underline decoration-[color:var(--border-strong)] hover:decoration-[color:var(--text-primary)]">
              Open the yield agent's ledger
            </Link>{" "}
            for the full trail.
          </p>
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
