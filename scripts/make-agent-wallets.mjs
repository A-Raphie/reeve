// Create the four agent wallets (counterfactual registration via relay, no gas needed).
// Prints addresses only; keys stored locally in .spike/agents.json (gitignored).
import { createClient, BNB_TESTNET } from "@altananetwork/sdk";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const STATE = ".spike/agents.json";
const AGENTS = ["rebalancer", "grid", "yield", "guard"];

const existing = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const client = createClient({ chains: [BNB_TESTNET], defaultChainId: BNB_TESTNET.chainId });
const out = { ...existing };

for (const name of AGENTS) {
  if (out[name]) continue;
  const w = await client.createWallet({ networks: [BNB_TESTNET] });
  out[name] = { address: w.address, privateKey: w.signer._privateKey };
  console.log(`${name}: ${w.address}`);
}
mkdirSync(".spike", { recursive: true });
writeFileSync(STATE, JSON.stringify(out, null, 2));
console.log(`saved ${Object.keys(out).length}/4 -> ${STATE}`);
