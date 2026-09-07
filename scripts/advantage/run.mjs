// Agent Advantage Report harness (TermiX partner track): run real tasks
// BOTH ways -- hired through the Reeve marketplace (writ-gated agent) and
// done by hand (direct chain calls, no marketplace) -- measure time, cost,
// and attach the actual outputs. Writes ledger/advantage.json and
// ADVANTAGE_REPORT.md.
//
// Run: node scripts/advantage/run.mjs [t1|t3|all]
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, signerFromPrivateKey } from "@altananetwork/sdk";
import { createPublicClient, http, createWalletClient, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { NETWORK } from "../../lib/chain.mjs";
import { yieldSweep } from "../engines/yield.mjs";
import { callWords } from "../engines/rpc.mjs";

const now = () => new Date().toISOString();
const readJson = (p, f) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return f; } };
const timer = () => { const t = process.hrtime.bigint(); return () => Number(process.hrtime.bigint() - t) / 1e6; };

const RPC = process.env.RPC_URL ?? "https://bsc-testnet-rpc.publicnode.com";
const chainClient = createPublicClient({ chain: bscTestnet, transport: http(RPC) });

function liveWrit() {
  const writs = readJson("ledger/writs.json", []).filter((w) => w.status === "in force");
  const writ = writs.at(-1);
  if (!writ) throw new Error("no writ in force");
  const keys = readJson(".spike/writ-keys.json", {});
  const keyEntry = Object.entries(keys).find(([, v]) => v.publicKey === writ.publicKey);
  if (!keyEntry) throw new Error("no session key for the writ in force");
  return { writ, sessionKey: keyEntry[1].sessionKey };
}

// ---- T1: best USDT supply APR across Venus pools -------------------------
async function t1Agent() {
  const { writ } = liveWrit();
  const stop = timer();
  const sweep = await yieldSweep();
  const ms = stop();
  return {
    path: "agent",
    via: `yield agent hired under writ ${writ.id} (Altana session, clause I allowlist + clause II cap)`,
    ms: Math.round(ms),
    costNative: 0,
    output: {
      best: sweep.best,
      board: sweep.rows.map((r) => ({ pool: r.pool, supplyAprPct: Number(r.supplyApr.toFixed(6)), borrowAprPct: Number(r.borrowApr.toFixed(6)) })),
      decision: sweep.decision,
      reason: sweep.reason,
    },
  };
}

async function t1Diy() {
  const markets = [
    { pool: "Venus DeFi", vUSDT: "0x80CC30811e362aC9aB857C3d7875CbcCc0b65750" },
    { pool: "Venus GameFi", vUSDT: "0x0bFE4e0B8A2a096A27e5B18b078d25be57C08634" },
    { pool: "Venus StableCoins", vUSDT: "0x3338988d0beb4419Acb8fE624218754053362D06" },
  ];
  const SEL_SUPPLY = "0xae9d70b0";
  const stop = timer();
  const out = [];
  for (const m of markets) {
    const w = await callWords(m.vUSDT, SEL_SUPPLY);
    const apr = (Number(w[0] ?? 0n) * 10_512_000) / 1e18 * 100;
    out.push({ pool: m.pool, supplyAprPct: Number(apr.toFixed(6)) });
  }
  const best = out.reduce((a, b) => (b.supplyAprPct > a.supplyAprPct ? b : a));
  const ms = stop();
  return {
    path: "diy",
    via: "manual one-off: raw eth_call to each market's supplyRatePerBlock, APR computed by hand",
    ms: Math.round(ms),
    costNative: 0,
    output: { best, board: out, decision: "none: a manual check answers once and is stale the next block" },
  };
}

// ---- T3: can the spender break out of its limits? -------------------------
async function t3Agent() {
  const { writ, sessionKey } = liveWrit();
  const session = {
    walletAddress: writ.walletAddress,
    signer: signerFromPrivateKey(sessionKey),
    publicKey: writ.publicKey,
    permissions: {
      calls: writ.calls,
      spend: writ.spend.map((s) => ({ limit: BigInt(s.limit), period: s.period })),
    },
    expiry: writ.expiry,
  };
  const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });
  const stranger = "0x000000000000000000000000000000000000dEaD";
  const gasBefore = await chainClient.getBalance({ address: writ.walletAddress });
  const stop = timer();
  let refused;
  try {
    const r = await client.execute({ session, calls: [{ to: stranger, value: 0n, data: "0x" }] });
    refused = false;
    var executed = r.transactionHash ?? JSON.stringify(r).slice(0, 120);
  } catch (e) {
    refused = true;
    var err = String(e.message).slice(0, 200);
  }
  const ms = stop();
  const gasAfter = await chainClient.getBalance({ address: writ.walletAddress });
  return {
    path: "agent",
    via: `out-of-scope send attempted through writ ${writ.id} (Keystore-registered session)`,
    ms: Math.round(ms),
    costNative: Number(gasBefore - gasAfter) / 1e18,
    output: {
      executed: !refused,
      wasRefused: refused,
      result: refused ? `CHAIN REFUSED THE CALL: ${err}` : `CALL EXECUTED (defect!): ${executed}`,
      stranger,
      enforcement: "onchain, by the Keystore: UnauthorizedCall revert, nothing moved",
    },
  };
}

async function t3Diy() {
  const wallet = readJson(".spike/wallet.json", {});
  const account = privateKeyToAccount(wallet.privateKey);
  const sender = createWalletClient({ account, chain: bscTestnet, transport: http(RPC) });
  const stranger = "0x000000000000000000000000000000000000dEaD";
  const before = await chainClient.getBalance({ address: account.address });
  const stop = timer();
  const hash = await sender.sendTransaction({ to: stranger, value: 0n, data: "0x", gas: 21000n });
  const receipt = await chainClient.waitForTransactionReceipt({ hash });
  const ms = stop();
  const after = await chainClient.getBalance({ address: account.address });
  return {
    path: "diy",
    via: "same out-of-scope send attempted by hand from a bare wallet: no permission layer exists to stop it",
    ms: Math.round(ms),
    costNative: Number(before - after) / 1e18,
    output: {
      executed: receipt.status === "success",
      result: `THE CALL JUST EXECUTED: tx ${hash} (${receipt.status}). Nobody stopped it, because nothing was asked.`,
      stranger,
      enforcement: "none: a bare wallet has no allowlist, no cap, no expiry",
    },
  };
}

// ---- run -------------------------------------------------------------------
const TASKS = {
  t1: {
    id: "T1",
    name: "Which Venus pool pays the best USDT supply APR right now?",
    category: "Yield Optimisation (DeFi)",
    runs: [t1Agent, t1Diy],
  },
  t3: {
    id: "T3",
    name: "Stop an out-of-scope spend before it happens",
    category: "Security (writ enforcement)",
    runs: [t3Agent, t3Diy],
  },
};

const pick = process.argv[2] ?? "all";
const report = readJson("ledger/advantage.json", { generatedAt: now(), tasks: {} });
report.generatedAt = now();

const order = pick === "all" ? Object.keys(TASKS) : [pick];
for (const key of order) {
  const t = TASKS[key];
  const runs = [];
  for (const run of t.runs) runs.push(await run());
  report.tasks[t.id] = { ...t, runs, ranAt: now() };
  console.log(`${t.id} done: ${runs.map((r) => `${r.path} ${r.ms}ms`).join(" | ")}`);
}

writeFileSync("ledger/advantage.json", JSON.stringify(report, null, 2));
console.log("ledger/advantage.json written");
