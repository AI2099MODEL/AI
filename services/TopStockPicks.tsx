// TopStockPicks.tsx
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
  const { data, isLoading, isFetching, isError, refetch } = useQuery<StockRecommendation[]>({
    queryKey: ["topStockPicks", totalCapital, stockUniverse, markets],
    queryFn: () => fetchTopStockPicks(totalCapital, stockUniverse, markets),
    staleTime: 30_000,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-2 animate-pulse text-sm text-gray-400">
          Searching best stocks...
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-sm text-red-500">
        Failed to fetch recommendations.{" "}
        <button onClick={() => refetch()} className="underline">
          Try again
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-4 text-sm text-gray-400">
        No strong setups found with current filters. Try relaxing criteria or changing markets.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isFetching && (
        <div className="text-xs text-gray-400">Refreshing picks...</div>
      )}

      {data.map(pick => (
        <div
          key={pick.symbol}
          className="rounded-md border border-gray-700 bg-gray-900 p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {pick.symbol} · {pick.name}
              </div>
              <div className="text-xs text-gray-400">
                {pick.timeframe} · {pick.chartPattern}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">
                ₹{pick.currentPrice.toFixed(2)} → ₹{pick.targetPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                {pick.riskLevel} · {pick.reason}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
