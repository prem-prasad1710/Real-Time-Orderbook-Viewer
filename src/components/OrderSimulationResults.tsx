// Order Simulation Results Component

'use client';

import React from 'react';
import { OrderSimulationResult } from '@/types';
import { formatPrice, formatQuantity } from '@/utils/orderbook';

interface OrderSimulationResultsProps {
  result: OrderSimulationResult | null;
  loading?: boolean;
  error?: string | null;
  onClear?: () => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit = '', color = 'gray', icon }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
    red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300',
    blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
    gray: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toFixed(2) : value}
            {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
          </p>
        </div>
        {icon && <div className="text-2xl opacity-60">{icon}</div>}
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Running simulation...</span>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="text-red-500 text-2xl mb-2">⚠️</div>
    <p className="text-red-600 dark:text-red-400">{error}</p>
  </div>
);

const OrderSimulationResults: React.FC<OrderSimulationResultsProps> = ({
  result,
  loading = false,
  error = null,
  onClear,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <ErrorState error={error} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <p>Run a simulation to see order impact analysis</p>
        </div>
      </div>
    );
  }

  const { simulation, impactMetrics, position, affectedLevels, warnings } = result;
  
  // Determine colors based on metrics
  const getSlippageColor = (slippage: number) => {
    if (slippage < 1) return 'green';
    if (slippage < 3) return 'yellow';
    return 'red';
  };

  const getMarketImpactColor = (impact: number) => {
    if (impact < 5) return 'green';
    if (impact < 15) return 'yellow';
    return 'red';
  };

  const getFillColor = (fillPercentage: number) => {
    if (fillPercentage >= 95) return 'green';
    if (fillPercentage >= 80) return 'yellow';
    return 'red';
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Simulation Results
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {simulation.orderType} {simulation.side} • {simulation.venue} • {simulation.symbol}
          </p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Order Details */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Order Details</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Type:</span>
            <span className="ml-2 font-medium">{simulation.orderType}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Side:</span>
            <span className={`ml-2 font-medium ${simulation.side === 'Buy' ? 'text-green-600' : 'text-red-600'}`}>
              {simulation.side}
            </span>
          </div>
          {simulation.price && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Price:</span>
              <span className="ml-2 font-mono">{formatPrice(simulation.price, simulation.symbol)}</span>
            </div>
          )}
          <div>
            <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
            <span className="ml-2 font-mono">{formatQuantity(simulation.quantity)}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Timing:</span>
            <span className="ml-2 font-medium">{simulation.timing}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Position:</span>
            <span className="ml-2 font-medium">#{position + 1}</span>
          </div>
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Impact Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Fill Percentage"
            value={impactMetrics.estimatedFillPercentage}
            unit="%"
            color={getFillColor(impactMetrics.estimatedFillPercentage)}
            icon="📊"
          />
          <MetricCard
            title="Market Impact"
            value={impactMetrics.marketImpact}
            unit="%"
            color={getMarketImpactColor(impactMetrics.marketImpact)}
            icon="📈"
          />
          <MetricCard
            title="Slippage"
            value={impactMetrics.slippage}
            unit="%"
            color={getSlippageColor(impactMetrics.slippage)}
            icon="⚡"
          />
          <MetricCard
            title="Avg Fill Price"
            value={formatPrice(impactMetrics.averageFillPrice, simulation.symbol)}
            color="blue"
            icon="💰"
          />
        </div>

        {/* Time to Fill (if applicable) */}
        {impactMetrics.timeToFill !== undefined && (
          <div className="mt-4">
            <MetricCard
              title="Estimated Time to Fill"
              value={impactMetrics.timeToFill === 0 ? 'Immediate' : `${Math.round(impactMetrics.timeToFill)}s`}
              color={impactMetrics.timeToFill > 60 ? 'yellow' : 'green'}
              icon="⏱️"
            />
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Warnings</h4>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5">⚠️</div>
                <p className="text-yellow-800 dark:text-yellow-300 text-sm">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affected Levels */}
      {affectedLevels.length > 0 && (
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Affected Orderbook Levels</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Price</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400">Quantity Filled</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400">Total Available</th>
                  <th className="text-right py-2 text-gray-600 dark:text-gray-400">Fill %</th>
                </tr>
              </thead>
              <tbody>
                {affectedLevels.map((level, index) => {
                  const fillPercentage = (level.quantity / (level.total || level.quantity)) * 100;
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <td className="py-2 font-mono">{formatPrice(level.price, simulation.symbol)}</td>
                      <td className="py-2 text-right font-mono">{formatQuantity(level.quantity)}</td>
                      <td className="py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                        {formatQuantity(level.total || level.quantity)}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          fillPercentage === 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {fillPercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSimulationResults;
