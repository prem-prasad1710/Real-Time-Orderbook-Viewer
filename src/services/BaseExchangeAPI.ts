// Base API service for cryptocurrency exchanges

import { Orderbook, OrderbookLevel, Venue } from '@/types';

export abstract class BaseExchangeAPI {
  protected venue: Venue;
  protected baseUrl: string;
  protected wsUrl: string;
  protected ws: WebSocket | null = null;
  protected reconnectTimer: NodeJS.Timeout | null = null;
  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 5;
  protected reconnectInterval = 5000;

  constructor(venue: Venue, baseUrl: string, wsUrl: string) {
    this.venue = venue;
    this.baseUrl = baseUrl;
    this.wsUrl = wsUrl;
  }

  abstract getOrderbook(symbol: string): Promise<Orderbook>;
  abstract subscribeToOrderbook(symbol: string, callback: (orderbook: Orderbook) => void): void;
  abstract unsubscribeFromOrderbook(symbol: string): void;
  abstract getSupportedSymbols(): string[];

  protected createWebSocket(url: string, onMessage: (data: unknown) => void, onError?: (error: Event) => void): WebSocket {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log(`WebSocket connected to ${this.venue}`);
      this.reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error(`Error parsing WebSocket message from ${this.venue}:`, error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error from ${this.venue}:`, error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected from ${this.venue}`);
      this.scheduleReconnect(url, onMessage, onError);
    };

    return ws;
  }

  private scheduleReconnect(url: string, onMessage: (data: unknown) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect to ${this.venue} (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.ws = this.createWebSocket(url, onMessage, onError);
      }, this.reconnectInterval);
    }
  }

  protected async fetchJSON(url: string): Promise<unknown> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${this.venue}:`, error);
      throw error;
    }
  }

  protected normalizeOrderbookLevel(priceStr: string, quantityStr: string): OrderbookLevel {
    return {
      price: parseFloat(priceStr),
      quantity: parseFloat(quantityStr)
    };
  }

  protected calculateTotals(levels: OrderbookLevel[]): OrderbookLevel[] {
    let runningTotal = 0;
    return levels.map(level => {
      runningTotal += level.quantity;
      return {
        ...level,
        total: runningTotal
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export default BaseExchangeAPI;
