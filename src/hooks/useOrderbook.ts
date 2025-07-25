// Custom React hooks for orderbook management

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Venue, Orderbook, OrderSimulation, OrderSimulationResult } from '@/types';
import ExchangeManager from '@/services/ExchangeManager';

/**
 * Hook for managing exchange manager instance
 */
export function useExchangeManager() {
  const exchangeManagerRef = useRef<ExchangeManager | null>(null);

  if (!exchangeManagerRef.current) {
    exchangeManagerRef.current = new ExchangeManager();
  }

  useEffect(() => {
    return () => {
      if (exchangeManagerRef.current) {
        exchangeManagerRef.current.disconnect();
      }
    };
  }, []);

  return exchangeManagerRef.current;
}

/**
 * Hook for managing orderbook data with real-time updates
 */
export function useOrderbook(venue: Venue, symbol: string, autoSubscribe: boolean = true) {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const exchangeManager = useExchangeManager();
  const subscriptionRef = useRef<boolean>(false);

  // Fetch initial orderbook data
  const fetchOrderbook = useCallback(async () => {
    if (!symbol || !venue) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await exchangeManager.getOrderbook(venue, symbol);
      setOrderbook(data);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orderbook');
      console.error('Error fetching orderbook:', err);
    } finally {
      setLoading(false);
    }
  }, [exchangeManager, venue, symbol]);

  // Handle real-time updates
  const handleOrderbookUpdate = useCallback((newOrderbook: Orderbook) => {
    setOrderbook(newOrderbook);
    setLastUpdated(Date.now());
    setError(null);
  }, []);

  // Subscribe to real-time updates
  const subscribe = useCallback(() => {
    if (!symbol || !venue || subscriptionRef.current) return;
    
    try {
      exchangeManager.subscribeToOrderbook(venue, symbol, handleOrderbookUpdate);
      subscriptionRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to orderbook');
    }
  }, [exchangeManager, venue, symbol, handleOrderbookUpdate]);

  // Unsubscribe from updates
  const unsubscribe = useCallback(() => {
    if (!symbol || !venue || !subscriptionRef.current) return;
    
    exchangeManager.unsubscribeFromOrderbook(venue, symbol);
    subscriptionRef.current = false;
  }, [exchangeManager, venue, symbol]);

  // Auto-subscribe effect
  useEffect(() => {
    if (autoSubscribe && venue && symbol) {
      fetchOrderbook();
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [venue, symbol, autoSubscribe, fetchOrderbook, subscribe, unsubscribe]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchOrderbook();
  }, [fetchOrderbook]);

  return {
    orderbook,
    loading,
    error,
    lastUpdated,
    refresh,
    subscribe,
    unsubscribe,
    isSubscribed: subscriptionRef.current
  };
}

/**
 * Hook for managing multiple venue orderbooks
 */
export function useMultiVenueOrderbooks(venues: Venue[], symbol: string) {
  const [orderbooks, setOrderbooks] = useState<Record<Venue, Orderbook | null>>({
    OKX: null,
    Bybit: null,
    Deribit: null
  });
  const [loading, setLoading] = useState<Record<Venue, boolean>>({
    OKX: false,
    Bybit: false,
    Deribit: false
  });
  const [errors, setErrors] = useState<Record<Venue, string | null>>({
    OKX: null,
    Bybit: null,
    Deribit: null
  });

  const exchangeManager = useExchangeManager();

  // Update single venue data
  const updateVenueData = useCallback((venue: Venue, data: Orderbook | null, isLoading: boolean, error: string | null) => {
    setOrderbooks(prev => ({ ...prev, [venue]: data }));
    setLoading(prev => ({ ...prev, [venue]: isLoading }));
    setErrors(prev => ({ ...prev, [venue]: error }));
  }, []);

  // Fetch data for a specific venue
  const fetchVenueOrderbook = useCallback(async (venue: Venue) => {
    if (!symbol) return;

    updateVenueData(venue, null, true, null);

    try {
      const data = await exchangeManager.getOrderbook(venue, symbol);
      updateVenueData(venue, data, false, null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch orderbook';
      updateVenueData(venue, null, false, errorMsg);
    }
  }, [exchangeManager, symbol, updateVenueData]);

  // Subscribe to real-time updates for a venue
  const subscribeVenue = useCallback((venue: Venue) => {
    if (!symbol) return;

    const handleUpdate = (orderbook: Orderbook) => {
      updateVenueData(venue, orderbook, false, null);
    };

    exchangeManager.subscribeToOrderbook(venue, symbol, handleUpdate);
  }, [exchangeManager, symbol, updateVenueData]);

  // Fetch all venues
  const fetchAll = useCallback(() => {
    venues.forEach(venue => {
      fetchVenueOrderbook(venue);
      subscribeVenue(venue);
    });
  }, [venues, fetchVenueOrderbook, subscribeVenue]);

  // Effect for initial load and symbol changes
  useEffect(() => {
    if (symbol && venues.length > 0) {
      fetchAll();
    }

    return () => {
      venues.forEach(venue => {
        exchangeManager.unsubscribeFromOrderbook(venue, symbol);
      });
    };
  }, [symbol, venues, fetchAll, exchangeManager]);

  return {
    orderbooks,
    loading,
    errors,
    refresh: fetchAll,
    refreshVenue: fetchVenueOrderbook
  };
}

/**
 * Hook for order simulation
 */
export function useOrderSimulation() {
  const [simulationResult, setSimulationResult] = useState<OrderSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exchangeManager = useExchangeManager();

  const simulateOrder = useCallback(async (simulation: OrderSimulation) => {
    setSimulating(true);
    setError(null);

    try {
      // Add timing delay if specified
      if (simulation.timing !== 'immediate') {
        const delay = parseInt(simulation.timing.replace('s', '')) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = exchangeManager.simulateOrder(simulation);
      setSimulationResult(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Simulation failed';
      setError(errorMsg);
      setSimulationResult(null);
    } finally {
      setSimulating(false);
    }
  }, [exchangeManager]);

  const clearSimulation = useCallback(() => {
    setSimulationResult(null);
    setError(null);
  }, []);

  return {
    simulationResult,
    simulating,
    error,
    simulateOrder,
    clearSimulation
  };
}

/**
 * Hook for managing supported symbols across venues
 */
export function useSupportedSymbols() {
  const [symbols, setSymbols] = useState<Record<Venue, string[]>>({
    OKX: [],
    Bybit: [],
    Deribit: []
  });

  const exchangeManager = useExchangeManager();

  useEffect(() => {
    const allSymbols = exchangeManager.getAllSupportedSymbols();
    setSymbols(allSymbols);
  }, [exchangeManager]);

  return symbols;
}

/**
 * Hook for WebSocket connection status
 */
export function useConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<Record<Venue, 'connected' | 'disconnected' | 'connecting'>>({
    OKX: 'disconnected',
    Bybit: 'disconnected',
    Deribit: 'disconnected'
  });

  // This would be enhanced to actually monitor WebSocket connections
  // For now, we'll simulate connection status
  useEffect(() => {
    // Simulate connection process
    const timer = setTimeout(() => {
      setConnectionStatus({
        OKX: 'connected',
        Bybit: 'connected',
        Deribit: 'connected'
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return connectionStatus;
}

/**
 * Hook for managing form state with validation
 */
export function useOrderForm() {
  const [formData, setFormData] = useState<OrderSimulation>({
    venue: 'OKX',
    symbol: 'BTC-USDT',
    orderType: 'Limit',
    side: 'Buy',
    price: 0,
    quantity: 0,
    timing: 'immediate'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback((field: keyof OrderSimulation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol) {
      newErrors.symbol = 'Symbol is required';
    }

    if (formData.orderType === 'Limit' && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      venue: 'OKX',
      symbol: 'BTC-USDT',
      orderType: 'Limit',
      side: 'Buy',
      price: 0,
      quantity: 0,
      timing: 'immediate'
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
}
