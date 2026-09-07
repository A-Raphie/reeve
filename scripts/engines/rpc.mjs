// Minimal JSON-RPC for the dependency-free round engines (GitHub Actions has
// no npm install step; see the CI fix in Memory.md). Function selectors are
// precomputed with viem at authoring time and embedded as constants.
export const RPC_URL = process.env.RPC_URL ?? "https://bsc-testnet-rpc.publicnode.com";

export async function rpc(method, params, attempt = 0) {
  try {
    const r = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message ?? JSON.stringify(j.error).slice(0, 120));
    return j.result;
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500));
      return rpc(method, params, attempt + 1);
    }
    throw e;
  }
}

// eth_call helper: calldata -> array of 32-byte BigInt words
export async function callWords(to, data) {
  const raw = await rpc("eth_call", [{ to, data }, "latest"]);
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (hex.length === 0) return [];
  const words = [];
  for (let i = 0; i < hex.length; i += 64) words.push(BigInt("0x" + hex.slice(i, i + 64)));
  return words;
}

export function encodeAddress(a) {
  return "000000000000000000000000" + a.toLowerCase().replace(/^0x/, "");
}

export function word0x(selector, ...encodedArgs) {
  return selector + encodedArgs.join("");
}
