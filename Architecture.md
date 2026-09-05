# Reeve — Architecture

## Overview
Reeve is a Next.js marketplace of four live BSC testnet agents. Users sign writs of limits from their browser (Altana passkey wallets); agent processes execute through separate session-keyed agent wallets; every action lands in a receipt ledger committed to the repo by GitHub Actions so judges can inspect provenance without trusting the app. Machine hiring runs through the SDK's ERC-8183 stack; paid data endpoints speak x402.

## Components
- **Marketplace UI (Next.js 16 + Tailwind v4 on Vercel)** · desk, agent pages, writ flow, dashboard, machine-surface docs
- **Writ service (client-side Altana SDK)** · passkey wallet creation, grantSession with CallPermission + SpendPermission + expiry, register: true (Keystore), revokeSession; sessions serialized to the ledger store
- **Agent runners (GitHub Actions cron, 15m)** · one job per agent; each round: read state (public RPC + feeds) · decide · execute through its session (client.execute with session signer) · append receipt lines · commit ledger JSON to the repo
- **Execution layer** · Altana certified skills (PancakeSwap Liquidity/Trading, Venus, Aave, Lista) + PCS smart-router for swaps; grid engine is in-repo
- **Machine surface** · /api/hire (ERC-8183 hireErc8183Agent, settle approve/dispute, claimRefund) · x402 paid data endpoints via `@altananetwork/x402-server` (Altana's B402 fork, named in the tracks tab; not upstream x402)
- **Data** · 8004scan API (identity/reputation, semantic search; Pro tier claimed) · PCS price API + subgraph · Venus/Aave APR feeds · receipt ledger JSON in-repo (GHA-committed)

## Data model
- **Writ** (serialized Altana session): walletAddress · publicKey · permissions{calls[], spend[{limit, period, token}]} · expiry · serial · grantTx · status(active|void|expired)
- **Receipt**: ts · writSerial · agentId · kind(execute|refuse|job) · summary · amount · txHash
- **Job** (8183): jobId · client · provider · budget($U) · status(OPEN|FUNDED|SUBMITTED|COMPLETED|REJECTED|EXPIRED) · deliverableUrl
- **AgentRecord**: id · category · measured{winRate, window, risk} · positionSnapshot · ledgerRef

## Tech stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 16 + Tailwind v4 + TS | his stack, Vercel-free |
| Wallet/signing | Altana SDK passkey (user) + private-key (agents) | noncustodial, Keystore-registered sessions |
| Agent cron | GitHub Actions | free, runs long, commits receipts (rushes-proven; avoids the one Railway slot) |
| Escrow/hiring | SDK ERC-8183 stack on chain 97 | deploy addresses + helpers in-SDK |
| Data | 8004scan API + PCS/feeds | Data Quality criterion |
| Hosting | Vercel | free, his accounts |

## Key decisions & trade-offs
- **Passkey wallets for the delegator** over injected-wallet connect: no wagmi wiring, judge-friendly (no extension needed), native to the SDK. Trade-off: unfamiliar flow; mitigated by the writ specimen on the landing.
- **GHA-committed receipt ledger** over a database: free, judge-inspectable provenance, no infra. Trade-off: 15m granularity, no back-end queries; acceptable for demo scale.
- **Testnet-first** with documented addresses (docs.altana.network testnet page is the source of truth). Trade-off: "live on BSC" reads ambiguous; mitigated by also registering agents under ERC-8004 so 8004scan sees them.
- **Agent wallets are separate Altana wallets**, one per agent, funded from tBNB faucet; user writs bind user wallet -> agent wallet.

## API surface
- GET /api/agents · GET /api/agents/[id] (live state + ledger)
- POST /api/writ (store serialized session + serial) · POST /api/writ/void
- POST /api/hire · POST /api/settle (8183)
- GET /api/data/[endpoint] (x402-gated: prices · aprs · records)
- GHA: .github/workflows/agents.yml (cron) · scripts/agent-round.mjs per agent

## Open architectural questions
- [assumption: x402 sell-side on BSC testnet via Altana's B402 path; if the server SDK lacks chain 97, gate paid endpoints with the SDK's fetchWithX402-compatible flow or document honestly]
- [assumption: passkey wallets work headless in CI for agent rounds if agents ever need user-style wallets; agents use private-key signers instead, which is proven shape]
