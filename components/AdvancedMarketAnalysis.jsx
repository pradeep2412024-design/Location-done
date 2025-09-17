"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  RefreshCw,
  ExternalLink,
  TrendingUp as UpTrend,
  TrendingDown as DownTrend,
  Minus as StableTrend
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { useI18n } from "@/i18n"

const AdvancedMarketAnalysis = ({ crop, location, state, month, onAnalysisUpdate }) => {
  const { t } = useI18n()
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(300000) // 5 minutes

  // Fetch market analysis data
  const fetchMarketAnalysis = useCallback(async () => {
    if (!crop || !location) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crop,
          location,
          state,
          month
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setMarketData(result.data)
        setLastUpdated(new Date())
        onAnalysisUpdate?.(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch market analysis')
      }
    } catch (err) {
      console.error('Error fetching market analysis:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [crop, location, state, month, onAnalysisUpdate])

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchMarketAnalysis()

    let interval
    if (autoRefresh) {
      interval = setInterval(fetchMarketAnalysis, refreshInterval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchMarketAnalysis, autoRefresh, refreshInterval])

  // Manual refresh
  const handleRefresh = () => {
    fetchMarketAnalysis()
  }

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':
        return <UpTrend className="h-4 w-4 text-green-500" />
      case 'falling':
        return <DownTrend className="h-4 w-4 text-red-500" />
      default:
        return <StableTrend className="h-4 w-4 text-yellow-500" />
    }
  }

  // Get trend color
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600'
      case 'falling':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  // Generate price history data for charts
  const generatePriceHistory = () => {
    if (!marketData?.realTimeData) return []
    
    const currentPrice = marketData.realTimeData.currentPrice
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((month, index) => ({
      month,
      price: Math.round(currentPrice * (0.8 + Math.random() * 0.4)), // Simulate price variation
      volume: Math.round(Math.random() * 1000 + 500)
    }))
  }

  // Resolve market distribution (prefer AI insights; fallback to defaults)
  const resolveMarketDistribution = () => {
    const palette = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a28cf2', '#34d399']
    const aiDist = marketData?.aiInsights?.marketDistribution
    if (Array.isArray(aiDist) && aiDist.length > 0) {
      return aiDist.map((d, i) => ({
        name: d.name || `Segment ${i + 1}`,
        value: Number(d.value) || 0,
        color: palette[i % palette.length]
      }))
    }
    return [
      { name: 'Local Markets', value: 45, color: '#8884d8' },
      { name: 'Regional Mandis', value: 30, color: '#82ca9d' },
      { name: 'Export Markets', value: 15, color: '#ffc658' },
      { name: 'Direct Sales', value: 10, color: '#ff7300' }
    ]
  }

  if (loading && !marketData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading market analysis...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load market analysis: {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!marketData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No market data available</p>
        </CardContent>
      </Card>
    )
  }

  const priceHistory = generatePriceHistory()
  const marketDistribution = resolveMarketDistribution()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Market Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="text-xs">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Never updated'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Price */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-bold">
                        ₹{marketData.realTimeData.currentPrice}/{marketData.realTimeData.unit}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getTrendIcon(marketData.realTimeData.trend)}
                    <span className={`text-sm ml-1 ${getTrendColor(marketData.realTimeData.trend)}`}>
                      {marketData.realTimeData.priceChange > 0 ? '+' : ''}{marketData.realTimeData.priceChange.toFixed(2)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Price Range */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Price Range</p>
                      <p className="text-lg font-semibold">
                        ₹{marketData.realTimeData.minPrice} - ₹{marketData.realTimeData.maxPrice}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per {marketData.realTimeData.unit}
                  </p>
                </CardContent>
              </Card>

              {/* Market Location */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Market</p>
                      <p className="text-lg font-semibold">{marketData.realTimeData.market}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {marketData.realTimeData.district}, {marketData.realTimeData.state}
                  </p>
                </CardContent>
              </Card>

              {/* Data Source */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Source</p>
                      <p className="text-lg font-semibold capitalize">
                        {marketData.realTimeData.source.replace('_', ' ')}
                      </p>
                    </div>
                    <ExternalLink className="h-8 w-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {marketData.realTimeData.lastUpdated}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Market Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marketDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {marketDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            {/* Price Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Trends (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, 'Price']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Price Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Average Price</p>
                    <p className="text-2xl font-bold">₹{marketData.realTimeData.avgPrice}</p>
                    <p className="text-xs text-muted-foreground">Per {marketData.realTimeData.unit}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Price Volatility</p>
                    <p className="text-2xl font-bold">
                      {Math.round(((marketData.realTimeData.maxPrice - marketData.realTimeData.minPrice) / marketData.realTimeData.avgPrice) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Range variation</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Market Trend</p>
                    <div className="flex items-center justify-center mt-2">
                      {getTrendIcon(marketData.realTimeData.trend)}
                      <span className={`ml-2 capitalize ${getTrendColor(marketData.realTimeData.trend)}`}>
                        {marketData.realTimeData.trend}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {marketData.aiInsights && (
              <>
                {/* Demand Forecast */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Demand Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">3-Month Forecast</span>
                        <Badge variant="outline">{marketData.aiInsights.demandForecast}</Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {marketData.aiInsights.pricePrediction}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Opportunities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketData.aiInsights.opportunities?.map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketData.aiInsights.riskFactors?.map((risk, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Export Potential */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Export Potential
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Export Rating</span>
                        <Badge variant="outline">{marketData.aiInsights.exportPotential}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {marketData.aiInsights.competitionAnalysis}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {marketData.recommendations?.map((recommendation, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {recommendation.type === 'timing' && <Clock className="h-5 w-5 text-blue-500" />}
                      {recommendation.type === 'quality' && <Target className="h-5 w-5 text-green-500" />}
                      {recommendation.type === 'market_access' && <MapPin className="h-5 w-5 text-purple-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{recommendation.title}</h4>
                        <Badge 
                          variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}
                        >
                          {recommendation.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {recommendation.description}
                      </p>
                      <div className="bg-muted p-2 rounded text-sm">
                        <strong>Action:</strong> {recommendation.action}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AdvancedMarketAnalysis
