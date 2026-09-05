// The four agents of the desk. Identity is real (wallets live onchain);
// measured records and receipts fill in as rounds execute (lib/ledger).
export type AgentId = "rebalancer" | "grid" | "yield" | "guard";

export type Agent = {
  id: AgentId;
  name: string;
  category: string;
  does: string;
  protocols: string;
  address: string;
  writTitle: string;
  writCalls: string[];
  defaultCap: number;
  strategy: string;
};

export const AGENTS: Record<AgentId, Agent> = {
  rebalancer: {
    id: "rebalancer",
    name: "Rebalancer",
    category: "Rebalancing",
    does: "Manages LP ranges, resets positions automatically",
    protocols: "PancakeSwap V3",
    address: "0x9339950c42E40f54ad4F709ceD0AD2ddd1B7Db21",
    writTitle: "LP management",
    writCalls: ["pancakeAddLiquidity()", "pancakeRemovePosition()", "pancakeSwap()"],
    defaultCap: 50,
    strategy:
      "Watches the position's range every 15 minutes. When price leaves the range, it removes the position, swaps back to the paired token, and mints a fresh range around the new price. Out-of-range capital that earns nothing is the cost of skipping this agent.",
  },
  grid: {
    id: "grid",
    name: "Grid",
    category: "Grid Trading",
    does: "Places and manages automated grid orders",
    protocols: "PancakeSwap",
    address: "0x88F72e7361afBD8f1cDdC75ac60999dDb56418CC",
    writTitle: "Grid trading",
    writCalls: ["pancakeSwap()"],
    defaultCap: 50,
    strategy:
      "Holds a ladder of buy and sell levels around the mid price. Each crossing executes one level and re-places it, harvesting volatility into filled spread. The writ caps the quote token the ladder may spend per day.",
  },
  yield: {
    id: "yield",
    name: "Yield",
    category: "Yield Optimisation",
    does: "Routes liquidity to the highest available APR",
    protocols: "Venus · Aave · Lista",
    address: "0x15ceD3e1DFe1b4b748b0E52812a0c4DE41c6ff22",
    writTitle: "Supply routing",
    writCalls: ["venusSupply()", "venusWithdraw()", "aaveSupply()"],
    defaultCap: 100,
    strategy:
      "Reads supply APRs across Venus, Aave, and Lista every round. When the best route beats the current one by more than the move cost, it withdraws and re-supplies. Otherwise it holds: the cheapest round is the one it doesn't take.",
  },
  guard: {
    id: "guard",
    name: "Guard",
    category: "Health Factor Monitoring",
    does: "Protects lending positions from liquidation",
    protocols: "Venus · Aave",
    address: "0x0C1E7065F5F20c4A8728F1Ab063fbB1865b0b943",
    writTitle: "Liquidation guard",
    writCalls: ["venusWithdraw()", "venusRepay()"],
    defaultCap: 100,
    strategy:
      "Tracks the health factor of protected positions every round. Below the warning line it alerts; below the danger line it deleverages by the minimum needed to restore safety. It never touches a healthy position.",
  },
};

export const AGENT_LIST = Object.values(AGENTS);
