// Orderbook Display Component

'use client';

import React, { useMemo } from 'react';
import { Orderbook, OrderbookLevel } from '@/types';
import { formatPrice, formatQuantity, calculateSpread, isDataStale } from '@/utils/orderbook';

interface OrderbookDisplayProps {
  orderbook: Orderbook | null;
  loading?: boolean;
  error?: string | null;
  highlightedLevel?: number;
  onLevelClick?: (level: OrderbookLevel, side: 'bid' | 'ask') => void;
  className?: string;
}

interface OrderLevelRowProps {
  level: OrderbookLevel;
  side: 'bid' | 'ask';
  isHighlighted?: boolean;
  maxTotal: number;
  onClick?: () => void;
  symbol: string;
}

const OrderLevelRow: React.FC<OrderLevelRowProps> = ({
  level,
  side,
  isHighlighted,
  maxTotal,
  onClick,
  symbol
}) => {
  const fillPercentage = (level.total || 0) / maxTotal * 100;
  const isAsk = side === 'ask';
  
  return (
    <div
      className={`
        relative flex items-center justify-between px-3 py-1 text-xs cursor-pointer
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        ${isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
      onClick={onClick}
    >
      {/* Background fill indicator */}
      <div
        className={`
          absolute inset-y-0 ${isAsk ? 'right-0' : 'left-0'} opacity-20
          ${isAsk ? 'bg-red-500' : 'bg-green-500'}
        `}
        style={{ width: `${fillPercentage}%` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <span className={`font-mono ${isAsk ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {formatPrice(level.price)}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {formatQuantity(level.quantity)}
        </span>
        <span className="text-gray-500 dark:text-gray-500 text-right min-w-[60px]">
          {formatQuantity(level.total || 0)}
        </span>
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading orderbook...</span>
  </div>
);

const ErrorState: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="text-red-500 mb-2">⚠️</div>
    <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

const OrderbookDisplay: React.FC<OrderbookDisplayProps> = ({
  orderbook,
  loading = false,
  error = null,
  highlightedLevel,
  onLevelClick,
  className = ''
}) => {
  const spreadInfo = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) {
      return null;
    }
    return calculateSpread(orderbook.bids, orderbook.asks);
  }, [orderbook]);

  const maxTotal = useMemo(() => {
    if (!orderbook) return 0;
    
    const maxBidTotal = Math.max(...orderbook.bids.slice(0, 15).map(b => b.total || 0));
    const maxAskTotal = Math.max(...orderbook.asks.slice(0, 15).map(a => a.total || 0));
    
    return Math.max(maxBidTotal, maxAskTotal);
  }, [orderbook]);

  const isStale = useMemo(() => {
    return orderbook ? isDataStale(orderbook.timestamp) : false;
  }, [orderbook]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!orderbook) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        No orderbook data available
      </div>
    );
  }

  const displayAsks = orderbook.asks.slice(0, 15).reverse(); // Reverse for proper display order
  const displayBids = orderbook.bids.slice(0, 15);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {orderbook.venue} - {orderbook.symbol}
          </h3>
          {isStale && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              Stale Data
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          {spreadInfo && (
            <div>
              Spread: <span className="font-mono">{formatPrice(spreadInfo.absolute)}</span>
              <span className="ml-1">({spreadInfo.percentage.toFixed(3)}%)</span>
            </div>
          )}
          <div>
            Updated: {new Date(orderbook.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      {/* Orderbook levels */}
      <div className="max-h-96 overflow-y-auto">
        {/* Asks (sells) - displayed from highest to lowest */}
        {displayAsks.map((ask, index) => (
          <OrderLevelRow
            key={`ask-${ask.price}-${index}`}
            level={ask}
            side="ask"
            isHighlighted={highlightedLevel === index}
            maxTotal={maxTotal}
            onClick={() => onLevelClick?.(ask, 'ask')}
            symbol={orderbook.symbol}
          />
        ))}

        {/* Spread indicator */}
        {spreadInfo && (
          <div className="flex items-center justify-center py-2 bg-gray-100 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ← Spread: {formatPrice(spreadInfo.absolute)} →
            </span>
          </div>
        )}

        {/* Bids (buys) - displayed from highest to lowest */}
        {displayBids.map((bid, index) => (
          <OrderLevelRow
            key={`bid-${bid.price}-${index}`}
            level={bid}
            side="bid"
            isHighlighted={highlightedLevel === (displayAsks.length + index)}
            maxTotal={maxTotal}
            onClick={() => onLevelClick?.(bid, 'bid')}
            symbol={orderbook.symbol}
          />
        ))}
      </div>

      {/* Footer with stats */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div>
          Best Bid: <span className="font-mono text-green-600 dark:text-green-400">
            {formatPrice(orderbook.bids[0]?.price || 0)}
          </span>
        </div>
        <div>
          Best Ask: <span className="font-mono text-red-600 dark:text-red-400">
            {formatPrice(orderbook.asks[0]?.price || 0)}
          </span>
        </div>
        <div>
          Sequence: <span className="font-mono">{orderbook.sequence || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderbookDisplay;
