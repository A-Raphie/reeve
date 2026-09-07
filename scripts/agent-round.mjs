// One agent round: check state against the writ, act only when a threshold
// fires, receipt everything. Checks are free protocol reads through the
// strategy engines (scripts/engines/); actions are the only gas and stay
// gated on a live writ. Runs from GitHub Actions every 15 minutes.
import { readFileSync, writeFileSync } from "node:fs";
import { rpc } from "./engines/rpc.mjs";
import { guardCheck, guardSummary } from "./engines/guard.mjs";
import { rebalancerCheck, rebalancerSummary } from "./engines/rebalancer.mjs";

const AGENT = process.argv[2] ?? "yield";
const AGENTS = {
  rebalancer: { name: "Rebalancer", address: "0x9339950c42E40f54ad4F709ceD0AD2ddd1B7Db21" },
  grid: { name: "Grid", address: "0x88F72e7361afBD8f1cDdC75ac60999dDb56418CC" },
  yield: { name: "Yield", address: "0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22" },
  guard: { name: "Guard", address: "0x0C1E7065F5F20c4A8728F1Ab063fbB1865b0b943" },
};
const a = AGENTS[AGENT];

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
const writBit = writ ? ` · writ ${writ.id} in force` : " · no writ in force, no action authorized";

let entry;
try {
  let check;
  let rendered;
  if (AGENT === "guard") {
    check = await guardCheck(a.address);
    rendered = guardSummary(check, balance);
  } else if (AGENT === "rebalancer") {
    check = await rebalancerCheck(a.address);
    rendered = rebalancerSummary(check, balance);
  } else {
    // Grid and Yield engines land with their first funded positions; the
    // balance check still proves the round ran.
    check = null;
  }
  const summary = check
    ? `${rendered.summary}${writBit}`
    : writ
      ? `Round complete: HOLD · balance ${balance.toFixed(4)} tBNB${writBit}`
      : `Round complete: IDLE · balance ${balance.toFixed(4)} tBNB${writBit}`;
  entry = {
    ts: now,
    agent: AGENT,
    kind: "check",
    summary,
    detail: check ? rendered.detail : undefined,
    status: check?.decision === "alert" ? "pending" : "pass",
  };
  if (entry.detail === undefined) delete entry.detail;
} catch (e) {
  // A failed engine read is still a truthful receipt: the round ran, the
  // protocol read did not. Keep the chip neutral, say what failed.
  entry = {
    ts: now,
    agent: AGENT,
    kind: "check",
    summary: `Round complete: IDLE · balance ${balance.toFixed(4)} tBNB · engine read unavailable (${String(e.message ?? e).slice(0, 80)})`,
    status: "pass",
  };
}

receipts.push(entry);
writeFileSync("ledger/receipts.json", JSON.stringify(receipts, null, 2));
console.log(entry.summary);
if (entry.detail) console.log("  " + entry.detail);
