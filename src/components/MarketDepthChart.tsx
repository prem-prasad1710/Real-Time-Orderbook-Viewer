// Market Depth Chart Component

'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Orderbook } from '@/types';
import { calculateMarketDepth, formatPrice, formatVolume } from '@/utils/orderbook';

interface MarketDepthChartProps {
  orderbook: Orderbook | null;
  simulatedOrderPrice?: number;
  simulatedOrderSide?: 'bid' | 'ask';
  height?: number;
  className?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      price: number;
      volume: number;
      cumulative: number;
      side: 'bid' | 'ask';
    };
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white">
          Price: <span className="font-mono">${formatPrice(data.price)}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Volume: <span className="font-mono">{formatVolume(data.volume)}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Cumulative: <span className="font-mono">{formatVolume(data.cumulative)}</span>
        </p>
        <p className={`text-sm ${data.side === 'bid' ? 'text-green-600' : 'text-red-600'}`}>
          {data.side === 'bid' ? 'Bid' : 'Ask'}
        </p>
      </div>
    );
  }
  return null;
};

const MarketDepthChart: React.FC<MarketDepthChartProps> = ({
  orderbook,
  simulatedOrderPrice,
  simulatedOrderSide,
  height = 400,
  className = ''
}) => {
  const chartData = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return { bidData: [], askData: [], combinedData: [], midPrice: 0 };
    }

    const depthData = calculateMarketDepth(orderbook.bids, orderbook.asks);
    const midPrice = (orderbook.bids[0].price + orderbook.asks[0].price) / 2;

    // Prepare data for the chart
    // For bids, we want to show cumulative volume from mid price downwards
    const bidData = depthData.bids.map(point => ({
      price: point.price,
      volume: point.volume,
      cumulative: point.cumulative,
      side: 'bid' as const
    }));

    // For asks, we want to show cumulative volume from mid price upwards
    const askData = depthData.asks.map(point => ({
      price: point.price,
      volume: point.volume,
      cumulative: point.cumulative,
      side: 'ask' as const
    }));

    // Combine and sort by price for the chart
    const combinedData = [...bidData, ...askData].sort((a, b) => a.price - b.price);

    return { bidData, askData, combinedData, midPrice };
  }, [orderbook]);

  if (!orderbook || chartData.combinedData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Depth</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No orderbook data available for depth chart
        </div>
      </div>
    );
  }

  const { bidData, askData, midPrice } = chartData;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Market Depth - {orderbook.symbol}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Bids</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Asks</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4" style={{ height: height + 50 }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData.combinedData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="price"
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => formatPrice(value)}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => formatVolume(value)}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Mid price reference line */}
            <ReferenceLine
              x={midPrice}
              stroke="#6b7280"
              strokeDasharray="2 2"
              label={{ value: "Mid", position: "top" }}
            />
            
            {/* Simulated order reference line */}
            {simulatedOrderPrice && (
              <ReferenceLine
                x={simulatedOrderPrice}
                stroke={simulatedOrderSide === 'bid' ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                label={{ 
                  value: "Order", 
                  position: "top",
                  style: { fill: simulatedOrderSide === 'bid' ? '#10b981' : '#ef4444' }
                }}
              />
            )}

            {/* Bid area */}
            <Area
              dataKey="cumulative"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
              data={bidData}
            />

            {/* Ask area */}
            <Area
              dataKey="cumulative"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
              strokeWidth={2}
              data={askData}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with stats */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-6">
          <div>
            <span className="text-green-600 dark:text-green-400">Bid Depth:</span>
            <span className="ml-1 font-mono">{formatVolume(bidData[bidData.length - 1]?.cumulative || 0)}</span>
          </div>
          <div>
            <span className="text-red-600 dark:text-red-400">Ask Depth:</span>
            <span className="ml-1 font-mono">{formatVolume(askData[askData.length - 1]?.cumulative || 0)}</span>
          </div>
        </div>
        <div>
          <span>Mid Price:</span>
          <span className="ml-1 font-mono">{formatPrice(midPrice)}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketDepthChart;
