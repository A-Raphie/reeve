// Wait for the demo wallet to hold tBNB, then redistribute to the four agent wallets and run the spike.
import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from "viem";
import { bscTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { execSync } from "node:child_process";

const demo = JSON.parse(readFileSync(".spike/wallet.json", "utf8"));
const agents = JSON.parse(readFileSync(".spike/agents.json", "utf8"));
const account = privateKeyToAccount(demo.privateKey);
const publicClient = createPublicClient({ chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });
const walletClient = createWalletClient({ account, chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });

console.log(`treasury ${account.address}; polling for funds...`);
let balance = 0n;
const deadline = Date.now() + 9 * 60 * 1000;
while (Date.now() < deadline) {
  balance = await publicClient.getBalance({ address: account.address });
  if (balance > parseEther("0.01")) break;
  await new Promise((r) => setTimeout(r, 5000));
}
if (balance <= parseEther("0.01")) {
  console.log(`still unfunded (${formatEther(balance)} tBNB); aborting for this run`);
  process.exit(2);
}
console.log(`funded: ${formatEther(balance)} tBNB`);

const share = (balance * 75n) / 100n / 4n; // 75% split evenly, 25% stays
for (const [name, w] of Object.entries(agents)) {
  const hash = await walletClient.sendTransaction({ to: w.address, value: share });
  const r = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`${name} ${w.address} += ${formatEther(share)} tBNB  tx ${hash} (${r.status})`);
}
console.log(`treasury keeps ${formatEther(await publicClient.getBalance({ address: account.address }))} tBNB`);

console.log("--- re-running spike end-to-end ---");
execSync("node scripts/altana-spike.mjs", { stdio: "inherit" });
