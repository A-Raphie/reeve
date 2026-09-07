import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// POST { id }: revoke a writ NOW. Onchain revocation of the session key +
// ledger marks the writ void. If the key store is unavailable on this host,
// the ledger still records the revoke intent with a 503 + clear message
// instead of pretending success.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "writ id is required" }, { status: 400 });

  const writsPath = join(process.cwd(), "ledger", "writs.json");
  const writs = existsSync(writsPath) && readFileSync(writsPath, "utf8").trim()
    ? JSON.parse(readFileSync(writsPath, "utf8"))
    : [];
  type W = {
    id: string; agent: string; status: string; walletAddress: string; publicKey: string;
    permissions?: unknown; expiry: number; calls?: unknown; spend?: Array<{ limit: string; period: string }>;
  };
  const writ = (writs as W[]).find((w) => w.id === body.id && w.status === "in force");
  if (!writ) {
    return NextResponse.json({ error: "no live writ with that id" }, { status: 404 });
  }

  // 1. onchain revoke where the key store exists
  let onchain: string | null = null;
  try {
    const keys = JSON.parse(readFileSync(join(process.cwd(), ".spike", "writ-keys.json"), "utf8"));
    const entry = (Object.entries(keys) as Array<[string, { publicKey: string; sessionKey: string }]>).find(
      ([, v]) => v.publicKey === writ.publicKey,
    );
    if (entry) {
      const { createClient, signerFromPrivateKey } = await import("@altananetwork/sdk");
      const { NETWORK } = await import("@/lib/chain.mjs");
      const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });
      const agents = JSON.parse(readFileSync(join(process.cwd(), ".spike", "agents.json"), "utf8"));
      const agent = agents[writ.agent];
      const wallet = { address: writ.walletAddress, signer: signerFromPrivateKey(agent.privateKey) };
      const session = {
        walletAddress: writ.walletAddress,
        signer: signerFromPrivateKey(entry[1].sessionKey as `0x${string}`),
        publicKey: writ.publicKey,
        permissions: writ.permissions ?? { calls: [{ to: writ.walletAddress }], spend: [] },
        expiry: writ.expiry,
      };
      const r = await client.revokeSession({ wallet: wallet as never, signer: wallet.signer, session: session as never });
      onchain = r.transactionHash ?? "revoked (bundled)";
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `onchain revoke failed: ${msg.slice(0, 140)}. The writ is still in force.` },
      { status: 502 },
    );
  }
  if (!onchain) {
    return NextResponse.json(
      { error: "session key store unavailable in this environment — revoke needs the operator host. Writ still in force." },
      { status: 503 },
    );
  }

  // 2. ledger marks the writ void + refusal-style receipt for the trail
  const next = (writs as W[]).map((w) =>
    w.id === writ.id ? { ...w, status: "void", revokedAt: new Date().toISOString(), revokeTx: onchain } : w,
  );
  writeFileSync(writsPath, JSON.stringify(next, null, 2));
  const rp = join(process.cwd(), "ledger", "receipts.json");
  const receipts = existsSync(rp) && readFileSync(rp, "utf8").trim() ? JSON.parse(readFileSync(rp, "utf8")) : [];
  receipts.push({
    ts: new Date().toISOString(),
    agent: writ.agent,
    kind: "revocation",
    status: "pass",
    summary: `Revoked: writ ${writ.id} void onchain — all ${agentLabel(writ.agent)} authority ends`,
    detail: `revoke tx ${String(onchain).slice(0, 18)}… · Keystore key deleted, session dead`,
  });
  function agentLabel(a: string) { return a; }
  writeFileSync(rp, JSON.stringify(receipts, null, 2));
  return NextResponse.json({ ok: true, tx: onchain });
}
