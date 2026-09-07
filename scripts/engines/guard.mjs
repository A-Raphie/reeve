// Guard engine: health-factor monitoring against Venus Isolated Pools on
// BSC testnet (StableCoins pool). Free reads only; the deleverage action is
// wired but executes only under a live writ with Venus scope (clause I/II).
//
// Deployments verified Sep 7 from VenusProtocol/isolated-pools
// deployments/bsctestnet_addresses.json, then probed live on chain 97.
import { callWords, encodeAddress, word0x } from "./rpc.mjs";

export const VENUS = {
  pool: "DeFi",
  comptroller: "0x23a73971A6B9f6580c048B9CB188869B2A2aA2aD",
  vUSDT: "0x80CC30811e362aC9aB857C3d7875CbcCc0b65750",
};

// keccak selectors computed with viem (scripts/engines selector probe)
const SEL = {
  getAssetsIn: "0xabfceffc", // getAssetsIn(address)
  getAccountLiquidity: "0x5ec88c79", // getAccountLiquidity(address)
  markets: "0x8e8f294b", // markets(address) -> (bool, uint256, uint256)
  underlying: "0x6f307dc3", // underlying()
  exchangeRateStored: "0x182df0f5", // exchangeRateStored()
  supplyRatePerBlock: "0xae9d70b0", // supplyRatePerBlock()
  borrowRatePerBlock: "0xf8f9da28", // borrowRatePerBlock()
  accountTokens: "0xa19d1460", // accountTokens(address)
  borrowBalanceStored: "0x95dd9193", // borrowBalanceStored(address)
};

export const GUARD_LINES = { warning: 1.75, danger: 1.5 };

export async function guardCheck(account) {
  const C = VENUS.comptroller;
  const V = VENUS.vUSDT;

  const assetsIn = (await callWords(C, word0x(SEL.getAssetsIn, encodeAddress(account))))
    .map((w) => "0x" + w.toString(16).padStart(40, "0").slice(-40));
  const liq = await callWords(C, word0x(SEL.getAccountLiquidity, encodeAddress(account)));
  const market = await callWords(C, word0x(SEL.markets, encodeAddress(V)));
  const rates = {
    supply: Number(await callWords(V, SEL.supplyRatePerBlock).then((w) => w[0] ?? 0n)),
    borrow: Number(await callWords(V, SEL.borrowRatePerBlock).then((w) => w[0] ?? 0n)),
  };

  const isListed = market.length > 0 && market[0] === 1n;
  const cf = market.length > 1 ? Number(market[1]) / 1e18 : null;
  // Isolated-pools HF semantics: liquidity is computed against the
  // liquidation threshold (live-verified Sep 7: DeFi pool vUSDT CF 0.8,
  // LT 0.88; the StableCoins pool lists CF 0 markets).
  const lt = market.length > 2 ? Number(market[2]) / 1e18 : null;
  const hfThreshold = lt ?? cf;

  const inScope = assetsIn.map((a) => a.toLowerCase()).includes(V.toLowerCase());
  let supply = 0;
  let borrow = 0;
  let hf = null;
  if (inScope) {
    const tokens = (await callWords(V, word0x(SEL.accountTokens, encodeAddress(account))))[0] ?? 0n;
    const borrowRaw = (await callWords(V, word0x(SEL.borrowBalanceStored, encodeAddress(account))))[0] ?? 0n;
    const xr = (await callWords(V, SEL.exchangeRateStored))[0] ?? 0n;
    supply = Number((tokens * xr) / 10n ** 18n) / 1e18;
    borrow = Number(borrowRaw) / 1e18;
    if (borrow > 0 && hfThreshold) hf = (supply * hfThreshold) / borrow;
  }

  const liquidity = Number(liq[1] ?? 0n) / 1e18;
  const shortfall = Number(liq[2] ?? 0n) / 1e18;

  let decision;
  let reason;
  if (!isListed) {
    decision = "hold";
    reason = `market read failed on ${VENUS.pool} pool · refusing to reason on bad data`;
  } else if (!inScope || (borrow === 0 && supply === 0)) {
    decision = "hold";
    reason = `no position in scope · ${VENUS.pool} pool live, ${assetsIn.length} assets entered`;
  } else if (hf === null) {
    decision = "hold";
    reason = `collateral supplied, zero debt · nothing to guard`;
  } else if (hf < GUARD_LINES.danger) {
    decision = "deleverage";
    reason = `HF ${hf.toFixed(2)} below danger line ${GUARD_LINES.danger} · repay minimum under writ`;
  } else if (hf < GUARD_LINES.warning) {
    decision = "alert";
    reason = `HF ${hf.toFixed(2)} below warning line ${GUARD_LINES.warning} · watching every round`;
  } else {
    decision = "hold";
    reason = `HF ${hf.toFixed(2)} above warning line ${GUARD_LINES.warning}`;
  }

  return {
    engine: "guard",
    protocol: `Venus Isolated Pools · ${VENUS.pool}`,
    comptroller: C,
    market: { vUSDT: V, isListed, collateralFactor: cf, liquidationThreshold: lt },
    ratesPerBlock: rates,
    position: { inScope, supply, borrow, healthFactor: hf },
    accountLiquidity: { liquidity, shortfall },
    assetsInCount: assetsIn.length,
    decision,
    reason,
  };
}

export function guardSummary(c, balance) {
  const pos = c.position;
  const posBit =
    pos.healthFactor !== null
      ? `HF ${pos.healthFactor.toFixed(2)}`
      : pos.inScope
        ? "no debt"
        : "no position";
  const hfBit =
    c.decision === "alert" || c.decision === "deleverage" ? ` · ${c.reason}` : ` · ${c.reason}`;
  return {
    summary: `Round complete: ${c.decision.toUpperCase()} · Venus ${posBit} · balance ${balance.toFixed(4)} tBNB`,
    detail: `${c.protocol} · supply ${pos.supply.toFixed(2)} borrow ${pos.borrow.toFixed(2)} · CF ${c.market.collateralFactor ?? "-"} · comptroller ${c.comptroller.slice(0, 10)}…`,
  };
}
