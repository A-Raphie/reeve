// One agent round: check state against the writ, act only when a threshold
// fires, receipt everything. Checks are free reads; actions are the only gas.
// Runs from GitHub Actions every 15 minutes (Architecture.md).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const AGENT = process.argv[2] ?? "yield";
const AGENTS = {
  rebalancer: { name: "Rebalancer", address: "0x9339950c42E40f54ad4F709ceD0AD2ddd1B7Db21" },
  grid: { name: "Grid", address: "0x88F72e7361afBD8f1cDdC75ac60999dDb56418CC" },
  yield: { name: "Yield", address: "0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22" },
  guard: { name: "Guard", address: "0x0C1E7065F5F20c4A8728F1Ab063fbB1865b0b943" },
};
const RPC = process.env.RPC_URL ?? "https://bsc-testnet-rpc.publicnode.com";
const a = AGENTS[AGENT];

async function rpc(method, params) {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

function readJson(path, fallback) {
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const writs = readJson("ledger/writs.json", []).filter((w) => w.agent === AGENT && w.status === "in force");
const writ = writs.at(-1);
const receipts = readJson("ledger/receipts.json", []);

const balanceWei = await rpc("eth_getBalance", [a.address, "latest"]);
const balance = Number(BigInt(balanceWei)) / 1e18;
const now = new Date().toISOString();

// Decision: with no managed position yet, the correct action is HOLD. The
// strategy engines (PCS ranges, grid ladder, APR routing, health factor)
// attach here as they come online; the receipt proves the round ran.
const decision = "hold";
const summary = writ
  ? `Round complete: ${decision.toUpperCase()} · balance ${balance.toFixed(4)} tBNB · writ ${writ.id} in force`
  : `Round complete: IDLE · balance ${balance.toFixed(4)} tBNB · no writ in force, no action authorized`;

receipts.push({
  ts: now,
  agent: AGENT,
  kind: "check",
  summary,
  status: "pass",
});
writeFileSync("ledger/receipts.json", JSON.stringify(receipts, null, 2));
console.log(summary);
