# GoQuant Real-Time Orderbook Viewer

A Next.js application that displays real-time orderbook data with order simulation capabilities across multiple cryptocurrency exchanges (OKX, Bybit, and Deribit).

## 🚀 Features

### Core Functionality
- **Multi-Venue Orderbook Display**: Real-time orderbooks from OKX, Bybit, and Deribit
- **Order Simulation**: Simulate order placement with impact analysis
- **Market Depth Visualization**: Interactive depth charts using Recharts
- **Real-Time Updates**: WebSocket connections for live data feeds
- **Responsive Design**: Optimized for desktop and mobile trading scenarios

### Advanced Features
- **Order Impact Metrics**: Slippage, market impact, and fill percentage calculations
- **Timing Simulation**: Immediate, 5s, 10s, and 30s delay options
- **Orderbook Imbalance Indicators**: Visual representation of bid/ask imbalances
- **Market Statistics**: Spread analysis, mid-price calculation, and volume metrics
- **Dark Mode Support**: Complete light/dark theme implementation

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Charts**: Recharts for market depth visualization
- **State Management**: React hooks with custom hook patterns
- **WebSocket**: Native WebSocket API for real-time connections
- **Styling**: Tailwind CSS with dark mode support

### Project Structure
```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── OrderbookDisplay.tsx
│   ├── OrderSimulationForm.tsx
│   ├── OrderSimulationResults.tsx
│   ├── MarketDepthChart.tsx
│   └── VenueSelector.tsx
├── hooks/                  # Custom React hooks
│   └── useOrderbook.ts
├── services/               # API service classes
│   ├── BaseExchangeAPI.ts
│   ├── OKXService.ts
│   ├── BybitService.ts
│   ├── DeribitService.ts
│   └── ExchangeManager.ts
├── types/                  # TypeScript type definitions
│   └── index.ts
└── utils/                  # Utility functions
    └── orderbook.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with WebSocket support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goquant
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install recharts ws @types/ws react-hook-form @hookform/resolvers zod lucide-react clsx tailwind-merge class-variance-authority
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## 📊 API Integration

### Supported Exchanges

#### OKX
- **API Documentation**: https://www.okx.com/docs-v5/
- **WebSocket**: Real-time orderbook updates
- **Supported Symbols**: BTC-USDT, ETH-USDT, BTC-USD-SWAP, ETH-USD-SWAP
- **Rate Limiting**: Implemented with proper error handling

#### Bybit
- **API Documentation**: https://bybit-exchange.github.io/docs/v5/intro
- **WebSocket**: Real-time spot market data
- **Supported Symbols**: BTCUSDT, ETHUSDT, SOLUSDT, ADAUSDT
- **Rate Limiting**: Built-in throttling mechanisms

#### Deribit
- **API Documentation**: https://docs.deribit.com/
- **WebSocket**: Real-time options and futures data
- **Supported Symbols**: BTC-PERPETUAL, ETH-PERPETUAL, BTC-29MAR25
- **Rate Limiting**: JSON-RPC 2.0 protocol with connection management

### API Features
- **Free Tier Compatible**: All APIs use publicly available endpoints
- **Error Handling**: Comprehensive error handling and fallback mechanisms
- **Reconnection Logic**: Automatic WebSocket reconnection with exponential backoff
- **Data Validation**: Type-safe API responses with TypeScript

## 🎯 Order Simulation

### Simulation Types
- **Market Orders**: Immediate execution with slippage calculation
- **Limit Orders**: Order placement visualization and time-to-fill estimation

### Impact Metrics
- **Fill Percentage**: Estimated execution percentage based on available liquidity
- **Market Impact**: Percentage of available liquidity consumed
- **Slippage**: Price deviation from best bid/ask
- **Average Fill Price**: Volume-weighted average price
- **Time to Fill**: Estimated execution time for limit orders

### Timing Scenarios
- **Immediate**: Instant order placement
- **5s Delay**: 5-second delayed execution
- **10s Delay**: 10-second delayed execution  
- **30s Delay**: 30-second delayed execution

## 📈 Market Depth Visualization

### Depth Chart Features
- **Bid/Ask Visualization**: Color-coded depth representation
- **Cumulative Volume**: Running totals for market depth analysis
- **Mid-Price Reference**: Visual mid-price indicator
- **Simulated Order Overlay**: Shows where orders would sit in the book
- **Interactive Tooltips**: Detailed level information on hover

### Orderbook Display
- **15 Levels**: Best 15 bid and ask levels
- **Real-Time Updates**: Live price and volume changes
- **Volume Indicators**: Visual depth representation
- **Spread Calculation**: Real-time spread monitoring

## 🎯 Assignment Completion

### ✅ Functional Requirements Met
- [x] Multi-venue orderbook display (OKX, Bybit, Deribit)
- [x] 15+ levels of bids and asks
- [x] Real-time WebSocket updates
- [x] Seamless venue switching
- [x] Order simulation form with all required fields
- [x] Order placement visualization
- [x] Impact metrics calculation
- [x] Responsive design for all screen sizes

### ✅ Technical Requirements Met
- [x] Real-time data integration with proper error handling
- [x] WebSocket connections with fallback mechanisms
- [x] Efficient state management
- [x] Proper cleanup and connection management
- [x] Rate limiting and API best practices

### ✅ Bonus Features Implemented
- [x] Market depth visualization
- [x] Orderbook imbalance indicators
- [x] Slippage warnings for high-impact orders
- [x] Market impact calculations
- [x] Multiple timing scenarios comparison
- [x] Dark mode support
- [x] Mobile optimization

### 📹 Video Demonstration
*[Video recording demonstrating all features and code walkthrough will be included in submission]*

### 📧 Submission Details
- **Email**: careers@goquant.io (CC: jennifer.carreno@goquant.io)
- **Subject**: Real-Time Orderbook Viewer with Order Simulation
- **Attachments**: Resume, video demonstration, documentation

---

**Built with ❤️ for GoQuant - Transforming Financial Markets Through Technology**
