# Reeve — Design

The source of truth for the frontend. Every screen defers to this file; deviations update this file, not just the code.

## Feel
Employed — deskbound, measured, two-sided. A hiring desk where every contract is live.

## Audience
DeFi operators and judges who know trading terminals. They expect numbers first, decoration never. The product's subject is ON THE SURFACE: the writ (limits), the ledger (receipts), the measured record (win rate · window · risk).

## Visual direction
Hiring-desk data grid, light and cool: the marketplace is a dense desk of agent rows with measured columns, not a card bento. Two-ink duotone carries the product's core mechanic (a two-party contract): **gold ink = principal acts** (sign, fund, revoke), **blue ink = agent acts** (execute, submit). Every surface answers "whose act is this?" by ink. Mono appears only as machine voice: serials, hashes, limit values. Display type is oversized grotesk numerals (clamp to 6rem+, line-height 0.9): the measured record is the hero.

Sponsor tokens mined from live CSS Sep 5 (not guessed): BNB #F0B90B gold + #181A1E ink + #FFE900 + neutral ladder #C4C5CB/#8C8F9B/#E1E2E5; Altana #3665E4 blue + #D97757; TermiX #ff5b2e/#AEF431; 8004scan #fcff52; PCS #1FC7D4.

## Design tokens
- `--field` #EFF0F1 cool light gray (desk surface) · `--field-2` #FFFFFF (documents/rows)
- `--ink` #14161A primary text · `--ink-2` #5A5E66 secondary · `--hairline` rgba(20,22,26,.14) grid lines
- `--gold` #F0B90B principal ink (acts, live dials, primary CTA) · `--gold-deep` #B8860B-ish press state
- `--agent` #3665E4 agent ink (executions, agent-authored rows)
- `--pass` #2EBD85 · `--fail` #F6465D (data states ONLY: receipts, records)
- `--mono` JetBrains Mono or Geist Mono (serials, hashes, limits) · `--sans` a grotesk (Geist/Archivo), weight 400-700
- Display scale: 0.66rem mono-micro (.1em tracking caps) · 15px body · 2rem section · 6rem numerals (lh 0.9, tracking -0.06em)
- Radius: 2px on documents/rows (near-sharp); pills only for status chips
- Elevation: hairlines + 1px grid lines only; shadows banned
- Grid: 1px column rules between table cells (ledger discipline)

## Copy tone
Terse employment language, second person: "You set the limits. The agent works inside them." Clauses are numbered (I., II., III.). Refusals state the rule: "Refused: clause II caps daily spend at 50 USDT." No buzzwords, no em dashes: use · and : per house rule.

## User flow (build order)
1. **Front door / landing** · what this is: agents for hire under a signed writ of limits; visible proof: a live writ specimen with moving dials + the four categories as desk rows; enter path: "Open the desk"
2. **The Desk (marketplace)** · four mandated categories as dense table rows with live measured columns (record, cap, window, status); row click opens agent
3. **Agent page** · live position/P&L, measured record as oversized numerals, receipt ledger, machine-hire panel (8183 + x402), Hire button
4. **The Writ (offer sheet)** · clause editor (allowlist · spend cap · expiry), sign with passkey wallet, onchain registration, serial + tx footer; the signature surface
5. **Dashboard** · my writs as live dials: spend vs cap, calls used, time left; revoke = VOID
6. **Machine surface (/hire docs)** · how an agent hires an agent: 8183 job path, x402 paid endpoints, curl examples
7. **Advantage Report** · measured with/without comparisons, outputs attached

## Folds used
- (empty on scaffold)

## Avoid-list
- Dark bento agent-card grids (the consensus object of this hackathon)
- Purple-blue gradients, glowing heroes, glassmorphism, rounded-2xl everywhere
- AI chat panel for hiring; emoji category icons; mascots
- Cream/paper textures (claimcheck + rushes repeat); stamp-strike motion (assay repeat)
- fade-in-up sections; drop shadows; labels where visual hierarchy suffices
- All-caps blocks over one line; color as sole information carrier
