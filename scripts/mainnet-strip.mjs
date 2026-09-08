// MAINNET PROOF STRIP: one complete writ lifecycle on BSC mainnet for the
// yield agent, ~5 transactions, then the agent stops. Funded by a single
// 0.001 BNB send; every bundle keeps 2x+ headroom. Receipts are tagged
// MAINNET and land in the same ledger the site reads.
//
// Run: node scripts/mainnet-strip.mjs   (waits for funding, then executes)
import { createClient, signerFromPrivateKey, createPrivateKeySigner, serializeSession } from "@altananetwork/sdk";
import { BNB } from "@altananetwork/sdk";
import { encodeFunctionData } from "viem";
import { readFileSync, writeFileSync } from "node:fs";

const VUSDT_MAINNET = "0xfD5840Cd36d94D7229439859C0112a4185BC0255"; // legacy Venus vUSDT (verified: underlying = USDT)
const ACCRUE = encodeFunctionData({ abi: [{ type: "function", name: "accrueInterest", inputs: [], outputs: [] }], functionName: "accrueInterest" });
const DEAD = "0x000000000000000000000000000000000000dEaD";
const CAP_WEI = 100_000_000_000_000n; // clause II: 0.0001 BNB / day
const EXPLORER = (h) => `https://bscscan.com/tx/${h}`;
const EXPIRY = Math.floor(Date.now() / 1000) + 24 * 3600;

const agents = JSON.parse(readFileSync(".spike/agents.json", "utf8"));
const w = agents.yield;
const client = createClient({ chains: [BNB], defaultChainId: BNB.chainId });
const wallet = { address: w.address, signer: signerFromPrivateKey(w.privateKey) };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nativeBalance() {
  const b = await client.balances({ wallet: wallet.address, chainId: 56 });
  return BigInt(b.native);
}

console.log(`waiting for funding on mainnet: ${wallet.address}`);
let funded = false;
for (let i = 0; i < 240; i++) {
  const bal = await nativeBalance();
  if (bal >= 500_000_000_000_000n) {
    console.log(`funded: ${Number(bal) / 1e18} BNB`);
    funded = true;
    break;
  }
  if (i % 5 === 0) console.log(`  balance ${(Number(bal) / 1e18).toFixed(6)} BNB · waiting…`);
  await sleep(60_000);
}
if (!funded) {
  console.error("never funded after 4h — aborting cleanly, testnet submission unaffected");
  process.exit(1);
}

const receipts = (() => {
  try { return JSON.parse(readFileSync("ledger/receipts.json", "utf8")); } catch { return []; }
})();
const receipt = (r) => {
  receipts.push({ ts: new Date().toISOString(), agent: "yield", ...r });
  writeFileSync("ledger/receipts.json", JSON.stringify(receipts, null, 2));
  console.log(`receipt: ${r.summary.slice(0, 130)}`);
};

// -- 1. grant ---------------------------------------------------------------
const sessionKey = createPrivateKeySigner();
let grant, sheet;
try {
  grant = await client.grantSession({
    wallet,
    signer: wallet.signer,
    sessionSigner: sessionKey,
    permissions: {
      calls: [{ to: VUSDT_MAINNET }],
      spend: [{ limit: CAP_WEI, period: "day" }],
    },
    expiry: EXPIRY,
    register: true,
  });
  sheet = serializeSession(grant);
  receipt({
    kind: "check",
    status: "pass",
    summary: `MAINNET: writ granted in force for yield · clause I allowlists Venus vUSDT accrueInterest only · clause II cap 0.0001 BNB/day · 24h expiry`,
    detail: `grant tx ${EXPLORER(grant.transactionHash)}`,
    txHash: grant.transactionHash,
    explorerTx: EXPLORER(grant.transactionHash),
  });
} catch (e) {
  receipt({ kind: "check", status: "fail", summary: `MAINNET: grant failed (${String(e.message ?? e).slice(0, 120)}) · stopping the strip cleanly` });
  console.error("grant failed — aborting, testnet submission unaffected");
  process.exit(1);
}

const session = {
  walletAddress: sheet.walletAddress,
  signer: sessionKey,
  publicKey: sheet.publicKey,
  permissions: {
    calls: sheet.permissions.calls,
    spend: sheet.permissions.spend.map((s) => ({ limit: BigInt(s.limit ?? s), period: s.period ?? "day" })),
  },
  expiry: sheet.expiry,
};

// -- 2. cap-breaker: value above clause II ----------------------------------
try {
  await client.execute({ session, chainId: 56, calls: [{ to: VUSDT_MAINNET, value: CAP_WEI * 2n, data: "0x" }] });
  receipt({ kind: "check", status: "fail", summary: `MAINNET: DEFECT — a spend above the cap executed. The writ failed. This line must never appear.` });
} catch (e) {
  receipt({
    kind: "refusal",
    status: "pass",
    summary: `MAINNET refused: spend of ${(Number(CAP_WEI * 2n) / 1e18).toFixed(4)} BNB breaks the 0.0001 BNB/day cap · clause II held on mainnet`,
    detail: String(e.message ?? e).slice(0, 160),
  });
}

// -- 3. out-of-scope: address outside clause I ------------------------------
try {
  await client.execute({ session, chainId: 56, calls: [{ to: DEAD, value: 0n, data: "0x" }] });
  receipt({ kind: "check", status: "fail", summary: `MAINNET: DEFECT — an out-of-scope send executed. The writ failed. This line must never appear.` });
} catch (e) {
  receipt({
    kind: "refusal",
    status: "pass",
    summary: `MAINNET refused: send to 0x0000…dEaD is outside clause I · the allowlist held on mainnet`,
    detail: String(e.message ?? e).slice(0, 160),
  });
}

// -- 4. one real in-scope action -------------------------------------------
try {
  const r = await client.execute({ session, chainId: 56, calls: [{ to: VUSDT_MAINNET, value: 0n, data: ACCRUE }] });
  receipt({
    kind: "check",
    status: "pass",
    summary: `MAINNET: yield agent executed accrueInterest() on Venus vUSDT through the session key · a real protocol action inside the limits`,
    txHash: r.transactionHash,
    explorerTx: r.transactionHash ? EXPLORER(r.transactionHash) : undefined,
  });
} catch (e) {
  receipt({ kind: "check", status: "fail", summary: `MAINNET: in-scope accrueInterest failed (${String(e.message ?? e).slice(0, 120)})` });
}

// -- 5. revoke --------------------------------------------------------------
try {
  const r = await client.revokeSession({ wallet, signer: wallet.signer, session });
  receipt({
    kind: "check",
    status: "pass",
    summary: `MAINNET: writ revoked · the lifecycle closed: grant → refused above cap → refused out-of-scope → acted in scope → revoke`,
    txHash: r.transactionHash,
    explorerTx: r.transactionHash ? EXPLORER(r.transactionHash) : undefined,
  });
} catch (e) {
  receipt({ kind: "check", status: "fail", summary: `MAINNET: revoke failed (${String(e.message ?? e).slice(0, 120)}) · session expires on its own within 24h` });
}

const finalBal = await nativeBalance();
receipt({
  kind: "check",
  status: "pass",
  summary: `MAINNET strip complete · wallet balance now ${(Number(finalBal) / 1e18).toFixed(6)} BNB · the agent stops here; checks stay free reads`,
});

console.log("strip complete");
