// Scan local hackathon repos for BSC/EVM private keys, derive addresses, check tBNB balances.
// Prints ONLY addresses + balances — never key material.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, formatEther } from "viem";
import { bscTestnet } from "viem/chains";

const ROOT = "/Users/raphie/Documents/Hackathons";
const seen = new Map(); // key -> source
const pkRe = /^[0-9a-fA-F]{64}$/;

function walk(dir, depth) {
  if (depth > 2) return;
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git" || name.startsWith(".")) {
      if (name === ".env" || name.startsWith(".env")) {
        const f = join(dir, name);
        try {
          for (const line of readFileSync(f, "utf8").split("\n")) {
            const m = line.match(/^(?:[A-Z0-9_]*KEY[A-Z0-9_]*|PRIVATE_KEY[A-Z0-9_]*)\s*=\s*(?:\"|')?(0x)?([0-9a-fA-F]{64})(?:\"|')?\s*$/);
            if (m) {
              const key = "0x" + m[2];
              if (!seen.has(key)) seen.set(key, f.replace(ROOT + "/", ""));
            }
          }
        } catch {}
      }
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, depth + 1);
  }
}
walk(ROOT, 0);

const pc = createPublicClient({ chain: bscTestnet, transport: http("https://bsc-testnet-rpc.publicnode.com") });
console.log(`found ${seen.size} candidate key(s):`);
for (const [key, src] of seen) {
  try {
    const acct = privateKeyToAccount(key);
    const bal = await pc.getBalance({ address: acct.address });
    console.log(`${acct.address}  ${formatEther(bal)} tBNB  <- ${src}`);
  } catch (e) {
    console.log(`bad key in ${src}: ${e.message.slice(0, 50)}`);
  }
}
