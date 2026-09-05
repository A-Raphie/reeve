// Single source of chain truth. CHAIN env var selects the network; nothing else
// in the repo names a chain. Cutover = CHAIN=mainnet.
import { BNB, BNB_TESTNET } from "@altananetwork/sdk";

export const CHAIN = (process.env.CHAIN ?? "testnet").toLowerCase();
export const IS_MAINNET = CHAIN === "mainnet";
export const NETWORK = IS_MAINNET ? BNB : BNB_TESTNET;
export const EXPLORER = IS_MAINNET ? "https://bscscan.com" : "https://testnet.bscscan.com";
export const EXPLORER_TX = (hash) => `${EXPLORER}/tx/${hash}`;
export const EXPLORER_ADDR = (address) => `${EXPLORER}/address/${address}`;
export const CHAIN_LABEL = IS_MAINNET ? "BNB Smart Chain" : "BNB Smart Chain Testnet";
