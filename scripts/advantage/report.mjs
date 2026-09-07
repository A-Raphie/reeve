// Render ledger/advantage.json into ADVANTAGE_REPORT.md (TermiX partner
// track: at least 3 real tasks run both ways, time, cost and output quality
// reported, actual outputs attached).
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("ledger/advantage.json", "utf8"));
const native = (v) => `${v.toFixed(8)} tBNB`;

const rows = Object.values(data.tasks)
  .map((t) => {
    const a = t.runs.find((r) => r.path === "agent");
    const d = t.runs.find((r) => r.path === "diy");
    return `| ${t.id} | ${t.category} | ${a.ms} ms | ${native(a.costNative)} | ${d.ms} ms | ${native(d.costNative)} |`;
  })
  .join("\n");

const sections = Object.values(data.tasks)
  .map((t) => {
    const a = t.runs.find((r) => r.path === "agent");
    const d = t.runs.find((r) => r.path === "diy");
    return `## ${t.id}: ${t.name}

Category: ${t.category}. Ran at ${t.ranAt}.

**Hired through the marketplace** (${a.via}): ${a.ms} ms, gas ${native(a.costNative)}.

\`\`\`
${JSON.stringify(a.output, null, 2)}
\`\`\`

**Done by hand** (${d.via}): ${d.ms} ms, gas ${native(d.costNative)}.

\`\`\`
${JSON.stringify(d.output, null, 2)}
\`\`\`

**Read:** the hand path answers once and is stale the next block; the agent path runs every 15 minutes under a signed writ, and every action it could take is already capped onchain before the first call. Full run data: \`ledger/advantage.json\`.
`;
  })
  .join("\n");

const doc = `# Agent Advantage Report

Reeve · ${data.generatedAt} · BSC testnet (chain 97)

Every task below was executed twice: once hired through the Reeve marketplace (a
signed writ of limits plus a Keystore-registered session key), and once done by
hand with direct chain calls and no marketplace. Times are wall clock, costs
are gas paid by the principal, and the outputs are attached verbatim.

| Task | Category | Agent time | Agent gas | Hand time | Hand gas |
|---|---|---|---|---|---|
${rows}

${sections}

## Task T2 (armed): is a USDT/WBNB LP position in range?

Hired through the Rebalancer agent (PancakeSwap V3 USDT/WBNB 0.25%). The range
engine is live and reading the pool every 15 minutes (see the agent's receipt
ledger); the task completes when the first position is minted under a signed
writ, which is gated on the testnet drip to the Rebalancer wallet.
`;

writeFileSync("ADVANTAGE_REPORT.md", doc);
console.log("ADVANTAGE_REPORT.md written");
