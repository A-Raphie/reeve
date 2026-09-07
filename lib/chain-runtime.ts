// Runtime chain selection: evaluates CHAIN at request time so one build
// can serve either network (Vercel env var decides, no rebuild for cutover).
import { BNB, BNB_TESTNET } from "@altananetwork/sdk";

export function chainConfig() {
  const chain = (process.env.CHAIN ?? "testnet").toLowerCase();
  const isMainnet = chain === "mainnet";
  const network = isMainnet ? BNB : BNB_TESTNET;
  return {
    CHAIN: chain,
    IS_MAINNET: isMainnet,
    NETWORK: network,
    EXPLORER: isMainnet ? "https://bscscan.com" : "https://testnet.bscscan.com",
    CHAIN_LABEL: isMainnet ? "BNB Smart Chain" : "BNB Smart Chain Testnet",
    CHAIN_SHORT: isMainnet ? "BSC MAINNET" : "BSC TESTNET",
    CHAIN_ORIGIN: isMainnet
      ? "Deployed and executed on BNB Smart Chain mainnet (chain 56). Agents were proven on testnet (chain 97) before cutover."
      : "Agents currently arming on BNB Smart Chain Testnet (chain 97). Mainnet cutover at the Phase 1 gate.",
  };
}

export function explorerTx(hash: string): string {
  const main = (process.env.CHAIN ?? "testnet").toLowerCase() === "mainnet";
  return `${main ? "https://bscscan.com" : "https://testnet.bscscan.com"}/tx/${hash}`;
}
