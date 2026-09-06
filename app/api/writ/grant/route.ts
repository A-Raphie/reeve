import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// POST: grant a demo writ server-side with the operator key (Recourse DEMO_KEY
// pattern). The writ is a real onchain session; the payer custody is the demo
// operator's, which the UI states plainly. Passkey self-custody lands with the
// mainnet cutover (needs a funding path for fresh wallets).
export async function POST(req: Request) {
  const body = await req.json();
  const agentId: string = body.agentId;
  const cap: number = Number(body.cap) || 50;
  const days: number = Number(body.days) || 7;
  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  // 1. resolve the agent wallet key (server-side store)
  const agentsPath = join(process.cwd(), ".spike", "agents.json");
  if (!existsSync(agentsPath)) {
    return NextResponse.json({ error: "agent keys unavailable in this environment" }, { status: 503 });
  }
  const agents = JSON.parse(readFileSync(agentsPath, "utf8"));
  const agent = agents[agentId];
  if (!agent) {
    return NextResponse.json({ error: "unknown agent" }, { status: 404 });
  }

  const { createClient, signerFromPrivateKey, createPrivateKeySigner, serializeSession } =
    await import("@altananetwork/sdk");
  const { NETWORK, EXPLORER_TX } = await import("@/lib/chain.mjs");

  const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });
  const wallet = { address: agent.address, signer: signerFromPrivateKey(agent.privateKey) };

  const sessionKey = createPrivateKeySigner();
  const expiry = Math.floor(Date.now() / 1000) + days * 24 * 3600;
  const grant = await client.grantSession({
    wallet,
    signer: wallet.signer,
    sessionSigner: sessionKey,
    permissions: {
      calls: [{ to: agent.address }],
      spend: [{ limit: BigInt(Math.floor(cap)) * 10n ** 18n, period: "day" }],
    },
    expiry,
    register: true,
  });

  const id = `RW-${Date.now().toString(36).toUpperCase()}`;
  const session = serializeSession(grant);
  const tx = grant.transactionHash ?? null;

  // 2. ledger index (committed file; keys never enter it)
  const ledgerEntry = {
    id,
    agent: agentId,
    walletAddress: session.walletAddress,
    publicKey: session.publicKey,
    calls: session.permissions.calls,
    spend: session.permissions.spend,
    expiry: session.expiry,
    grantTx: tx,
    explorerTx: tx ? EXPLORER_TX(tx) : null,
    status: "in force",
    grantedAt: new Date().toISOString(),
  };
  const writsPath = join(process.cwd(), "ledger", "writs.json");
  mkdirSync(join(process.cwd(), "ledger"), { recursive: true });
  const prior = existsSync(writsPath) && readFileSync(writsPath, "utf8").trim()
    ? JSON.parse(readFileSync(writsPath, "utf8"))
    : [];
  type LedgerRow = typeof ledgerEntry;
  const next = [
    ...(prior as LedgerRow[]).filter((x) => x.agent !== agentId || x.status === "void"),
    ledgerEntry,
  ];
  writeFileSync(writsPath, JSON.stringify(next, null, 2));

  // 3. session key into the gitignored store (agent rounds use it)
  try {
    const keysPath = join(process.cwd(), ".spike", "writ-keys.json");
    const keys = existsSync(keysPath) && readFileSync(keysPath, "utf8").trim()
      ? JSON.parse(readFileSync(keysPath, "utf8"))
      : {};
    keys[id] = { agent: agentId, sessionKey: sessionKey._privateKey, publicKey: session.publicKey };
    writeFileSync(keysPath, JSON.stringify(keys, null, 2));
  } catch {
    // read-only filesystem: the writ is onchain; the key store catches up on the host
  }

  return NextResponse.json({ ok: true, id, tx });
}
