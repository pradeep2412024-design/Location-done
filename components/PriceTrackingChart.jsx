"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Calendar,
  Target,
  RefreshCw
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine
} from "recharts"

const PriceTrackingChart = ({ crop, location, marketData, onDataUpdate }) => {
  const [timeframe, setTimeframe] = useState('6M')
  const [chartType, setChartType] = useState('line')
  const [priceHistory, setPriceHistory] = useState([])
  const [loading, setLoading] = useState(false)

  // Generate realistic price history data
  const generatePriceHistory = (timeframe) => {
    const now = new Date()
    const data = []
    let days = 30 // Default to 1 month
    
    switch (timeframe) {
      case '1W':
        days = 7
        break
      case '1M':
        days = 30
        break
      case '3M':
        days = 90
        break
      case '6M':
        days = 180
        break
      case '1Y':
        days = 365
        break
    }

    const basePrice = marketData?.realTimeData?.currentPrice || 2500
    let currentPrice = basePrice

    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Add realistic price volatility
      const volatility = 0.02 // 2% daily volatility
      const change = (Math.random() - 0.5) * volatility
      currentPrice = currentPrice * (1 + change)
      
      // Add seasonal patterns
      const month = date.getMonth()
      const seasonalFactor = 1 + Math.sin((month / 12) * 2 * Math.PI) * 0.1
      currentPrice = currentPrice * seasonalFactor
      
      // Add trend based on market data
      const trend = marketData?.realTimeData?.trend || 'stable'
      if (trend === 'rising') {
        currentPrice = currentPrice * (1 + 0.001) // Slight upward trend
      } else if (trend === 'falling') {
        currentPrice = currentPrice * (1 - 0.001) // Slight downward trend
      }

      data.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(currentPrice),
        volume: Math.round(Math.random() * 1000 + 500),
        high: Math.round(currentPrice * (1 + Math.random() * 0.05)),
        low: Math.round(currentPrice * (1 - Math.random() * 0.05)),
        change: i === 0 ? 0 : Math.round((currentPrice - basePrice) / basePrice * 100 * 100) / 100
      })
    }

    return data
  }

  // Update price history when timeframe changes
  useEffect(() => {
    setLoading(true)
    const newHistory = generatePriceHistory(timeframe)
    setPriceHistory(newHistory)
    setLoading(false)
  }, [timeframe, marketData])

  // Calculate price statistics
  const calculateStats = () => {
    if (priceHistory.length === 0) return null

    const prices = priceHistory.map(d => d.price)
    const current = prices[prices.length - 1]
    const previous = prices[prices.length - 2] || current
    const highest = Math.max(...prices)
    const lowest = Math.min(...prices)
    const average = prices.reduce((a, b) => a + b, 0) / prices.length
    const change = ((current - previous) / previous * 100)
    const changeFromLow = ((current - lowest) / lowest * 100)
    const changeFromHigh = ((current - highest) / highest * 100)

    return {
      current,
      previous,
      highest,
      lowest,
      average,
      change,
      changeFromLow,
      changeFromHigh,
      volatility: Math.sqrt(prices.reduce((acc, price) => acc + Math.pow(price - average, 2), 0) / prices.length) / average * 100
    }
  }

  const stats = calculateStats()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-blue-600">Price: ₹{data.price}</p>
          <p className="text-green-600">Volume: {data.volume}</p>
          <p className="text-gray-600">High: ₹{data.high}</p>
          <p className="text-gray-600">Low: ₹{data.low}</p>
          {data.change !== 0 && (
            <p className={data.change > 0 ? "text-green-600" : "text-red-600"}>
              Change: {data.change > 0 ? "+" : ""}{data.change}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    switch (timeframe) {
      case '1W':
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case '3M':
      case '6M':
        return date.toLocaleDateString('en-US', { month: 'short' })
      case '1Y':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Price Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading price data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Price Tracking - {crop}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {location}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true)
                const newHistory = generatePriceHistory(timeframe)
                setPriceHistory(newHistory)
                setLoading(false)
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">Price Chart</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Price Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            {/* Timeframe Selector */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                  <Button
                    key={period}
                    variant={timeframe === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'line' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  Line
                </Button>
                <Button
                  variant={chartType === 'area' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType('area')}
                >
                  Area
                </Button>
                <Button
                  variant={chartType === 'candlestick' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType('candlestick')}
                >
                  OHLC
                </Button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: '#8884d8', strokeWidth: 2 }}
                    />
                    <ReferenceLine 
                      y={stats?.average} 
                      stroke="#ff7300" 
                      strokeDasharray="5 5"
                      label={{ value: "Avg", position: "topRight" }}
                    />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      fill="#8884d8"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <ReferenceLine 
                      y={stats?.average} 
                      stroke="#ff7300" 
                      strokeDasharray="5 5"
                      label={{ value: "Avg", position: "topRight" }}
                    />
                  </AreaChart>
                ) : (
                  <ComposedChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="high" fill="#82ca9d" opacity={0.3} />
                    <Bar dataKey="low" fill="#ffc658" opacity={0.3} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 3 }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Price Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="text-xl font-bold text-blue-600">₹{stats.current}</p>
                  <p className={`text-sm ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                  </p>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Highest</p>
                  <p className="text-xl font-bold text-green-600">₹{stats.highest}</p>
                  <p className="text-sm text-gray-600">
                    {stats.changeFromHigh.toFixed(2)}% from high
                  </p>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Lowest</p>
                  <p className="text-xl font-bold text-red-600">₹{stats.lowest}</p>
                  <p className="text-sm text-gray-600">
                    {stats.changeFromLow.toFixed(2)}% from low
                  </p>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-xl font-bold text-purple-600">₹{Math.round(stats.average)}</p>
                  <p className="text-sm text-gray-600">
                    Volatility: {stats.volatility.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Volume Tab */}
          <TabsContent value="volume" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [value, 'Volume']}
                    labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                  />
                  <Bar dataKey="volume" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {stats && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Price Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Price Trend</span>
                        <Badge variant={stats.change >= 0 ? "default" : "destructive"}>
                          {stats.change >= 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Bullish
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Bearish
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Volatility</span>
                        <Badge variant={stats.volatility > 10 ? "destructive" : stats.volatility > 5 ? "secondary" : "default"}>
                          {stats.volatility > 10 ? "High" : stats.volatility > 5 ? "Medium" : "Low"}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Price Range</span>
                        <span className="text-sm text-gray-600">
                          ₹{stats.lowest} - ₹{stats.highest}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Average Price</span>
                        <span className="text-sm text-gray-600">
                          ₹{Math.round(stats.average)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.change > 5 && (
                        <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Strong Price Growth</p>
                            <p className="text-xs text-green-600">Prices have increased significantly over the selected period.</p>
                          </div>
                        </div>
                      )}
                      
                      {stats.change < -5 && (
                        <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                          <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Price Decline</p>
                            <p className="text-xs text-red-600">Prices have decreased significantly over the selected period.</p>
                          </div>
                        </div>
                      )}
                      
                      {stats.volatility > 10 && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                          <Activity className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">High Volatility</p>
                            <p className="text-xs text-yellow-600">Price fluctuations are high. Consider risk management strategies.</p>
                          </div>
                        </div>
                      )}
                      
                      {Math.abs(stats.change) < 2 && (
                        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Stable Prices</p>
                            <p className="text-xs text-blue-600">Prices have remained relatively stable over the selected period.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PriceTrackingChart
