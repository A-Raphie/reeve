// Grant a real demo writ on an agent wallet and persist it to the ledger the
// landing page reads. No mocks: the serial, tx hash, cap and expiry are real.
import { createClient, signerFromPrivateKey, createPrivateKeySigner, serializeSession } from "@altananetwork/sdk";
import { NETWORK, EXPLORER_TX } from "../lib/chain.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const agents = JSON.parse(readFileSync(".spike/agents.json", "utf8"));
const which = process.argv[2] ?? "yield";
const w = agents[which];

const CAP_USDT = 50; // clause II: daily spend cap
const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });
const wallet = { address: w.address, signer: signerFromPrivateKey(w.privateKey) };

const sessionKey = createPrivateKeySigner();
const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // one week
const grant = await client.grantSession({
  wallet,
  signer: wallet.signer,
  sessionSigner: sessionKey,
  permissions: {
    calls: [{ to: wallet.address }],
    spend: [{ limit: BigInt(CAP_USDT) * 10n ** 18n, period: "day" }],
  },
  expiry,
  register: true,
});

const sheet = serializeSession(grant);
const entry = {
  id: `RW-${Date.now().toString(36).toUpperCase()}`,
  agent: which,
  agentAddress: w.address,
  walletAddress: sheet.walletAddress,
  publicKey: sheet.publicKey,
  calls: sheet.permissions.calls,
  spend: sheet.permissions.spend,
  expiry: sheet.expiry,
  grantTx: grant.transactionHash ?? null,
  explorerTx: grant.transactionHash ? EXPLORER_TX(grant.transactionHash) : null,
  status: grant.transactionHash ? "in force" : "pending",
  grantedAt: new Date().toISOString(),
  sessionKey: sessionKey._privateKey,
};

const { sessionKey: _sk, ...ledgerEntry } = entry;
mkdirSync("ledger", { recursive: true });
const path = "ledger/writs.json";
const prior = readFileSync(path, "utf8").trim() ? JSON.parse(readFileSync(path, "utf8")) : [];
const next = [...prior.filter((x) => x.agent !== which || x.status === "void"), ledgerEntry];
writeFileSync(path, JSON.stringify(next, null, 2));
mkdirSync(".spike", { recursive: true });
const keysPath = ".spike/writ-keys.json";
const keys = readFileSync(keysPath, "utf8").trim() ? JSON.parse(readFileSync(keysPath, "utf8")) : {};
keys[entry.id] = { agent: which, sessionKey: sessionKey._privateKey, publicKey: entry.publicKey };
writeFileSync(keysPath, JSON.stringify(keys, null, 2));
console.log(`writ ${entry.id} granted for ${which}: ${entry.explorerTx ?? "(bundled)"} (key stored in ${keysPath})`);
