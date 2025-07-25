// Mock Data Service for Development
// Simulates real-time orderbook data without external API calls

import { Orderbook, OrderbookLevel, Venue } from '@/types';

export class MockDataService {
  private static instance: MockDataService;
  private intervals = new Map<string, NodeJS.Timeout>();
  private callbacks = new Map<string, (orderbook: Orderbook) => void>();

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Generate realistic mock orderbook data
  generateMockOrderbook(venue: Venue, symbol: string): Orderbook {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const spread = basePrice * 0.001; // 0.1% spread
    
    const bids: OrderbookLevel[] = [];
    const asks: OrderbookLevel[] = [];

    // Generate 15 levels of bids and asks
    for (let i = 0; i < 15; i++) {
      const bidPrice = basePrice - spread/2 - (i * spread * 0.1);
      const askPrice = basePrice + spread/2 + (i * spread * 0.1);
      
      const bidQuantity = Math.random() * 10 + 1;
      const askQuantity = Math.random() * 10 + 1;

      bids.push({
        price: bidPrice,
        quantity: bidQuantity,
        total: 0 // Will be calculated
      });

      asks.push({
        price: askPrice,
        quantity: askQuantity,
        total: 0 // Will be calculated
      });
    }

    // Calculate running totals
    let bidTotal = 0;
    let askTotal = 0;

    bids.forEach(bid => {
      bidTotal += bid.quantity;
      bid.total = bidTotal;
    });

    asks.forEach(ask => {
      askTotal += ask.quantity;
      ask.total = askTotal;
    });

    return {
      symbol,
      venue,
      timestamp: Date.now(),
      bids,
      asks
    };
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      // OKX symbols
      'BTC-USDT': 43000,
      'ETH-USDT': 2600,
      'BTC-USD-SWAP': 43000,
      'ETH-USD-SWAP': 2600,
      
      // Bybit symbols
      'BTCUSDT': 43000,
      'ETHUSDT': 2600,
      'SOLUSDT': 100,
      'ADAUSDT': 0.45,
      
      // Deribit symbols
      'BTC-PERPETUAL': 43000,
      'ETH-PERPETUAL': 2600,
      'BTC-29MAR25': 43500
    };

    return basePrices[symbol] || 1000;
  }

  async getMockOrderbook(venue: Venue, symbol: string): Promise<Orderbook> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Add some randomness to simulate price movements
    const orderbook = this.generateMockOrderbook(venue, symbol);
    
    // Add small random price movements
    const priceVariation = 0.001; // 0.1% max variation
    const variation = (Math.random() - 0.5) * priceVariation;
    
    orderbook.bids.forEach(bid => {
      bid.price *= (1 + variation);
      bid.quantity *= (0.8 + Math.random() * 0.4); // ±20% quantity variation
    });

    orderbook.asks.forEach(ask => {
      ask.price *= (1 + variation);
      ask.quantity *= (0.8 + Math.random() * 0.4); // ±20% quantity variation
    });

    return orderbook;
  }

  subscribeToMockOrderbook(venue: Venue, symbol: string, callback: (orderbook: Orderbook) => void): void {
    const key = `${venue}-${symbol}`;
    
    // Store callback
    this.callbacks.set(key, callback);

    // Clear existing interval if any
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key)!);
    }

    // Send initial data
    this.getMockOrderbook(venue, symbol).then(callback);

    // Set up periodic updates (every 1-3 seconds)
    const interval = setInterval(async () => {
      try {
        const orderbook = await this.getMockOrderbook(venue, symbol);
        const storedCallback = this.callbacks.get(key);
        if (storedCallback) {
          storedCallback(orderbook);
        }
      } catch (error) {
        console.error(`Error generating mock data for ${key}:`, error);
      }
    }, 1000 + Math.random() * 2000);

    this.intervals.set(key, interval);
  }

  unsubscribeFromMockOrderbook(venue: Venue, symbol: string): void {
    const key = `${venue}-${symbol}`;
    
    // Clear interval
    if (this.intervals.has(key)) {
      clearInterval(this.intervals.get(key)!);
      this.intervals.delete(key);
    }

    // Remove callback
    this.callbacks.delete(key);
  }

  getSupportedSymbols(venue: Venue): string[] {
    const symbols: Record<Venue, string[]> = {
      'OKX': ['BTC-USDT', 'ETH-USDT', 'BTC-USD-SWAP', 'ETH-USD-SWAP'],
      'Bybit': ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT'],
      'Deribit': ['BTC-PERPETUAL', 'ETH-PERPETUAL', 'BTC-29MAR25']
    };

    return symbols[venue] || [];
  }

  // Simulate order impact for order simulation
  simulateOrderImpact(orderbook: Orderbook, side: 'Buy' | 'Sell', quantity: number, orderType: 'Market' | 'Limit', limitPrice?: number) {
    const levels = side === 'Buy' ? orderbook.asks : orderbook.bids;
    let remainingQuantity = quantity;
    let totalCost = 0;
    let fillPrice = 0;
    
    if (orderType === 'Market') {
      // Fill against available levels
      for (const level of levels) {
        if (remainingQuantity <= 0) break;
        
        const fillQuantity = Math.min(remainingQuantity, level.quantity);
        totalCost += fillQuantity * level.price;
        remainingQuantity -= fillQuantity;
      }
      
      fillPrice = quantity > 0 ? totalCost / (quantity - remainingQuantity) : 0;
    } else if (orderType === 'Limit' && limitPrice) {
      // For limit orders, calculate potential fill based on price
      fillPrice = limitPrice;
      
      for (const level of levels) {
        if (remainingQuantity <= 0) break;
        
        const canFill = side === 'Buy' ? level.price <= limitPrice : level.price >= limitPrice;
        if (canFill) {
          const fillQuantity = Math.min(remainingQuantity, level.quantity);
          totalCost += fillQuantity * level.price;
          remainingQuantity -= fillQuantity;
        }
      }
    }

    const fillPercentage = ((quantity - remainingQuantity) / quantity) * 100;
    const marketPrice = levels[0]?.price || 0;
    const slippage = marketPrice > 0 ? Math.abs((fillPrice - marketPrice) / marketPrice) * 100 : 0;

    return {
      fillPercentage,
      averageFillPrice: fillPrice,
      slippage,
      marketImpact: (quantity / levels[0]?.quantity || 1) * 100,
      estimatedTime: orderType === 'Market' ? 0 : Math.random() * 30 + 5 // 5-35 seconds for limit orders
    };
  }
}

export default MockDataService;
