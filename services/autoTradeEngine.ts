import {
  AppSettings,
  MarketData,
  PortfolioItem,
  StockRecommendation,
  Transaction,
  Funds,
} from '../types';

export interface TradeResult {
  executed: boolean;
  transaction?: Transaction;
  newFunds?: Funds;
  newPortfolio?: PortfolioItem[];
  reason?: string;
}

export const runAutoTradeEngine = (
  settings: AppSettings,
  portfolio: PortfolioItem[],
  marketData: MarketData,
  funds: Funds,
  recommendations: StockRecommendation[]
): TradeResult[] => {
  // Only run if PAPER bot is enabled
  if (!settings.activeBrokers.includes('PAPER')) return [];

  const results: TradeResult[] = [];
  const currentFunds: Funds = { ...funds };
  const currentPortfolio: PortfolioItem[] = [...portfolio];

  const now = Date.now();

  // 1. Exits (STOP LOSS / TARGET)
  for (let i = 0; i < currentPortfolio.length; i++) {
    const item = currentPortfolio[i];
    if (item.broker !== 'PAPER') continue;

    const data = marketData[item.symbol];
    if (!data) continue;

    const price = data.price;
    if (!price || item.avgCost <= 0) continue;

    const pnlPercent = ((price - item.avgCost) / item.avgCost) * 100;

    let action: 'STOP_LOSS' | 'TARGET_HIT' | null = null;
    if (pnlPercent <= -2) action = 'STOP_LOSS';
    else if (pnlPercent >= 4) action = 'TARGET_HIT';

    if (!action) continue;

    const notional = price * item.quantity;
    if (notional <= 0) continue;

    currentFunds.stock += notional;

    const tx: Transaction = {
      id: `${now}-${Math.random()}`,
      type: 'SELL',
      symbol: item.symbol,
      assetType: item.type,
      quantity: item.quantity,
      price,
      timestamp: now,
      broker: 'PAPER',
    };

    results.push({
      executed: true,
      transaction: tx,
      reason: `Auto ${action}`,
    });
    // Note: actual removal from portfolio can be done by caller using tx.
  }

  // Build a set of existing symbols to avoid repeated find() calls
  const heldSymbols = new Set(
    currentPortfolio.filter((p) => p.broker === 'PAPER').map((p) => p.symbol)
  );

  const { mode, value } = settings.autoTradeConfig;

  // 2. Entries
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];

    // Skip if already held (PAPER)
    if (heldSymbols.has(rec.symbol)) continue;

    const data = marketData[rec.symbol];
    if (!data || !data.technicals) continue;

    const { signalStrength } = data.technicals;
    if (signalStrength !== 'STRONG BUY') continue;

    const price = data.price;
    if (!price || price <= 0) continue;

    // Trade size: FIXED amount or percentage of current stock funds
    const tradeAmt =
      mode === 'FIXED' ? value : currentFunds.stock * (value / 100);

    if (tradeAmt <= 0 || currentFunds.stock <= tradeAmt) continue;

    const qty = Math.floor(tradeAmt / price);
    if (qty <= 0) continue;

    const cost = qty * price;
    if (cost <= 0 || cost > currentFunds.stock) continue;

    currentFunds.stock -= cost;

    const tx: Transaction = {
      id: `${now}-${Math.random()}`,
      type: 'BUY',
      symbol: rec.symbol,
      assetType: rec.type,
      quantity: qty,
      price,
      timestamp: now,
      broker: 'PAPER',
    };

    results.push({
      executed: true,
      transaction: tx,
      reason: 'Auto Entry Signal',
    });

    // Optionally update heldSymbols in case multiple recs for same symbol appear
    heldSymbols.add(rec.symbol);
  }

  // If you want to return updated funds/portfolio with each result, you can
  // attach snapshots here; otherwise keep results lean.
  return results;
};

// Simulate "Offline" trades
export const simulateBackgroundTrades = (
  lastRunTime: number,
  settings: AppSettings,
  funds: Funds
): { newTransactions: Transaction[]; newFunds: Funds } => {
  const now = Date.now();
  const hoursOffline = (now - lastRunTime) / (1000 * 60 * 60);

  // Only simulate if offline for more than 1h and less than 48h
  if (hoursOffline < 1 || hoursOffline > 48) {
    return { newTransactions: [], newFunds: funds };
  }

  // If PAPER broker is disabled, do nothing
  if (!settings.activeBrokers.includes('PAPER')) {
    return { newTransactions: [], newFunds: funds };
  }

  const tradeCount = Math.floor(Math.random() * 3) + 1; // 1–3 trades
  const newTransactions: Transaction[] = [];
  const simulatedFunds: Funds = { ...funds };

  const demoStocks = ['RELIANCE', 'TATASTEEL', 'INFY', 'HDFCBANK'];

  for (let i = 0; i < tradeCount; i++) {
    const isBuy = Math.random() > 0.5;
    const symbol =
      demoStocks[Math.floor(Math.random() * demoStocks.length)];
    const rawPrice = 1000 + Math.random() * 500;
    const price = parseFloat(rawPrice.toFixed(2));
    const qty = 5;
    const notional = price * qty;

    if (isBuy && simulatedFunds.stock > notional) {
      simulatedFunds.stock -= notional;
      newTransactions.push({
        id: `sim-${now}-${i}`,
        type: 'BUY',
        symbol,
        assetType: 'STOCK',
        quantity: qty,
        price,
        timestamp: now - Math.floor(Math.random() * 1_000_000),
        broker: 'PAPER',
      });
    }
  }

  return { newTransactions, newFunds: simulatedFunds };
};
