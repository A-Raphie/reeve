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
  writPlain: string;
  scopes: string[];
  job: string;
  machineBlurb: string;
  machineTask: string;
  established: string[];
  notEstablished: string[];
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
    writPlain: "Move your PancakeSwap position and swap between its two tokens. Nothing else.",
    job: "Keep my LP earning in range.",
    machineBlurb: "A rebalancer client posts its range state; the agent re-mints out-of-range liquidity inside its cap.",
    machineTask: "rebalance my PCS position into range",
    established: [
      "Wallet live on BNB Smart Chain and funded",
      "Session authority proven end to end: grant, agent-side execute, revoke (tx receipts)",
      "Round engine live: checks run on a 15-minute schedule, receipts committed to the repo",
      "Strategy engine live: real PancakeSwap V3 USDT/WBNB pool reads every round (slot0 price, tick, position count)",
    ],
    notEstablished: [
      "No LP position under management yet · the first position opens when a writ is signed",
      "Machine-hire path opens at the mainnet cutover",
    ],
    scopes: ["Reposition · PancakeSwap V3", "Swap · PancakeSwap"],
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
    writPlain: "Buy and sell one token pair, a little at a time. Nothing else.",
    job: "Turn chop into filled orders.",
    machineBlurb: "A grid client funds the ladder quote; the agent places and recycles grid levels inside its cap.",
    machineTask: "run a 5-level grid on this pair",
    established: [
      "Wallet live on BNB Smart Chain and funded",
      "Round engine live: checks run on a 15-minute schedule, receipts committed to the repo",
    ],
    notEstablished: [
      "Grid ladder not placed yet · first trades execute under the first writ",
      "Machine-hire path opens at the mainnet cutover",
    ],
    scopes: ["Swap · PancakeSwap"],
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
    writPlain: "Move your spare USDT to whichever lender pays more, and back. Nothing else.",
    job: "Keep my USDT at the best APR on BNB Chain.",
    machineBlurb: "A treasury client deposits USDT; the agent routes it to the best supply APR inside its cap.",
    machineTask: "keep my USDT at the best APR",
    established: [
      "Wallet live on BNB Smart Chain and funded",
      "Session authority proven end to end: grant, agent-side execute, revoke (tx receipts)",
      "Round engine live: checks run on a 15-minute schedule, receipts committed to the repo",
      "Strategy engine live: real Venus supply-APR sweep across three pools every round, with mainnet price reads",
    ],
    notEstablished: [
      "No supply position under management yet · the first route executes when a writ is signed",
      "Machine-hire path opens at the mainnet cutover",
    ],
    scopes: ["Supply & withdraw · Venus", "Supply · Aave", "Stake · Lista"],
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
    writPlain: "If your loan gets close to liquidation, pay part of it down to keep it safe. Nothing else.",
    job: "Stop my loan from liquidating.",
    machineBlurb: "A borrower registers its loan; the guard repays the minimum to restore safety inside its cap.",
    machineTask: "guard my Venus loan above 1.5",
    established: [
      "Wallet live on BNB Smart Chain and funded",
      "Round engine live: checks run on a 15-minute schedule, receipts committed to the repo",
      "Strategy engine live: real Venus DeFi-pool reads every round (comptroller liquidity, collateral factor, position state)",
    ],
    notEstablished: [
      "No protected position yet · the guard only acts under a writ on a real loan",
      "Machine-hire path opens at the mainnet cutover",
    ],
    scopes: ["Withdraw · Venus", "Repay · Venus"],
    defaultCap: 100,
    strategy:
      "Tracks the health factor of protected positions every round. Below the warning line it alerts; below the danger line it deleverages by the minimum needed to restore safety. It never touches a healthy position.",
  },
};

export const AGENT_LIST = Object.values(AGENTS);
