# Agent Advantage Report

Reeve · 2026-09-07T21:37:55.875Z · BSC testnet (chain 97)

Every task below was executed twice: once hired through the Reeve marketplace (a
signed writ of limits plus a Keystore-registered session key), and once done by
hand with direct chain calls and no marketplace. Times are wall clock, costs
are gas paid by the principal, and the outputs are attached verbatim.

| Task | Category | Agent time | Agent gas | Hand time | Hand gas |
|---|---|---|---|---|---|
| T1 | Yield Optimisation (DeFi) | 2328 ms | 0.00000000 tBNB | 593 ms | 0.00000000 tBNB |
| T3 | Security (writ enforcement) | 1939 ms | 0.00000000 tBNB | 5414 ms | 0.00000210 tBNB |

## T1: Which Venus pool pays the best USDT supply APR right now?

Category: Yield Optimisation (DeFi). Ran at 2026-09-07T21:37:23.242Z.

**Hired through the marketplace** (yield agent hired under writ RW-MTP3WFMY (Altana session, clause I allowlist + clause II cap)): 2328 ms, gas 0.00000000 tBNB.

```
{
  "best": {
    "pool": "Venus GameFi",
    "apr": 0.28331822458079997
  },
  "board": [
    {
      "pool": "Venus DeFi",
      "supplyAprPct": 0.000011,
      "borrowAprPct": 0.300062
    },
    {
      "pool": "Venus GameFi",
      "supplyAprPct": 0.283318,
      "borrowAprPct": 0.853347
    },
    {
      "pool": "Venus StableCoins",
      "supplyAprPct": 0.000001,
      "borrowAprPct": 0.001562
    }
  ],
  "decision": "route",
  "reason": "Venus GameFi pays 0.2833% vs Venus StableCoins 0.0000% · re-supply under writ"
}
```

**Done by hand** (manual one-off: raw eth_call to each market's supplyRatePerBlock, APR computed by hand): 593 ms, gas 0.00000000 tBNB.

```
{
  "best": {
    "pool": "Venus GameFi",
    "supplyAprPct": 0.283318
  },
  "board": [
    {
      "pool": "Venus DeFi",
      "supplyAprPct": 0.000011
    },
    {
      "pool": "Venus GameFi",
      "supplyAprPct": 0.283318
    },
    {
      "pool": "Venus StableCoins",
      "supplyAprPct": 0.000001
    }
  ],
  "decision": "none: a manual check answers once and is stale the next block"
}
```

**Read:** the hand path answers once and is stale the next block; the agent path runs every 15 minutes under a signed writ, and every action it could take is already capped onchain before the first call. Full run data: `ledger/advantage.json`.

## T3: Stop an out-of-scope spend before it happens

Category: Security (writ enforcement). Ran at 2026-09-07T21:38:04.507Z.

**Hired through the marketplace** (out-of-scope send attempted through writ RW-MTP3WFMY (Keystore-registered session)): 1939 ms, gas 0.00000000 tBNB.

```
{
  "executed": false,
  "wasRefused": true,
  "result": "CHAIN REFUSED THE CALL: An error occurred while executing calls.\n\nReason: UnauthorizedCall\n\nDetails: UnauthorizedCall(UnauthorizedCall { keyHash: 0xb8b03a375436900e033c3e45befacbeb920a62b5f67208b67482e32758869813, target: 0x",
  "stranger": "0x000000000000000000000000000000000000dEaD",
  "enforcement": "onchain, by the Keystore: UnauthorizedCall revert, nothing moved"
}
```

**Done by hand** (same out-of-scope send attempted by hand from a bare wallet: no permission layer exists to stop it): 5414 ms, gas 0.00000210 tBNB.

```
{
  "executed": true,
  "result": "THE CALL JUST EXECUTED: tx 0x5544d7b29e7302badb4a18e250d99ab35a45d8b0a88b8a62c66b5d4759571897 (success). Nobody stopped it, because nothing was asked.",
  "stranger": "0x000000000000000000000000000000000000dEaD",
  "enforcement": "none: a bare wallet has no allowlist, no cap, no expiry"
}
```

**Read:** the hand path answers once and is stale the next block; the agent path runs every 15 minutes under a signed writ, and every action it could take is already capped onchain before the first call. Full run data: `ledger/advantage.json`.


## Task T2 (armed): is a USDT/WBNB LP position in range?

Hired through the Rebalancer agent (PancakeSwap V3 USDT/WBNB 0.25%). The range
engine is live and reading the pool every 15 minutes (see the agent's receipt
ledger); the task completes when the first position is minted under a signed
writ, which is gated on the testnet drip to the Rebalancer wallet.
