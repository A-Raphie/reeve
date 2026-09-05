import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// POST: index a freshly granted writ. The writ's truth is onchain; this file
// ledger is the human/agent-readable index (Architecture.md). Session keys are
// stored in the gitignored .spike store, never in the committed ledger.
export async function POST(req: Request) {
  const body = await req.json();
  const { agentId, id, session, sessionKey, tx } = body;
  if (!agentId || !id || !session || !sessionKey) {
    return NextResponse.json({ error: "agentId, id, session and sessionKey are required" }, { status: 400 });
  }

  const ledgerEntry = {
    id,
    agent: agentId,
    walletAddress: session.walletAddress,
    publicKey: session.publicKey,
    calls: session.permissions.calls,
    spend: session.permissions.spend,
    expiry: session.expiry,
    grantTx: tx ?? null,
    explorerTx: tx
      ? `${process.env.CHAIN === "mainnet" ? "https://bscscan.com" : "https://testnet.bscscan.com"}/tx/${tx}`
      : null,
    status: "in force",
    grantedAt: new Date().toISOString(),
  };

  const writsPath = join(process.cwd(), "ledger", "writs.json");
  mkdirSync(join(process.cwd(), "ledger"), { recursive: true });
  const prior = readFileSync(writsPath, "utf8").trim() ? JSON.parse(readFileSync(writsPath, "utf8")) : [];
  const next = [...(prior as Array<typeof ledgerEntry>).filter((x) => x.agent !== agentId || x.status === "void"), ledgerEntry];
  writeFileSync(writsPath, JSON.stringify(next, null, 2));

  try {
    const keysPath = join(process.cwd(), ".spike", "writ-keys.json");
    mkdirSync(join(process.cwd(), ".spike"), { recursive: true });
    const keys = readFileSync(keysPath, "utf8").trim() ? JSON.parse(readFileSync(keysPath, "utf8")) : {};
    keys[id] = { agent: agentId, sessionKey, publicKey: session.publicKey };
    writeFileSync(keysPath, JSON.stringify(keys, null, 2));
  } catch {
    // Read-only filesystem (serverless): the writ is onchain regardless; the
    // key store catches up from the signing device. Say so honestly.
    return NextResponse.json({ ok: true, ledger: "deferred" });
  }
  return NextResponse.json({ ok: true, ledger: "written" });
}
