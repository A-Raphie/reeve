import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Runtime truth for chain labels: reads CHAIN at request time.
export async function GET() {
  const main = (process.env.CHAIN ?? "testnet").toLowerCase() === "mainnet";
  return NextResponse.json({
    chain: main ? "mainnet" : "testnet",
    short: main ? "BSC MAINNET" : "BSC TESTNET",
    origin: main
      ? "Deployed and executed on BNB Smart Chain mainnet (chain 56). Agents were proven on testnet (chain 97) before cutover."
      : "Agents currently arming on BNB Smart Chain Testnet (chain 97). Mainnet cutover at the Phase 1 gate.",
  });
}
