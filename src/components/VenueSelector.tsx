// Venue Selector Component

'use client';

import React from 'react';
import { Venue } from '@/types';
import { useConnectionStatus } from '@/hooks/useOrderbook';

interface VenueSelectorProps {
  selectedVenue: Venue;
  onVenueChange: (venue: Venue) => void;
  disabled?: boolean;
  showConnectionStatus?: boolean;
  className?: string;
}

interface VenueButtonProps {
  venue: Venue;
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const VenueButton: React.FC<VenueButtonProps> = ({
  venue,
  isSelected,
  isConnected,
  onClick,
  disabled = false
}) => {
  const getVenueColor = (venue: Venue) => {
    switch (venue) {
      case 'OKX': return 'blue';
      case 'Bybit': return 'yellow';
      case 'Deribit': return 'purple';
      default: return 'gray';
    }
  };

  const color = getVenueColor(venue);
  
  const baseClasses = `
    relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'}
  `;

  const colorClasses = {
    blue: isSelected
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 text-gray-700 dark:text-gray-300',
    yellow: isSelected
      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
      : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 text-gray-700 dark:text-gray-300',
    purple: isSelected
      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-300',
    gray: 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
  };

  const connectionStatusColor = isConnected ? 'bg-green-500' : 'bg-red-500';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      {/* Connection status indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${connectionStatusColor}`} />
      
      {/* Venue logo/icon - placeholder */}
      <div className="w-8 h-8 mb-2 flex items-center justify-center">
        {venue === 'OKX' && <div className="text-2xl">🅾️</div>}
        {venue === 'Bybit' && <div className="text-2xl">🐝</div>}
        {venue === 'Deribit' && <div className="text-2xl">🏛️</div>}
      </div>
      
      {/* Venue name */}
      <div className="font-semibold text-lg">{venue}</div>
      
      {/* Connection status */}
      <div className="text-xs mt-1 opacity-75">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-lg pointer-events-none" />
      )}
    </button>
  );
};

const VenueSelector: React.FC<VenueSelectorProps> = ({
  selectedVenue,
  onVenueChange,
  disabled = false,
  showConnectionStatus = true,
  className = ''
}) => {
  const connectionStatus = useConnectionStatus();
  const venues: Venue[] = ['OKX', 'Bybit', 'Deribit'];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Exchange
        </h3>
        {showConnectionStatus && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live Data
          </div>
        )}
      </div>

      {/* Venue buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <VenueButton
            key={venue}
            venue={venue}
            isSelected={selectedVenue === venue}
            isConnected={connectionStatus[venue] === 'connected'}
            onClick={() => !disabled && onVenueChange(venue)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Venue information */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900 dark:text-white">OKX</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              Spot & Futures<br />
              High Liquidity
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900 dark:text-white">Bybit</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              Spot Trading<br />
              Fast Execution
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900 dark:text-white">Deribit</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">
              Options & Futures<br />
              BTC/ETH Focus
            </div>
          </div>
        </div>
      </div>

      {/* Connection status details */}
      {showConnectionStatus && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between items-center">
              <span>Connection Status:</span>
              <div className="flex space-x-4">
                {venues.map((venue) => (
                  <div key={venue} className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${
                        connectionStatus[venue] === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{venue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSelector;
