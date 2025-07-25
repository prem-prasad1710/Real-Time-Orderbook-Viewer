// OKX API Service Implementation

import { Orderbook, OKXOrderbookResponse } from '@/types';
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
      const response = await this.fetchJSON(url) as OKXOrderbookResponse;
      
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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribeFromOrderbook(symbol: string): void {
    this.callbacks.delete(symbol);
    this.subscribedSymbols.delete(symbol);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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

  private handleWebSocketMessage(data: unknown): void {
    try {
      const message = data as Record<string, unknown>;
      
      if (message.event === 'subscribe') {
        console.log('OKX subscription confirmed');
        return;
      }

      if (message.arg && (message.arg as Record<string, unknown>)?.channel === 'books' && message.data) {
        const symbol = (message.arg as Record<string, unknown>).instId as string;
        const callback = this.callbacks.get(symbol);
        
        if (callback && Array.isArray(message.data) && message.data.length > 0) {
          const bookData = message.data[0] as Record<string, unknown>;
          const bids = (bookData.bids as string[][]).map(([price, quantity]) => 
            this.normalizeOrderbookLevel(price, quantity)
          );
          const asks = (bookData.asks as string[][]).map(([price, quantity]) => 
            this.normalizeOrderbookLevel(price, quantity)
          );

          const orderbook: Orderbook = {
            symbol,
            venue: 'OKX',
            timestamp: parseInt(bookData.ts as string),
            bids: this.calculateTotals(bids),
            asks: this.calculateTotals(asks)
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
    this.subscribedSymbols.clear();
  }
}

export default OKXService;
