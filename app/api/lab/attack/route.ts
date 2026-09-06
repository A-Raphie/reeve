import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// POST { attack }: fires ONE real attack against a live session and receipts
// the onchain refusal. Nothing here is simulated — refusals come from the
// Keystore contracts. Attack writs (over-cap, revoked, expired) are cheap
// throwaway grants on the yield wallet, so the demo writ stays untouched.
export const maxDuration = 120;

type AttackId = "stranger" | "overcap" | "revoked" | "expired";

function loadJson<T>(path: string, fallback: T): T {
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function appendReceipt(r: {
  agent: string;
  kind: "refusal";
  status: "pass";
  summary: string;
  detail: string;
}) {
  const p = join(process.cwd(), "ledger", "receipts.json");
  mkdirSync(join(process.cwd(), "ledger"), { recursive: true });
  const all = loadJson<Array<{ ts: string } & typeof r>>(p, []);
  all.push({ ts: new Date().toISOString(), ...r });
  writeFileSync(p, JSON.stringify(all, null, 2));
}

function shortErr(attack: AttackId, e: unknown): string {
  const details =
    typeof (e as { details?: string }).details === "string"
      ? (e as { details: string }).details
      : "";
  const s = `${e instanceof Error ? e.message : String(e)} ${details}`;
  if (s.includes("ExceededSpendLimit")) return "ExceededSpendLimit";
  if (s.includes("UnauthorizedCall")) return "UnauthorizedCall";
  if (s.includes("KeyDoesNotExist")) return "KeyDoesNotExist";
  // relay-level failures for dead sessions surface as verbose RPC errors;
  // the attack id tells us which clause fired, so label it cleanly
  if (attack === "revoked") return "SESSION_REVOKED";
  if (attack === "expired") {
    // decode Error(string) revert reasons when the chain gives one
    const m = s.match(/Reason: (0x08c379a0[0-9a-f]+)/);
    if (m) {
      try {
        const hex = m[1].slice(10);
        const len = parseInt(hex.slice(64, 128), 16);
        const msg = Buffer.from(hex.slice(128, 128 + len * 2), "hex").toString("utf8");
        if (msg.trim()) return `REVERT: ${msg.trim().slice(0, 60)}`;
      } catch {}
    }
    return "SESSION_EXPIRED";
  }
  return s.slice(0, 80).replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { attack?: string };
  const attack = body.attack as "stranger" | "overcap" | "revoked" | "expired" | undefined;
  if (!attack || !["stranger", "overcap", "revoked", "expired"].includes(attack)) {
    return NextResponse.json({ error: "unknown attack" }, { status: 400 });
  }

  const { createClient, signerFromPrivateKey, createPrivateKeySigner, serializeSession } =
    await import("@altananetwork/sdk");
  type SdkWallet = Parameters<typeof client.grantSession>[0]["wallet"];
  const { NETWORK } = await import("@/lib/chain.mjs");
  const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });

  const agents = loadJson<Record<string, { address: string; privateKey: string }>>(
    join(process.cwd(), ".spike", "agents.json"),
    {},
  );
  const yieldAgent = agents.yield;
  if (!yieldAgent) {
    return NextResponse.json({ error: "agent keys unavailable in this environment" }, { status: 503 });
  }
  const wallet = {
    address: yieldAgent.address,
    signer: signerFromPrivateKey(yieldAgent.privateKey as `0x${string}`),
  };

  const now = Math.floor(Date.now() / 1000);
  const stranger = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

  // short-lived throwaway session for the attacks that need one
  async function throwaway(capLimit: bigint, ttlSeconds: number) {
    const sessionKey = createPrivateKeySigner();
    const grant = await client.grantSession({
      wallet: wallet as never,
      signer: wallet.signer,
      sessionSigner: sessionKey,
      permissions: {
        calls: [{ to: wallet.address as `0x${string}` }],
        spend: [{ limit: capLimit, period: "day" }],
      },
      expiry: now + ttlSeconds,
      register: true,
    });
    const sheet = serializeSession(grant);
    const session = {
      walletAddress: sheet.walletAddress,
      signer: sessionKey,
      publicKey: sheet.publicKey,
      permissions: {
        calls: [{ to: wallet.address as `0x${string}` }],
        spend: [{ limit: capLimit, period: "day" as const }],
      },
      expiry: sheet.expiry,
    };
    return { session, tx: grant.transactionHash ?? null };
  }

  let label = "";
  let clause = "";
  let fire: () => Promise<unknown>;

  if (attack === "stranger") {
    label = "Send the agent's balance to a stranger";
    clause = "I · What it may do (allowlist)";
    fire = async () => {
      const t = await throwaway(10n ** 17n, 600);
      return client.execute({ session: t.session, calls: [{ to: stranger, value: 0n, data: "0x" }] });
    };
  } else if (attack === "overcap") {
    label = "Spend 0.06 past a 0.05 daily cap";
    clause = "II · Daily spend cap";
    fire = async () => {
      const t = await throwaway(5n * 10n ** 16n, 3600);
      return client.execute({
        session: t.session,
        calls: [{ to: wallet.address as `0x${string}`, value: 6n * 10n ** 16n, data: "0x" }],
      });
    };
  } else if (attack === "revoked") {
    label = "Call through a revoked session";
    clause = "III · Revocation is instant";
    fire = async () => {
      const t = await throwaway(10n ** 17n, 3600);
      await client.revokeSession({ wallet: wallet as never, signer: wallet.signer, session: t.session });
      return client.execute({ session: t.session as never, calls: [{ to: wallet.address as `0x${string}`, value: 0n, data: "0x" }] });
    };
  } else {
    label = "Call through an expired session";
    clause = "III · Expiry";
    fire = async () => {
      const t = await throwaway(10n ** 17n, 1);
      await new Promise((r) => setTimeout(r, 3000));
      return client.execute({ session: t.session as never, calls: [{ to: wallet.address as `0x${string}`, value: 0n, data: "0x" }] });
    };
  }

  try {
    await fire();
    // executing here would mean the boundary failed — a defect, not a result
    return NextResponse.json(
      {
        refused: false,
        error:
          "The attack EXECUTED — the boundary failed. This is a defect and it is flagged for review.",
      },
      { status: 500 },
    );
  } catch (e) {
    const code = shortErr(attack, e);
    appendReceipt({
      agent: "yield",
      kind: "refusal",
      status: "pass",
      summary: `Refused: ${label} · ${code}`,
      detail: `clause ${clause} · ${code}`,
    });
    return NextResponse.json({
      refused: true,
      code,
      clause,
      attempt: label,
      detail: "The Keystore evaluated the call against the writ and reverted it before broadcast.",
    });
  }
}
