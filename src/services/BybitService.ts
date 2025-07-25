// Bybit API Service Implementation

import { Orderbook, BybitOrderbookResponse } from '@/types';
import BaseExchangeAPI from './BaseExchangeAPI';

export class BybitService extends BaseExchangeAPI {
  private subscribedSymbols = new Set<string>();
  private callbacks = new Map<string, (orderbook: Orderbook) => void>();

  constructor() {
    super('Bybit', 'https://api.bybit.com', 'wss://stream.bybit.com/v5/public/spot');
  }

  async getOrderbook(symbol: string): Promise<Orderbook> {
    const url = `${this.baseUrl}/v5/market/orderbook?category=spot&symbol=${symbol}&limit=25`;
    
    try {
      const response: BybitOrderbookResponse = await this.fetchJSON(url);
      
      if (response.retCode !== 0 || !response.result) {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }

      const data = response.result;
      const bids = data.b.map(([price, quantity]) => 
        this.normalizeOrderbookLevel(price, quantity)
      );
      const asks = data.a.map(([price, quantity]) => 
        this.normalizeOrderbookLevel(price, quantity)
      );

      return {
        symbol,
        venue: 'Bybit',
        timestamp: data.ts,
        bids: this.calculateTotals(bids),
        asks: this.calculateTotals(asks),
        sequence: data.u
      };
    } catch (error) {
      console.error('Error fetching Bybit orderbook:', error);
      throw error;
    }
  }

  subscribeToOrderbook(symbol: string, callback: (orderbook: Orderbook) => void): void {
    if (this.subscribedSymbols.has(symbol)) {
      this.callbacks.set(symbol, callback);
      return;
    }

    this.callbacks.set(symbol, callback);
    this.subscribedSymbols.add(symbol);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }

    // Subscribe to the symbol once connected
    const subscribeMessage = {
      op: 'subscribe',
      args: [`orderbook.25.${symbol}`]
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscribeMessage));
    } else {
      // Queue the subscription for when connection opens
      const originalOnOpen = this.ws?.onopen;
      if (this.ws) {
        this.ws.onopen = (event) => {
          if (originalOnOpen && this.ws) originalOnOpen.call(this.ws, event);
          this.ws?.send(JSON.stringify(subscribeMessage));
        };
      }
    }
  }

  unsubscribeFromOrderbook(symbol: string): void {
    if (!this.subscribedSymbols.has(symbol)) return;

    this.subscribedSymbols.delete(symbol);
    this.callbacks.delete(symbol);

    if (this.ws?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        op: 'unsubscribe',
        args: [`orderbook.25.${symbol}`]
      };
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  getSupportedSymbols(): string[] {
    return [
      'BTCUSDT',
      'ETHUSDT',
      'SOLUSDT',
      'ADAUSDT',
      'AVAXUSDT',
      'DOTUSDT',
      'LINKUSDT',
      'UNIUSDT'
    ];
  }

  private connectWebSocket(): void {
    this.ws = this.createWebSocket(
      this.wsUrl,
      this.handleWebSocketMessage.bind(this),
      this.handleWebSocketError.bind(this)
    );
  }

  private handleWebSocketMessage(data: any): void {
    try {
      if (data.success && data.op === 'subscribe') {
        console.log('Bybit subscription confirmed:', data);
        return;
      }

      if (data.topic?.startsWith('orderbook') && data.data) {
        const symbol = data.topic.split('.')[2]; // Extract symbol from topic
        const callback = this.callbacks.get(symbol);
        
        if (callback) {
          const bookData = data.data;
          const bids = bookData.b.map(([price, quantity]: string[]) => 
            this.normalizeOrderbookLevel(price, quantity)
          );
          const asks = bookData.a.map(([price, quantity]: string[]) => 
            this.normalizeOrderbookLevel(price, quantity)
          );

          const orderbook: Orderbook = {
            symbol,
            venue: 'Bybit',
            timestamp: data.ts,
            bids: this.calculateTotals(bids),
            asks: this.calculateTotals(asks),
            sequence: bookData.u
          };

          callback(orderbook);
        }
      }
    } catch (error) {
      console.error('Error handling Bybit WebSocket message:', error);
    }
  }

  private handleWebSocketError(error: Event): void {
    console.error('Bybit WebSocket error:', error);
  }
}

export default BybitService;
