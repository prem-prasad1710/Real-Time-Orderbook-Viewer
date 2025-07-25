// Order Simulation Form Component

'use client';

import React, { useState, useEffect } from 'react';
import { Venue, OrderType, OrderSide, TimingDelay, OrderSimulation } from '@/types';
import { useSupportedSymbols } from '@/hooks/useOrderbook';

interface OrderSimulationFormProps {
  onSimulate: (simulation: OrderSimulation) => void;
  loading?: boolean;
  disabled?: boolean;
  initialValues?: Partial<OrderSimulation>;
  className?: string;
}

const OrderSimulationForm: React.FC<OrderSimulationFormProps> = ({
  onSimulate,
  loading = false,
  disabled = false,
  initialValues = {},
  className = ''
}) => {
  const [formData, setFormData] = useState<OrderSimulation>({
    venue: 'OKX',
    symbol: 'BTC-USDT',
    orderType: 'Limit',
    side: 'Buy',
    price: undefined,
    quantity: 0,
    timing: 'immediate',
    ...initialValues
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const supportedSymbols = useSupportedSymbols();

  // Update form data
  const updateField = (field: keyof OrderSimulation, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.symbol) {
      newErrors.symbol = 'Symbol is required';
    }

    if (formData.orderType === 'Limit' && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'Price must be greater than 0 for limit orders';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    // Check if symbol is supported by venue
    const venueSymbols = supportedSymbols[formData.venue] || [];
    if (formData.symbol && !venueSymbols.includes(formData.symbol)) {
      newErrors.symbol = `Symbol not supported by ${formData.venue}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && !loading && !disabled) {
      onSimulate(formData);
    }
  };

  // Update symbol when venue changes
  useEffect(() => {
    const venueSymbols = supportedSymbols[formData.venue] || [];
    if (venueSymbols.length > 0 && !venueSymbols.includes(formData.symbol)) {
      updateField('symbol', venueSymbols[0]);
    }
  }, [formData.venue, supportedSymbols]);

  const venues: Venue[] = ['OKX', 'Bybit', 'Deribit'];
  const orderTypes: OrderType[] = ['Market', 'Limit'];
  const sides: OrderSide[] = ['Buy', 'Sell'];
  const timingOptions: TimingDelay[] = ['immediate', '5s', '10s', '30s'];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Order Simulation
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Venue Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Venue
          </label>
          <select
            value={formData.venue}
            onChange={(e) => updateField('venue', e.target.value as Venue)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={disabled}
          >
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
        </div>

        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Symbol
          </label>
          <select
            value={formData.symbol}
            onChange={(e) => updateField('symbol', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.symbol ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={disabled}
          >
            {(supportedSymbols[formData.venue] || []).map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.symbol}</p>
          )}
        </div>

        {/* Order Type and Side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order Type
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => updateField('orderType', e.target.value as OrderType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={disabled}
            >
              {orderTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Side
            </label>
            <select
              value={formData.side}
              onChange={(e) => updateField('side', e.target.value as OrderSide)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={disabled}
            >
              {sides.map(side => (
                <option key={side} value={side}>
                  {side}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price (only for limit orders) */}
        {formData.orderType === 'Limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              placeholder="Enter limit price"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={disabled}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price}</p>
            )}
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.quantity || ''}
            onChange={(e) => updateField('quantity', parseFloat(e.target.value) || 0)}
            placeholder="Enter quantity"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={disabled}
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
          )}
        </div>

        {/* Timing Simulation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timing
          </label>
          <select
            value={formData.timing}
            onChange={(e) => updateField('timing', e.target.value as TimingDelay)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            disabled={disabled}
          >
            {timingOptions.map(timing => (
              <option key={timing} value={timing}>
                {timing === 'immediate' ? 'Immediate' : `${timing} delay`}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || disabled}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            loading || disabled
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : formData.side === 'Buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Simulating...
            </div>
          ) : (
            `Simulate ${formData.side} Order`
          )}
        </button>
      </form>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              updateField('orderType', 'Market');
              updateField('side', 'Buy');
              updateField('quantity', 1);
            }}
            className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
            disabled={disabled}
          >
            Market Buy
          </button>
          <button
            type="button"
            onClick={() => {
              updateField('orderType', 'Market');
              updateField('side', 'Sell');
              updateField('quantity', 1);
            }}
            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
            disabled={disabled}
          >
            Market Sell
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                venue: 'OKX',
                symbol: 'BTC-USDT',
                orderType: 'Limit',
                side: 'Buy',
                price: undefined,
                quantity: 0,
                timing: 'immediate'
              });
              setErrors({});
            }}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
            disabled={disabled}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSimulationForm;
