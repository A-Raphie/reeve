// Free MAINNET reads: real BNB Smart Chain mainnet state costs nothing to
// read, so every round the agents also look at live mainnet markets. These
// are reads only -- every action stays on BSC testnet under signed writs,
// and receipts say so. Deployments verified from VenusProtocol/isolated-pools
// deployments/bscmainnet_addresses.json and pancakeswap/pancake-subgraph
// config/bsc.js.
import { callWords, MAINNET_RPC_URL, word0x } from "./rpc.mjs";

export const MAINNET = {
  venus: {
    pools: [
      // Legacy Venus core: real live supply yield (0.419% verified Sep 8).
      // Address from VenusProtocol/venus-protocol deployments/bscmainnet.json
      // (contracts.vUSDT.address), on-chain confirmed: underlying = USDT.
      { pool: "Venus vUSDT", vUSDT: "0xfD5840Cd36d94D7229439859C0112a4185BC0255" },
      // Isolated-pools deployments (VenusProtocol/isolated-pools
      // deployments/bscmainnet_addresses.json): fresh pools, currently 0%.
      { pool: "Venus DeFi", vUSDT: "0x1D8bBDE12B6b34140604E18e9f9c6e14deC16854" },
      { pool: "Venus GameFi", vUSDT: "0x4978591f17670A846137d9d613e333C38dc68A37" },
    ],
  },
  pcs: {
    pool: "0x36696169c63e42cd08ce11f5deebbcebae652050", // WBNB-USDT 0.05% (V3)
    usdt: "0x55d398326f99059fF775485246999027B3197955",
    wbnb: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  },
};

const SEL = {
  supplyRatePerBlock: "0xae9d70b0", // supplyRatePerBlock()
  slot0: "0x3850c7bd", // slot0()
};

// BSC mainnet: 3s blocks -> 10,512,000 blocks/year.
const BLOCKS_PER_YEAR = 10_512_000;

export async function mainnetSnapshot() {
  const aprs = [];
  for (const p of MAINNET.venus.pools) {
    const w = await callWords(p.vUSDT, SEL.supplyRatePerBlock, MAINNET_RPC_URL);
    const apr = (Number(w[0] ?? 0n) * BLOCKS_PER_YEAR) / 1e18 * 100;
    aprs.push({ pool: p.pool, supplyAprPct: Number(apr.toFixed(4)) });
  }
  // slot0 words[0] = sqrtPriceX96; USDT is token0 -> WBNB per USDT = (sp/2^96)^2
  const s0 = await callWords(MAINNET.pcs.pool, SEL.slot0, MAINNET_RPC_URL);
  const sp = s0[0] ?? 0n;
  const usdtPerWbnb = sp > 0n ? (Number(sp) / 2 ** 96) ** -2 : null;
  return {
    venusAprs: aprs,
    bestMainnetApr: aprs.reduce((a, b) => (b.supplyAprPct > a.supplyAprPct ? b : a), aprs[0]),
    usdtPerWbnb: usdtPerWbnb === null ? null : Number(usdtPerWbnb.toFixed(2)),
  };
}

export function mainnetLine(s) {
  if (!s) return "";
  const aprs = s.venusAprs.map((a) => a.pool).join(" / ");
  const price = s.usdtPerWbnb !== null ? ` · PCS USDT/WBNB $${s.usdtPerWbnb}` : "";
  return ` · MAINNET READ: ${aprs}${price}`;
}
