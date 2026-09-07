// Rebalancer engine: PancakeSwap V3 USDT/WBNB range monitoring on BSC testnet.
// Free reads only; the remove-and-re-mint action is wired but executes only
// under a live writ with PancakeSwap scope (clause I/II).
//
// Deployment verified Sep 7 from pancakeswap/pancake-subgraph
// config/chapel.js (v3 factory + nonfungiblePositionManager) and confirmed
// live: factory.getPool(USDT, WBNB, 2500) returns the pool the subgraph
// itself indexes as wNativeStablePoolAddress.
import { callWords, encodeAddress, word0x } from "./rpc.mjs";

export const PCS_V3 = {
  factory: "0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865",
  positionManager: "0x427bf5b37357632377ecbec9de3626c71a5396c1",
  pool: "0x5147173E452AE4dd23dcEe7BaAaaAB7318F16F6B",
  usdt: "0x828e3fc56dd48e072e3b6f3c4fd4ddb4733c2c5e",
  wbnb: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  fee: 2500,
};

// keccak selectors computed with viem
const SEL = {
  balanceOf: "0x70a08231", // balanceOf(address)
  slot0: "0x3850c7bd", // slot0()
};

export async function rebalancerCheck(account) {
  const P = PCS_V3.pool;

  // slot0(): words[0] = sqrtPriceX96, words[1] = tick (signed)
  const s0 = await callWords(P, SEL.slot0);
  const sqrtPriceX96 = s0[0] ?? 0n;
  const tick = s0.length > 1 ? BigInt.asIntN(24, s0[1]) : null;

  const positionCount = Number(
    (await callWords(PCS_V3.positionManager, word0x(SEL.balanceOf, encodeAddress(account))))[0] ?? 0n,
  );

  // The pool pair is USDT (token0) / WBNB (token1): price from tick is
  // token1-per-token0, i.e. WBNB per USDT. Inverted for the human line.
  let wbnbPerUsdt = null;
  if (tick !== null) wbnbPerUsdt = Math.pow(1.0001, Number(tick));

  let decision;
  let reason;
  if (tick === null || sqrtPriceX96 === 0n) {
    decision = "hold";
    reason = "pool read failed · refusing to reason on bad data";
  } else if (positionCount === 0) {
    decision = "hold";
    reason = `no position in scope · USDT/WBNB 0.25% pool live at tick ${tick}`;
  } else {
    // Range math activates when the first position is minted under a writ;
    // out-of-range then becomes decision "rebalance".
    decision = "hold";
    reason = `position held · range check pending first mint under writ`;
  }

  return {
    engine: "rebalancer",
    protocol: "PancakeSwap V3 · USDT/WBNB 0.25%",
    pool: P,
    positionManager: PCS_V3.positionManager,
    poolState: { sqrtPriceX96: sqrtPriceX96.toString(), tick: tick === null ? null : Number(tick), wbnbPerUsdt },
    positionCount,
    decision,
    reason,
  };
}

export function rebalancerSummary(c, balance) {
  const priceBit =
    c.poolState.wbnbPerUsdt !== null
      ? `1 USDT = ${c.poolState.wbnbPerUsdt.toExponential(3)} WBNB`
      : "price read failed";
  return {
    summary: `Round complete: ${c.decision.toUpperCase()} · PCS ${priceBit} · balance ${balance.toFixed(4)} tBNB`,
    detail: `${c.protocol} · tick ${c.poolState.tick} · sqrtPriceX96 ${c.poolState.sqrtPriceX96} · positions ${c.positionCount} · ${c.reason}`,
  };
}
