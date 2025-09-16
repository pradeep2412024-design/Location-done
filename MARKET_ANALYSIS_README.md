# Advanced Market Analysis Feature

## Overview

The Advanced Market Analysis feature provides real-time agricultural commodity price data, AI-powered market insights, and comprehensive market analysis tools for farmers and agricultural stakeholders.

## Features

### 🔄 Real-Time Price Data
- **Data Source**: Integration with data.gov.in API for authentic market prices
- **Coverage**: Multiple states and commodities across India
- **Update Frequency**: Real-time with 5-minute caching for optimal performance
- **Fallback System**: Robust fallback data when API is unavailable

### 🤖 AI-Powered Insights
- **Groq Integration**: Advanced AI analysis using Groq's LLaMA model
- **Market Predictions**: 3-month demand forecasts and price predictions
- **Risk Assessment**: Comprehensive risk factor analysis
- **Opportunity Identification**: Market opportunities and export potential analysis

### 📊 Advanced Visualization
- **Interactive Charts**: Multiple chart types (Line, Area, OHLC, Volume)
- **Timeframe Selection**: 1W, 1M, 3M, 6M, 1Y price tracking
- **Price Statistics**: Current, highest, lowest, average prices with volatility metrics
- **Market Distribution**: Visual representation of market segments

### 🎯 Smart Recommendations
- **Timing Recommendations**: Optimal selling periods and forward contract suggestions
- **Quality Focus**: Premium pricing opportunities based on quality metrics
- **Market Access**: Multi-market selling strategies and direct buyer options
- **Risk Management**: Weather and market volatility risk mitigation

## API Endpoints

### `/api/market-analysis`
**Method**: POST  
**Description**: Get comprehensive market analysis for a specific crop and location

**Request Body**:
```json
{
  "crop": "Rice",
  "location": "Bhubaneswar, Odisha",
  "state": "odisha",
  "month": "6"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "crop": "Rice",
    "location": "Bhubaneswar, Odisha",
    "state": "odisha",
    "month": "6",
    "realTimeData": {
      "currentPrice": 2800,
      "minPrice": 2500,
      "maxPrice": 3100,
      "avgPrice": 2800,
      "priceChange": 2.5,
      "trend": "rising",
      "unit": "quintal",
      "market": "Local Market",
      "state": "Odisha",
      "district": "Khordha",
      "lastUpdated": "2024-01-15",
      "source": "data.gov.in"
    },
    "aiInsights": {
      "demandForecast": "High",
      "pricePrediction": "Prices expected to continue rising",
      "bestSellingTime": "October-November",
      "riskFactors": ["Weather variability", "Market volatility"],
      "opportunities": ["Premium pricing", "Export potential"],
      "exportPotential": "Moderate",
      "competitionAnalysis": "Competitive market",
      "marketStrategy": "Focus on quality and timing"
    },
    "trends": {
      "shortTerm": { "direction": "rising", "confidence": 85, "timeframe": "1-3 months" },
      "mediumTerm": { "direction": "stable", "confidence": 70, "timeframe": "3-6 months" },
      "longTerm": { "direction": "stable", "confidence": 60, "timeframe": "6-12 months" }
    },
    "recommendations": [
      {
        "type": "timing",
        "priority": "high",
        "title": "Consider Forward Selling",
        "description": "Prices are rising - consider forward contracts",
        "action": "Contact local mandis for forward contract options"
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "cached": false
}
```

### `/api/market-analysis/test`
**Method**: GET  
**Description**: Test endpoint to verify market analysis API functionality

## Components

### `AdvancedMarketAnalysis`
Main component providing comprehensive market analysis with tabbed interface:
- **Overview**: Key metrics and market distribution
- **Pricing**: Price trends and statistics
- **Price Tracking**: Advanced charting with multiple timeframes
- **AI Insights**: AI-powered market analysis
- **Recommendations**: Actionable market strategies

### `PriceTrackingChart`
Advanced price tracking component with:
- Multiple chart types (Line, Area, OHLC)
- Timeframe selection (1W to 1Y)
- Price statistics and volatility analysis
- Market insights and trend analysis

## Caching System

### `market-cache.js`
Intelligent caching system with:
- **Cache Duration**: 5 minutes for optimal balance between freshness and performance
- **Cache Size**: Maximum 100 entries with LRU eviction
- **Key Generation**: Smart key generation based on crop, location, state, and month
- **Statistics**: Cache hit/miss tracking and performance metrics

## Data Sources

### Primary: data.gov.in API
- **Resource ID**: 1832c7b4-82ef-4734-b2b4-c2e3a38a28d3
- **API Key**: 579b464db66ec23bdd000001c3e8a0bc7a9341c15a4acb4c4dbc5bba
- **Coverage**: Agricultural commodity prices across Indian states
- **Update Frequency**: Daily updates from government sources

### AI Analysis: Groq API
- **Model**: LLaMA 3 8B 8192
- **Purpose**: Market insights, predictions, and recommendations
- **Temperature**: 0.3 for consistent, factual analysis
- **Max Tokens**: 1000 for comprehensive insights

## Integration

### Dashboard Integration
The market analysis is seamlessly integrated into the main dashboard:
- **Tab**: Dedicated "Market Analysis" tab
- **Dynamic Updates**: Real-time data refresh with auto-refresh option
- **Context Awareness**: Uses current farm data (crop, location, month)
- **Responsive Design**: Optimized for all device sizes

### State Detection
Intelligent state detection from location strings:
- **Odisha**: Comprehensive district coverage
- **Other States**: Punjab, Haryana, UP, Maharashtra, Karnataka, Tamil Nadu, Gujarat, Rajasthan, Bihar, West Bengal, MP, Andhra Pradesh, Telangana
- **Fallback**: Defaults to Odisha for unmatched locations

## Usage Examples

### Basic Usage
```jsx
import AdvancedMarketAnalysis from '@/components/AdvancedMarketAnalysis'

<AdvancedMarketAnalysis
  crop="Rice"
  location="Bhubaneswar, Odisha"
  state="odisha"
  month="6"
  onAnalysisUpdate={(data) => {
    console.log("Market analysis updated:", data)
  }}
/>
```

### Price Tracking
```jsx
import PriceTrackingChart from '@/components/PriceTrackingChart'

<PriceTrackingChart
  crop="Rice"
  location="Bhubaneswar, Odisha"
  marketData={marketAnalysisData}
  onDataUpdate={(data) => {
    console.log("Price tracking updated:", data)
  }}
/>
```

## Error Handling

### API Failures
- **Graceful Degradation**: Fallback to mock data when APIs fail
- **User Feedback**: Clear error messages and retry options
- **Logging**: Comprehensive error logging for debugging

### Data Validation
- **Input Validation**: Required field validation
- **Data Sanitization**: Safe handling of user inputs
- **Type Checking**: Runtime type validation for API responses

## Performance Optimizations

### Caching Strategy
- **API Response Caching**: 5-minute cache for market data
- **Component Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for chart libraries

### Network Optimization
- **Request Batching**: Multiple API calls batched when possible
- **Timeout Handling**: 30-second timeout for external API calls
- **Retry Logic**: Exponential backoff for failed requests

## Future Enhancements

### Planned Features
- **Historical Data**: Extended price history beyond 1 year
- **Price Alerts**: Custom price threshold notifications
- **Market Comparison**: Multi-location price comparison
- **Export Reports**: PDF/Excel export functionality
- **Mobile App**: Native mobile application
- **API Rate Limiting**: Advanced rate limiting and quota management

### Integration Opportunities
- **Weather APIs**: Integration with weather data for correlation analysis
- **News APIs**: Market news and sentiment analysis
- **Blockchain**: Price transparency and traceability
- **IoT Integration**: Real-time farm data correlation

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify GROQ_API_KEY is set in environment variables
   - Check data.gov.in API key validity

2. **Caching Problems**
   - Clear browser cache
   - Check cache expiration settings

3. **Chart Rendering Issues**
   - Ensure recharts library is properly installed
   - Check for responsive container issues

4. **State Detection Issues**
   - Verify location string format
   - Check getStateFromLocation function

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed API calls and cache operations.

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.
