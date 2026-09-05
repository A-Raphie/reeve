// Minimal probe: admin execute from an agent wallet whose onchain nonce is still 0.
import { createClient, signerFromPrivateKey, BNB_TESTNET } from "@altananetwork/sdk";
import { readFileSync } from "node:fs";
import { createPublicClient, http, formatEther } from "viem";

const agents = JSON.parse(readFileSync(".spike/agents.json", "utf8"));
const which = process.argv[2] ?? "yield";
const w = agents[which];
const client = createClient({ chains: [BNB_TESTNET], defaultChainId: BNB_TESTNET.chainId });
const wallet = { address: w.address, signer: signerFromPrivateKey(w.privateKey) };
const pc = createPublicClient({ chain: BNB_TESTNET.chain, transport: http(BNB_TESTNET.publicRpcUrl) });
console.log(`${which} ${w.address} nonce ${await pc.getTransactionCount({ address: w.address })} bal ${formatEther(await pc.getBalance({ address: w.address }))}`);
try {
  const r = await client.execute({ wallet, signer: wallet.signer, calls: [{ to: w.address, value: 0n, data: "0x" }] });
  console.log("EXEC OK:", r.transactionHash ?? JSON.stringify(r).slice(0, 200));
} catch (e) {
  console.log("EXEC FAIL:", String(e.message).slice(0, 200));
  if (e.details) console.log("details:", String(e.details).slice(0, 200));
}
