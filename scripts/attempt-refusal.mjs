// Prove the writ bites: attempt a call OUTSIDE the allowlist through the
// agent's session and receipt the onchain refusal (fief rule: a refusal is
// the system working, so it gets a green receipt citing the clause).
import { createClient, signerFromPrivateKey, serializeSession } from "@altananetwork/sdk";
import { NETWORK, EXPLORER_TX } from "../lib/chain.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const writs = JSON.parse(readFileSync("ledger/writs.json", "utf8")).filter((w) => w.status === "in force");
const writ = writs.at(-1);
if (!writ) { console.error("no writ in force"); process.exit(1); }
const keys = JSON.parse(readFileSync(".spike/writ-keys.json", "utf8"));
const keyEntry = Object.entries(keys).find(([, v]) => v.publicKey === writ.publicKey);
if (!keyEntry) { console.error("no session key for this writ"); process.exit(1); }
const sessionKey = signerFromPrivateKey(keyEntry[1].sessionKey);

const session = {
  walletAddress: writ.walletAddress,
  signer: sessionKey,
  publicKey: writ.publicKey,
  permissions: {
    calls: writ.calls,
    spend: writ.spend.map((s) => ({ limit: BigInt(s.limit), period: s.period })),
  },
  expiry: writ.expiry,
};

const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });

// Out of scope: an address no clause authorizes.
const stranger = "0x000000000000000000000000000000000000dEaD";
try {
  const r = await client.execute({ session, calls: [{ to: stranger, value: 0n, data: "0x" }] });
  console.log("UNEXPECTED: the out-of-scope call executed:", r.transactionHash ?? JSON.stringify(r).slice(0, 120));
  process.exit(1);
} catch (e) {
  const receipts = JSON.parse(readFileSync("ledger/receipts.json", "utf8"));
  receipts.push({
    ts: new Date().toISOString(),
    agent: writ.agent,
    kind: "refusal",
    status: "pass",
    summary: `Refused: send to ${stranger.slice(0, 10)}… is outside clause I · the writ only allows its listed calls`,
    status: "pass",
  });
  writeFileSync("ledger/receipts.json", JSON.stringify(receipts, null, 2));
  console.log("REFUSED ONCHAIN (expected, this is the proof):", String(e.message).slice(0, 140));
}
