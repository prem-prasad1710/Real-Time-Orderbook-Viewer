// OKX API Service Implementation

import { Orderbook, OrderbookLevel, OKXOrderbookResponse } from '@/types';
import BaseExchangeAPI from './BaseExchangeAPI';

export class OKXService extends BaseExchangeAPI {
  private subscribedSymbols = new Set<string>();
  private callbacks = new Map<string, (orderbook: Orderbook) => void>();

  constructor() {
    super('OKX', 'https://www.okx.com', 'wss://ws.okx.com:8443/ws/v5/public');
  }

  async getOrderbook(symbol: string): Promise<Orderbook> {
    const url = `${this.baseUrl}/api/v5/market/books?instId=${symbol}&sz=15`;
    
    try {
      const response: OKXOrderbookResponse = await this.fetchJSON(url);
      
      if (response.code !== '0' || !response.data || response.data.length === 0) {
        throw new Error(`OKX API error: ${response.msg}`);
      }

      const data = response.data[0];
      const bids = data.bids.map(([price, quantity]) => 
        this.normalizeOrderbookLevel(price, quantity)
      );
      const asks = data.asks.map(([price, quantity]) => 
        this.normalizeOrderbookLevel(price, quantity)
      );

      return {
        symbol,
        venue: 'OKX',
        timestamp: parseInt(data.ts),
        bids: this.calculateTotals(bids),
        asks: this.calculateTotals(asks)
      };
    } catch (error) {
      console.error('Error fetching OKX orderbook:', error);
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
      args: [{
        channel: 'books',
        instId: symbol
      }]
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
        args: [{
          channel: 'books',
          instId: symbol
        }]
      };
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  getSupportedSymbols(): string[] {
    return [
      'BTC-USDT',
      'ETH-USDT',
      'BTC-USD-SWAP',
      'ETH-USD-SWAP',
      'SOL-USDT',
      'ADA-USDT',
      'AVAX-USDT',
      'DOT-USDT'
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
      if (data.event === 'subscribe') {
        console.log('OKX subscription confirmed:', data);
        return;
      }

      if (data.arg?.channel === 'books' && data.data) {
        const symbol = data.arg.instId;
        const callback = this.callbacks.get(symbol);
        
        if (callback && data.data.length > 0) {
          const bookData = data.data[0];
          const bids = bookData.bids.map(([price, quantity]: string[]) => 
            this.normalizeOrderbookLevel(price, quantity)
          );
          const asks = bookData.asks.map(([price, quantity]: string[]) => 
            this.normalizeOrderbookLevel(price, quantity)
          );

          const orderbook: Orderbook = {
            symbol,
            venue: 'OKX',
            timestamp: parseInt(bookData.ts),
            bids: this.calculateTotals(bids),
            asks: this.calculateTotals(asks),
            sequence: bookData.seqId
          };

          callback(orderbook);
        }
      }
    } catch (error) {
      console.error('Error handling OKX WebSocket message:', error);
    }
  }

  private handleWebSocketError(error: Event): void {
    console.error('OKX WebSocket error:', error);
  }
}

export default OKXService;
