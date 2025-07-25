// Types for the Real-Time Orderbook Viewer

export interface OrderbookLevel {
  price: number;
  quantity: number;
  total?: number;
}

export interface Orderbook {
  symbol: string;
  venue: Venue;
  timestamp: number;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  sequence?: number;
}

export type Venue = 'OKX' | 'Bybit' | 'Deribit';

export type OrderType = 'Market' | 'Limit';
export type OrderSide = 'Buy' | 'Sell';
export type TimingDelay = 'immediate' | '5s' | '10s' | '30s';

export interface OrderSimulation {
  venue: Venue;
  symbol: string;
  orderType: OrderType;
  side: OrderSide;
  price?: number;
  quantity: number;
  timing: TimingDelay;
}

export interface OrderImpactMetrics {
  estimatedFillPercentage: number;
  marketImpact: number;
  slippage: number;
  timeToFill?: number;
  averageFillPrice: number;
}

export interface SimulatedOrderPosition {
  position: number; // Position in the orderbook (0-based)
  impactMetrics: OrderImpactMetrics;
  affectedLevels: OrderbookLevel[];
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface VenueConfig {
  name: Venue;
  apiUrl: string;
  wsUrl: string;
  symbols: string[];
  rateLimit: number;
}

export interface MarketDepthData {
  price: number;
  cumulativeVolume: number;
  side: 'bid' | 'ask';
}

export interface OrderbookImbalance {
  bidTotal: number;
  askTotal: number;
  imbalanceRatio: number;
  dominantSide: 'bid' | 'ask' | 'balanced';
}

// API Response types for each venue
export interface OKXOrderbookResponse {
  code: string;
  msg: string;
  data: Array<{
    asks: string[][];
    bids: string[][];
    ts: string;
  }>;
}

export interface BybitOrderbookResponse {
  retCode: number;
  retMsg: string;
  result: {
    s: string; // symbol
    b: string[][]; // bids
    a: string[][]; // asks
    ts: number;
    u: number; // update id
  };
}

export interface DeribitOrderbookResponse {
  jsonrpc: string;
  id: number;
  result: {
    instrument_name: string;
    bids: number[][];
    asks: number[][];
    timestamp: number;
    change_id: number;
  };
}

// WebSocket message types
export interface WebSocketMessage {
  venue: Venue;
  type: 'orderbook' | 'error' | 'connected' | 'disconnected';
  data?: any;
  error?: string;
}

export interface OrderSimulationResult extends SimulatedOrderPosition {
  orderbook: Orderbook;
  simulation: OrderSimulation;
  warnings: string[];
}

// Form validation schemas
export interface OrderFormData {
  venue: Venue;
  symbol: string;
  orderType: OrderType;
  side: OrderSide;
  price: string;
  quantity: string;
  timing: TimingDelay;
}

export interface OrderFormErrors {
  venue?: string;
  symbol?: string;
  orderType?: string;
  side?: string;
  price?: string;
  quantity?: string;
  timing?: string;
}

// Chart data types
export interface ChartDataPoint {
  price: number;
  volume: number;
  cumulative: number;
  side: 'bid' | 'ask';
}

export interface DepthChartData {
  bids: ChartDataPoint[];
  asks: ChartDataPoint[];
  maxVolume: number;
  spread: number;
}
