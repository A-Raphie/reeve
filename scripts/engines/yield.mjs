// Yield engine: USDT supply-APR sweep across the Venus Isolated Pools on
// BSC testnet. Free reads only; the withdraw-and-re-supply action is wired
// but executes only under a live writ with Venus scope.
//
// Pools verified Sep 7 from VenusProtocol/isolated-pools
// deployments/bsctestnet_addresses.json and probed live on chain 97.
import { callWords, word0x } from "./rpc.mjs";

const SEL = {
  supplyRatePerBlock: "0xae9d70b0", // supplyRatePerBlock()
  borrowRatePerBlock: "0xf8f9da28", // borrowRatePerBlock()
  totalSupply: "0x18160ddd", // totalSupply()
};

// BSC testnet: 3s blocks -> 10,512,000 blocks/year.
export const BLOCKS_PER_YEAR = 10_512_000;

export const MARKETS = [
  { pool: "Venus DeFi", vUSDT: "0x80CC30811e362aC9aB857C3d7875CbcCc0b65750" },
  { pool: "Venus GameFi", vUSDT: "0x0bFE4e0B8A2a096A27e5B18b078d25be57C08634" },
  { pool: "Venus StableCoins", vUSDT: "0x3338988d0beb4419Acb8fE624218754053362D06" },
];

const apr = (ratePerBlock) =>
  ratePerBlock > 0n ? (Number(ratePerBlock) * BLOCKS_PER_YEAR) / 1e18 * 100 : 0;

export async function yieldSweep() {
  const rows = [];
  for (const m of MARKETS) {
    const supply = (await callWords(m.vUSDT, SEL.supplyRatePerBlock))[0] ?? 0n;
    const borrow = (await callWords(m.vUSDT, SEL.borrowRatePerBlock))[0] ?? 0n;
    const ts = (await callWords(m.vUSDT, SEL.totalSupply))[0] ?? 0n;
    rows.push({
      pool: m.pool,
      vUSDT: m.vUSDT,
      supplyApr: apr(supply),
      borrowApr: apr(borrow),
      totalSupplyShares: ts.toString(),
    });
  }
  const best = rows.reduce((a, b) => (b.supplyApr > a.supplyApr ? b : a));
  const worst = rows.reduce((a, b) => (b.supplyApr < a.supplyApr ? b : a));
  const spread = best.supplyApr - worst.supplyApr;

  let decision;
  let reason;
  if (rows.some((r) => !isFinite(r.supplyApr))) {
    decision = "hold";
    reason = "market read failed · refusing to reason on bad data";
  } else if (spread <= 0) {
    decision = "hold";
    reason = `all pools at ${best.supplyApr.toFixed(4)}% · no route worth the move cost`;
  } else {
    decision = "route";
    reason = `${best.pool} pays ${best.supplyApr.toFixed(4)}% vs ${worst.pool} ${worst.supplyApr.toFixed(4)}% · re-supply under writ`;
  }

  return {
    engine: "yield",
    protocol: "Venus Isolated Pools · USDT across 3 pools",
    rows,
    best: { pool: best.pool, apr: best.supplyApr },
    spread,
    decision,
    reason,
  };
}

export function yieldSummary(c, balance) {
  const board = c.rows
    .map((r) => `${r.pool} ${r.supplyApr.toFixed(4)}%`)
    .join(" · ");
  return {
    summary: `Round complete: ${c.decision.toUpperCase()} · best ${c.best.pool} ${c.best.apr.toFixed(4)}% APR · balance ${balance.toFixed(4)} tBNB`,
    detail: `${c.protocol} · ${board} · ${c.reason}`,
  };
}
