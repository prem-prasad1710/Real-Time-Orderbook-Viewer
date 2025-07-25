// Deribit API Service Implementation

import { Orderbook, OrderbookLevel, DeribitOrderbookResponse } from '@/types';
import BaseExchangeAPI from './BaseExchangeAPI';

export class DeribitService extends BaseExchangeAPI {
  private subscribedSymbols = new Set<string>();
  private callbacks = new Map<string, (orderbook: Orderbook) => void>();
  private messageId = 1;

  constructor() {
    super('Deribit', 'https://www.deribit.com', 'wss://www.deribit.com/ws/api/v2');
  }

  async getOrderbook(symbol: string): Promise<Orderbook> {
    const url = `${this.baseUrl}/api/v2/public/get_order_book?instrument_name=${symbol}&depth=15`;
    
    try {
      const response: DeribitOrderbookResponse = await this.fetchJSON(url);
      
      if (!response.result) {
        throw new Error('Deribit API error: No result data');
      }

      const data = response.result;
      const bids = data.bids.map(([price, quantity]) => 
        this.normalizeOrderbookLevel(price.toString(), quantity.toString())
      );
      const asks = data.asks.map(([price, quantity]) => 
        this.normalizeOrderbookLevel(price.toString(), quantity.toString())
      );

      return {
        symbol,
        venue: 'Deribit',
        timestamp: data.timestamp,
        bids: this.calculateTotals(bids),
        asks: this.calculateTotals(asks),
        sequence: data.change_id
      };
    } catch (error) {
      console.error('Error fetching Deribit orderbook:', error);
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
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'public/subscribe',
      params: {
        channels: [`book.${symbol}.100ms`]
      }
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
        jsonrpc: '2.0',
        id: this.messageId++,
        method: 'public/unsubscribe',
        params: {
          channels: [`book.${symbol}.100ms`]
        }
      };
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  getSupportedSymbols(): string[] {
    return [
      'BTC-PERPETUAL',
      'ETH-PERPETUAL',
      'SOL-PERPETUAL',
      'BTC-29MAR25',
      'ETH-29MAR25',
      'BTC-28JUN25',
      'ETH-28JUN25'
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
      // Handle subscription confirmation
      if (data.result && data.method === 'public/subscribe') {
        console.log('Deribit subscription confirmed:', data);
        return;
      }

      // Handle orderbook updates
      if (data.params?.channel?.startsWith('book.')) {
        const channelParts = data.params.channel.split('.');
        const symbol = channelParts[1];
        const callback = this.callbacks.get(symbol);
        
        if (callback && data.params.data) {
          const bookData = data.params.data;
          const bids = bookData.bids.map(([price, quantity]: number[]) => 
            this.normalizeOrderbookLevel(price.toString(), quantity.toString())
          );
          const asks = bookData.asks.map(([price, quantity]: number[]) => 
            this.normalizeOrderbookLevel(price.toString(), quantity.toString())
          );

          const orderbook: Orderbook = {
            symbol,
            venue: 'Deribit',
            timestamp: bookData.timestamp,
            bids: this.calculateTotals(bids),
            asks: this.calculateTotals(asks),
            sequence: bookData.change_id
          };

          callback(orderbook);
        }
      }
    } catch (error) {
      console.error('Error handling Deribit WebSocket message:', error);
    }
  }

  private handleWebSocketError(error: Event): void {
    console.error('Deribit WebSocket error:', error);
  }
}

export default DeribitService;
