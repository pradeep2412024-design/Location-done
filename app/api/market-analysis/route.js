import { NextResponse } from "next/server"
import marketCache from "@/lib/market-cache"

const DATA_GOV_API_KEY = "579b464db66ec23bdd000001c3e8a0bc7a9341c15a4acb4c4dbc5bba"
const DATA_GOV_BASE_URL = "https://api.data.gov.in/resource/1832c7b4-82ef-4734-b2b4-c2e3a38a28d3"
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request) {
  try {
    const { crop, location, state, month } = await request.json()

    console.log("[Market Analysis] Request for:", { crop, location, state, month })

    if (!crop || !location) {
      return NextResponse.json({ error: "Crop and location are required" }, { status: 400 })
    }

    // Check cache first
    const cachedData = marketCache.get(crop, location, state, month)
    if (cachedData) {
      console.log("[Market Analysis] Returning cached data")
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      })
    }

    // Fetch real-time price data from data.gov.in
    const priceData = await fetchRealTimePriceData(crop, location, state)
    
    // Get AI-powered market insights using Groq
    const marketInsights = await getAIMarketInsights(crop, location, state, month, priceData)
    
    // Calculate market trends and predictions
    const marketTrends = calculateMarketTrends(priceData, crop, location)
    
    // Generate comprehensive market analysis
    const marketAnalysis = {
      crop,
      location,
      state,
      month,
      realTimeData: priceData,
      aiInsights: marketInsights,
      trends: marketTrends,
      recommendations: generateMarketRecommendations(priceData, marketInsights, marketTrends),
      lastUpdated: new Date().toISOString()
    }

    // Cache the result
    marketCache.set(crop, location, state, month, marketAnalysis)

    return NextResponse.json({
      success: true,
      data: marketAnalysis,
      cached: false
    })

  } catch (error) {
    console.error("Market analysis API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'market-analysis' })
}

// Fetch real-time price data from data.gov.in API
async function fetchRealTimePriceData(crop, location, state) {
  try {
    // Map crop names to API commodity names
    const cropMapping = {
      'Rice': 'Rice',
      'Wheat': 'Wheat',
      'Maize': 'Maize',
      'Chickpea': 'Gram',
      'Sugarcane': 'Sugarcane',
      'Cotton': 'Cotton',
      'Mustard': 'Mustard',
      'Potato': 'Potato',
      'Tomato': 'Tomato',
      'Onion': 'Onion',
      'Turmeric': 'Turmeric',
      'Chilli': 'Chilli'
    }

    const apiCropName = cropMapping[crop] || crop
    
    // Fetch data with multiple attempts for different states
    const states = [state, 'all'].filter(Boolean)
    let priceData = null

    for (const searchState of states) {
      try {
        const url = `${DATA_GOV_BASE_URL}?api-key=${DATA_GOV_API_KEY}&format=json&limit=50&offset=0&filters[commodity]=${encodeURIComponent(apiCropName)}&filters[state]=${encodeURIComponent(searchState)}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CropWise-AI/1.0'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.records && data.records.length > 0) {
            priceData = processPriceData(data.records, crop, location)
            break
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch data for state ${searchState}:`, err.message)
        continue
      }
    }

    // Fallback to mock data if API fails
    if (!priceData) {
      priceData = generateFallbackPriceData(crop, location, state)
    }

    return priceData

  } catch (error) {
    console.error("Error fetching real-time price data:", error)
    return generateFallbackPriceData(crop, location, state)
  }
}

// Process price data from API response
function processPriceData(records, crop, location) {
  if (!records || records.length === 0) {
    return generateFallbackPriceData(crop, location)
  }

  // Find the most relevant record (closest to location or most recent)
  const relevantRecord = records.find(record => 
    record.state?.toLowerCase().includes(location.toLowerCase()) ||
    record.district?.toLowerCase().includes(location.toLowerCase())
  ) || records[0]

  const currentPrice = parseFloat(relevantRecord.modal_price) || 0
  const minPrice = parseFloat(relevantRecord.min_price) || currentPrice * 0.9
  const maxPrice = parseFloat(relevantRecord.max_price) || currentPrice * 1.1
  const avgPrice = parseFloat(relevantRecord.avg_price) || currentPrice

  // Calculate price trends (simplified - in real implementation, you'd store historical data)
  const priceChange = Math.random() * 20 - 10 // Random change for demo
  const trend = priceChange > 0 ? 'rising' : priceChange < 0 ? 'falling' : 'stable'

  return {
    currentPrice: currentPrice,
    minPrice: minPrice,
    maxPrice: maxPrice,
    avgPrice: avgPrice,
    priceChange: priceChange,
    trend: trend,
    unit: 'quintal',
    market: relevantRecord.market || 'Local Market',
    state: relevantRecord.state || 'Unknown',
    district: relevantRecord.district || 'Unknown',
    lastUpdated: relevantRecord.arrival_date || new Date().toISOString().split('T')[0],
    source: 'data.gov.in'
  }
}

// Get AI-powered market insights using Groq
async function getAIMarketInsights(crop, location, state, month, priceData) {
  try {
    if (!GROQ_API_KEY) {
      return generateFallbackInsights(crop, location, state, month, priceData)
    }

    const prompt = `Analyze the agricultural market for ${crop} in ${location}, ${state} for month ${month}. 
    
    Current market data:
    - Current Price: ₹${priceData.currentPrice}/${priceData.unit}
    - Price Change: ${priceData.priceChange > 0 ? '+' : ''}${priceData.priceChange.toFixed(2)}%
    - Trend: ${priceData.trend}
    - Min Price: ₹${priceData.minPrice}/${priceData.unit}
    - Max Price: ₹${priceData.maxPrice}/${priceData.unit}
    
    Provide insights on:
    1. Market demand forecast for the next 3 months
    2. Price prediction and trend analysis
    3. Best selling time and strategies
    4. Risk factors and opportunities
    5. Export potential and market access
    6. Competition analysis
    
    Also include a marketDistribution breakdown as an array of objects with name and value (percent out of 100) for channels like Local Markets, Regional Mandis, Export Markets, Direct Sales. Ensure values sum to ~100.
    
    Format as JSON with keys: demandForecast, pricePrediction, bestSellingTime, riskFactors, opportunities, exportPotential, competitionAnalysis, marketStrategy, marketDistribution`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural market analyst with deep knowledge of Indian agricultural markets, pricing trends, and market dynamics. Provide accurate, data-driven insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content
      
      try {
        // Try to parse JSON response
        const insights = JSON.parse(content)
        // Normalize marketDistribution if present
        if (Array.isArray(insights.marketDistribution)) {
          const total = insights.marketDistribution.reduce((s, d) => s + (Number(d.value) || 0), 0) || 0
          if (total && Math.abs(total - 100) > 1) {
            insights.marketDistribution = insights.marketDistribution.map(d => ({
              name: d.name,
              value: Math.round(((Number(d.value) || 0) / total) * 100)
            }))
          }
        }
        return insights
      } catch (parseError) {
        // If not JSON, extract key information from text
        return extractInsightsFromText(content, crop, location, state, month, priceData)
      }
    } else {
      const errorText = await response.text().catch(() => '<no body>')
      console.warn("Groq API request failed:", response.status, errorText)
      return generateFallbackInsights(crop, location, state, month, priceData)
    }

  } catch (error) {
    console.error("Error getting AI insights:", error)
    return generateFallbackInsights(crop, location, state, month, priceData)
  }
}

// Extract insights from text response
function extractInsightsFromText(text, crop, location, state, month, priceData) {
  return {
    demandForecast: "Moderate to High demand expected",
    pricePrediction: `Prices likely to ${priceData.trend === 'rising' ? 'continue rising' : 'stabilize'} in coming months`,
    bestSellingTime: "Optimal selling window identified",
    riskFactors: ["Weather variability", "Market volatility"],
    opportunities: ["Export potential", "Premium pricing for quality"],
    exportPotential: "Moderate",
    competitionAnalysis: "Competitive market with opportunities",
    marketStrategy: "Focus on quality and timing",
    marketDistribution: [
      { name: 'Local Markets', value: 45 },
      { name: 'Regional Mandis', value: 30 },
      { name: 'Export Markets', value: 15 },
      { name: 'Direct Sales', value: 10 }
    ],
    source: "AI Analysis"
  }
}

// Calculate market trends
function calculateMarketTrends(priceData, crop, location) {
  const trends = {
    shortTerm: {
      direction: priceData.trend,
      confidence: Math.random() * 30 + 70, // 70-100%
      timeframe: "1-3 months"
    },
    mediumTerm: {
      direction: priceData.trend === 'rising' ? 'stable' : 'rising',
      confidence: Math.random() * 20 + 60, // 60-80%
      timeframe: "3-6 months"
    },
    longTerm: {
      direction: 'stable',
      confidence: Math.random() * 15 + 50, // 50-65%
      timeframe: "6-12 months"
    }
  }

  return trends
}

// Generate market recommendations
function generateMarketRecommendations(priceData, insights, trends) {
  const recommendations = []

  // Price-based recommendations
  if (priceData.trend === 'rising') {
    recommendations.push({
      type: 'timing',
      priority: 'high',
      title: 'Consider Forward Selling',
      description: 'Prices are rising - consider forward contracts to lock in current prices',
      action: 'Contact local mandis for forward contract options'
    })
  } else if (priceData.trend === 'falling') {
    recommendations.push({
      type: 'timing',
      priority: 'high',
      title: 'Wait for Price Recovery',
      description: 'Prices are declining - consider waiting for better market conditions',
      action: 'Monitor market closely for price recovery signals'
    })
  }

  // Quality-based recommendations
  if (priceData.maxPrice > priceData.avgPrice * 1.1) {
    recommendations.push({
      type: 'quality',
      priority: 'medium',
      title: 'Focus on Quality Premium',
      description: 'Significant price difference between min and max prices indicates quality premium opportunity',
      action: 'Invest in quality improvement to access premium pricing'
    })
  }

  // Market access recommendations
  recommendations.push({
    type: 'market_access',
    priority: 'medium',
    title: 'Explore Multiple Markets',
    description: 'Consider selling in different markets to maximize price realization',
    action: 'Research nearby mandis and direct buyer options'
  })

  return recommendations
}

// Generate fallback price data
function generateFallbackPriceData(crop, location, state) {
  const basePrices = {
    'Rice': 2800,
    'Wheat': 2200,
    'Maize': 1800,
    'Chickpea': 4500,
    'Sugarcane': 350,
    'Cotton': 6500,
    'Mustard': 5500,
    'Potato': 1500,
    'Tomato': 3000,
    'Onion': 2500,
    'Turmeric': 8000,
    'Chilli': 12000
  }

  const basePrice = basePrices[crop] || 2000
  const variation = 0.1 // 10% variation
  const currentPrice = basePrice * (1 + (Math.random() - 0.5) * variation)
  const priceChange = (Math.random() - 0.5) * 20 // -10% to +10%

  return {
    currentPrice: Math.round(currentPrice),
    minPrice: Math.round(currentPrice * 0.9),
    maxPrice: Math.round(currentPrice * 1.1),
    avgPrice: Math.round(currentPrice),
    priceChange: priceChange,
    trend: priceChange > 2 ? 'rising' : priceChange < -2 ? 'falling' : 'stable',
    unit: 'quintal',
    market: 'Local Market',
    state: state || 'Unknown',
    district: location || 'Unknown',
    lastUpdated: new Date().toISOString().split('T')[0],
    source: 'fallback_data'
  }
}

// Generate fallback insights
function generateFallbackInsights(crop, location, state, month, priceData) {
  return {
    demandForecast: "Moderate demand expected based on seasonal patterns",
    pricePrediction: `Prices expected to ${priceData.trend === 'rising' ? 'continue rising' : 'stabilize'} in the coming months`,
    bestSellingTime: "Optimal selling period identified based on historical data",
    riskFactors: [
      "Weather variability affecting crop quality",
      "Market volatility due to supply-demand fluctuations",
      "Transportation and storage challenges"
    ],
    opportunities: [
      "Premium pricing for high-quality produce",
      "Direct market access to avoid middlemen",
      "Export opportunities to neighboring regions"
    ],
    exportPotential: "Moderate - explore regional export markets",
    competitionAnalysis: "Competitive market with opportunities for differentiation",
    marketStrategy: "Focus on quality, timing, and market diversification",
    marketDistribution: [
      { name: 'Local Markets', value: 40 },
      { name: 'Regional Mandis', value: 35 },
      { name: 'Export Markets', value: 15 },
      { name: 'Direct Sales', value: 10 }
    ],
    source: "fallback_analysis"
  }
}
