// Debug ladder: (a) admin execute trivial call, (b) grantSession with explicit sessionSigner, (c) session execute.
import { createClient, createPrivateKeySigner, signerFromPrivateKey, BNB_TESTNET, serializeSession } from "@altananetwork/sdk";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const STATE = ".spike/wallet.json";
const SESSION_STATE = ".spike/session.json";
const log = (...a) => console.log(...a);

async function main() {
  const client = createClient({ chains: [BNB_TESTNET], defaultChainId: BNB_TESTNET.chainId });
  const saved = JSON.parse(readFileSync(STATE, "utf8"));
  const wallet = { address: saved.address, signer: signerFromPrivateKey(saved.privateKey) };
  log(`wallet ${wallet.address}`);

  // (a) admin execute: deploy + trivial self-call
  try {
    const r = await client.execute({
      wallet,
      signer: wallet.signer,
      calls: [{ to: wallet.address, value: 0n, data: "0x" }],
    });
    log(`(a) ADMIN EXEC OK: ${r.transactionHash ?? JSON.stringify(r).slice(0, 100)}`);
  } catch (e) {
    log(`(a) ADMIN EXEC FAIL: ${e.message.slice(0, 300)}`);
    if (e.details) log("    details:", String(e.details).slice(0, 300));
    if (e.reason) log("    reason:", String(e.reason));
  }

  // (b) grant with explicit, persisted session key
  const sessionKey = existsSync(SESSION_STATE)
    ? signerFromPrivateKey(JSON.parse(readFileSync(SESSION_STATE, "utf8")).key)
    : createPrivateKeySigner();
  if (!existsSync(SESSION_STATE)) {
    mkdirSync(".spike", { recursive: true });
    writeFileSync(SESSION_STATE, JSON.stringify({ key: sessionKey._privateKey }, null, 2));
  }
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  try {
    const grant = await client.grantSession({
      wallet,
      signer: wallet.signer,
      sessionSigner: sessionKey,
      permissions: {
        calls: [{ to: wallet.address }],
        spend: [{ limit: 10n ** 15n, period: "day" }],
      },
      expiry,
      register: true,
    });
    writeFileSync(SESSION_STATE, JSON.stringify({ key: sessionKey._privateKey, session: serializeSession(grant) }, null, 2));
    log(`(b) GRANT OK  tx: ${grant.transactionHash ?? "none"}  publicKey: ${grant.publicKey.slice(0, 18)}...`);

    // (c) agent-side execute through the session
    try {
      const r2 = await client.execute({
        session: grant,
        calls: [{ to: wallet.address, value: 0n, data: "0x" }],
      });
      log(`(c) SESSION EXEC OK: ${r2.transactionHash ?? JSON.stringify(r2).slice(0, 100)}`);
    } catch (e2) {
      log(`(c) SESSION EXEC FAIL: ${e2.message.slice(0, 300)}`);
      if (e2.details) log("    details:", String(e2.details).slice(0, 300));
    }
  } catch (e) {
    log(`(b) GRANT FAIL: ${e.message.slice(0, 300)}`);
    if (e.details) log("    details:", String(e.details).slice(0, 300));
    if (e.reason) log("    reason:", String(e.reason));
  }
}

main().catch((e) => {
  console.error("DEBUG FAIL:", e.message);
  process.exit(1);
});
