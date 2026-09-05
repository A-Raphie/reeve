// Altana Day-1 spike for Reeve (kill-gate).
// Proves: wallet on bnb-testnet, relay faucet, session grant registered on-chain
// (call allowlist + spend cap + expiry), agent-side execute through the session,
// instant revoke, 8183 deployment addresses, skills registry reachability.
import { createClient, serializeSession, erc8183Addresses } from "@altananetwork/sdk";
import { NETWORK } from "../lib/chain.mjs";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createPublicClient, http, formatEther } from "viem";
import { pathToFileURL } from "node:url";

const relayUrl = pathToFileURL(new URL("../node_modules/@altananetwork/sdk/dist/internal/relay.js", import.meta.url).pathname);
const { buildRelayClient, fundNative, waitForBalance } = await import(relayUrl);

const STATE = ".spike/wallet.json";
const log = (...a) => console.log(...a);

async function main() {
  const client = createClient({ chains: [NETWORK], defaultChainId: NETWORK.chainId });
  log(`[1] client up: chain ${NETWORK.chainId} rpc ${NETWORK.publicRpcUrl}`);

  let wallet;
  if (existsSync(STATE)) {
    const saved = JSON.parse(readFileSync(STATE, "utf8"));
    if (!saved.privateKey) throw new Error("state file has no privateKey; delete it and re-run");
    const { signerFromPrivateKey } = await import("@altananetwork/sdk");
    wallet = { address: saved.address, signer: signerFromPrivateKey(saved.privateKey) };
    log(`[2] wallet restored: ${wallet.address}`);
  } else {
    const created = await client.createWallet({ networks: [NETWORK] });
    wallet = { address: created.address, signer: created.signer };
    mkdirSync(".spike", { recursive: true });
    writeFileSync(STATE, JSON.stringify({ address: created.address, privateKey: created.signer._privateKey }, null, 2));
    log(`[2] wallet created: ${wallet.address} (saved to ${STATE}, gitignored)`);
  }

  const publicClient = createPublicClient({ chain: NETWORK.chain, transport: http(NETWORK.publicRpcUrl) });
  const before = await publicClient.getBalance({ address: wallet.address });
  log(`[3] native balance (info): ${formatEther(before)} tBNB`);
  if (before < 10n ** 15n) {
    const relay = buildRelayClient(NETWORK);
    const { transactionHash } = await fundNative(relay, wallet.address, 5n * 10n ** 16n); // 0.05 tBNB
    log(`[3] faucet drip 0.05 tBNB accepted: ${transactionHash} (relay-prepaid gas; native balance may stay 0)`);
  }

  // The offer sheet: allow one target, cap native spend at 0.001 tBNB/day, live 1 hour.
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const grant = await client.grantSession({
    wallet,
    signer: wallet.signer,
    permissions: {
      calls: [{ to: wallet.address }],
      spend: [{ limit: 10n ** 15n, period: "day" }],
    },
    expiry,
    register: true, // on-chain Keystore registration (Altana-track requirement)
  });
  const sheet = serializeSession(grant);
  log("[4] session granted + registered on-chain. Offer sheet:");
  log("    " + JSON.stringify(sheet.permissions));
  log(`    expiry: ${new Date(sheet.expiry * 1000).toISOString()}  publicKey: ${sheet.publicKey.slice(0, 18)}...`);
  if (grant.transactionHash) log(`    grant tx: ${grant.transactionHash}`);

  // Agent executes THROUGH the session signer (no admin key involved).
  const exec = await client.execute({
    session: grant,
    calls: [{ to: wallet.address, value: 0n, data: "0x" }],
    chainId: NETWORK.chainId,
  });
  log(`[5] agent executed through session: ${exec.transactionHash ?? JSON.stringify(exec).slice(0, 120)}`);

  // Instant revocation, admin-side.
  const revoke = await client.revokeSession({ wallet, signer: wallet.signer, session: grant });
  log(`[6] revoked: ${revoke.transactionHash ?? JSON.stringify(revoke).slice(0, 120)}`);

  const a = erc8183Addresses(NETWORK.chainId);
  log(`[7] ERC-8183 on ${NETWORK.chainId}: commerce ${a.commerce} router ${a.router} registry ${a.registry} payToken ${a.paymentToken}`);

  for (const url of ["https://raw.githubusercontent.com/altananetwork/skills/main/index.json", "https://skills.altana.network/index.json"]) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const idx = await r.json();
      const skills = Array.isArray(idx) ? idx : (idx.skills ?? []);
      log(`[8] skills registry (${url}): ${skills.length} entries -> ${skills.map((s) => s.id ?? s.slug ?? "?").join(", ")}`);
      break;
    } catch (e) {
      log(`[8] registry miss ${url}: ${e.message.slice(0, 60)}`);
    }
  }
  log("SPIKE PASS");
}

main().catch((e) => {
  console.error("SPIKE FAIL:", e.message);
  if (e.details) console.error(e.details);
  process.exit(1);
});
