// Full session loop on a clean (nonce-unspent) wallet: grant registered session -> agent execute -> revoke.
import { createClient, signerFromPrivateKey, createPrivateKeySigner, serializeSession } from "@altananetwork/sdk";
import { NETWORK } from "../lib/chain.mjs";
import { readFileSync } from "node:fs";

const agents = JSON.parse(readFileSync(".spike/agents.json", "utf8"));
const w = agents[process.argv[2] ?? "yield"];
const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });
const wallet = { address: w.address, signer: signerFromPrivateKey(w.privateKey) };

// The offer sheet: allow one target, cap native spend at 0.0002 tBNB/day, live 1 hour, registered on-chain.
const sessionKey = createPrivateKeySigner();
const expiry = Math.floor(Date.now() / 1000) + 3600;
const grant = await client.grantSession({
  wallet,
  signer: wallet.signer,
  sessionSigner: sessionKey,
  permissions: {
    calls: [{ to: wallet.address }],
    spend: [{ limit: 2n * 10n ** 14n, period: "day" }],
  },
  expiry,
  register: true,
});
const sheet = serializeSession(grant);
console.log("[grant] registered on-chain");
console.log("        calls:", JSON.stringify(sheet.permissions.calls));
console.log("        spend:", JSON.stringify(sheet.permissions.spend));
console.log("        expiry:", new Date(sheet.expiry * 1000).toISOString());
console.log("        tx:", grant.transactionHash ?? "(bundled)");
console.log("        sessionPublicKey:", sheet.publicKey.slice(0, 20) + "...");

const exec = await client.execute({
  session: grant,
  calls: [{ to: wallet.address, value: 0n, data: "0x" }],
});
console.log("[agent execute through session] tx:", exec.transactionHash ?? JSON.stringify(exec).slice(0, 120));

const revoke = await client.revokeSession({ wallet, signer: wallet.signer, session: grant });
console.log("[revoke] tx:", revoke.transactionHash ?? JSON.stringify(revoke).slice(0, 120));
console.log("SESSION LOOP PASS");
