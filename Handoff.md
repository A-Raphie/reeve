# Reeve — Handoff

Read this first if you're picking up the project. Mirrors current state; updated as work progresses.

## Current state
Scaffold + spec + design done; Altana SDK proven to the session-grant level on bnb-testnet. The only on-chain blocker is gas: the SDK relay faucet is a stub, and the public faucet is login-gated (his step). Design direction locked via DESIGN_LEDGER-checked brief (hiring-desk grid · two-ink duotone · live writ).

## What's done
- Name locked (Reeve), repo A-Raphie/reeve (private), Next 16 + Tailwind v4 + vitest 4 scaffold pushed
- Altana spike: SDK install · createWallet (counterfactual via Porto relay) · grant/execute/revoke API shapes · ERC-8183 addresses on chain 97 · Keystore addresses · $U faucet mechanics · docs mined
- Spec set: PRD · Architecture · design.md · Tasks · Memory (this repo)
- DESIGN_LEDGER appended at hackathon-research/DESIGN_LEDGER.md

## In progress
- Nothing mid-flight; next is Phase 0/1 boundary

## Blocked / waiting
- tBNB into wallets · blocked on his manual faucet claim at https://testnet.bnbchain.org/faucet-smart (login). Agent wallet: .spike/wallet.json holds an address; better: claim to 2-3 fresh addresses (agents + demo)
- 8004scan Pro upgrade form · needs his email + wallet + registration email match

## How to run it
```bash
npm install --legacy-peer-deps
npm run dev        # marketplace UI
npm test           # vitest
node scripts/altana-spike.mjs   # end-to-end once wallets hold tBNB (idempotent)
```

## Next steps
1. He claims tBNB (above); then re-run scripts/altana-spike.mjs to prove grant -> execute -> revoke live
2. Semantic tokens into globals.css; component harvest; landing + writ flow (Phase 1)
3. Yield agent end-to-end under a writ

## Open questions
- x402 sell-side chain-97 support (B402 path) · verify when building /api/data

## Pointers
- Spec: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [design.md](./design.md)
- Plan: [Tasks.md](./Tasks.md)
- History: [Memory.md](./Memory.md)
