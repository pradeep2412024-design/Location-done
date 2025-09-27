import { NextResponse } from "next/server"

// Simple in-memory cache for crop recommendations
const cropCache = new Map()
const CACHE_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_SIZE = 50

function getCacheKey(location, month, category, previousCrop, state) {
  return `${location}-${month}-${category || 'all'}-${previousCrop || 'none'}-${state}`.toLowerCase()
}

function getCachedData(location, month, category, previousCrop, state) {
  const key = getCacheKey(location, month, category, previousCrop, state)
  const cached = cropCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.data
  }
  
  if (cached) {
    cropCache.delete(key)
  }
  
  return null
}

function setCachedData(location, month, category, previousCrop, state, data) {
  const key = getCacheKey(location, month, category, previousCrop, state)
  
  if (cropCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cropCache.keys().next().value
    cropCache.delete(oldestKey)
  }
  
  cropCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export async function POST(request) {
  try {
    const { location, month, soilData, weatherData, category, previousCrop } = await request.json()

    console.log("[v0] Crop recommendations requested for:", { location, month, category, previousCrop })

    if (!location || !month) {
      return NextResponse.json({ error: "Location and month are required" }, { status: 400 })
    }

    // Get state from location
    const state = getStateFromLocation(location)
    
    // Check cache first
    const cachedResult = getCachedData(location, month, category, previousCrop, state)
    if (cachedResult) {
      console.log("[Crop Recommendations] Returning cached data")
      return NextResponse.json({
        success: true,
        recommendations: cachedResult.recommendations,
        location,
        month,
        category,
        state,
        dataSource: cachedResult.dataSource,
        cached: true
      })
    }
    
    // Fetch soil and weather data if not provided - using parallel calls for better performance
    let finalSoilData = soilData
    let finalWeatherData = weatherData

    if (!finalSoilData || !finalWeatherData) {
      const { origin } = new URL(request.url)
      const baseUrl = origin

      // Create parallel fetch promises
      const fetchPromises = []
      
      if (!finalSoilData) {
        fetchPromises.push(
          fetch(`${baseUrl}/api/soil`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, month }),
          }).then(async (response) => {
            if (response.ok) {
              const result = await response.json()
              return { type: 'soil', data: result.data }
            }
            return { type: 'soil', data: null }
          }).catch(() => ({ type: 'soil', data: null }))
        )
      }

      if (!finalWeatherData) {
        fetchPromises.push(
          fetch(`${baseUrl}/api/weather`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, month }),
          }).then(async (response) => {
            if (response.ok) {
              const result = await response.json()
              return { type: 'weather', data: result.weatherData }
            }
            return { type: 'weather', data: null }
          }).catch(() => ({ type: 'weather', data: null }))
        )
      }

      // Wait for all parallel requests to complete
      if (fetchPromises.length > 0) {
        const results = await Promise.all(fetchPromises)
        
        results.forEach(result => {
          if (result.type === 'soil' && result.data) {
            finalSoilData = result.data
          } else if (result.type === 'weather' && result.data) {
            finalWeatherData = result.data
          }
        })
      }
    }

    // Generate fallback data if still missing
    if (!finalSoilData) {
      finalSoilData = generateFallbackSoilData(location)
    }
    if (!finalWeatherData) {
      finalWeatherData = generateFallbackWeatherData(location)
    }

    // Get crop recommendations based on state
    const recommendations = state === 'odisha' 
      ? await getOdishaCropRecommendations(finalSoilData, finalWeatherData, location, month, category, previousCrop)
      : await getMultiStateCropRecommendations(finalSoilData, finalWeatherData, location, month, category, previousCrop, state)

    const result = {
      success: true,
      recommendations,
      location,
      month,
      category,
      state,
      dataSource: state === 'odisha' ? 'odisha_database' : 'multi_state_database'
    }

    // Cache the result
    setCachedData(location, month, category, previousCrop, state, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error("Crop recommendations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get state from location string
function getStateFromLocation(location) {
  const locationLower = location.toLowerCase()
  
  // Check for Odisha first (most specific)
  if (locationLower.includes('odisha') || locationLower.includes('orissa') || 
      locationLower.includes('bhubaneswar') || locationLower.includes('cuttack') ||
      locationLower.includes('puri') || locationLower.includes('rourkela') ||
      locationLower.includes('berhampur') || locationLower.includes('sambalpur') ||
      locationLower.includes('balasore') || locationLower.includes('bhadrak') ||
      locationLower.includes('angul') || locationLower.includes('dhenkanal') ||
      locationLower.includes('kendujhar') || locationLower.includes('mayurbhanj') ||
      locationLower.includes('balangir') || locationLower.includes('bargarh') ||
      locationLower.includes('kalahandi') || locationLower.includes('nuapada') ||
      locationLower.includes('koraput') || locationLower.includes('malkangiri') ||
      locationLower.includes('nabarangpur') || locationLower.includes('rayagada') ||
      locationLower.includes('gajapati') || locationLower.includes('ganjam') ||
      locationLower.includes('kandhamal') || locationLower.includes('boudh') ||
      locationLower.includes('subarnapur') || locationLower.includes('sundargarh') ||
      locationLower.includes('deogarh') || locationLower.includes('jharsuguda') ||
      locationLower.includes('jajpur') || locationLower.includes('jagatsinghpur') ||
      locationLower.includes('kendrapara') || locationLower.includes('khordha') ||
      locationLower.includes('nayagarh')) {
    return 'odisha'
  }
  
  // Check other states
  if (locationLower.includes('punjab') || locationLower.includes('amritsar') || locationLower.includes('ludhiana')) return 'punjab'
  if (locationLower.includes('haryana') || locationLower.includes('gurgaon') || locationLower.includes('faridabad')) return 'haryana'
  if (
    locationLower.includes('uttar pradesh') ||
    locationLower.includes('lucknow') ||
    locationLower.includes('kanpur') ||
    locationLower.includes('ghaziabad') ||
    locationLower.includes('ghazibad')
  ) return 'uttar_pradesh'
  if (locationLower.includes('maharashtra') || locationLower.includes('mumbai') || locationLower.includes('pune')) return 'maharashtra'
  if (locationLower.includes('karnataka') || locationLower.includes('bangalore') || locationLower.includes('mysore')) return 'karnataka'
  if (locationLower.includes('tamil nadu') || locationLower.includes('chennai') || locationLower.includes('coimbatore')) return 'tamil_nadu'
  if (locationLower.includes('gujarat') || locationLower.includes('ahmedabad') || locationLower.includes('surat')) return 'gujarat'
  if (locationLower.includes('rajasthan') || locationLower.includes('jaipur') || locationLower.includes('jodhpur')) return 'rajasthan'
  if (locationLower.includes('bihar') || locationLower.includes('patna') || locationLower.includes('gaya')) return 'bihar'
  if (locationLower.includes('west bengal') || locationLower.includes('kolkata') || locationLower.includes('howrah')) return 'west_bengal'
  if (locationLower.includes('madhya pradesh') || locationLower.includes('bhopal') || locationLower.includes('indore')) return 'madhya_pradesh'
  if (locationLower.includes('andhra pradesh') || locationLower.includes('hyderabad') || locationLower.includes('visakhapatnam')) return 'andhra_pradesh'
  if (locationLower.includes('telangana') || locationLower.includes('warangal') || locationLower.includes('nizamabad')) return 'telangana'
  
  return 'other'
}

// Cache for agricultural database
let agriculturalDatabase = null
let databaseLoadTime = 0
const DATABASE_CACHE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

async function getAgriculturalDatabase() {
  if (agriculturalDatabase && Date.now() - databaseLoadTime < DATABASE_CACHE_TIMEOUT) {
    return agriculturalDatabase
  }
  
  const database = await import('../../../complete_agricultural_database.json')
  agriculturalDatabase = database.default
  databaseLoadTime = Date.now()
  return agriculturalDatabase
}

// Get Odisha-specific crop recommendations
async function getOdishaCropRecommendations(soilData, weatherData, location, month, category, previousCrop) {
  try {
    // Load agricultural database (with caching)
    const db = await getAgriculturalDatabase()
    
    // Get Odisha yield data
    const odishaYieldData = db.yieldData?.odisha || {}
    
    // Get all available crops for Odisha
    const availableCrops = Object.keys(odishaYieldData)
    
    // Filter by category if specified
    const filteredCrops = category ? filterCropsByCategory(availableCrops, category) : availableCrops
    
    // Calculate suitability scores for each crop
    const cropScores = []
    
    for (const crop of filteredCrops) {
      const cropData = odishaYieldData[crop]
      if (!cropData) continue
      
      // Get district factor for location
      const districtFactor = getDistrictFactor(location, 'odisha', db.districtFactors)
      
      // Get seasonal factor
      const season = getSeason(parseInt(month))
      const seasonalFactor = db.seasonalFactors?.[season]?.[crop] || 1.0
      
      // Calculate enhanced crop data
      const enhancedCropData = {
        averageYield: cropData.averageYield,
        trend: cropData.trend,
        variability: cropData.variability,
        duration: getCropDuration(crop),
        optimalPH: getCropOptimalPH(crop),
        optimalMoisture: getCropOptimalMoisture(crop),
        optimalTemp: getCropOptimalTemp(crop),
        seasons: getCropSeasons(crop),
        waterRequirement: getCropWaterRequirement(crop)
      }
      
      const score = calculateCropSuitabilityScore(crop, enhancedCropData, soilData, weatherData, month, location, previousCrop)
      const marketAnalysis = await getMarketAnalysis(crop, location, 'odisha')
      const reasons = generateRecommendationReasons(crop, enhancedCropData, soilData, weatherData, score, marketAnalysis, districtFactor, seasonalFactor)
      
      // Calculate expected yield with factors and improvement potential
      const baseYield = cropData.averageYield * districtFactor * seasonalFactor
      
      // Add yield improvement potential based on suitability score
      // Higher scores indicate better conditions, so potential for improvement
      const improvementFactor = 1 + ((score.totalScore - 50) / 100) * 0.3 // Up to 30% improvement for high scores
      const expectedYield = (baseYield * improvementFactor).toFixed(1)
      const improvementPotential = ((improvementFactor - 1) * 100).toFixed(1)
      
      cropScores.push({
        name: crop,
        match: `${Math.min(95, Math.max(45, score.totalScore))}%`,
        duration: enhancedCropData.duration,
        marketDemand: marketAnalysis.demand,
        yield: `${expectedYield} tons/hectare`,
        baseYield: `${cropData.averageYield} tons/hectare`,
        improvementPotential: improvementPotential > 0 ? `+${improvementPotential}%` : '0%',
        price: marketAnalysis.price,
        profitability: marketAnalysis.profitability,
        reasons: reasons,
        score: score.totalScore,
        suitability: score,
        marketAnalysis: marketAnalysis,
        dataSource: 'odisha_database',
        districtFactor: districtFactor,
        seasonalFactor: seasonalFactor,
        trend: cropData.trend,
        variability: cropData.variability
      })
    }
    
    // Sort by score and return top recommendations
    return cropScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      
  } catch (error) {
    console.error('Error getting Odisha recommendations:', error)
    return getFallbackRecommendations(soilData, weatherData, month, category, previousCrop)
  }
}

// Get multi-state crop recommendations
async function getMultiStateCropRecommendations(soilData, weatherData, location, month, category, previousCrop, state) {
  try {
    // Load agricultural database (with caching)
    const db = await getAgriculturalDatabase()
    
    // Get state yield data
    const stateYieldData = db.yieldData?.[state] || {}
    
    // Get all available crops for the state
    const availableCrops = Object.keys(stateYieldData)
    
    // Filter by category if specified
    const filteredCrops = category ? filterCropsByCategory(availableCrops, category) : availableCrops
    
    // Calculate suitability scores for each crop
    const cropScores = []
    
    for (const crop of filteredCrops) {
      const cropData = stateYieldData[crop]
      if (!cropData) continue
      
      // Get district factor for location
      const districtFactor = getDistrictFactor(location, state, db.districtFactors)
      
      // Get seasonal factor
      const season = getSeason(parseInt(month))
      const seasonalFactor = db.seasonalFactors?.[season]?.[crop] || 1.0
      
      // Calculate enhanced crop data
      const enhancedCropData = {
        averageYield: cropData.averageYield,
        trend: cropData.trend,
        variability: cropData.variability,
        duration: getCropDuration(crop),
        optimalPH: getCropOptimalPH(crop),
        optimalMoisture: getCropOptimalMoisture(crop),
        optimalTemp: getCropOptimalTemp(crop),
        seasons: getCropSeasons(crop),
        waterRequirement: getCropWaterRequirement(crop)
      }
      
      const score = calculateCropSuitabilityScore(crop, enhancedCropData, soilData, weatherData, month, location, previousCrop)
      const marketAnalysis = await getMarketAnalysis(crop, location, state)
      const reasons = generateRecommendationReasons(crop, enhancedCropData, soilData, weatherData, score, marketAnalysis, districtFactor, seasonalFactor)
      
      // Calculate expected yield with factors and improvement potential
      const baseYield = cropData.averageYield * districtFactor * seasonalFactor
      
      // Add yield improvement potential based on suitability score
      // Higher scores indicate better conditions, so potential for improvement
      const improvementFactor = 1 + ((score.totalScore - 50) / 100) * 0.3 // Up to 30% improvement for high scores
      const expectedYield = (baseYield * improvementFactor).toFixed(1)
      const improvementPotential = ((improvementFactor - 1) * 100).toFixed(1)
      
      cropScores.push({
        name: crop,
        match: `${Math.min(95, Math.max(45, score.totalScore))}%`,
        duration: enhancedCropData.duration,
        marketDemand: marketAnalysis.demand,
        yield: `${expectedYield} tons/hectare`,
        baseYield: `${cropData.averageYield} tons/hectare`,
        improvementPotential: improvementPotential > 0 ? `+${improvementPotential}%` : '0%',
        price: marketAnalysis.price,
        profitability: marketAnalysis.profitability,
        reasons: reasons,
        score: score.totalScore,
        suitability: score,
        marketAnalysis: marketAnalysis,
        dataSource: 'multi_state_database',
        districtFactor: districtFactor,
        seasonalFactor: seasonalFactor,
        trend: cropData.trend,
        variability: cropData.variability
      })
    }
    
    // Sort by score and return top recommendations
    return cropScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      
  } catch (error) {
    console.error('Error getting multi-state recommendations:', error)
    return getFallbackRecommendations(soilData, weatherData, month, category, previousCrop)
  }
}

// Filter crops by category
function filterCropsByCategory(crops, category) {
  const categoryMappings = {
    "Cereals & Grains": ["Rice", "Wheat", "Maize", "Barley", "Jowar", "Bajra", "Ragi", "Corn"],
    "Pulses": ["Lentil", "Gram", "Arhar", "Tur", "Moong", "Urad", "Chickpea", "Black Gram", "Green Gram"],
    "Cash Crops": ["Sugarcane", "Cotton", "Jute", "Tobacco", "Tea", "Coffee"],
    "Oilseeds": ["Groundnut", "Peanut", "Soybean", "Sunflower", "Mustard", "Safflower", "Sesame"],
    "Plantation Crops": ["Tea", "Coffee", "Rubber", "Coconut", "Arecanut", "Cocoa"],
    "Fruits": ["Mango", "Banana", "Apple", "Orange", "Grapes", "Pineapple", "Guava", "Papaya", "Pomegranate"],
    "Vegetables": ["Potato", "Tomato", "Onion", "Brinjal", "Eggplant", "Cauliflower", "Cabbage", "Carrot", "Radish"],
    "Spices & Herbs": ["Turmeric", "Ginger", "Garlic", "Chilli", "Black Pepper", "Cardamom", "Coriander", "Cumin"],
    "Medicinal Plants": ["Aloe Vera", "Tulsi", "Holy Basil", "Ashwagandha", "Lemongrass", "Mint"]
  }
  
  const categoryCrops = categoryMappings[category] || []
  return crops.filter(crop => 
    categoryCrops.some(categoryCrop => 
      crop.toLowerCase().includes(categoryCrop.toLowerCase()) ||
      categoryCrop.toLowerCase().includes(crop.toLowerCase())
    )
  )
}

// Calculate crop suitability score
function calculateCropSuitabilityScore(crop, cropData, soilData, weatherData, month, location, previousCrop) {
  let score = 0
  const factors = {
    soil: 0,
    weather: 0,
    seasonal: 0,
    rotation: 0,
    location: 0
  }
  
  // Soil suitability (40% weight)
  const soilScore = calculateSoilSuitability(cropData, soilData)
  factors.soil = soilScore
  score += soilScore * 0.4
  
  // Weather suitability (25% weight)
  const weatherScore = calculateWeatherSuitability(cropData, weatherData, month)
  factors.weather = weatherScore
  score += weatherScore * 0.25
  
  // Seasonal suitability (20% weight)
  const seasonalScore = calculateSeasonalSuitability(cropData, month)
  factors.seasonal = seasonalScore
  score += seasonalScore * 0.2
  
  // Crop rotation (10% weight)
  const rotationScore = calculateRotationScore(previousCrop, crop)
  factors.rotation = rotationScore
  score += rotationScore * 0.1
  
  // Location suitability (5% weight)
  const locationScore = calculateLocationSuitability(cropData, location)
  factors.location = locationScore
  score += locationScore * 0.05
  
  return {
    totalScore: Math.round(score),
    factors: factors,
    breakdown: {
      soil: `${Math.round(soilScore)}/100`,
      weather: `${Math.round(weatherScore)}/100`,
      seasonal: `${Math.round(seasonalScore)}/100`,
      rotation: `${Math.round(rotationScore)}/100`,
      location: `${Math.round(locationScore)}/100`
    }
  }
}

// Calculate soil suitability
function calculateSoilSuitability(cropData, soilData) {
  let score = 50 // Base score
  
  // pH suitability
  const optimalPH = cropData.optimalPH || 6.5
  const phDiff = Math.abs(soilData.ph - optimalPH)
  if (phDiff < 0.5) score += 20
  else if (phDiff < 1.0) score += 10
  else if (phDiff > 2.0) score -= 15
  
  // Moisture suitability
  const optimalMoisture = cropData.optimalMoisture || 60
  const moistureDiff = Math.abs(soilData.moisture - optimalMoisture)
  if (moistureDiff < 10) score += 15
  else if (moistureDiff < 20) score += 8
  else if (moistureDiff > 30) score -= 10
  
  // Nutrient suitability
  const nitrogenScore = soilData.nitrogen >= (cropData.nitrogenRequirement || 20) ? 10 : 5
  const phosphorusScore = soilData.phosphorus >= (cropData.phosphorusRequirement || 15) ? 10 : 5
  const potassiumScore = soilData.potassium >= (cropData.potassiumRequirement || 150) ? 10 : 5
  
  score += nitrogenScore + phosphorusScore + potassiumScore
  
  return Math.min(100, Math.max(0, score))
}

// Calculate weather suitability
function calculateWeatherSuitability(cropData, weatherData, month) {
  let score = 50 // Base score
  
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 25), 0) / weatherData.length
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
  
  // Temperature suitability
  const optimalTemp = cropData.optimalTemp || 25
  const tempDiff = Math.abs(avgTemp - optimalTemp)
  if (tempDiff < 3) score += 20
  else if (tempDiff < 6) score += 10
  else if (tempDiff > 10) score -= 15
  
  // Rainfall suitability
  const optimalRainfall = cropData.optimalRainfall || 3
  const rainfallDiff = Math.abs(rainyDays - optimalRainfall)
  if (rainfallDiff < 1) score += 15
  else if (rainfallDiff < 2) score += 8
  else if (rainfallDiff > 4) score -= 10
  
  return Math.min(100, Math.max(0, score))
}

// Calculate seasonal suitability
function calculateSeasonalSuitability(cropData, month) {
  const monthNum = parseInt(month) || 1
  const season = getSeason(monthNum)
  const cropSeasons = cropData.seasons || ['kharif']
  
  if (cropSeasons.includes(season)) {
    return 100
  } else if (cropSeasons.includes('all')) {
    return 80
  } else {
    return 30
  }
}

// Calculate crop rotation score
function calculateRotationScore(previousCrop, currentCrop) {
  if (!previousCrop) return 50 // Neutral if no previous crop
  
  const rotationMatrix = {
    'Rice': { 'Wheat': 20, 'Chickpea': 15, 'Mustard': 10, 'Rice': -20 },
    'Wheat': { 'Rice': 20, 'Maize': 15, 'Sugarcane': 10, 'Wheat': -20 },
    'Maize': { 'Wheat': 15, 'Chickpea': 20, 'Mustard': 15, 'Maize': -15 },
    'Chickpea': { 'Rice': 15, 'Wheat': 20, 'Maize': 15, 'Chickpea': -15 },
    'Sugarcane': { 'Wheat': 10, 'Rice': 15, 'Sugarcane': -25 },
    'Cotton': { 'Wheat': 15, 'Chickpea': 20, 'Cotton': -20 }
  }
  
  const score = rotationMatrix[previousCrop]?.[currentCrop] || 0
  return Math.max(0, Math.min(100, 50 + score))
}

// Calculate location suitability
function calculateLocationSuitability(cropData, location) {
  // This could be enhanced with more specific location data
  return 70 // Default moderate score
}

// Get season from month
function getSeason(month) {
  if (month >= 6 && month <= 10) return 'kharif'
  if (month >= 11 && month <= 3) return 'rabi'
  return 'summer'
}

// Get market analysis
async function getMarketAnalysis(crop, location, state) {
  // This would typically connect to market data APIs
  // For now, return realistic mock data
  const basePrices = {
    'Rice': 25,
    'Wheat': 22,
    'Maize': 18,
    'Chickpea': 45,
    'Sugarcane': 3.5,
    'Cotton': 65,
    'Mustard': 55,
    'Potato': 15,
    'Tomato': 30,
    'Onion': 25
  }
  
  const basePrice = basePrices[crop] || 20
  const demandLevels = ['Low', 'Moderate', 'High']
  const demand = demandLevels[Math.floor(Math.random() * 3)]
  
  // Adjust price based on demand
  let price = basePrice
  if (demand === 'High') price *= 1.2
  else if (demand === 'Low') price *= 0.8
  
  // Calculate profitability (simplified)
  const costPerKg = price * 0.6 // Assume 60% cost
  const profitPerKg = price - costPerKg
  const profitability = (profitPerKg / costPerKg) * 100
  
  return {
    price: `₹${price.toFixed(2)}/kg`,
    demand: demand,
    profitability: `${profitability.toFixed(1)}%`,
    marketTrend: demand === 'High' ? 'Rising' : demand === 'Low' ? 'Declining' : 'Stable',
    exportPotential: demand === 'High' ? 'High' : 'Moderate'
  }
}

// Get district factor for location
function getDistrictFactor(location, state, districtFactors) {
  const locationLower = location.toLowerCase()
  const stateFactors = districtFactors?.[state] || {}
  
  // Check for exact district match
  for (const [district, factor] of Object.entries(stateFactors)) {
    if (district !== 'default' && locationLower.includes(district)) {
      return factor
    }
  }
  
  return stateFactors.default || 1.0
}

// Get crop duration
function getCropDuration(crop) {
  const durations = {
    'Rice': '120-150 days',
    'Wheat': '120-150 days',
    'Maize': '90-120 days',
    'Chickpea': '90-120 days',
    'Sugarcane': '12-18 months',
    'Cotton': '150-180 days',
    'Mustard': '100-120 days',
    'Potato': '90-120 days',
    'Tomato': '90-120 days',
    'Onion': '120-150 days',
    'Ragi': '100-120 days',
    'Bajra': '80-100 days',
    'Jowar': '100-120 days'
  }
  return durations[crop] || '120-150 days'
}

// Get crop optimal pH
function getCropOptimalPH(crop) {
  const phValues = {
    'Rice': 6.0,
    'Wheat': 6.5,
    'Maize': 6.2,
    'Chickpea': 6.5,
    'Sugarcane': 6.8,
    'Cotton': 6.8,
    'Mustard': 6.5,
    'Potato': 5.5,
    'Tomato': 6.0,
    'Onion': 6.0,
    'Ragi': 6.0,
    'Bajra': 6.5,
    'Jowar': 6.5
  }
  return phValues[crop] || 6.5
}

// Get crop optimal moisture
function getCropOptimalMoisture(crop) {
  const moistureValues = {
    'Rice': 80,
    'Wheat': 65,
    'Maize': 75,
    'Chickpea': 70,
    'Sugarcane': 85,
    'Cotton': 55,
    'Mustard': 60,
    'Potato': 70,
    'Tomato': 65,
    'Onion': 60,
    'Ragi': 60,
    'Bajra': 50,
    'Jowar': 55
  }
  return moistureValues[crop] || 65
}

// Get crop optimal temperature
function getCropOptimalTemp(crop) {
  const tempValues = {
    'Rice': 28,
    'Wheat': 22,
    'Maize': 25,
    'Chickpea': 25,
    'Sugarcane': 30,
    'Cotton': 28,
    'Mustard': 20,
    'Potato': 20,
    'Tomato': 25,
    'Onion': 22,
    'Ragi': 25,
    'Bajra': 28,
    'Jowar': 26
  }
  return tempValues[crop] || 25
}

// Get crop seasons
function getCropSeasons(crop) {
  const seasons = {
    'Rice': ['kharif'],
    'Wheat': ['rabi'],
    'Maize': ['kharif', 'summer'],
    'Chickpea': ['rabi'],
    'Sugarcane': ['all'],
    'Cotton': ['kharif'],
    'Mustard': ['rabi'],
    'Potato': ['rabi'],
    'Tomato': ['all'],
    'Onion': ['rabi'],
    'Ragi': ['kharif'],
    'Bajra': ['kharif'],
    'Jowar': ['kharif']
  }
  return seasons[crop] || ['kharif']
}

// Get crop water requirement
function getCropWaterRequirement(crop) {
  const waterReqs = {
    'Rice': 'High',
    'Wheat': 'Medium',
    'Maize': 'Medium',
    'Chickpea': 'Low',
    'Sugarcane': 'High',
    'Cotton': 'Medium',
    'Mustard': 'Low',
    'Potato': 'Medium',
    'Tomato': 'Medium',
    'Onion': 'Low',
    'Ragi': 'Low',
    'Bajra': 'Low',
    'Jowar': 'Low'
  }
  return waterReqs[crop] || 'Medium'
}

// Generate recommendation reasons
function generateRecommendationReasons(crop, cropData, soilData, weatherData, score, marketAnalysis, districtFactor, seasonalFactor) {
  const reasons = []
  
  // Soil-based reasons
  if (score.factors.soil > 80) {
    reasons.push(`Excellent soil conditions for ${crop.toLowerCase()} cultivation`)
  } else if (score.factors.soil > 60) {
    reasons.push(`Good soil conditions support ${crop.toLowerCase()} growth`)
  }
  
  // Weather-based reasons
  if (score.factors.weather > 80) {
    reasons.push(`Favorable weather conditions for optimal yield`)
  } else if (score.factors.weather > 60) {
    reasons.push(`Weather conditions are suitable for ${crop.toLowerCase()}`)
  }
  
  // Seasonal reasons
  if (score.factors.seasonal > 80) {
    reasons.push(`Perfect season for ${crop.toLowerCase()} planting`)
  }
  
  // Market reasons
  if (marketAnalysis.demand === 'High') {
    reasons.push(`High market demand ensures good prices`)
  }
  
  if (parseFloat(marketAnalysis.profitability) > 30) {
    reasons.push(`High profitability potential (${marketAnalysis.profitability})`)
  }
  
  // Yield reasons with context
  const expectedYield = cropData.averageYield || 3.0
  if (expectedYield > 4.0) {
    reasons.push(`High yield potential (${expectedYield} tons/hectare)`)
  } else if (expectedYield < 1.0) {
    reasons.push(`Low base yield (${expectedYield} tons/hectare) - significant improvement potential with proper management`)
  } else if (expectedYield < 2.0) {
    reasons.push(`Moderate yield potential (${expectedYield} tons/hectare) - good scope for improvement`)
  }
  
  // Rotation reasons
  if (score.factors.rotation > 70) {
    reasons.push(`Good crop rotation benefits soil health`)
  }
  
  // District factor reasons
  if (districtFactor > 1.1) {
    reasons.push(`Favorable location with ${Math.round((districtFactor - 1) * 100)}% yield advantage`)
  }
  
  // Seasonal factor reasons
  if (seasonalFactor > 1.1) {
    reasons.push(`Optimal season with ${Math.round((seasonalFactor - 1) * 100)}% seasonal advantage`)
  }
  
  // Trend reasons
  if (cropData.trend === 'increasing') {
    reasons.push(`Increasing yield trend in recent years`)
  }
  
  return reasons.slice(0, 6) // Limit to 6 reasons
}

// Fallback recommendations
function getFallbackRecommendations(soilData, weatherData, month, category, previousCrop) {
  const fallbackCrops = [
    {
      name: "Rice",
      match: "75%",
      duration: "120-150 days",
      marketDemand: "High",
      yield: "4.5 tons/hectare",
      price: "₹25/kg",
      profitability: "35%",
      reasons: [
        "Suitable for current soil conditions",
        "High market demand",
        "Good profitability potential"
      ],
      score: 75,
      dataSource: 'fallback'
    },
    {
      name: "Wheat",
      match: "70%",
      duration: "120-150 days",
      marketDemand: "High",
      yield: "3.8 tons/hectare",
      price: "₹22/kg",
      profitability: "32%",
      reasons: [
        "Good soil pH for wheat cultivation",
        "Favorable weather conditions",
        "Stable market prices"
      ],
      score: 70,
      dataSource: 'fallback'
    }
  ]
  
  return category ? fallbackCrops.filter(crop => 
    filterCropsByCategory([crop.name], category).length > 0
  ) : fallbackCrops
}

// Generate fallback soil data
function generateFallbackSoilData(location) {
  return {
    ph: 6.5,
    moisture: 60,
    nitrogen: 25,
    phosphorus: 18,
    potassium: 180,
    organicMatter: 2.5,
    texture: "loamy"
  }
}

// Generate fallback weather data
function generateFallbackWeatherData(location) {
  return [
    { temp: "28°C", condition: "Sunny", tempValue: 28 },
    { temp: "26°C", condition: "Partly Cloudy", tempValue: 26 },
    { temp: "30°C", condition: "Sunny", tempValue: 30 },
    { temp: "25°C", condition: "Light Rain", tempValue: 25 },
    { temp: "27°C", condition: "Cloudy", tempValue: 27 }
  ]
}
