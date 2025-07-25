// Utility functions for the orderbook viewer

import { OrderbookLevel, DepthChartData, ChartDataPoint, OrderbookImbalance } from '@/types';

/**
 * Calculate market depth data for depth chart visualization
 */
export function calculateMarketDepth(
  bids: OrderbookLevel[],
  asks: OrderbookLevel[]
): DepthChartData {
  const bidData: ChartDataPoint[] = [];
  const askData: ChartDataPoint[] = [];
  
  let bidCumulative = 0;
  let askCumulative = 0;
  
  // Process bids (reverse order for proper depth chart)
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  for (const bid of sortedBids) {
    bidCumulative += bid.quantity;
    bidData.push({
      price: bid.price,
      volume: bid.quantity,
      cumulative: bidCumulative,
      side: 'bid'
    });
  }
  
  // Process asks
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
  for (const ask of sortedAsks) {
    askCumulative += ask.quantity;
    askData.push({
      price: ask.price,
      volume: ask.quantity,
      cumulative: askCumulative,
      side: 'ask'
    });
  }
  
  const maxVolume = Math.max(
    Math.max(...bidData.map(d => d.cumulative)),
    Math.max(...askData.map(d => d.cumulative))
  );
  
  const spread = askData[0]?.price - bidData[0]?.price || 0;
  
  return {
    bids: bidData,
    asks: askData,
    maxVolume,
    spread
  };
}

/**
 * Calculate orderbook imbalance indicators
 */
export function calculateOrderbookImbalance(
  bids: OrderbookLevel[],
  asks: OrderbookLevel[]
): OrderbookImbalance {
  const bidTotal = bids.reduce((sum, level) => sum + level.quantity, 0);
  const askTotal = asks.reduce((sum, level) => sum + level.quantity, 0);
  
  const totalVolume = bidTotal + askTotal;
  const imbalanceRatio = totalVolume > 0 ? (bidTotal - askTotal) / totalVolume : 0;
  
  let dominantSide: 'bid' | 'ask' | 'balanced';
  if (Math.abs(imbalanceRatio) < 0.1) {
    dominantSide = 'balanced';
  } else if (imbalanceRatio > 0) {
    dominantSide = 'bid';
  } else {
    dominantSide = 'ask';
  }
  
  return {
    bidTotal,
    askTotal,
    imbalanceRatio,
    dominantSide
  };
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number, symbol: string): string {
  // Determine decimal places based on price magnitude
  let decimals = 2;
  if (price > 1000) decimals = 0;
  else if (price > 100) decimals = 1;
  else if (price > 10) decimals = 2;
  else if (price > 1) decimals = 3;
  else if (price > 0.1) decimals = 4;
  else if (price > 0.01) decimals = 5;
  else if (price > 0.001) decimals = 6;
  else decimals = 8;
  
  return price.toFixed(decimals);
}

/**
 * Format quantity with appropriate decimal places
 */
export function formatQuantity(quantity: number): string {
  if (quantity >= 1000) {
    return (quantity / 1000).toFixed(1) + 'K';
  } else if (quantity >= 100) {
    return quantity.toFixed(0);
  } else if (quantity >= 10) {
    return quantity.toFixed(1);
  } else if (quantity >= 1) {
    return quantity.toFixed(2);
  } else {
    return quantity.toFixed(4);
  }
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  } else {
    return volume.toFixed(2);
  }
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get color for price change
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}

/**
 * Validate symbol format for each venue
 */
export function validateSymbol(symbol: string, venue: string): boolean {
  const patterns = {
    OKX: /^[A-Z]+-[A-Z]+(-SWAP)?$/,
    Bybit: /^[A-Z]+USDT$/,
    Deribit: /^[A-Z]+-(PERPETUAL|\d{2}[A-Z]{3}\d{2})$/
  };
  
  const pattern = patterns[venue as keyof typeof patterns];
  return pattern ? pattern.test(symbol) : false;
}

/**
 * Convert symbol between venue formats
 */
export function convertSymbol(symbol: string, fromVenue: string, toVenue: string): string {
  // Simplified conversion - in practice, this would be more comprehensive
  const baseSymbolMap: Record<string, string> = {
    'BTC-USDT': 'BTCUSDT',
    'ETH-USDT': 'ETHUSDT',
    'BTCUSDT': 'BTC-USDT',
    'ETHUSDT': 'ETH-USDT',
    'BTC-PERPETUAL': 'BTC-USD-SWAP',
    'ETH-PERPETUAL': 'ETH-USD-SWAP'
  };
  
  return baseSymbolMap[symbol] || symbol;
}

/**
 * Calculate mid price from orderbook
 */
export function calculateMidPrice(bids: OrderbookLevel[], asks: OrderbookLevel[]): number {
  if (bids.length === 0 || asks.length === 0) return 0;
  return (bids[0].price + asks[0].price) / 2;
}

/**
 * Calculate spread
 */
export function calculateSpread(bids: OrderbookLevel[], asks: OrderbookLevel[]): {
  absolute: number;
  percentage: number;
} {
  if (bids.length === 0 || asks.length === 0) {
    return { absolute: 0, percentage: 0 };
  }
  
  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const absolute = bestAsk - bestBid;
  const percentage = (absolute / bestAsk) * 100;
  
  return { absolute, percentage };
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for frequent updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format timestamp to readable time
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Check if orderbook data is stale
 */
export function isDataStale(timestamp: number, maxAge: number = 30000): boolean {
  return Date.now() - timestamp > maxAge;
}

/**
 * Generate random order ID for simulation
 */
export function generateOrderId(): string {
  return Math.random().toString(36).substr(2, 9);
}
