import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTopStockPicks } from "./stockPickerService";
import { StockRecommendation, MarketSettings } from "../types";

type Props = {
  totalCapital: number;
  stockUniverse?: string[];
  markets: MarketSettings;
};

export const TopStockPicks: React.FC<Props> = ({
  totalCapital,
  stockUniverse = [],
  markets
}) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch
  } = useQuery<StockRecommendation[]>({
    // use a stable key object so we avoid accidental cache collisions
    queryKey: [
      "topStockPicks",
      {
        totalCapital,
        stockUniverse,
        markets
      }
    ],
    // all stock-selection logic lives inside this service, mirroring apps.py
    queryFn: () => fetchTopStockPicks(totalCapital, stockUniverse, markets),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: true
  });

  const isInitialLoading = isLoading || (!data && isFetching);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-2 animate-pulse text-sm text-gray-400">
          Running AI stock screener with your risk rules...
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-sm text-red-500">
        Failed to fetch AI recommendations.
        <button
          onClick={() => refetch()}
          className="ml-1 underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-4 text-sm text-gray-400">
        No high‑quality setups found for current filters and risk rules.
        Try relaxing criteria, changing markets, or lowering minimum profit target.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isFetching && data && (
        <div className="text-xs text-gray-400">Refreshing picks...</div>
      )}

      {data.map((pick) => (
        <div
          key={pick.symbol}
          className="rounded-md border border-gray-700 bg-gray-900 p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">
                {pick.symbol} · {pick.name}
              </div>
              <div className="text-xs text-gray-400">
                {pick.timeframe} · {pick.chartPattern}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Risk: {pick.riskLevel} · R:R {pick.riskReward?.toFixed(2) ?? "—"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm">
                ₹{pick.currentPrice.toFixed(2)} → ₹
                {pick.targetPrice.toFixed(2)}
              </div>
              <div className="text-xs text-green-400">
                Upside: {pick.expectedReturnPct?.toFixed(1) ?? 0}%
              </div>
              {pick.maxDrawdownPct != null && (
                <div className="text-xs text-red-400">
                  Max drawdown: {pick.maxDrawdownPct.toFixed(1)}%
                </div>
              )}
              {pick.allocatedCapital != null && (
                <div className="mt-1 text-xs text-gray-300">
                  Allocated: ₹{pick.allocatedCapital.toFixed(0)}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-400 line-clamp-2">
                {pick.reason}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

