# Copilot Instructions for GoQuant Orderbook Viewer

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js TypeScript project for a Real-Time Orderbook Viewer with Order Simulation capabilities.

## Project Context
- Real-time cryptocurrency orderbook viewer
- Multi-venue support (OKX, Bybit, Deribit)
- WebSocket connections for live data
- Order simulation and market impact analysis
- Responsive design with Tailwind CSS

## Code Style Guidelines
- Use TypeScript for type safety
- Follow React best practices with hooks
- Use Tailwind CSS for styling
- Implement proper error handling for API failures
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Handle WebSocket connections with proper cleanup

## API Integration Notes
- OKX API: https://www.okx.com/docs-v5/
- Bybit API: https://bybit-exchange.github.io/docs/v5/intro
- Deribit API: https://docs.deribit.com/
- All APIs should use free/demo endpoints only
- Implement rate limiting and error handling
- Use WebSocket connections where available

## Component Structure
- Modular component design
- Reusable UI components
- Custom hooks for data fetching
- State management with React hooks
- Proper TypeScript interfaces for all data structures
