'use client';

import React, { useState, useCallback } from 'react';
import { Venue, OrderSimulation } from '@/types';
import { useOrderbook, useOrderSimulation } from '@/hooks/useOrderbook';
import OrderbookDisplay from '@/components/OrderbookDisplay';
import OrderSimulationForm from '@/components/OrderSimulationForm';
import OrderSimulationResults from '@/components/OrderSimulationResults';
import MarketDepthChart from '@/components/MarketDepthChart';
import VenueSelector from '@/components/VenueSelector';

const Dashboard: React.FC = () => {
  const [selectedVenue, setSelectedVenue] = useState<Venue>('OKX');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USDT');
  const [showDepthChart, setShowDepthChart] = useState(true);

  // Orderbook data hook
  const {
    orderbook,
    loading: orderbookLoading,
    error: orderbookError,
    refresh: refreshOrderbook
  } = useOrderbook(selectedVenue, selectedSymbol, true);

  // Order simulation hook
  const {
    simulationResult,
    simulating,
    error: simulationError,
    simulateOrder,
    clearSimulation
  } = useOrderSimulation();

  // Handle venue change
  const handleVenueChange = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    clearSimulation();
    
    // Update symbol to match venue's supported symbols
    const venueSymbols: Record<Venue, string> = {
      'OKX': 'BTC-USDT',
      'Bybit': 'BTCUSDT',
      'Deribit': 'BTC-PERPETUAL'
    };
    setSelectedSymbol(venueSymbols[venue]);
  }, [clearSimulation]);

  // Handle symbol change
  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    clearSimulation();
  }, [clearSimulation]);

  // Handle order simulation
  const handleSimulateOrder = useCallback((simulation: OrderSimulation) => {
    simulateOrder(simulation);
  }, [simulateOrder]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                GoQuant Orderbook Viewer
              </h1>
              <div className="ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                Real-Time
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Symbol selector */}
              <select
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {selectedVenue === 'OKX' && (
                  <>
                    <option value="BTC-USDT">BTC-USDT</option>
                    <option value="ETH-USDT">ETH-USDT</option>
                    <option value="BTC-USD-SWAP">BTC-USD-SWAP</option>
                    <option value="ETH-USD-SWAP">ETH-USD-SWAP</option>
                  </>
                )}
                {selectedVenue === 'Bybit' && (
                  <>
                    <option value="BTCUSDT">BTCUSDT</option>
                    <option value="ETHUSDT">ETHUSDT</option>
                    <option value="SOLUSDT">SOLUSDT</option>
                  </>
                )}
                {selectedVenue === 'Deribit' && (
                  <>
                    <option value="BTC-PERPETUAL">BTC-PERPETUAL</option>
                    <option value="ETH-PERPETUAL">ETH-PERPETUAL</option>
                    <option value="BTC-29MAR25">BTC-29MAR25</option>
                  </>
                )}
              </select>
              
              {/* Toggle depth chart */}
              <button
                onClick={() => setShowDepthChart(!showDepthChart)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  showDepthChart
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Depth Chart
              </button>
              
              {/* Refresh button */}
              <button
                onClick={refreshOrderbook}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Refresh Data"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Venue selector */}
          <VenueSelector
            selectedVenue={selectedVenue}
            onVenueChange={handleVenueChange}
          />

          {/* Main dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Orderbook */}
            <div className="lg:col-span-1">
              <OrderbookDisplay
                orderbook={orderbook}
                loading={orderbookLoading}
                error={orderbookError}
              />
            </div>

            {/* Middle column - Order Form */}
            <div className="lg:col-span-1">
              <OrderSimulationForm
                onSimulate={handleSimulateOrder}
                loading={simulating}
                initialValues={{
                  venue: selectedVenue,
                  symbol: selectedSymbol
                }}
              />
            </div>

            {/* Right column - Simulation Results */}
            <div className="lg:col-span-1">
              <OrderSimulationResults
                result={simulationResult}
                loading={simulating}
                error={simulationError}
                onClear={clearSimulation}
              />
            </div>
          </div>

          {/* Market depth chart */}
          {showDepthChart && (
            <div className="w-full">
              <MarketDepthChart
                orderbook={orderbook}
                simulatedOrderPrice={simulationResult?.simulation.price}
                simulatedOrderSide={simulationResult?.simulation.side === 'Buy' ? 'bid' : 'ask'}
                height={400}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              Real-Time Orderbook Viewer with Order Simulation
            </p>
            <p className="text-sm">
              Built for GoQuant - Integrating OKX, Bybit, and Deribit APIs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
