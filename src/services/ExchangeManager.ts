// Exchange Manager Service - Coordinates all venue APIs

import { Venue, Orderbook, OrderSimulation, OrderSimulationResult, OrderImpactMetrics, SimulatedOrderPosition } from '@/types';
import MockDataService from './MockDataService';

export class ExchangeManager {
  private mockDataService: MockDataService;
  private orderbooks: Map<string, Orderbook> = new Map();
  private callbacks: Map<string, (orderbook: Orderbook) => void> = new Map();

  constructor() {
    this.mockDataService = MockDataService.getInstance();
  }

  /**
   * Get supported symbols for a venue
   */
  getSupportedSymbols(venue: Venue): string[] {
    return this.mockDataService.getSupportedSymbols(venue);
  }

  /**
   * Get all supported symbols across all venues
   */
  getAllSupportedSymbols(): Record<Venue, string[]> {
    const venues: Venue[] = ['OKX', 'Bybit', 'Deribit'];
    const result: Record<Venue, string[]> = {} as Record<Venue, string[]>;
    
    venues.forEach(venue => {
      result[venue] = this.mockDataService.getSupportedSymbols(venue);
    });
    
    return result;
  }

  /**
   * Fetch orderbook from a specific venue (using mock data)
   */
  async getOrderbook(venue: Venue, symbol: string): Promise<Orderbook> {
    try {
      const orderbook = await this.mockDataService.getMockOrderbook(venue, symbol);
      this.orderbooks.set(`${venue}-${symbol}`, orderbook);
      return orderbook;
    } catch (error) {
      console.error(`Error fetching orderbook for ${venue} ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time orderbook updates (using mock data)
   */
  subscribeToOrderbook(venue: Venue, symbol: string, callback: (orderbook: Orderbook) => void): void {
    const key = `${venue}-${symbol}`;
    this.callbacks.set(key, callback);

    this.mockDataService.subscribeToMockOrderbook(venue, symbol, (orderbook: Orderbook) => {
      this.orderbooks.set(key, orderbook);
      callback(orderbook);
    });
  }

  /**
   * Unsubscribe from orderbook updates
   */
  unsubscribeFromOrderbook(venue: Venue, symbol: string): void {
    const key = `${venue}-${symbol}`;
    this.callbacks.delete(key);
    this.mockDataService.unsubscribeFromMockOrderbook(venue, symbol);
  }

  /**
   * Get the current cached orderbook
   */
  getCachedOrderbook(venue: Venue, symbol: string): Orderbook | undefined {
    return this.orderbooks.get(`${venue}-${symbol}`);
  }

  /**
   * Simulate order placement and calculate impact metrics
   */
  simulateOrder(simulation: OrderSimulation): OrderSimulationResult {
    const orderbook = this.getCachedOrderbook(simulation.venue, simulation.symbol);
    
    if (!orderbook) {
      throw new Error(`No orderbook data available for ${simulation.venue} ${simulation.symbol}`);
    }

    const result = this.calculateOrderImpact(orderbook, simulation);
    
    return {
      ...result,
      orderbook,
      simulation,
      warnings: this.generateWarnings(simulation, result.impactMetrics)
    };
  }

  /**
   * Calculate order impact metrics (using mock data service)
   */
  private calculateOrderImpact(orderbook: Orderbook, simulation: OrderSimulation): SimulatedOrderPosition {
    const mockImpact = this.mockDataService.simulateOrderImpact(
      orderbook,
      simulation.side,
      simulation.quantity,
      simulation.orderType,
      simulation.price
    );

    // For mock mode, create simplified affected levels
    const levels = simulation.side === 'Buy' ? orderbook.asks : orderbook.bids;
    const affectedLevels = levels.slice(0, Math.min(3, levels.length)); // Show first 3 levels as affected

    return {
      position: 0, // For simplicity in mock mode
      impactMetrics: {
        estimatedFillPercentage: mockImpact.fillPercentage,
        averageFillPrice: mockImpact.averageFillPrice,
        slippage: mockImpact.slippage,
        marketImpact: mockImpact.marketImpact,
        timeToFill: mockImpact.estimatedTime
      },
      affectedLevels
    };
  }

  /**
   * Generate warnings for potentially problematic orders
   */
  private generateWarnings(simulation: OrderSimulation, metrics: OrderImpactMetrics): string[] {
    const warnings: string[] = [];

    if (metrics.slippage > 5) {
      warnings.push(`High slippage warning: ${metrics.slippage.toFixed(2)}% slippage expected`);
    }

    if (metrics.marketImpact > 10) {
      warnings.push(`High market impact: ${metrics.marketImpact.toFixed(2)}% of available liquidity`);
    }

    if (metrics.estimatedFillPercentage < 100) {
      warnings.push(`Partial fill expected: Only ${metrics.estimatedFillPercentage.toFixed(1)}% may be filled`);
    }

    if (metrics.timeToFill && metrics.timeToFill > 60) {
      warnings.push(`Long fill time: Estimated ${Math.round(metrics.timeToFill)}s to complete`);
    }

    return warnings;
  }

  /**
   * Disconnect all services and clean up
   */
  disconnect(): void {
    // Unsubscribe from all mock data subscriptions
    this.callbacks.forEach((callback, key) => {
      const [venue, symbol] = key.split('-');
      this.mockDataService.unsubscribeFromMockOrderbook(venue as Venue, symbol);
    });
    
    this.orderbooks.clear();
    this.callbacks.clear();
  }
}

export default ExchangeManager;
