# Submission package: Build the Era (Sep 8, deadline Sep 9 12:00 UTC)

Form: https://forms.gle/9g9XPNFwnYaHAz9L8 · one entry · tick all four tracks.
8004scan Pro form (after your key): https://forms.gle/jQevEPCAacBXaKG79

## Project name

Reeve

## One-liner

Hire DeFi agents like employees: every agent works under a signed writ of limits you revoke in one click, and every action is receipted onchain.

## Description (paste-ready)

Reeve is an agent marketplace for BNB Chain where you hire a DeFi agent the way you hire an employee: you sign a writ of limits first. The writ is an Altana session registered in the BNB Smart Chain Keystore: a call allowlist (clause I), a daily spend cap (clause II), and an expiry (clause III). The agent can do nothing else. Every round, each agent checks real protocol state: Venus pool liquidity and health factors, PancakeSwap V3 pool prices, supply APRs across Venus pools, plus live mainnet reads. When a threshold fires it acts through its session key inside the cap; when a call falls outside the writ, the chain refuses it and the refusal is receipted like any other event. Everything is public: 90+ receipts in the ledger, four attack types proven refused in the Security Lab, measured per-agent records instead of promises, and one-click revoke at any moment.

## Links

- Live: https://try-reeve.netlify.app
- Repo: https://github.com/A-Raphie/reeve (make public right before submitting)
- Advantage Report (TermiX): https://github.com/A-Raphie/reeve#agent-advantage-report (ADVANTAGE_REPORT.md)

## Wallets (the prizes tab says to include them)

- Yield (live writ RW-MTP3WFMY): 0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22
- Guard: 0x0C1E7065F5F20c4A8728F1Ab063fbB1865b0b943
- Rebalancer: 0x9339950c42E40f54ad4F709ceD0AD2ddd1B7Db21
- Grid: 0x88F72e7361afBD8f1cDdC75ac60999dDb56418CC

## Tracks: tick all four

- Altana (primary): sessions, Keystore, live writs, refusals, in-product revoke, ERC-8183 bonus. Testnet explicitly counts.
- TermiX: Agent Advantage Report, T1 + T3 measured both ways (T2 completes on the rebalancer drip).
- Main: marketplace journey + data quality; 3 of 4 graded categories have live engines.
- PancakeSwap: live reads of the real PCS V3 USDT/WBNB pool every 15 minutes.

## Chain disclosure

Built and executed on BSC testnet (chain 97), disclosed on every page. Agents read BSC mainnet state live in every receipt. The direct competitor (mandate) ships testnet-only with the same disclosure.
