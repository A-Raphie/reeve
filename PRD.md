# Reeve — PRD

## Problem
Agent marketplaces list black boxes: you cannot see what an agent will do with your funds before you hand them over. BSC has 200k+ ERC-8004-registered agents and no place where hiring them is bounded by rules the hirer controls. Hiring an agent today is blind trust. Reeve makes it an onchain employment contract: you sign a writ of limits (call allowlist, spend cap, expiry, registered on-chain), jobs settle through ERC-8183 escrow, and every agent ships a measured track record.

## Personas
- **Primary: the delegator** · a DeFi user (or judge) who wants an agent to work their funds inside rules they set; today their only options are "trust the agent" or "do it yourself".
- **Secondary: the machine hirer** · another agent (or TermiX's evaluators) hiring Reeve agents programmatically via ERC-8183 and paying over x402.
- **Tertiary: the partner judges** · TermiX hires from the marketplace and scores measured advantage; Altana scores live sessions-with-limits; PancakeSwap scores real benefit delivered through PCS products.

## Jobs to be Done
1. When I find an agent, I want to cap what it can spend and which calls it can make, so I can hire it without blind trust.
2. When my agent acts, I want every action receipted against the writ that authorized it, so I can audit it after the fact.
3. When an agent misbehaves, I want to revoke it instantly on-chain and reclaim escrowed budget.
4. When an agent (not a human) needs a service, I want to hire and pay programmatically, so agent commerce needs no human in the loop.

## Scope (v1)
- Four live agents at equal depth on BSC testnet: Rebalancing (PCS V3), Grid Trading, Yield Optimisation (Venus/Aave/Lista), Health Factor Monitoring (Venus/Aave)
- The Writ flow: clause editor · passkey signing · on-chain session registration (Altana Keystore) · serial + tx footer
- Live dials dashboard: spend vs cap, calls used, time left; instant revoke (VOID)
- Receipt ledger: every agent action as a line bound to its writ
- Machine surface: ERC-8183 hire/settle (agent-hires-agent capable) + x402 paid endpoints
- Agent Advantage Report: ≥3 tasks measured with vs without, ≥1 trading

## Non-goals
- No custody: the platform never holds user funds; sessions are noncustodial Altana keys
- No alpha promises: agents execute mechanical strategies; no "we beat the market" claims
- No mainnet requirement: testnet end-to-end; mainnet sweep only if trivially cheap
- No chat bot interface, no mobile app, no multi-chain beyond BSC
- No self-serve agent onboarding (the four agents are curated; registry listing is future work)

## Success metrics
- The full journey works end-to-end on testnet: land · find by category · understand · sign writ · agent executes inside limits · revoke
- All four categories show real on-chain transactions with receipts
- Advantage Report: ≥3 tasks with measured time/cost/quality deltas, actual outputs attached
- Main-track form submitted before Sep 9 12:00 UTC with all tracks ticked
- Kill criteria: Altana session execute unprovable by Sep 6 noon → fall back to own scoped-session contract with honest disclosure; Sep 7 EOD not submission-ready → cut in order (registry surfacing · grid depth · machine-hire)

## Open questions
- [assumption: passkey wallets in-browser are the delegator's signing path (Altana createPasskeyWallet); private-key wallets are the agents']
- [assumption: tBNB arrives via his manual faucet claim; $U for 8183 budgets via the faucet contract's requestTokens]
- [to fill: his wallet address + handles for the submission form]
