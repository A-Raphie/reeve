// Server-side ledger reads. The ledger is plain JSON committed to the repo by
// the grant/agent scripts (Architecture.md: GHA-committed receipts). Missing
// file = honest empty state upstream, never a fabricated row.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Writ = {
  id: string;
  agent: string;
  agentAddress: string;
  walletAddress: string;
  publicKey: string;
  calls: readonly { to?: string; signature?: string }[];
  spend: readonly { limit: string; period: string; token?: string }[];
  expiry: number;
  grantTx: string | null;
  explorerTx: string | null;
  status: string;
  grantedAt: string;
};

export function readWrits(): Writ[] {
  try {
    const raw = readFileSync(join(process.cwd(), "ledger", "writs.json"), "utf8").trim();
    return raw ? (JSON.parse(raw) as Writ[]) : [];
  } catch {
    return [];
  }
}

export function liveWrit(): Writ | undefined {
  return readWrits().find((w) => w.status === "in force");
}
