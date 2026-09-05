# Reeve — Memory

Running log of decisions, conventions, and gotchas. Newest at the top.

## Decisions
- **2026-09-05** — Name Reeve via naming skill (finalists Reeve/Muster/Stint): archaic word for the officer who acts under a granted writ; root of "sheriff".
- **2026-09-05** — Thesis: hiring contract (writ limits + 8183 escrow + measured records); four categories are proof instances, not the pitch. Passed all 11 idea-hack gates.
- **2026-09-05** — Design: hiring-desk data grid, cool light field, gold/blue two-ink duotone (principal vs agent acts), oversized grotesk numerals, THE LIVE WRIT signature (live dials + ink-depletion VOID). Chosen after DESIGN_LEDGER check killed the first instinct (paper/document/stamp = rushes/assay/claimcheck repeats).
- **2026-09-05** — GHA cron + repo-committed receipt ledger over a database: free, judge-inspectable, avoids the purser-held Railway slot.
- **2026-09-05** — Passkey wallets for delegators (browser, no extension); private-key signers for agents.

## Conventions
- No em dashes anywhere in UI strings or docs: use · and :
- Footer: "built by Raphie" linking https://x.com/a_raphie
- vitest pinned 4.x (assay convention); npm installs need --legacy-peer-deps on this box
- Agent scripts live in scripts/, ledger JSON in ledger/

## Gotchas
- **Never send a plain EOA transfer from an Altana wallet**: relay bundles sign the 7702 auth item with the nonce recorded at account creation; a plain transfer desyncs the nonce and every later relay op fails with "invalid auth item nonce, expected N, got 0". Fund wallets only via faucet; use a dedicated dumb EOA (the treasury) to move gas between wallets.
- Relay bundle gas costs ~0.0004 tBNB (bare execute) to ~0.0015 tBNB (deploy + grant). The bnb faucet pays 0.01 tBNB per claim: about 10-20 agent ops per claim. Relay bundles do NOT consume the account EOA's plain nonce.
- "quote has asset deficits and is expected to fail" = balance below the bundle cost; top up and retry.
- Altana SDK signer key field is `_privateKey`, not `privateKey`
- Altana SDK exports map blocks internal paths: deep-import via direct file URL from node_modules
- The SDK relay faucet (fundNative) is a stub on bnb-testnet: mint-to-0x0 tx, no usable credit. Fund from the public faucet https://testnet.bnbchain.org/faucet-smart (login-gated, his step)
- $U for 8183 budgets: faucet contract 0x86e9197CC0F76E4e4aaa7082180945196bBAb5D3 requestTokens() pays 10 $U per address per 30 min (needs gas first)
- Testnet addresses source of truth: docs.altana.network/concepts/networks/testnet (Keystore 0x6b8361C29d05D498b1a12B54A37310f94171E94A, KeyStoreController 0xb530D1971f5453F3359518343F05D0AedFfF7e12, $U 0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565)
- npm arborist crash `Cannot read properties of null (reading 'edgesOut')`: use --legacy-peer-deps

## Things to not forget
- Flip repo public at submission; keep it private during build
- Sep 9 12:00 UTC hard stop; keep links alive through judging (winners date unpublished)
- Tracks tab (rendered Sep 5): Altana bar says "Testnet counts, mainnet is stronger" explicitly; main-track Weight column is EMPTY (weights unpublished, only TermiX has 30/30/20/20); timeline = Build NOW -> top-3 PUBLIC shortlist -> Phase 2 [REDACTED] with "more criterias"; sponsor Ideas-to-Build table names our exact build (agent hiring marketplace via hireErc8183Agent, autonomous DeFi in spend caps, b402 via @altananetwork/x402-server)
- Footer X credit; claims-verify before submission; notify-gate before any form submit (he clicks)
