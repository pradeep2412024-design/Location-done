import { generateDynamicTimeline } from '../../../lib/dynamicTimeline.js'

export async function POST(request) {
  try {
    const body = await request.json()
    const location = body.location || "Odisha"
    const crop = body.crop || body.nextCrop || "Rice"
    const month = body.month || body.cultivationMonth || "October"
    const hectare = body.hectare || body.farmSize || "5"

    console.log("[v0] Crop analysis requested for:", { location, crop, month, hectare })

    const { origin } = new URL(request.url)
    const baseUrl = origin

    // Fetch soil data
    const soilResponse = await fetch(`${baseUrl}/api/soil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, crop, month, hectare }),
    })

    let soilData = null
    if (soilResponse.ok) {
      const soilResult = await soilResponse.json()
      soilData = soilResult.data
    }

    // Fetch weather data
    const weatherResponse = await fetch(`${baseUrl}/api/weather`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, month }),
    })

    let weatherData = null
    if (weatherResponse.ok) {
      const weatherResult = await weatherResponse.json()
      weatherData = weatherResult.weatherData
    }

    if (!soilData) {
      soilData = generateFallbackSoilData(location, crop)
    }

    if (!weatherData) {
      weatherData = generateFallbackWeatherData(location)
    }

    // Calculate dynamic predictions based on soil and weather using unified (Odisha) logic for all states
    const predictions = await calculateOdishaPredictions(soilData, weatherData, crop, month, hectare, location)

    // Generate recommendations
    const recommendations = generateRecommendations(soilData, weatherData, crop, month)

    // Generate market analysis using dynamic predicted yields
    const marketAnalysis = generateMarketAnalysis(crop, location, hectare, predictions.predictedYield)

    // Generate sustainability metrics
    const sustainability = generateSustainabilityMetrics(soilData, crop, hectare)

    // Generate dynamic timeline based on real-world conditions
    console.log("[v0] Generating dynamic timeline for:", { crop, month, location })
    const dynamicTimeline = generateDynamicTimeline(crop, month, location, weatherData, soilData, predictions)
    console.log("[v0] Dynamic timeline generated with", dynamicTimeline.length, "phases")


    const response = {
      userInfo: {
        name: "Farmer", // This could be from user session
        location,
        farmSize: hectare,
        previousCrop: "", // Could be tracked
        nextCrop: crop,
        cultivationMonth: month,
      },
      predictions,
      recommendations,
      marketAnalysis,
      sustainability,
      soilData,
      weatherData,
      dynamicTimeline, // Add dynamic timeline to response
    }

    console.log("[v0] Enhanced crop analysis response generated")
    return Response.json(response)
  } catch (error) {
    console.error("[v0] Crop analysis API error:", error)
    return Response.json({ error: "Failed to analyze crop data" }, { status: 500 })
  }
}

function generateFallbackSoilData(location, crop) {
  return {
    ph: 6.2 + Math.random() * 1.0,
    moisture: 35 + Math.random() * 30,
    nitrogen: 60 + Math.random() * 30,
    phosphorus: 50 + Math.random() * 40,
    potassium: 55 + Math.random() * 35,
    organicMatter: 2.1 + Math.random() * 1.5,
    salinity: 0.2 + Math.random() * 0.3,
  }
}

function generateFallbackWeatherData(location) {
  const baseTemp = location.toLowerCase().includes("mumbai")
    ? 32
    : location.toLowerCase().includes("delhi")
      ? 30
      : location.toLowerCase().includes("bangalore")
        ? 26
        : 28

  return [
    {
      day: "Mon",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Sunny",
      rainfall: 0,
      humidity: 65,
      wind: 12,
      date: "2024-01-15",
    },
    {
      day: "Tue",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Partly Cloudy",
      rainfall: 0,
      humidity: 70,
      wind: 8,
      date: "2024-01-16",
    },
    {
      day: "Wed",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Light Rain",
      rainfall: 5,
      humidity: 78,
      wind: 15,
      date: "2024-01-17",
    },
    {
      day: "Thu",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Cloudy",
      rainfall: 2,
      humidity: 72,
      wind: 10,
      date: "2024-01-18",
    },
    {
      day: "Fri",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Light Rain",
      rainfall: 8,
      humidity: 80,
      wind: 18,
      date: "2024-01-19",
    },
    {
      day: "Sat",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Sunny",
      rainfall: 0,
      humidity: 58,
      wind: 14,
      date: "2024-01-20",
    },
    {
      day: "Sun",
      temp: baseTemp + Math.random() * 4 - 2,
      condition: "Hot",
      rainfall: 0,
      humidity: 55,
      wind: 16,
      date: "2024-01-21",
    },
  ]
}

async function calculateOdishaPredictions(soilData, weatherData, crop, month, hectare, location) {
  try {
    // Ensure crop is defined and has a fallback
    const cropType = crop || "Rice"
    console.log("[v0] Using crop type:", cropType)
    
    // Normalize crop name for consistent matching
    const normalizedCrop = cropType.split(" ")[0].split("(")[0].toLowerCase()
    console.log("[v0] Normalized crop type:", normalizedCrop)
    
    // Get base yield with AI fallback support using actual state from location
    const stateForCalc = getStateFromLocation(location)
    const baseYield = await getBaseYield(cropType, stateForCalc)
    
    // Calculate soil health impact (purely dynamic based on crop-location-month interrelation)
    const soilHealthResult = calculateOdishaSoilHealthScore(soilData, location, normalizedCrop, month)
    const soilHealthScore = soilHealthResult.score
    const soilFactor = soilHealthScore / 100
    
    // Calculate weather impact (Odisha monsoon patterns)
    const weatherImpact = calculateOdishaWeatherImpact(weatherData, normalizedCrop, month, location)
    
    // Calculate seasonal factor (comprehensive cropping seasons)
    const seasonalFactor = calculateComprehensiveSeasonalFactor(normalizedCrop, month)
    
    // Calculate district-specific factor
    const districtFactor = getStateDistrictFactor(getStateFromLocation(location), location)
    
    // Calculate predicted yield with more realistic factors
    // Use additive approach instead of multiplicative to avoid extremely low yields
    const soilBonus = (soilFactor - 0.5) * 0.3 // Soil can add/subtract up to 15%
    const weatherBonus = (weatherImpact - 1.0) * 0.2 // Weather can add/subtract up to 10%
    const seasonalBonus = (seasonalFactor - 1.0) * 0.1 // Season can add/subtract up to 5%
    const districtBonus = (districtFactor - 1.0) * 0.1 // District can add/subtract up to 5%
    
    const totalBonus = 1 + soilBonus + weatherBonus + seasonalBonus + districtBonus
    const exactYield = baseYield * totalBonus
    
    // Ensure reasonable minimum yield (at least 50% of base yield)
    const minYield = baseYield * 0.5
    const predictedYield = Math.max(minYield, Math.round(exactYield * 10) / 10)
    
    console.log("[v0] Yield calculation details:", {
      baseYield,
      soilFactor,
      weatherImpact,
      seasonalFactor,
      districtFactor,
      exactYield,
      predictedYield
    })

    // Calculate weather risk (purely dynamic based on crop-location-month interrelation)
    const weatherRiskResult = calculateOdishaWeatherRisk(weatherData, month, normalizedCrop, location)
    const weatherRisk = weatherRiskResult.level

    // Calculate confidence based on data quality (more realistic range)
    const confidence = Math.min(
      90,
      Math.max(70, soilHealthScore - (weatherRisk === "High" ? 10 : weatherRisk === "Medium" ? 5 : 0)),
    )

  // Get AI recommendations for Odisha farming conditions
  const aiRecommendations = getOdishaAIRecommendations(normalizedCrop, soilData, weatherData, location, month)
  
  // Ensure we have at least some recommendations
  if (aiRecommendations.length === 0) {
    aiRecommendations.push({
      type: 'general',
      priority: 'medium',
      action: 'Apply balanced fertilizer and maintain proper irrigation',
      expectedIncrease: 5
    })
  }

  // Calculate dynamic yield increase based on AI recommendations
  const yieldIncrease = calculateDynamicYieldIncrease(predictedYield, aiRecommendations)

    // Calculate priority tasks with detailed risk solutions
    const priorityTasksData = calculatePriorityTasks(soilHealthResult, weatherRiskResult, aiRecommendations, normalizedCrop, location, month)
    
    return {
      predictedYield: Number.parseFloat(predictedYield.toFixed(1)),
      yieldIncrease: yieldIncrease.display, // Use display string for frontend compatibility
      yieldIncreaseDetails: yieldIncrease, // Keep full object for detailed info
      soilHealthScore,
      weatherRisk,
      priorityTasks: priorityTasksData.count,
      priorityTasksData: priorityTasksData, // Detailed data for clickable panel
      confidence,
      aiRecommendations: aiRecommendations,
      soilHealthDetails: soilHealthResult, // Detailed soil health breakdown
      weatherRiskDetails: weatherRiskResult, // Detailed weather risk breakdown
      factors: {
        baseYield,
        soilFactor,
        weatherImpact,
        seasonalFactor,
        districtFactor
      }
    }
  } catch (error) {
    console.error("Error in calculateOdishaPredictions:", error)
    console.error("Error details:", error.message)
    console.error("Stack trace:", error.stack)
    // Fallback to static calculation
    return await calculateStaticPredictions(soilData, weatherData, crop, month, hectare, location)
  }
}

async function calculatePredictions(soilData, weatherData, crop, month, hectare, location) {
  // Get state from location
  const state = getStateFromLocation(location)
  
  // Calculate yield increase based on soil health
  const soilHealthScore = Math.round(
    (soilData.ph >= 6.0 && soilData.ph <= 7.0 ? 25 : 15) +
      (soilData.moisture >= 40 && soilData.moisture <= 70 ? 25 : 15) +
      (soilData.nitrogen >= 20 ? 20 : 10) +
      (soilData.phosphorus >= 15 ? 15 : 8) +
      (soilData.potassium >= 150 ? 15 : 8),
  )

  // Calculate weather risk
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  const rainyDays = weatherData.filter((day) => day.condition.includes("rain")).length

  let weatherRisk = "Low"
  if (avgTemp > 35 || rainyDays > 4) weatherRisk = "High"
  else if (avgTemp > 30 || rainyDays > 2) weatherRisk = "Medium"

  // Calculate yield prediction with AI fallback
  const baseYield = await getBaseYield(crop, state)
  const soilFactor = soilHealthScore / 100
  const weatherFactor = weatherRisk === "Low" ? 1.1 : weatherRisk === "Medium" ? 1.0 : 0.9

  const predictedYield = (baseYield * soilFactor * weatherFactor).toFixed(1)
  const confidence = Math.min(
    95,
    Math.max(60, soilHealthScore + (weatherRisk === "High" ? 20 : weatherRisk === "Medium" ? 10 : 0)),
  )

  // Calculate yield increase based on soil and weather factors
  const yieldIncreasePercentage = Math.max(0, Math.round((soilFactor * weatherFactor - 1) * 100))
  const yieldIncreaseRange = `${yieldIncreasePercentage}-${yieldIncreasePercentage + 15}%`
  
  // Create yield increase details for breakdown
  const yieldIncreaseDetails = {
    percentage: yieldIncreasePercentage,
    confidence: confidence,
    recommendations: 0,
    display: yieldIncreaseRange,
    calculation: {
      currentYield: baseYield.toFixed(2),
      improvedYield: predictedYield,
      totalImprovement: yieldIncreasePercentage.toFixed(1),
      yieldIncrease: (Number.parseFloat(predictedYield) - baseYield).toFixed(2)
    }
  }

  // Create detailed soil health breakdown
  const soilHealthDetails = {
    score: soilHealthScore,
    factors: {
      ph: {
        value: soilData.ph,
        score: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? 25 : 15,
        status: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? "Optimal" : "Suboptimal",
        recommendation: soilData.ph < 6.0 ? "Add lime to increase pH" : soilData.ph > 7.0 ? "Add sulfur to decrease pH" : "pH is optimal"
      },
      moisture: {
        value: soilData.moisture,
        score: soilData.moisture >= 40 && soilData.moisture <= 70 ? 25 : 15,
        status: soilData.moisture >= 40 && soilData.moisture <= 70 ? "Good" : "Needs attention",
        recommendation: soilData.moisture < 40 ? "Increase irrigation" : soilData.moisture > 70 ? "Improve drainage" : "Moisture is optimal"
      },
      nitrogen: {
        value: soilData.nitrogen,
        score: soilData.nitrogen >= 20 ? 20 : 10,
        status: soilData.nitrogen >= 20 ? "Adequate" : "Low",
        recommendation: soilData.nitrogen < 20 ? "Apply nitrogen fertilizer" : "Nitrogen levels are adequate"
      },
      phosphorus: {
        value: soilData.phosphorus,
        score: soilData.phosphorus >= 15 ? 15 : 8,
        status: soilData.phosphorus >= 15 ? "Adequate" : "Low",
        recommendation: soilData.phosphorus < 15 ? "Apply phosphorus fertilizer" : "Phosphorus levels are adequate"
      },
      potassium: {
        value: soilData.potassium,
        score: soilData.potassium >= 150 ? 15 : 8,
        status: soilData.potassium >= 150 ? "Adequate" : "Low",
        recommendation: soilData.potassium < 150 ? "Apply potassium fertilizer" : "Potassium levels are adequate"
      }
    }
  }

  // Create detailed weather risk breakdown
  const weatherRiskDetails = {
    risk: weatherRisk,
    factors: {
      temperature: {
        value: avgTemp.toFixed(1),
        status: avgTemp > 35 ? "High Risk" : avgTemp > 30 ? "Medium Risk" : "Low Risk",
        impact: avgTemp > 35 ? "Heat stress can reduce yield" : avgTemp > 30 ? "Moderate heat stress" : "Temperature is favorable"
      },
      rainfall: {
        value: rainyDays,
        status: rainyDays > 4 ? "High Risk" : rainyDays > 2 ? "Medium Risk" : "Low Risk",
        impact: rainyDays > 4 ? "Excessive rain can cause waterlogging" : rainyDays > 2 ? "Moderate rain risk" : "Rainfall is manageable"
      }
    }
  }

  // Create priority tasks breakdown
  const priorityTasksDetails = {
    count: weatherRisk === "High" ? 3 : weatherRisk === "Medium" ? 1 : 0,
    tasks: weatherRisk === "High" ? [
      "Monitor soil moisture levels daily",
      "Implement drainage system if needed",
      "Apply stress-relief fertilizers"
    ] : weatherRisk === "Medium" ? [
      "Monitor weather conditions closely"
    ] : [
      "Continue regular monitoring"
    ]
  }

  // Add missing fields for frontend compatibility
  soilHealthDetails.riskFactors = []
  soilHealthDetails.recommendations = []
  soilHealthDetails.breakdown = {
    ph: {
      points: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? 25 : 15,
      risk: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? null : `pH ${soilData.ph} is outside optimal range (6.0-7.0)`,
      recommendation: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? "pH is optimal" : (soilData.ph < 6.0 ? "Add lime to increase pH" : "Add sulfur to decrease pH")
    },
    moisture: {
      points: soilData.moisture >= 40 && soilData.moisture <= 70 ? 25 : 15,
      risk: soilData.moisture >= 40 && soilData.moisture <= 70 ? null : `Moisture ${soilData.moisture}% is outside optimal range (40-70%)`,
      recommendation: soilData.moisture >= 40 && soilData.moisture <= 70 ? "Moisture is optimal" : (soilData.moisture < 40 ? "Increase irrigation" : "Improve drainage")
    },
    nitrogen: {
      points: soilData.nitrogen >= 20 ? 20 : 10,
      risk: soilData.nitrogen >= 20 ? null : `Low nitrogen levels (${soilData.nitrogen})`,
      recommendation: soilData.nitrogen >= 20 ? "Nitrogen levels are adequate" : "Apply nitrogen fertilizer"
    },
    phosphorus: {
      points: soilData.phosphorus >= 15 ? 15 : 8,
      risk: soilData.phosphorus >= 15 ? null : `Low phosphorus levels (${soilData.phosphorus})`,
      recommendation: soilData.phosphorus >= 15 ? "Phosphorus levels are adequate" : "Apply phosphorus fertilizer"
    },
    potassium: {
      points: soilData.potassium >= 150 ? 15 : 8,
      risk: soilData.potassium >= 150 ? null : `Low potassium levels (${soilData.potassium})`,
      recommendation: soilData.potassium >= 150 ? "Potassium levels are adequate" : "Apply potassium fertilizer"
    }
  }

  // Populate risk factors and recommendations
  if (soilData.ph < 6.0 || soilData.ph > 7.0) {
    soilHealthDetails.riskFactors.push(`pH ${soilData.ph} is outside optimal range (6.0-7.0)`)
    soilHealthDetails.recommendations.push(soilData.ph < 6.0 ? "Add lime to increase pH" : "Add sulfur to decrease pH")
  }
  if (soilData.moisture < 40 || soilData.moisture > 70) {
    soilHealthDetails.riskFactors.push(`Moisture ${soilData.moisture}% is outside optimal range (40-70%)`)
    soilHealthDetails.recommendations.push(soilData.moisture < 40 ? "Increase irrigation" : "Improve drainage")
  }
  if (soilData.nitrogen < 20) {
    soilHealthDetails.riskFactors.push(`Low nitrogen levels (${soilData.nitrogen})`)
    soilHealthDetails.recommendations.push("Apply nitrogen fertilizer")
  }
  if (soilData.phosphorus < 15) {
    soilHealthDetails.riskFactors.push(`Low phosphorus levels (${soilData.phosphorus})`)
    soilHealthDetails.recommendations.push("Apply phosphorus fertilizer")
  }
  if (soilData.potassium < 150) {
    soilHealthDetails.riskFactors.push(`Low potassium levels (${soilData.potassium})`)
    soilHealthDetails.recommendations.push("Apply potassium fertilizer")
  }

  return {
    yieldIncrease: yieldIncreaseRange,
    yieldIncreaseDetails: yieldIncreaseDetails,
    soilHealthScore,
    soilHealthDetails: soilHealthDetails,
    weatherRisk,
    weatherRiskDetails: weatherRiskDetails,
    priorityTasks: weatherRisk === "High" ? 3 : weatherRisk === "Medium" ? 1 : 0,
    priorityTasksDetails: priorityTasksDetails,
    predictedYield: Number.parseFloat(predictedYield),
    confidence,
  }
}

function generateRecommendations(soilData, weatherData, crop, month) {
  // Ensure crop is defined and has a fallback
  const cropType = crop || "Rice"
  
  // Normalize crop name - handle variations like "Maize (Corn)" -> "maize"
  const normalizedCrop = cropType.split(" ")[0].split("(")[0].toLowerCase()
  
  const avgHumidity = weatherData.reduce((sum, day) => sum + day.humidity, 0) / weatherData.length
  const rainyDays = weatherData.filter((day) => day.condition.includes("rain")).length

  return {
    irrigation: {
      type: soilData.moisture < 40 ? "Drip Irrigation System" : "Sprinkler System",
      efficiency: `${8 + Math.round(Math.random() * 10)}-${15 + Math.round(Math.random() * 10)}% water efficiency`,
      description: `Optimal water management strategy for ${normalizedCrop} based on current soil moisture of ${soilData.moisture}%`,
    },
    pestManagement: {
      type: "Integrated Pest Management",
      monitoring: avgHumidity > 70 ? "Daily Monitoring" : "Weekly Monitoring",
      description: `Preventive pest control measures specific to ${normalizedCrop} cultivation`,
      efficiency: `${5 + Math.round(Math.random() * 8)}-${12 + Math.round(Math.random() * 8)}% loss prevention`,
    },
    fertilizer: {
      type: soilData.nitrogen < 20 ? "Nitrogen-Rich Fertilizer" : "Balanced NPK",
      application: `Based on soil analysis: N-${soilData.nitrogen}, P-${soilData.phosphorus}, K-${soilData.potassium}`,
      timing: `Apply during ${month} for optimal ${normalizedCrop} growth`,
    },
  }
}

function generateMarketAnalysis(crop, location, hectare, predictedYield) {
  // Comprehensive crop pricing database (150+ crops)
  const basePrices = {
    // GRAINS & CEREALS
    "Rice": 2800, "Wheat": 2200, "Maize": 2000, "Jowar": 1800, "Bajra": 2000, 
    "Ragi": 3000, "Barley": 2000, "Oats": 2500, "Quinoa": 15000,
    
    // PULSES
    "Black Gram": 6000, "Green Gram": 7000, "Horse Gram": 5000, "Bengal Gram": 6500,
    "Chickpea": 6500, "Pigeon Pea": 5500, "Lentil": 6000, "Pea": 4000, "Soybean": 4500,
    "Kidney Bean": 8000, "Lima Bean": 7000, "Navy Bean": 6000, "Pinto Bean": 5500,
    
    // OILSEEDS
    "Groundnut": 5500, "Mustard": 4500, "Sesame": 8000, "Sunflower": 4000,
    "Niger": 6000, "Castor": 4000, "Linseed": 5000, "Safflower": 4000,
    "Rapeseed": 4500, "Canola": 4000, "Palm Oil": 800, "Coconut Oil": 1200,
    
    // COMMERCIAL CROPS
    "Cotton": 6000, "Sugarcane": 300, "Jute": 3000, "Mesta": 2500, "Tobacco": 15000,
    "Rubber": 150, "Tea": 200, "Coffee": 300, "Cocoa": 5000,
    
    // VEGETABLES
    "Potato": 2500, "Tomato": 4000, "Onion": 3500, "Chilli": 15000, "Brinjal": 2000,
    "Okra": 3000, "Cucumber": 2500, "Bottle Gourd": 2000, "Bitter Gourd": 3000,
    "Watermelon": 3000, "Muskmelon": 3000, "Pumpkin": 1500, "Cauliflower": 3000,
    "Cabbage": 2000, "Carrot": 2500, "Radish": 1500, "Spinach": 2000,
    "Lettuce": 3000, "Broccoli": 4000, "Capsicum": 5000, "Beetroot": 2000,
    "Turnip": 1500, "Kohlrabi": 2000, "Artichoke": 8000, "Asparagus": 12000,
    
    // TUBERS & ROOTS
    "Sweet Potato": 2000, "Cassava": 1500, "Yam": 2000, "Taro": 2500,
    "Arrowroot": 3000, "Ginger": 12000, "Turmeric": 8000,
    
    // SPICES & CONDIMENTS
    "Coriander": 8000, "Cumin": 20000, "Fenugreek": 10000, "Fennel": 12000,
    "Cardamom": 25000, "Pepper": 30000, "Cloves": 40000, "Cinnamon": 35000,
    "Nutmeg": 30000, "Mace": 45000, "Star Anise": 20000, "Bay Leaves": 15000,
    "Oregano": 18000, "Thyme": 20000, "Rosemary": 15000, "Sage": 12000,
    "Basil": 10000, "Mint": 8000, "Parsley": 6000, "Dill": 12000,
    
    // FRUITS
    "Mango": 5000, "Banana": 2000, "Litchi": 8000, "Coconut": 3000,
    "Grapes": 6000, "Pomegranate": 4000, "Guava": 2000, "Papaya": 1500,
    "Apple": 8000, "Orange": 3000, "Lemon": 4000, "Lime": 5000,
    "Pineapple": 3000, "Strawberry": 12000, "Blueberry": 20000,
    "Raspberry": 25000, "Blackberry": 20000, "Cranberry": 15000,
    "Kiwi": 8000, "Avocado": 10000, "Fig": 6000, "Date": 4000,
    "Pomegranate": 4000, "Custard Apple": 3000, "Sapota": 2500,
    "Jackfruit": 2000, "Breadfruit": 1500, "Dragon Fruit": 8000,
    
    // FIBER CROPS
    "Hemp": 2000, "Flax": 3000, "Jute": 3000, "Mesta": 2500,
    "Sisal": 1500, "Coir": 1000, "Kapok": 2000,
    
    // MEDICINAL CROPS
    "Aloe Vera": 1000, "Neem": 500, "Tulsi": 2000, "Ashwagandha": 8000,
    "Brahmi": 6000, "Shatavari": 10000, "Giloy": 3000, "Amla": 4000,
    "Haritaki": 5000, "Bibhitaki": 4000, "Triphala": 6000,
    
    // MISCELLANEOUS
    "Bamboo": 1000, "Cashew": 8000, "Areca Nut": 2000, "Betel Nut": 3000,
    "Oil Palm": 500, "Coconut": 3000, "Date Palm": 2000,
    
    // ADDITIONAL CROP VARIATIONS
    "Rice (Paddy)": 2800, "Paddy": 2800, "Corn": 2000, "Sorghum": 1800,
    "Pearl Millet": 2000, "Finger Millet": 3000, "Urad": 6000, "Moong": 7000,
    "Gram": 6500, "Arhar": 5500, "Toor": 5500, "Peanut": 5500,
    "Til": 8000, "Gingelly": 8000, "Eggplant": 2000, "Lady Finger": 3000,
    "Bhendi": 3000, "Karela": 3000, "Lauki": 2000, "Kaddu": 2000,
    "Tinda": 2000, "Gobi": 3000, "Patta Gobi": 2000, "Gajar": 2500,
    "Mooli": 1500, "Palak": 2000, "Methi": 2000, "Dhaniya": 8000,
    "Jeera": 20000, "Haldi": 8000, "Adrak": 12000, "Elaichi": 25000,
    "Kali Mirch": 30000, "Aam": 5000, "Kela": 2000, "Nariyal": 3000,
    "Angur": 6000, "Anar": 4000, "Amrood": 2000, "Papita": 1500,
    "Chai": 200, "Kapi": 300, "Bans": 1000, "Kaju": 8000,
    "Supari": 2000, "Paan": 3000, "Tambaku": 15000
  }

  // Location-based pricing multipliers
  const locationMultipliers = {
    // High productivity states (lower prices due to supply)
    "punjab": 0.95, "haryana": 0.95, "uttar_pradesh": 0.90,
    
    // Metropolitan areas (higher prices due to demand)
    "mumbai": 1.15, "delhi": 1.20, "bangalore": 1.10, "chennai": 1.08,
    "kolkata": 1.05, "hyderabad": 1.08, "pune": 1.10, "ahmedabad": 1.05,
    
    // Coastal areas (export potential)
    "tamil_nadu": 1.05, "andhra_pradesh": 1.03, "kerala": 1.08,
    "goa": 1.12, "odisha": 1.02, "west_bengal": 1.03,
    
    // Arid/remote areas (higher prices due to transport)
    "rajasthan": 1.08, "gujarat": 1.05, "madhya_pradesh": 1.03,
    "bihar": 0.98, "jharkhand": 1.00, "chhattisgarh": 0.98,
    
    // Northeastern states
    "assam": 1.05, "manipur": 1.10, "meghalaya": 1.08, "nagaland": 1.10,
    "tripura": 1.05, "mizoram": 1.08, "arunachal_pradesh": 1.12,
    
    // Himalayan states
    "himachal_pradesh": 1.15, "uttarakhand": 1.12, "jammu_kashmir": 1.18,
    "sikkim": 1.20, "ladakh": 1.25,
    
    // Union territories
    "chandigarh": 1.15, "pondicherry": 1.10, "daman_diu": 1.08,
    "dadra_nagar_haveli": 1.08, "andaman_nicobar": 1.30, "lakshadweep": 1.25
  }

  // Get state from location
  const state = getStateFromLocation(location)
  const locationMultiplier = locationMultipliers[state] || 1.0

  // Get base price for crop
  const basePrice = basePrices[crop] || 3000
  
  // Apply location-based pricing
  const adjustedBasePrice = Math.round(basePrice * locationMultiplier)
  
  // Add random market variation (±5% for realistic fluctuations)
  const variation = (Math.random() - 0.5) * 0.1 // ±5%
  const currentPrice = Math.round(adjustedBasePrice * (1 + variation))

  // Use dynamic predicted yield for accurate calculations
  const totalProduction = hectare * predictedYield
  const expectedRevenue = Math.round(currentPrice * totalProduction)

  // Determine market trend based on season and crop
  const trend = getMarketTrend(crop, location, state)
  const demand = getMarketDemand(crop, state)

  return {
    currentPrice: currentPrice,
    basePrice: basePrice,
    locationMultiplier: locationMultiplier,
    trend: trend,
    demand: demand,
    expectedRevenue: expectedRevenue,
    totalProduction: totalProduction,
    predictedYield: predictedYield,
    state: state
  }
}

// Helper function to determine market trend
function getMarketTrend(crop, location, state) {
  const month = new Date().getMonth() + 1
  
  // Seasonal trends for different crops
  if (crop.toLowerCase().includes('rice') && (month >= 6 && month <= 10)) {
    return "increasing" // Kharif season
  }
  if (crop.toLowerCase().includes('wheat') && (month >= 11 || month <= 3)) {
    return "increasing" // Rabi season
  }
  if (crop.toLowerCase().includes('watermelon') && (month >= 3 && month <= 6)) {
    return "increasing" // Summer season
  }
  
  // High productivity states tend to have stable prices
  if (['punjab', 'haryana', 'uttar_pradesh'].includes(state)) {
    return Math.random() > 0.7 ? "increasing" : "stable"
  }
  
  // Metropolitan areas have more volatile prices
  if (['mumbai', 'delhi', 'bangalore', 'chennai'].includes(state)) {
    return Math.random() > 0.5 ? "increasing" : "stable"
  }
  
  return Math.random() > 0.6 ? "increasing" : "stable"
}

// Helper function to determine market demand
function getMarketDemand(crop, state) {
  // High-value crops generally have high demand
  const highValueCrops = ['chilli', 'turmeric', 'ginger', 'cardamom', 'pepper', 'cumin']
  if (highValueCrops.some(c => crop.toLowerCase().includes(c))) {
    return "high"
  }
  
  // Staple crops have consistent demand
  const stapleCrops = ['rice', 'wheat', 'maize', 'potato', 'onion']
  if (stapleCrops.some(c => crop.toLowerCase().includes(c))) {
    return "high"
  }
  
  // Metropolitan areas have higher demand
  if (['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'].includes(state)) {
    return Math.random() > 0.3 ? "high" : "moderate"
  }
  
  return Math.random() > 0.4 ? "high" : "moderate"
}

function generateSustainabilityMetrics(soilData, crop, hectare) {
  return {
    carbonFootprint: Math.round(hectare * 2.5 + Math.random() * 1.5),
    waterUsage: Math.round(hectare * 500 + Math.random() * 200),
    soilHealth: Math.round((soilData.ph * 10 + soilData.organicMatter * 5) / 2),
    biodiversityScore: Math.round(60 + Math.random() * 30),
  }
}

// Multi-State historical yield data for all major Indian states
function getMultiStateHistoricalYieldData(crop, location) {
  const state = getStateFromLocation(location)
  
  const stateYieldData = {
    // PUNJAB - High productivity state
    'punjab': {
      'Rice': { averageYield: 4.0, trend: 'stable', variability: 0.08 },
      'Wheat': { averageYield: 4.5, trend: 'increasing', variability: 0.06 },
      'Maize': { averageYield: 3.2, trend: 'stable', variability: 0.10 },
      'Cotton': { averageYield: 0.6, trend: 'stable', variability: 0.15 },
      'Sugarcane': { averageYield: 80.0, trend: 'stable', variability: 0.12 },
      'Mustard': { averageYield: 1.8, trend: 'increasing', variability: 0.10 },
      'Sunflower': { averageYield: 1.5, trend: 'stable', variability: 0.12 },
      'Potato': { averageYield: 25.0, trend: 'increasing', variability: 0.08 },
      'Tomato': { averageYield: 35.0, trend: 'stable', variability: 0.15 }
    },
    
    // HARYANA - High productivity state
    'haryana': {
      'Rice': { averageYield: 3.8, trend: 'stable', variability: 0.09 },
      'Wheat': { averageYield: 4.2, trend: 'increasing', variability: 0.07 },
      'Maize': { averageYield: 3.0, trend: 'stable', variability: 0.11 },
      'Cotton': { averageYield: 0.5, trend: 'stable', variability: 0.18 },
      'Sugarcane': { averageYield: 75.0, trend: 'stable', variability: 0.13 },
      'Mustard': { averageYield: 1.6, trend: 'increasing', variability: 0.12 },
      'Sunflower': { averageYield: 1.3, trend: 'stable', variability: 0.14 },
      'Bajra': { averageYield: 2.2, trend: 'stable', variability: 0.16 },
      'Jowar': { averageYield: 1.8, trend: 'stable', variability: 0.18 }
    },
    
    // UTTAR PRADESH - Largest agricultural state
    'uttar_pradesh': {
      'Rice': { averageYield: 2.8, trend: 'increasing', variability: 0.12 },
      'Wheat': { averageYield: 3.2, trend: 'increasing', variability: 0.10 },
      'Maize': { averageYield: 2.5, trend: 'stable', variability: 0.15 },
      'Sugarcane': { averageYield: 70.0, trend: 'stable', variability: 0.14 },
      'Potato': { averageYield: 22.0, trend: 'increasing', variability: 0.12 },
      'Mustard': { averageYield: 1.2, trend: 'increasing', variability: 0.15 },
      'Lentil': { averageYield: 0.9, trend: 'stable', variability: 0.20 },
      'Chickpea': { averageYield: 1.1, trend: 'increasing', variability: 0.18 },
      'Mango': { averageYield: 8.0, trend: 'stable', variability: 0.20 }
    },
    
    // MAHARASHTRA - Diverse crops
    'maharashtra': {
      'Rice': { averageYield: 2.2, trend: 'stable', variability: 0.18 },
      'Wheat': { averageYield: 2.8, trend: 'increasing', variability: 0.15 },
      'Maize': { averageYield: 2.8, trend: 'increasing', variability: 0.14 },
      'Sugarcane': { averageYield: 85.0, trend: 'stable', variability: 0.10 },
      'Cotton': { averageYield: 0.4, trend: 'stable', variability: 0.25 },
      'Soybean': { averageYield: 1.8, trend: 'increasing', variability: 0.16 },
      'Turmeric': { averageYield: 8.0, trend: 'stable', variability: 0.20 },
      'Grapes': { averageYield: 15.0, trend: 'increasing', variability: 0.15 },
      'Onion': { averageYield: 18.0, trend: 'stable', variability: 0.22 }
    },
    
    // KARNATAKA - Southern state
    'karnataka': {
      'Rice': { averageYield: 2.5, trend: 'stable', variability: 0.16 },
      'Ragi': { averageYield: 1.8, trend: 'stable', variability: 0.20 },
      'Jowar': { averageYield: 1.5, trend: 'stable', variability: 0.22 },
      'Maize': { averageYield: 2.2, trend: 'increasing', variability: 0.18 },
      'Sugarcane': { averageYield: 90.0, trend: 'stable', variability: 0.12 },
      'Cotton': { averageYield: 0.5, trend: 'stable', variability: 0.20 },
      'Groundnut': { averageYield: 1.5, trend: 'stable', variability: 0.18 },
      'Sunflower': { averageYield: 1.2, trend: 'increasing', variability: 0.16 },
      'Coffee': { averageYield: 0.8, trend: 'stable', variability: 0.25 }
    },
    
    // TAMIL NADU - Southern state
    'tamil_nadu': {
      'Rice': { averageYield: 3.2, trend: 'stable', variability: 0.12 },
      'Sugarcane': { averageYield: 95.0, trend: 'stable', variability: 0.10 },
      'Cotton': { averageYield: 0.6, trend: 'stable', variability: 0.18 },
      'Groundnut': { averageYield: 1.8, trend: 'stable', variability: 0.16 },
      'Sunflower': { averageYield: 1.4, trend: 'increasing', variability: 0.14 },
      'Turmeric': { averageYield: 9.0, trend: 'stable', variability: 0.18 },
      'Coconut': { averageYield: 12.0, trend: 'stable', variability: 0.15 },
      'Banana': { averageYield: 35.0, trend: 'increasing', variability: 0.12 }
    },
    
    // GUJARAT - Western state
    'gujarat': {
      'Wheat': { averageYield: 3.5, trend: 'increasing', variability: 0.12 },
      'Cotton': { averageYield: 0.5, trend: 'stable', variability: 0.20 },
      'Groundnut': { averageYield: 2.0, trend: 'stable', variability: 0.15 },
      'Sugarcane': { averageYield: 80.0, trend: 'stable', variability: 0.13 },
      'Mustard': { averageYield: 1.4, trend: 'increasing', variability: 0.14 },
      'Cumin': { averageYield: 0.8, trend: 'stable', variability: 0.25 },
      'Castor': { averageYield: 1.2, trend: 'stable', variability: 0.18 },
      'Bajra': { averageYield: 2.5, trend: 'stable', variability: 0.16 }
    },
    
    // RAJASTHAN - Arid state
    'rajasthan': {
      'Wheat': { averageYield: 2.8, trend: 'increasing', variability: 0.18 },
      'Mustard': { averageYield: 1.6, trend: 'increasing', variability: 0.16 },
      'Bajra': { averageYield: 1.8, trend: 'stable', variability: 0.22 },
      'Jowar': { averageYield: 1.2, trend: 'stable', variability: 0.25 },
      'Cotton': { averageYield: 0.4, trend: 'stable', variability: 0.28 },
      'Cumin': { averageYield: 0.6, trend: 'stable', variability: 0.30 },
      'Coriander': { averageYield: 1.0, trend: 'stable', variability: 0.25 },
      'Fenugreek': { averageYield: 0.8, trend: 'stable', variability: 0.28 }
    },
    
    // BIHAR - Eastern state
    'bihar': {
      'Rice': { averageYield: 2.2, trend: 'increasing', variability: 0.15 },
      'Wheat': { averageYield: 2.5, trend: 'increasing', variability: 0.14 },
      'Maize': { averageYield: 2.8, trend: 'increasing', variability: 0.12 },
      'Sugarcane': { averageYield: 65.0, trend: 'stable', variability: 0.16 },
      'Lentil': { averageYield: 0.8, trend: 'stable', variability: 0.20 },
      'Chickpea': { averageYield: 1.0, trend: 'increasing', variability: 0.18 },
      'Potato': { averageYield: 20.0, trend: 'increasing', variability: 0.15 },
      'Litchi': { averageYield: 6.0, trend: 'stable', variability: 0.25 }
    },
    
    // WEST BENGAL - Eastern state
    'west_bengal': {
      'Rice': { averageYield: 2.8, trend: 'stable', variability: 0.14 },
      'Wheat': { averageYield: 2.2, trend: 'increasing', variability: 0.16 },
      'Maize': { averageYield: 2.0, trend: 'stable', variability: 0.18 },
      'Jute': { averageYield: 2.5, trend: 'stable', variability: 0.20 },
      'Potato': { averageYield: 18.0, trend: 'stable', variability: 0.18 },
      'Mustard': { averageYield: 1.0, trend: 'stable', variability: 0.20 },
      'Sugarcane': { averageYield: 70.0, trend: 'stable', variability: 0.15 },
      'Tea': { averageYield: 1.8, trend: 'stable', variability: 0.22 }
    },
    
    // MADHYA PRADESH - Central state
    'madhya_pradesh': {
      'Wheat': { averageYield: 2.8, trend: 'increasing', variability: 0.14 },
      'Rice': { averageYield: 2.0, trend: 'stable', variability: 0.18 },
      'Soybean': { averageYield: 1.2, trend: 'increasing', variability: 0.20 },
      'Maize': { averageYield: 2.5, trend: 'increasing', variability: 0.16 },
      'Chickpea': { averageYield: 1.1, trend: 'increasing', variability: 0.18 },
      'Lentil': { averageYield: 0.9, trend: 'stable', variability: 0.22 },
      'Mustard': { averageYield: 1.3, trend: 'increasing', variability: 0.16 },
      'Sugarcane': { averageYield: 75.0, trend: 'stable', variability: 0.14 }
    },
    
    // ANDHRA PRADESH - Southern state
    'andhra_pradesh': {
      'Rice': { averageYield: 3.5, trend: 'stable', variability: 0.12 },
      'Sugarcane': { averageYield: 85.0, trend: 'stable', variability: 0.11 },
      'Cotton': { averageYield: 0.5, trend: 'stable', variability: 0.20 },
      'Groundnut': { averageYield: 1.6, trend: 'stable', variability: 0.18 },
      'Chilli': { averageYield: 2.5, trend: 'stable', variability: 0.22 },
      'Turmeric': { averageYield: 8.5, trend: 'stable', variability: 0.18 },
      'Tobacco': { averageYield: 1.8, trend: 'stable', variability: 0.25 },
      'Mango': { averageYield: 7.0, trend: 'stable', variability: 0.20 }
    },
    
    // TELANGANA - New state
    'telangana': {
      'Rice': { averageYield: 2.8, trend: 'stable', variability: 0.16 },
      'Cotton': { averageYield: 0.4, trend: 'stable', variability: 0.22 },
      'Maize': { averageYield: 2.2, trend: 'increasing', variability: 0.18 },
      'Sugarcane': { averageYield: 80.0, trend: 'stable', variability: 0.13 },
      'Groundnut': { averageYield: 1.4, trend: 'stable', variability: 0.20 },
      'Chilli': { averageYield: 2.0, trend: 'stable', variability: 0.25 },
      'Turmeric': { averageYield: 7.5, trend: 'stable', variability: 0.20 }
    },
    
    // ODISHA - Original state (keeping existing data)
    'odisha': {
      'Rice': { averageYield: 1.55, plateauYield: 1.54, coastalYield: 1.58, trend: 'increasing', variability: 0.12 },
      'Wheat': { averageYield: 2.2, trend: 'stable', variability: 0.18 },
      'Maize': { averageYield: 2.8, trend: 'stable', variability: 0.15 },
      'Ragi': { averageYield: 1.2, trend: 'stable', variability: 0.18 },
      'Black Gram': { averageYield: 0.6, trend: 'stable', variability: 0.25 },
      'Green Gram': { averageYield: 0.7, trend: 'increasing', variability: 0.22 },
      'Horse Gram': { averageYield: 0.5, trend: 'stable', variability: 0.28 },
      'Bengal Gram': { averageYield: 0.8, trend: 'increasing', variability: 0.20 },
      'Pigeon Pea': { averageYield: 0.9, trend: 'stable', variability: 0.23 },
      'Lentil': { averageYield: 0.7, trend: 'increasing', variability: 0.25 },
      'Pea': { averageYield: 1.1, trend: 'stable', variability: 0.20 },
      'Groundnut': { averageYield: 1.2, trend: 'stable', variability: 0.18 },
      'Mustard': { averageYield: 0.8, trend: 'increasing', variability: 0.22 },
      'Sesame': { averageYield: 0.4, trend: 'stable', variability: 0.30 },
      'Sunflower': { averageYield: 1.0, trend: 'increasing', variability: 0.25 },
      'Niger': { averageYield: 0.3, trend: 'decreasing', variability: 0.35 },
      'Castor': { averageYield: 0.6, trend: 'stable', variability: 0.28 },
      'Vegetables': { averageYield: 8.5, trend: 'increasing', variability: 0.15 },
      'Tomato': { averageYield: 25.0, trend: 'increasing', variability: 0.20 },
      'Potato': { averageYield: 15.0, trend: 'stable', variability: 0.18 },
      'Onion': { averageYield: 12.0, trend: 'stable', variability: 0.22 },
      'Chilli': { averageYield: 8.0, trend: 'increasing', variability: 0.25 },
      'Brinjal': { averageYield: 18.0, trend: 'stable', variability: 0.20 },
      'Cotton': { averageYield: 0.4, trend: 'stable', variability: 0.30 },
      'Mesta': { averageYield: 2.5, trend: 'stable', variability: 0.20 },
      'Sweet Potato': { averageYield: 12.0, trend: 'stable', variability: 0.18 }
    }
  }
  
  const stateData = stateYieldData[state] || stateYieldData['odisha']
  return stateData[crop] || null
}

// State detection function
function getStateFromLocation(location) {
  const stateMapping = {
    // Punjab
    'punjab': 'punjab', 'amritsar': 'punjab', 'ludhiana': 'punjab', 'jalandhar': 'punjab',
    'patiala': 'punjab', 'bathinda': 'punjab', 'mohali': 'punjab', 'firozpur': 'punjab',
    
    // Haryana
    'haryana': 'haryana', 'gurgaon': 'haryana', 'faridabad': 'haryana', 'panipat': 'haryana',
    'karnal': 'haryana', 'hisar': 'haryana', 'rohtak': 'haryana', 'sonipat': 'haryana',
    
    // Uttar Pradesh
    'uttar pradesh': 'uttar_pradesh', 'uttar pradesh': 'uttar_pradesh', 'lucknow': 'uttar_pradesh',
    'kanpur': 'uttar_pradesh', 'agra': 'uttar_pradesh', 'varanasi': 'uttar_pradesh', 'meerut': 'uttar_pradesh',
    'allahabad': 'uttar_pradesh', 'bareilly': 'uttar_pradesh', 'ghaziabad': 'uttar_pradesh',
    
    // Maharashtra
    'maharashtra': 'maharashtra', 'mumbai': 'maharashtra', 'pune': 'maharashtra', 'nagpur': 'maharashtra',
    'nashik': 'maharashtra', 'aurangabad': 'maharashtra', 'solapur': 'maharashtra', 'kolhapur': 'maharashtra',
    'amravati': 'maharashtra', 'nanded': 'maharashtra', 'jalgaon': 'maharashtra',
    
    // Karnataka
    'karnataka': 'karnataka', 'bangalore': 'karnataka', 'mysore': 'karnataka', 'hubli': 'karnataka',
    'mangalore': 'karnataka', 'belgaum': 'karnataka', 'gulbarga': 'karnataka', 'davangere': 'karnataka',
    'bellary': 'karnataka', 'bijapur': 'karnataka', 'shimoga': 'karnataka',
    
    // Tamil Nadu
    'tamil nadu': 'tamil_nadu', 'tamilnadu': 'tamil_nadu', 'chennai': 'tamil_nadu', 'coimbatore': 'tamil_nadu',
    'madurai': 'tamil_nadu', 'tiruchirapalli': 'tamil_nadu', 'salem': 'tamil_nadu', 'tirunelveli': 'tamil_nadu',
    'erode': 'tamil_nadu', 'vellore': 'tamil_nadu', 'tuticorin': 'tamil_nadu',
    
    // Gujarat
    'gujarat': 'gujarat', 'ahmedabad': 'gujarat', 'surat': 'gujarat', 'vadodara': 'gujarat',
    'rajkot': 'gujarat', 'bhavnagar': 'gujarat', 'jamnagar': 'gujarat', 'gandhinagar': 'gujarat',
    'anand': 'gujarat', 'nadiad': 'gujarat', 'mehsana': 'gujarat',
    
    // Rajasthan
    'rajasthan': 'rajasthan', 'jaipur': 'rajasthan', 'jodhpur': 'rajasthan', 'kota': 'rajasthan',
    'bikaner': 'rajasthan', 'ajmer': 'rajasthan', 'udaipur': 'rajasthan', 'bharatpur': 'rajasthan',
    'alwar': 'rajasthan', 'sikar': 'rajasthan', 'pali': 'rajasthan',
    
    // Bihar
    'bihar': 'bihar', 'patna': 'bihar', 'gaya': 'bihar', 'bhagalpur': 'bihar', 'muzaffarpur': 'bihar',
    'darbhanga': 'bihar', 'purnia': 'bihar', 'arrah': 'bihar', 'begusarai': 'bihar', 'katihar': 'bihar',
    
    // West Bengal
    'west bengal': 'west_bengal', 'westbengal': 'west_bengal', 'kolkata': 'west_bengal', 'howrah': 'west_bengal',
    'durgapur': 'west_bengal', 'asansol': 'west_bengal', 'siliguri': 'west_bengal', 'bardhaman': 'west_bengal',
    'malda': 'west_bengal', 'baharampur': 'west_bengal', 'habra': 'west_bengal',
    
    // Madhya Pradesh
    'madhya pradesh': 'madhya_pradesh', 'madhyapradesh': 'madhya_pradesh', 'bhopal': 'madhya_pradesh',
    'indore': 'madhya_pradesh', 'gwalior': 'madhya_pradesh', 'jabalpur': 'madhya_pradesh', 'ujjain': 'madhya_pradesh',
    'sagar': 'madhya_pradesh', 'dewas': 'madhya_pradesh', 'satna': 'madhya_pradesh', 'ratlam': 'madhya_pradesh',
    
    // Andhra Pradesh
    'andhra pradesh': 'andhra_pradesh', 'andhrapradesh': 'andhra_pradesh', 'hyderabad': 'andhra_pradesh',
    'visakhapatnam': 'andhra_pradesh', 'vijayawada': 'andhra_pradesh', 'guntur': 'andhra_pradesh',
    'nellore': 'andhra_pradesh', 'kurnool': 'andhra_pradesh', 'tirupati': 'andhra_pradesh', 'kadapa': 'andhra_pradesh',
    
    // Telangana
    'telangana': 'telangana', 'warangal': 'telangana', 'nizamabad': 'telangana', 'khammam': 'telangana',
    'karimnagar': 'telangana', 'ramagundam': 'telangana', 'mahbubnagar': 'telangana', 'nalgonda': 'telangana',
    
    // Odisha (keeping existing mapping)
    'odisha': 'odisha', 'orissa': 'odisha', 'bhubaneswar': 'odisha', 'cuttack': 'odisha', 'puri': 'odisha',
    'rourkela': 'odisha', 'berhampur': 'odisha', 'sambalpur': 'odisha', 'balasore': 'odisha', 'bhadrak': 'odisha',
    'angul': 'odisha', 'dhenkanal': 'odisha', 'kendujhar': 'odisha', 'mayurbhanj': 'odisha', 'balangir': 'odisha',
    'bargarh': 'odisha', 'kalahandi': 'odisha', 'nuapada': 'odisha', 'koraput': 'odisha', 'malkangiri': 'odisha',
    'nabarangpur': 'odisha', 'rayagada': 'odisha', 'gajapati': 'odisha', 'ganjam': 'odisha', 'kandhamal': 'odisha',
    'boudh': 'odisha', 'subarnapur': 'odisha', 'sundargarh': 'odisha', 'deogarh': 'odisha', 'jharsuguda': 'odisha',
    'jajpur': 'odisha', 'jagatsinghpur': 'odisha', 'kendrapara': 'odisha', 'khordha': 'odisha', 'nayagarh': 'odisha'
  }
  
  const locationLower = location.toLowerCase()
  for (const [key, state] of Object.entries(stateMapping)) {
    if (locationLower.includes(key)) {
      return state
    }
  }
  
  return 'odisha' // Default fallback
}

// Odisha-specific historical yield data based on RKB Odisha and government statistics
function getOdishaHistoricalYieldData(crop, location) {
  const odishaYieldData = {
    // Cereals (tons per hectare)
    "Rice": {
      averageYield: 1.55, // Average of Plateau (1.54) and Coastal (1.58) regions
      plateauYield: 1.54,
      coastalYield: 1.58,
      trend: "increasing",
      variability: 0.12
    },
    "Maize": {
      averageYield: 2.8,
      trend: "stable",
      variability: 0.15
    },
    "Ragi": {
      averageYield: 1.2,
      trend: "stable",
      variability: 0.18
    },
    "Minor Millets": {
      averageYield: 0.8,
      trend: "decreasing",
      variability: 0.20
    },
    
    // Pulses (tons per hectare)
    "Black Gram": {
      averageYield: 0.6,
      trend: "stable",
      variability: 0.25
    },
    "Green Gram": {
      averageYield: 0.7,
      trend: "increasing",
      variability: 0.22
    },
    "Horse Gram": {
      averageYield: 0.5,
      trend: "stable",
      variability: 0.28
    },
    "Bengal Gram": {
      averageYield: 0.8,
      trend: "increasing",
      variability: 0.20
    },
    "Pigeon Pea": {
      averageYield: 0.9,
      trend: "stable",
      variability: 0.23
    },
    "Lentil": {
      averageYield: 0.7,
      trend: "increasing",
      variability: 0.25
    },
    "Pea": {
      averageYield: 1.1,
      trend: "stable",
      variability: 0.20
    },
    
    // Oilseeds (tons per hectare)
    "Groundnut": {
      averageYield: 1.2,
      trend: "stable",
      variability: 0.18
    },
    "Mustard": {
      averageYield: 0.8,
      trend: "increasing",
      variability: 0.22
    },
    "Sesame": {
      averageYield: 0.4,
      trend: "stable",
      variability: 0.30
    },
    "Sunflower": {
      averageYield: 1.0,
      trend: "increasing",
      variability: 0.25
    },
    "Niger": {
      averageYield: 0.3,
      trend: "decreasing",
      variability: 0.35
    },
    "Castor": {
      averageYield: 0.6,
      trend: "stable",
      variability: 0.28
    },
    
    // Vegetables (tons per hectare)
    "Vegetables": {
      averageYield: 8.5,
      trend: "increasing",
      variability: 0.15
    },
    
    // Other crops
    "Cotton": {
      averageYield: 0.4,
      trend: "stable",
      variability: 0.30
    },
    "Mesta": {
      averageYield: 2.5,
      trend: "stable",
      variability: 0.20
    },
    "Sweet Potato": {
      averageYield: 12.0,
      trend: "stable",
      variability: 0.18
    }
  }
  
  return odishaYieldData[crop] || null
}

// Calculate purely dynamic soil health score based on crop-location-month interrelation
function calculateOdishaSoilHealthScore(soilData, location, crop, month) {
  const state = getStateFromLocation(location)
  const soilType = getStateSoilType(state, location)
  const season = getOdishaSeason(month)
  
  // Get crop-specific soil requirements
  const cropRequirements = getCropSpecificSoilRequirements(crop, season)
  
  let score = 0
  let riskFactors = []
  let recommendations = []
  
  // pH factor - crop and season specific
  const phScore = calculatePHScore(soilData.ph, cropRequirements.ph, crop, season)
  score += phScore.points
  if (phScore.risk) riskFactors.push(phScore.risk)
  if (phScore.recommendation) recommendations.push(phScore.recommendation)
  
  // Moisture factor - crop and season specific
  const moistureScore = calculateMoistureScore(soilData.moisture, cropRequirements.moisture, crop, season, month)
  score += moistureScore.points
  if (moistureScore.risk) riskFactors.push(moistureScore.risk)
  if (moistureScore.recommendation) recommendations.push(moistureScore.recommendation)
  
  // Nutrient factors - crop specific
  const nitrogenScore = calculateNutrientScore(soilData.nitrogen, cropRequirements.nitrogen, 'nitrogen', crop, season)
  score += nitrogenScore.points
  if (nitrogenScore.risk) riskFactors.push(nitrogenScore.risk)
  if (nitrogenScore.recommendation) recommendations.push(nitrogenScore.recommendation)
  
  const phosphorusScore = calculateNutrientScore(soilData.phosphorus, cropRequirements.phosphorus, 'phosphorus', crop, season)
  score += phosphorusScore.points
  if (phosphorusScore.risk) riskFactors.push(phosphorusScore.risk)
  if (phosphorusScore.recommendation) recommendations.push(phosphorusScore.recommendation)
  
  const potassiumScore = calculateNutrientScore(soilData.potassium, cropRequirements.potassium, 'potassium', crop, season)
  score += potassiumScore.points
  if (potassiumScore.risk) riskFactors.push(potassiumScore.risk)
  if (potassiumScore.recommendation) recommendations.push(potassiumScore.recommendation)
  
  // Organic matter - crop and soil type specific
  const organicScore = calculateOrganicMatterScore(soilData.organicMatter, cropRequirements.organicMatter, crop, soilType)
  score += organicScore.points
  if (organicScore.risk) riskFactors.push(organicScore.risk)
  if (organicScore.recommendation) recommendations.push(organicScore.recommendation)
  
  // Apply minimal penalty for risk factors to keep scores realistic
  if (riskFactors.length > 0) {
    // Apply very light penalty for risk factors (2 points per risk)
    const riskPenalty = Math.min(riskFactors.length * 2, 10) // Max 10 point penalty
    score = Math.max(20, score - riskPenalty) // Ensure minimum score of 20
  }
  
  // Ensure score is within reasonable range (20-100)
  score = Math.max(20, Math.min(100, score))
  
  // Apply bonuses regardless of risk factors (but reduced if risks exist)
    const soilTypeFactor = getSoilTypeHealthFactor(soilType)
    const locationFactor = getLocationSoilFactor(state, location)
    const seasonFactor = getSeasonSoilFactor(season, crop)
    
  // Reduce bonus multiplier if there are risk factors
  const bonusMultiplier = riskFactors.length > 0 ? 0.8 : 1.0
  score = Math.round(score * soilTypeFactor * locationFactor * seasonFactor * bonusMultiplier)
    
    // Crop-specific soil health bonus/penalty
    const cropSoilBonus = getCropSoilBonus(crop, soilType, season)
    score += cropSoilBonus
  
  return {
    score: Math.min(100, Math.max(0, score)),
    riskFactors,
    recommendations,
    breakdown: {
      ph: phScore,
      moisture: moistureScore,
      nitrogen: nitrogenScore,
      phosphorus: phosphorusScore,
      potassium: potassiumScore,
      organicMatter: organicScore
    }
  }
}

// Get crop-specific soil requirements based on season
function getCropSpecificSoilRequirements(crop, season) {
  // Ensure crop is defined and has a fallback
  const cropType = crop || "Rice"
  
  // Normalize crop name - handle variations like "Maize (Corn)" -> "maize"
  const normalizedCrop = cropType.split(" ")[0].split("(")[0].toLowerCase()
  
  const cropData = {
    'rice': {
      ph: { optimal: 6.0, min: 5.5, max: 7.0 },
      moisture: { optimal: 70, min: 50, max: 85 },
      nitrogen: { optimal: 25, min: 20, max: 35 },
      phosphorus: { optimal: 18, min: 15, max: 25 },
      potassium: { optimal: 180, min: 150, max: 250 },
      organicMatter: { optimal: 3.5, min: 2.5, max: 5.0 }
    },
    'wheat': {
      ph: { optimal: 6.5, min: 6.0, max: 7.5 },
      moisture: { optimal: 60, min: 40, max: 75 },
      nitrogen: { optimal: 22, min: 18, max: 30 },
      phosphorus: { optimal: 16, min: 12, max: 22 },
      potassium: { optimal: 160, min: 120, max: 200 },
      organicMatter: { optimal: 3.0, min: 2.0, max: 4.0 }
    },
    'maize': {
      ph: { optimal: 6.2, min: 5.8, max: 7.0 },
      moisture: { optimal: 65, min: 45, max: 80 },
      nitrogen: { optimal: 28, min: 22, max: 35 },
      phosphorus: { optimal: 20, min: 15, max: 28 },
      potassium: { optimal: 200, min: 160, max: 280 },
      organicMatter: { optimal: 3.2, min: 2.2, max: 4.5 }
    },
    'cotton': {
      ph: { optimal: 6.8, min: 6.0, max: 8.0 },
      moisture: { optimal: 55, min: 35, max: 70 },
      nitrogen: { optimal: 20, min: 15, max: 28 },
      phosphorus: { optimal: 14, min: 10, max: 20 },
      potassium: { optimal: 140, min: 100, max: 180 },
      organicMatter: { optimal: 2.8, min: 1.8, max: 3.8 }
    },
    'sugarcane': {
      ph: { optimal: 6.5, min: 6.0, max: 7.5 },
      moisture: { optimal: 75, min: 60, max: 90 },
      nitrogen: { optimal: 30, min: 25, max: 40 },
      phosphorus: { optimal: 22, min: 18, max: 30 },
      potassium: { optimal: 220, min: 180, max: 300 },
      organicMatter: { optimal: 4.0, min: 3.0, max: 5.5 }
    },
    'turmeric': {
      ph: { optimal: 5.5, min: 5.0, max: 6.5 },
      moisture: { optimal: 60, min: 45, max: 75 },
      nitrogen: { optimal: 18, min: 15, max: 25 },
      phosphorus: { optimal: 12, min: 8, max: 18 },
      potassium: { optimal: 120, min: 80, max: 160 },
      organicMatter: { optimal: 3.5, min: 2.5, max: 4.5 }
    },
    'chilli': {
      ph: { optimal: 6.0, min: 5.5, max: 7.0 },
      moisture: { optimal: 55, min: 40, max: 70 },
      nitrogen: { optimal: 16, min: 12, max: 22 },
      phosphorus: { optimal: 10, min: 8, max: 15 },
      potassium: { optimal: 100, min: 80, max: 140 },
      organicMatter: { optimal: 2.5, min: 1.8, max: 3.5 }
    },
    'tomato': {
      ph: { optimal: 6.5, min: 6.0, max: 7.0 },
      moisture: { optimal: 70, min: 50, max: 85 },
      nitrogen: { optimal: 25, min: 20, max: 35 },
      phosphorus: { optimal: 18, min: 15, max: 25 },
      potassium: { optimal: 180, min: 150, max: 250 },
      organicMatter: { optimal: 3.5, min: 2.5, max: 4.5 }
    },
    'potato': {
      ph: { optimal: 6.0, min: 5.5, max: 6.5 },
      moisture: { optimal: 65, min: 50, max: 80 },
      nitrogen: { optimal: 20, min: 15, max: 30 },
      phosphorus: { optimal: 15, min: 12, max: 20 },
      potassium: { optimal: 160, min: 120, max: 200 },
      organicMatter: { optimal: 3.0, min: 2.0, max: 4.0 }
    },
    'onion': {
      ph: { optimal: 6.5, min: 6.0, max: 7.5 },
      moisture: { optimal: 60, min: 45, max: 75 },
      nitrogen: { optimal: 18, min: 15, max: 25 },
      phosphorus: { optimal: 12, min: 10, max: 18 },
      potassium: { optimal: 120, min: 100, max: 160 },
      organicMatter: { optimal: 2.8, min: 2.0, max: 3.8 }
    },
    'brinjal': {
      ph: { optimal: 6.5, min: 6.0, max: 7.0 },
      moisture: { optimal: 65, min: 50, max: 80 },
      nitrogen: { optimal: 22, min: 18, max: 30 },
      phosphorus: { optimal: 16, min: 12, max: 22 },
      potassium: { optimal: 150, min: 120, max: 200 },
      organicMatter: { optimal: 3.2, min: 2.5, max: 4.2 }
    }
  }
  
  const baseRequirements = cropData[normalizedCrop] || cropData['rice']
  
  // Season-specific adjustments
  if (season === 'kharif') {
    // Monsoon crops need more moisture tolerance
    return {
      ...baseRequirements,
      moisture: { ...baseRequirements.moisture, min: baseRequirements.moisture.min - 10 }
    }
  } else if (season === 'rabi') {
    // Winter crops need less moisture, more cold tolerance
    return {
      ...baseRequirements,
      moisture: { ...baseRequirements.moisture, max: baseRequirements.moisture.max - 10 }
    }
  }
  
  return baseRequirements
}

// Calculate pH score based on crop requirements
function calculatePHScore(actualPH, requirements, crop, season) {
  const { optimal, min, max } = requirements
  let points = 0
  let risk = null
  let recommendation = null
  
  if (actualPH >= min && actualPH <= max) {
    if (actualPH >= optimal - 0.5 && actualPH <= optimal + 0.5) {
      points = 25 // Perfect range
    } else if (actualPH >= optimal - 1.0 && actualPH <= optimal + 1.0) {
      points = 20 // Good range
    } else {
      points = 15 // Acceptable range
    }
  } else {
    points = 0 // Poor range - no points for suboptimal pH
    if (actualPH < min) {
      risk = `pH too acidic (${actualPH}) for ${crop} in ${season} season`
      recommendation = `Apply lime to raise pH to optimal range (${min}-${max})`
    } else if (actualPH > max) {
      risk = `pH too alkaline (${actualPH}) for ${crop} in ${season} season`
      recommendation = `Apply sulfur or organic matter to lower pH to optimal range (${min}-${max})`
    }
  }
  
  return { points, risk, recommendation }
}

// Calculate moisture score based on crop requirements
function calculateMoistureScore(actualMoisture, requirements, crop, season, month) {
  const { optimal, min, max } = requirements
  let points = 0
  let risk = null
  let recommendation = null
  
  // Season-specific moisture adjustments
  let adjustedMin = min
  let adjustedMax = max
  
  if (season === 'kharif' && ['june', 'july', 'august', 'september'].includes(month.toLowerCase())) {
    // Monsoon season - more moisture tolerance
    adjustedMin = min - 10
    adjustedMax = max + 10
  } else if (season === 'rabi' && ['november', 'december', 'january', 'february'].includes(month.toLowerCase())) {
    // Winter season - less moisture needed
    adjustedMax = max - 10
  }
  
  if (actualMoisture >= adjustedMin && actualMoisture <= adjustedMax) {
    if (actualMoisture >= optimal - 10 && actualMoisture <= optimal + 10) {
      points = 25 // Perfect range
    } else {
      points = 20 // Good range
    }
  } else {
    // Give partial credit based on how close the moisture is to optimal range
    if (actualMoisture < adjustedMin) {
      // Calculate partial score for dry soil (more lenient)
      const drynessRatio = actualMoisture / adjustedMin
      points = Math.max(8, Math.round(25 * drynessRatio * 0.7)) // At least 8 points, up to 70% of max
      
      risk = `Soil too dry (${actualMoisture}%) for ${crop} in ${season} season`
      recommendation = `Increase irrigation frequency or improve water retention`
    } else if (actualMoisture > adjustedMax) {
      // Calculate partial score for wet soil (still better than too dry, more lenient)
      const wetnessRatio = adjustedMax / actualMoisture
      points = Math.max(10, Math.round(25 * wetnessRatio * 0.8)) // At least 10 points, up to 80% of max
      
      risk = `Soil too wet (${actualMoisture}%) for ${crop} in ${season} season`
      recommendation = `Improve drainage or reduce irrigation frequency`
    }
  }
  
  return { points, risk, recommendation }
}

// Calculate nutrient score based on crop requirements
function calculateNutrientScore(actualValue, requirements, nutrient, crop, season) {
  const { optimal, min, max } = requirements
  let points = 0
  let risk = null
  let recommendation = null
  
  if (actualValue >= min && actualValue <= max) {
    if (actualValue >= optimal - (optimal * 0.2) && actualValue <= optimal + (optimal * 0.2)) {
      points = nutrient === 'nitrogen' ? 20 : nutrient === 'phosphorus' ? 15 : 15 // Perfect range
    } else {
      points = nutrient === 'nitrogen' ? 15 : nutrient === 'phosphorus' ? 12 : 12 // Good range
    }
  } else {
    // Give partial credit based on how close the value is to optimal range
    if (actualValue < min) {
      // Calculate partial score based on how close to minimum (more lenient)
      const deficiencyRatio = actualValue / min
      const maxPoints = nutrient === 'nitrogen' ? 20 : nutrient === 'phosphorus' ? 15 : 15
      points = Math.max(5, Math.round(maxPoints * deficiencyRatio * 0.6)) // At least 5 points, up to 60% of max
      
      risk = `${nutrient} deficiency (${actualValue} ppm) for ${crop} in ${season} season`
      recommendation = `Apply ${nutrient} fertilizer to reach optimal range (${min}-${max} ppm)`
    } else if (actualValue > max) {
      // Calculate partial score for excess (still better than deficiency, more lenient)
      const excessRatio = max / actualValue
      const maxPoints = nutrient === 'nitrogen' ? 20 : nutrient === 'phosphorus' ? 15 : 15
      points = Math.max(7, Math.round(maxPoints * excessRatio * 0.7)) // At least 7 points, up to 70% of max
      
      risk = `${nutrient} excess (${actualValue} ppm) for ${crop} in ${season} season`
      recommendation = `Reduce ${nutrient} fertilizer application or improve soil drainage`
    }
  }
  
  return { points, risk, recommendation }
}

// Calculate organic matter score
function calculateOrganicMatterScore(actualValue, requirements, crop, soilType) {
  const { optimal, min, max } = requirements
  let points = 0
  let risk = null
  let recommendation = null
  
  // Soil type specific adjustments
  let adjustedMin = min
  let adjustedMax = max
  
  if (soilType === 'lateritic' || soilType === 'red') {
    // These soils need more organic matter
    adjustedMin = min + 0.5
  } else if (soilType === 'alluvial') {
    // Alluvial soils are naturally rich
    adjustedMin = min - 0.5
  }
  
  if (actualValue >= adjustedMin && actualValue <= adjustedMax) {
    if (actualValue >= optimal - 0.5 && actualValue <= optimal + 0.5) {
      points = 25 // Perfect range
    } else {
      points = 20 // Good range
    }
  } else if (actualValue < adjustedMin) {
    points = 5 // Low organic matter - minimal points
      risk = `Low organic matter (${actualValue}%) for ${crop} in ${soilType} soil`
      recommendation = `Add compost, manure, or green manure to improve organic matter content`
    } else if (actualValue > adjustedMax) {
    // Only consider it excessive if it's significantly above max (more than 1% above)
    if (actualValue > adjustedMax + 1.0) {
      points = 5 // Excessive organic matter - minimal points
      risk = `Excessive organic matter (${actualValue}%) for ${crop}`
      recommendation = `Balance organic matter with mineral fertilizers`
    } else {
      points = 15 // Slightly high but acceptable
    }
  }
  
  return { points, risk, recommendation }
}

// Get location-specific soil factor
function getLocationSoilFactor(state, location) {
  const factors = {
    'punjab': 1.05, 'haryana': 1.05, 'uttar_pradesh': 1.02,
    'maharashtra': 1.0, 'karnataka': 0.98, 'tamil_nadu': 0.95,
    'andhra_pradesh': 0.97, 'telangana': 0.96, 'kerala': 1.0,
    'odisha': 0.92, 'west_bengal': 0.95, 'bihar': 0.98,
    'rajasthan': 0.88, 'gujarat': 0.90, 'madhya_pradesh': 0.95,
    'chhattisgarh': 0.93, 'jharkhand': 0.90, 'assam': 0.97
  }
  return factors[state] || 1.0
}

// Get season-specific soil factor
function getSeasonSoilFactor(season, crop) {
  const factors = {
    'kharif': 1.0, // Monsoon season
    'rabi': 1.02,  // Winter season - better soil conditions
    'zaid': 0.98   // Summer season - more stress
  }
  return factors[season] || 1.0
}

// Get crop-specific soil bonus
function getCropSoilBonus(crop, soilType, season) {
  const bonuses = {
    'rice': soilType === 'alluvial' ? 5 : soilType === 'lateritic' ? -3 : 0,
    'wheat': soilType === 'alluvial' ? 3 : soilType === 'black' ? 2 : 0,
    'cotton': soilType === 'black' ? 4 : soilType === 'red' ? 2 : 0,
    'sugarcane': soilType === 'alluvial' ? 6 : soilType === 'black' ? 4 : 0,
    'turmeric': soilType === 'lateritic' ? 3 : soilType === 'red' ? 2 : 0
  }
  return bonuses[crop.toLowerCase()] || 0
}

// Calculate state-specific weather impact
function calculateOdishaWeatherImpact(weatherData, crop, month, location) {
  const state = getStateFromLocation(location)
  const agroClimaticZone = getStateClimateZone(state)
  const season = getOdishaSeason(month)
  
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
  const avgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity) || 50), 0) / weatherData.length
  
  // Crop-specific temperature requirements for Odisha
  const tempRequirements = {
    'rice': { optimal: 25, min: 20, max: 35 },
    'wheat': { optimal: 20, min: 15, max: 28 },
    'maize': { optimal: 25, min: 18, max: 32 },
    'ragi': { optimal: 22, min: 16, max: 30 },
    'black gram': { optimal: 24, min: 18, max: 32 },
    'green gram': { optimal: 26, min: 20, max: 34 },
    'horse gram': { optimal: 20, min: 15, max: 28 },
    'bengal gram': { optimal: 22, min: 16, max: 30 },
    'pigeon pea': { optimal: 24, min: 18, max: 32 },
    'lentil': { optimal: 20, min: 15, max: 28 },
    'pea': { optimal: 18, min: 12, max: 25 },
    'groundnut': { optimal: 26, min: 20, max: 34 },
    'mustard': { optimal: 20, min: 15, max: 28 },
    'sesame': { optimal: 28, min: 22, max: 36 },
    'sunflower': { optimal: 24, min: 18, max: 32 },
    'niger': { optimal: 22, min: 16, max: 30 },
    'castor': { optimal: 26, min: 20, max: 34 },
    'vegetables': { optimal: 22, min: 16, max: 30 },
    'cotton': { optimal: 28, min: 22, max: 36 },
    'mesta': { optimal: 24, min: 18, max: 32 },
    'sweet potato': { optimal: 24, min: 18, max: 32 }
  }
  
  const requirements = tempRequirements[crop.toLowerCase()] || { optimal: 22, min: 16, max: 30 }
  
  // Temperature factor
  let tempFactor = 1.0
  if (avgTemp < requirements.min || avgTemp > requirements.max) {
    tempFactor = 0.7
  } else if (avgTemp < requirements.optimal - 5 || avgTemp > requirements.optimal + 5) {
    tempFactor = 0.85
  }
  
  // Rainfall factor (critical for Odisha's monsoon-dependent agriculture)
  let rainfallFactor = 1.0
  if (season === 'kharif') {
    // Kharif season is monsoon-dependent
    if (rainyDays < 3) rainfallFactor = 0.6
    else if (rainyDays > 8) rainfallFactor = 0.9
  } else if (season === 'rabi') {
    // Rabi season needs moderate rainfall
    if (rainyDays < 1) rainfallFactor = 0.8
    else if (rainyDays > 4) rainfallFactor = 0.9
  }
  
  // Humidity factor
  let humidityFactor = 1.0
  if (avgHumidity < 40 || avgHumidity > 85) humidityFactor = 0.9
  
  // Agro-climatic zone factor
  const zoneFactor = getAgroClimaticZoneFactor(agroClimaticZone, crop)
  
  return tempFactor * rainfallFactor * humidityFactor * zoneFactor
}

// Calculate comprehensive seasonal factor for all crops
function calculateComprehensiveSeasonalFactor(crop, month) {
  const season = getOdishaSeason(month)
  
  const seasonalFactors = {
    // GRAINS & CEREALS
    'rice': { kharif: 1.2, rabi: 0.8, zaid: 0.6 },
    'wheat': { kharif: 0.7, rabi: 1.2, zaid: 0.5 },
    'maize': { kharif: 1.1, rabi: 0.9, zaid: 1.0 },
    'jowar': { kharif: 1.0, rabi: 0.8, zaid: 0.7 },
    'bajra': { kharif: 1.0, rabi: 0.7, zaid: 0.8 },
    'ragi': { kharif: 1.0, rabi: 0.8, zaid: 0.7 },
    'barley': { kharif: 0.6, rabi: 1.1, zaid: 0.5 },
    
    // PULSES
    'black gram': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    'green gram': { kharif: 1.1, rabi: 0.8, zaid: 0.9 },
    'horse gram': { kharif: 0.9, rabi: 1.1, zaid: 0.8 },
    'bengal gram': { kharif: 0.8, rabi: 1.2, zaid: 0.7 },
    'chickpea': { kharif: 0.8, rabi: 1.2, zaid: 0.7 },
    'pigeon pea': { kharif: 1.0, rabi: 0.8, zaid: 0.9 },
    'lentil': { kharif: 0.8, rabi: 1.1, zaid: 0.7 },
    'pea': { kharif: 0.7, rabi: 1.2, zaid: 0.6 },
    'soybean': { kharif: 1.1, rabi: 0.7, zaid: 0.8 },
    
    // OILSEEDS
    'groundnut': { kharif: 1.1, rabi: 0.8, zaid: 0.9 },
    'mustard': { kharif: 0.8, rabi: 1.2, zaid: 0.7 },
    'sesame': { kharif: 1.0, rabi: 0.9, zaid: 1.1 },
    'sunflower': { kharif: 1.0, rabi: 1.1, zaid: 0.9 },
    'niger': { kharif: 0.9, rabi: 1.0, zaid: 0.8 },
    'castor': { kharif: 1.0, rabi: 0.9, zaid: 1.0 },
    'linseed': { kharif: 0.8, rabi: 1.1, zaid: 0.7 },
    'safflower': { kharif: 0.9, rabi: 1.0, zaid: 0.8 },
    
    // COMMERCIAL CROPS
    'cotton': { kharif: 1.1, rabi: 0.7, zaid: 1.0 },
    'sugarcane': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial crop
    'jute': { kharif: 1.0, rabi: 0.6, zaid: 0.8 },
    'mesta': { kharif: 1.0, rabi: 0.8, zaid: 0.9 },
    'tobacco': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    
    // VEGETABLES
    'potato': { kharif: 0.8, rabi: 1.1, zaid: 0.9 },
    'tomato': { kharif: 0.9, rabi: 1.0, zaid: 1.1 },
    'onion': { kharif: 0.8, rabi: 1.1, zaid: 0.9 },
    'chilli': { kharif: 1.0, rabi: 0.9, zaid: 1.0 },
    'brinjal': { kharif: 0.9, rabi: 1.0, zaid: 1.0 },
    'okra': { kharif: 1.0, rabi: 0.8, zaid: 1.1 },
    'cucumber': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'bottle gourd': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'bitter gourd': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'watermelon': { kharif: 0.7, rabi: 0.8, zaid: 1.3 },
    'muskmelon': { kharif: 0.7, rabi: 0.8, zaid: 1.3 },
    'pumpkin': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'cauliflower': { kharif: 0.8, rabi: 1.2, zaid: 0.7 },
    'cabbage': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'carrot': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'radish': { kharif: 0.8, rabi: 1.0, zaid: 0.9 },
    'spinach': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'vegetables': { kharif: 0.9, rabi: 1.1, zaid: 1.0 },
    
    // TUBERS & ROOTS
    'sweet potato': { kharif: 1.0, rabi: 1.1, zaid: 0.9 },
    'cassava': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'yam': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    
    // SPICES & CONDIMENTS
    'turmeric': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    'ginger': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    'coriander': { kharif: 0.8, rabi: 1.1, zaid: 0.9 },
    'cumin': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'fenugreek': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'fennel': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'cardamom': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'pepper': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    
    // FRUITS
    'mango': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'banana': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'litchi': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'coconut': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'grapes': { kharif: 0.9, rabi: 1.0, zaid: 1.1 },
    'pomegranate': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'guava': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'papaya': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    
    // BEVERAGE CROPS
    'tea': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'coffee': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    
    // FIBER CROPS
    'hemp': { kharif: 1.0, rabi: 0.8, zaid: 0.9 },
    'flax': { kharif: 0.8, rabi: 1.1, zaid: 0.7 },
    
    // MEDICINAL CROPS
    'aloe vera': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'neem': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    
    // MISCELLANEOUS
    'bamboo': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'rubber': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'cashew': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'areca nut': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'betel nut': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'coconut': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    'oil palm': { kharif: 1.0, rabi: 1.0, zaid: 1.0 }, // Perennial
    
    // ADDITIONAL CROP VARIATIONS (case-insensitive matching)
    'rice (paddy)': { kharif: 1.2, rabi: 0.8, zaid: 0.6 },
    'paddy': { kharif: 1.2, rabi: 0.8, zaid: 0.6 },
    'corn': { kharif: 1.1, rabi: 0.9, zaid: 1.0 },
    'sorghum': { kharif: 1.0, rabi: 0.8, zaid: 0.7 },
    'pearl millet': { kharif: 1.0, rabi: 0.7, zaid: 0.8 },
    'finger millet': { kharif: 1.0, rabi: 0.8, zaid: 0.7 },
    'urad': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    'moong': { kharif: 1.1, rabi: 0.8, zaid: 0.9 },
    'gram': { kharif: 0.8, rabi: 1.2, zaid: 0.7 },
    'arhar': { kharif: 1.0, rabi: 0.8, zaid: 0.9 },
    'toor': { kharif: 1.0, rabi: 0.8, zaid: 0.9 },
    'peanut': { kharif: 1.1, rabi: 0.8, zaid: 0.9 },
    'til': { kharif: 1.0, rabi: 0.9, zaid: 1.1 },
    'gingelly': { kharif: 1.0, rabi: 0.9, zaid: 1.1 },
    'eggplant': { kharif: 0.9, rabi: 1.0, zaid: 1.0 },
    'lady finger': { kharif: 1.0, rabi: 0.8, zaid: 1.1 },
    'bhendi': { kharif: 1.0, rabi: 0.8, zaid: 1.1 },
    'karela': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'lauki': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'kaddu': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'tinda': { kharif: 0.8, rabi: 0.9, zaid: 1.2 },
    'gobi': { kharif: 0.8, rabi: 1.2, zaid: 0.7 },
    'patta gobi': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'gajar': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'mooli': { kharif: 0.8, rabi: 1.0, zaid: 0.9 },
    'palak': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'methi': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'dhaniya': { kharif: 0.8, rabi: 1.1, zaid: 0.9 },
    'jeera': { kharif: 0.8, rabi: 1.1, zaid: 0.8 },
    'haldi': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    'adrak': { kharif: 1.0, rabi: 0.9, zaid: 0.8 },
    'elaichi': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'kali mirch': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'aam': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'kela': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'nariyal': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'angur': { kharif: 0.9, rabi: 1.0, zaid: 1.1 },
    'anar': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'amrood': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'papita': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'chai': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'kapi': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'bans': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'rubber': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'kaju': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'supari': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'paan': { kharif: 1.0, rabi: 1.0, zaid: 1.0 },
    'tambaku': { kharif: 1.0, rabi: 0.9, zaid: 0.8 }
  }
  
  const factors = seasonalFactors[crop.toLowerCase()] || { kharif: 1.0, rabi: 1.0, zaid: 1.0 }
  return factors[season] || 1.0
}

// Get Odisha district factor
function getOdishaDistrictFactor(location) {
  const district = getOdishaDistrict(location)
  const districtFactors = {
    // Coastal districts (higher productivity)
    'baleswar': 1.15, 'bhadrak': 1.12, 'jajpur': 1.10, 'kendrapara': 1.13,
    'jagatsinghpur': 1.14, 'cuttack': 1.16, 'puri': 1.15, 'khordha': 1.18,
    'gajapati': 1.08, 'ganjam': 1.12, 'nayagarh': 1.10,
    
    // Plateau districts (moderate productivity)
    'angul': 1.05, 'dhenkanal': 1.08, 'kandhamal': 1.02, 'boudh': 1.03,
    'subarnapur': 1.04, 'balangir': 1.06, 'nuapada': 1.03, 'kalahandi': 1.05,
    'rayagada': 1.04, 'koraput': 1.06, 'malkangiri': 1.02, 'nabarangpur': 1.03,
    
    // Northern districts
    'sundargarh': 1.08, 'deogarh': 1.05, 'sambalpur': 1.07, 'jharsuguda': 1.06,
    'bargarh': 1.09, 'mayurbhanj': 1.07, 'keonjhar': 1.06
  }
  
  return districtFactors[district.toLowerCase()] || 1.0
}

// Get state-specific AI recommendations
function getOdishaAIRecommendations(crop, soilData, weatherData, location, month) {
  const recommendations = []
  const state = getStateFromLocation(location)
  const season = getOdishaSeason(month)
  
  // State-specific soil-based recommendations
  const soilType = getStateSoilType(state, location)
  
  if (soilData.ph < 6.0) {
    const phAction = state === 'odisha' ? 'Apply lime to increase soil pH (Odisha soils are generally acidic)' :
                    state === 'rajasthan' ? 'Apply gypsum to improve soil pH (Rajasthan soils are alkaline)' :
                    'Apply lime to increase soil pH'
    recommendations.push({
      type: 'soil',
      priority: 'high',
      action: phAction,
      expectedIncrease: 6  // Realistic 6% increase from pH correction
    })
  }
  
  if (soilData.nitrogen < 20) {
    const nAction = state === 'punjab' || state === 'haryana' ? 'Apply nitrogen fertilizer (high productivity states need more N)' :
                   state === 'odisha' ? 'Apply nitrogen fertilizer (Odisha soils are low in N)' :
                   'Apply nitrogen fertilizer'
    
    // Dynamic yield increase based on nitrogen deficiency severity
    let nIncrease = 8  // Base 8% increase from N fertilizer
    if (soilData.nitrogen < 10) nIncrease += 3  // Severe deficiency
    if (crop.toLowerCase() === 'rice' || crop.toLowerCase() === 'wheat') nIncrease += 2  // N-demanding crops
    
    recommendations.push({
      type: 'fertilizer',
      priority: 'high',
      action: nAction,
      expectedIncrease: Math.min(12, nIncrease)
    })
  }
  
  if (soilData.organicMatter < 3) {
    const omAction = state === 'odisha' ? 'Add organic matter/compost (critical for Odisha degraded soils)' :
                    state === 'rajasthan' ? 'Add organic matter/compost (essential for desert soil improvement)' :
                    'Add organic matter/compost'
    recommendations.push({
      type: 'soil',
      priority: 'high',
      action: omAction,
      expectedIncrease: 7  // Realistic 7% increase from organic matter
    })
  }
  
  // Add potassium deficiency recommendation (common issue)
  if (soilData.potassium < 50) {
    let kIncrease = 6  // Base 6% increase from K fertilizer
    if (soilData.potassium < 30) kIncrease += 3  // Severe deficiency
    if (crop.toLowerCase() === 'wheat' || crop.toLowerCase() === 'maize') kIncrease += 2  // K-demanding crops
    
    recommendations.push({
      type: 'fertilizer',
      priority: 'high',
      action: 'Apply potassium fertilizer (K deficiency detected)',
      expectedIncrease: Math.min(10, kIncrease)
    })
  }
  
  // Weather-based recommendations
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 25), 0) / weatherData.length
  if (avgTemp > 32) {
    recommendations.push({
      type: 'weather',
      priority: 'medium',
      action: 'Use shade nets or mulching for heat stress management',
      expectedIncrease: 5  // Realistic 5% increase from heat management
    })
  }
  
  // Monsoon-specific recommendations with dynamic yield increase
  if (season === 'kharif') {
    const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
    if (rainyDays < 3) {
      // Dynamic yield increase based on soil health and weather conditions
      let irrigationIncrease = 10  // Base 10% increase from irrigation
      if (soilData.moisture < 40) irrigationIncrease += 3  // Very dry soil
      if (soilData.organicMatter < 2) irrigationIncrease += 2  // Poor soil structure
      if (weatherData.some(day => day.temp > 35)) irrigationIncrease += 2  // High temperature stress
      
      recommendations.push({
        type: 'irrigation',
        priority: 'high',
        action: 'Implement supplemental irrigation (monsoon failure)',
        expectedIncrease: Math.min(15, irrigationIncrease)  // Cap at 15%
      })
    }
  }
  
  // State-specific crop recommendations
  const cropRecommendations = getStateCropSpecificRecommendations(crop, soilData, weatherData, state)
  recommendations.push(...cropRecommendations)
  
  return recommendations
}

// Get state-specific crop recommendations
function getStateCropSpecificRecommendations(crop, soilData, weatherData, state) {
  const recommendations = []
  
  // State-specific crop recommendations
  switch (state) {
    case 'punjab':
    case 'haryana':
      // High productivity states
      if (crop.toLowerCase() === 'rice' && soilData.moisture < 60) {
        recommendations.push({
          type: 'irrigation',
          priority: 'high',
          action: 'Maintain flooded field conditions (essential for high-yield rice)',
          expectedIncrease: 8
        })
      }
      if (crop.toLowerCase() === 'wheat' && soilData.phosphorus < 15) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'high',
          action: 'Apply phosphorus fertilizer (critical for wheat in high productivity states)',
          expectedIncrease: 6
        })
      }
      break
      
    case 'rajasthan':
      // Arid state
      if (crop.toLowerCase() === 'mustard' && soilData.moisture < 30) {
        recommendations.push({
          type: 'irrigation',
          priority: 'high',
          action: 'Implement drip irrigation (essential for arid conditions)',
          expectedIncrease: 10
        })
      }
      if (crop.toLowerCase() === 'bajra' && soilData.potassium < 100) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'medium',
          action: 'Apply potassium fertilizer (important for drought-resistant crops)',
          expectedIncrease: 4
        })
      }
      break
      
    case 'karnataka':
    case 'telangana':
      // Southern states
      if (crop.toLowerCase() === 'ragi' && soilData.ph < 6.5) {
        recommendations.push({
          type: 'soil',
          priority: 'high',
          action: 'Adjust soil pH to 6.5-7.0 range (optimal for ragi)',
          expectedIncrease: 5
        })
      }
      if (crop.toLowerCase() === 'cotton' && soilData.calcium < 200) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'medium',
          action: 'Apply calcium fertilizer (gypsum) for cotton',
          expectedIncrease: 4
        })
      }
      break
      
    case 'tamil_nadu':
    case 'andhra_pradesh':
      // Coastal states
      if (crop.toLowerCase() === 'rice' && soilData.salinity > 0.5) {
        recommendations.push({
          type: 'soil',
          priority: 'high',
          action: 'Leach soil to reduce salinity (coastal areas)',
          expectedIncrease: 7
        })
      }
      if (crop.toLowerCase() === 'sugarcane' && soilData.potassium < 200) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'high',
          action: 'Apply potassium fertilizer (critical for sugarcane)',
          expectedIncrease: 6
        })
      }
      break
      
    case 'maharashtra':
      // Western state
      if (crop.toLowerCase() === 'sugarcane' && soilData.moisture < 50) {
        recommendations.push({
          type: 'irrigation',
          priority: 'high',
          action: 'Implement drip irrigation for sugarcane',
          expectedIncrease: 8
        })
      }
      if (crop.toLowerCase() === 'cotton' && soilData.nitrogen < 25) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'high',
          action: 'Apply nitrogen fertilizer (cotton needs high N)',
          expectedIncrease: 5
        })
      }
      break
      
    case 'odisha':
      // Original Odisha recommendations
      if (crop.toLowerCase() === 'rice' && soilData.moisture < 60) {
        recommendations.push({
          type: 'irrigation',
          priority: 'high',
          action: 'Maintain flooded field conditions (essential for rice in Odisha)',
          expectedIncrease: 7
        })
      }
      if (crop.toLowerCase() === 'rice' && soilData.phosphorus < 15) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'high',
          action: 'Apply phosphorus fertilizer (critical for rice)',
          expectedIncrease: 4
        })
      }
      break
      
    default:
      // Generic recommendations for other states
      if (crop.toLowerCase() === 'rice' && soilData.moisture < 50) {
        recommendations.push({
          type: 'irrigation',
          priority: 'medium',
          action: 'Improve irrigation management',
          expectedIncrease: 5
        })
      }
      if (crop.toLowerCase() === 'wheat' && soilData.phosphorus < 15) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'medium',
          action: 'Apply phosphorus fertilizer',
          expectedIncrease: 4
        })
      }
  }
  
  return recommendations
}

// Get Odisha crop-specific recommendations (keeping for backward compatibility)
function getOdishaCropSpecificRecommendations(crop, soilData, weatherData, district) {
  const recommendations = []
  
  switch (crop.toLowerCase()) {
    case 'rice':
      if (soilData.moisture < 60) {
        recommendations.push({
          type: 'irrigation',
          priority: 'high',
          action: 'Maintain flooded field conditions (essential for rice in Odisha)',
          expectedIncrease: 7
        })
      }
      if (soilData.phosphorus < 15) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'high',
          action: 'Apply phosphorus fertilizer (critical for rice)',
          expectedIncrease: 4
        })
      }
      break
      
    case 'maize':
      if (soilData.potassium < 150) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'medium',
          action: 'Apply potassium fertilizer',
          expectedIncrease: 3
        })
      }
      break
      
    case 'black gram':
    case 'green gram':
      if (soilData.ph < 6.5 || soilData.ph > 7.5) {
        recommendations.push({
          type: 'soil',
          priority: 'high',
          action: 'Adjust soil pH to 6.5-7.5 range',
          expectedIncrease: 5
        })
      }
      break
      
    case 'groundnut':
      if (soilData.calcium < 200) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'medium',
          action: 'Apply calcium fertilizer (gypsum)',
          expectedIncrease: 4
        })
      }
      break
      
    case 'mustard':
      if (soilData.sulfur < 20) {
        recommendations.push({
          type: 'fertilizer',
          priority: 'medium',
          action: 'Apply sulfur fertilizer',
          expectedIncrease: 3
        })
      }
      break
  }
  
  return recommendations
}

// State-specific soil type mapping
function getStateSoilType(state, location) {
  const stateSoilTypes = {
    'punjab': 'alluvial',
    'haryana': 'alluvial', 
    'uttar_pradesh': 'alluvial',
    'bihar': 'alluvial',
    'west_bengal': 'alluvial',
    'andhra_pradesh': 'alluvial',
    'tamil_nadu': 'alluvial',
    'gujarat': 'alluvial',
    'maharashtra': 'black',
    'karnataka': 'red',
    'telangana': 'red',
    'rajasthan': 'desert',
    'madhya_pradesh': 'black',
    'odisha': 'lateritic'
  }
  
  return stateSoilTypes[state] || 'alluvial'
}

// State-specific climate zone mapping
function getStateClimateZone(state) {
  const stateClimateZones = {
    'punjab': 'north-western-plains',
    'haryana': 'north-western-plains',
    'uttar_pradesh': 'north-central-plains',
    'bihar': 'east-central-plains',
    'west_bengal': 'east-coastal',
    'andhra_pradesh': 'south-coastal',
    'tamil_nadu': 'south-coastal',
    'gujarat': 'west-coastal',
    'maharashtra': 'west-central',
    'karnataka': 'south-central',
    'telangana': 'south-central',
    'rajasthan': 'arid-western',
    'madhya_pradesh': 'central-plateau',
    'odisha': 'east-coastal'
  }
  
  return stateClimateZones[state] || 'central-plateau'
}

// State-specific district factors
function getStateDistrictFactor(state, location) {
  const stateDistrictFactors = {
    'punjab': {
      'ludhiana': 1.2, 'amritsar': 1.15, 'jalandhar': 1.18, 'patiala': 1.12,
      'bathinda': 1.10, 'mohali': 1.15, 'firozpur': 1.08, 'default': 1.12
    },
    'haryana': {
      'gurgaon': 1.15, 'faridabad': 1.12, 'panipat': 1.18, 'karnal': 1.20,
      'hisar': 1.10, 'rohtak': 1.08, 'sonipat': 1.12, 'default': 1.12
    },
    'uttar_pradesh': {
      'lucknow': 1.10, 'kanpur': 1.08, 'agra': 1.05, 'varanasi': 1.12,
      'meerut': 1.15, 'allahabad': 1.08, 'bareilly': 1.06, 'ghaziabad': 1.18, 'default': 1.08
    },
    'maharashtra': {
      'mumbai': 1.20, 'pune': 1.15, 'nagpur': 1.08, 'nashik': 1.12,
      'aurangabad': 1.05, 'solapur': 1.08, 'kolhapur': 1.10, 'default': 1.10
    },
    'karnataka': {
      'bangalore': 1.15, 'mysore': 1.12, 'hubli': 1.08, 'mangalore': 1.18,
      'belgaum': 1.06, 'gulbarga': 1.04, 'davangere': 1.08, 'default': 1.10
    },
    'tamil_nadu': {
      'chennai': 1.18, 'coimbatore': 1.15, 'madurai': 1.12, 'tiruchirapalli': 1.10,
      'salem': 1.08, 'tirunelveli': 1.06, 'erode': 1.10, 'default': 1.12
    },
    'gujarat': {
      'ahmedabad': 1.15, 'surat': 1.18, 'vadodara': 1.12, 'rajkot': 1.08,
      'bhavnagar': 1.06, 'jamnagar': 1.05, 'gandhinagar': 1.10, 'default': 1.10
    },
    'rajasthan': {
      'jaipur': 1.08, 'jodhpur': 1.05, 'kota': 1.10, 'bikaner': 1.02,
      'ajmer': 1.06, 'udaipur': 1.08, 'bharatpur': 1.12, 'default': 1.06
    },
    'bihar': {
      'patna': 1.10, 'gaya': 1.08, 'bhagalpur': 1.06, 'muzaffarpur': 1.08,
      'darbhanga': 1.05, 'purnia': 1.04, 'arrah': 1.06, 'default': 1.06
    },
    'west_bengal': {
      'kolkata': 1.15, 'howrah': 1.12, 'durgapur': 1.08, 'asansol': 1.06,
      'siliguri': 1.10, 'bardhaman': 1.08, 'malda': 1.05, 'default': 1.08
    },
    'madhya_pradesh': {
      'bhopal': 1.08, 'indore': 1.12, 'gwalior': 1.10, 'jabalpur': 1.06,
      'ujjain': 1.08, 'sagar': 1.05, 'dewas': 1.06, 'default': 1.08
    },
    'andhra_pradesh': {
      'hyderabad': 1.12, 'visakhapatnam': 1.15, 'vijayawada': 1.10, 'guntur': 1.08,
      'nellore': 1.06, 'kurnool': 1.05, 'tirupati': 1.08, 'default': 1.08
    },
    'telangana': {
      'warangal': 1.08, 'nizamabad': 1.06, 'khammam': 1.05, 'karimnagar': 1.08,
      'ramagundam': 1.06, 'mahbubnagar': 1.04, 'nalgonda': 1.05, 'default': 1.06
    },
    'odisha': {
      'bhubaneswar': 1.18, 'cuttack': 1.16, 'puri': 1.15, 'rourkela': 1.08,
      'berhampur': 1.12, 'sambalpur': 1.07, 'balasore': 1.15, 'bhadrak': 1.12,
      'angul': 1.05, 'dhenkanal': 1.08, 'kendujhar': 1.06, 'mayurbhanj': 1.07,
      'balangir': 1.06, 'bargarh': 1.09, 'kalahandi': 1.05, 'nuapada': 1.03,
      'koraput': 1.06, 'malkangiri': 1.02, 'nabarangpur': 1.03, 'rayagada': 1.04,
      'gajapati': 1.08, 'ganjam': 1.12, 'kandhamal': 1.02, 'boudh': 1.03,
      'subarnapur': 1.04, 'sundargarh': 1.08, 'deogarh': 1.05, 'jharsuguda': 1.06,
      'jajpur': 1.10, 'jagatsinghpur': 1.14, 'kendrapara': 1.13, 'khordha': 1.18,
      'nayagarh': 1.10, 'default': 1.10
    }
  }
  
  const stateFactors = stateDistrictFactors[state] || stateDistrictFactors['odisha']
  const locationLower = location.toLowerCase()
  
  for (const [district, factor] of Object.entries(stateFactors)) {
    if (district !== 'default' && locationLower.includes(district)) {
      return factor
    }
  }
  
  return stateFactors['default'] || 1.0
}

// Helper functions for Odisha
function getOdishaDistrict(location) {
  const districts = [
    'angul', 'balangir', 'baleswar', 'bargarh', 'bhadrak', 'boudh', 'cuttack',
    'deogarh', 'dhenkanal', 'gajapati', 'ganjam', 'jagatsinghpur', 'jajpur',
    'jharsuguda', 'kalahandi', 'kandhamal', 'kendrapara', 'keonjhar', 'khordha',
    'koraput', 'malkangiri', 'mayurbhanj', 'nabarangpur', 'nayagarh', 'nuapada',
    'puri', 'rayagada', 'sambalpur', 'subarnapur', 'sundargarh'
  ]
  
  return districts.find(district => 
    location.toLowerCase().includes(district)
  ) || 'cuttack'
}

function getOdishaSoilType(district) {
  const soilTypes = {
    'baleswar': 'alluvial', 'bhadrak': 'alluvial', 'jajpur': 'alluvial',
    'kendrapara': 'alluvial', 'jagatsinghpur': 'alluvial', 'cuttack': 'alluvial',
    'puri': 'alluvial', 'khordha': 'alluvial', 'gajapati': 'lateritic',
    'ganjam': 'lateritic', 'nayagarh': 'lateritic', 'angul': 'lateritic',
    'dhenkanal': 'lateritic', 'kandhamal': 'lateritic', 'boudh': 'lateritic',
    'subarnapur': 'lateritic', 'balangir': 'lateritic', 'nuapada': 'lateritic',
    'kalahandi': 'lateritic', 'rayagada': 'lateritic', 'koraput': 'lateritic',
    'malkangiri': 'lateritic', 'nabarangpur': 'lateritic', 'sundargarh': 'lateritic',
    'deogarh': 'lateritic', 'sambalpur': 'lateritic', 'jharsuguda': 'lateritic',
    'bargarh': 'lateritic', 'mayurbhanj': 'lateritic', 'keonjhar': 'lateritic'
  }
  
  return soilTypes[district.toLowerCase()] || 'lateritic'
}

function getOdishaAgroClimaticZone(district) {
  const zones = {
    'sundargarh': 'north-western-plateau', 'deogarh': 'north-western-plateau',
    'sambalpur': 'north-western-plateau', 'jharsuguda': 'north-western-plateau',
    'mayurbhanj': 'north-central-plateau', 'keonjhar': 'north-central-plateau',
    'baleswar': 'north-eastern-coastal', 'bhadrak': 'north-eastern-coastal',
    'jajpur': 'north-eastern-coastal', 'kendrapara': 'north-eastern-coastal',
    'cuttack': 'mid-central-tableland', 'nayagarh': 'mid-central-tableland',
    'angul': 'mid-central-tableland', 'dhenkanal': 'mid-central-tableland',
    'puri': 'east-south-eastern-coastal', 'khordha': 'east-south-eastern-coastal',
    'gajapati': 'east-south-eastern-coastal', 'ganjam': 'east-south-eastern-coastal',
    'jagatsinghpur': 'east-south-eastern-coastal', 'kandhamal': 'south-eastern-ghat',
    'koraput': 'south-eastern-ghat', 'malkangiri': 'south-eastern-ghat',
    'nabarangpur': 'south-eastern-ghat', 'nuapada': 'western-undulating',
    'kalahandi': 'western-undulating', 'rayagada': 'western-undulating',
    'balangir': 'west-central-tableland', 'subarnapur': 'west-central-tableland',
    'bargarh': 'west-central-tableland', 'boudh': 'west-central-tableland'
  }
  
  return zones[district.toLowerCase()] || 'mid-central-tableland'
}

function getOdishaSeason(month) {
  const seasons = {
    'june': 'kharif', 'july': 'kharif', 'august': 'kharif', 'september': 'kharif', 'october': 'kharif',
    'november': 'rabi', 'december': 'rabi', 'january': 'rabi', 'february': 'rabi', 'march': 'rabi',
    'april': 'zaid', 'may': 'zaid'
  }
  return seasons[month.toLowerCase()] || 'kharif'
}

function getSoilTypeHealthFactor(soilType) {
  const factors = {
    'alluvial': 1.1,    // Most fertile (Punjab, Haryana, UP, etc.)
    'lateritic': 0.9,   // Less fertile, needs improvement (Odisha)
    'red': 0.95,        // Moderate fertility (Karnataka, Telangana)
    'black': 1.05,      // Good fertility (Maharashtra, MP)
    'desert': 0.8       // Low fertility (Rajasthan)
  }
  return factors[soilType] || 1.0
}

function getAgroClimaticZoneFactor(zone, crop) {
  const zoneFactors = {
    // Odisha zones (keeping existing)
    'north-western-plateau': 0.95,
    'north-central-plateau': 1.0,
    'north-eastern-coastal': 1.1,
    'mid-central-tableland': 1.05,
    'east-south-eastern-coastal': 1.15,
    'south-eastern-ghat': 0.9,
    'western-undulating': 0.95,
    'west-central-tableland': 1.0,
    
    // New multi-state zones
    'north-western-plains': 1.2,    // Punjab, Haryana
    'north-central-plains': 1.1,    // Uttar Pradesh
    'east-central-plains': 1.0,     // Bihar
    'east-coastal': 1.15,           // West Bengal, Odisha
    'south-coastal': 1.18,          // Tamil Nadu, Andhra Pradesh
    'west-coastal': 1.12,           // Gujarat
    'west-central': 1.08,           // Maharashtra
    'south-central': 1.05,          // Karnataka, Telangana
    'arid-western': 0.85,           // Rajasthan
    'central-plateau': 1.0          // Madhya Pradesh
  }
  return zoneFactors[zone] || 1.0
}

// Calculate purely dynamic weather risk based on crop-location-month interrelation
function calculateOdishaWeatherRisk(weatherData, month, crop, location) {
  const state = getStateFromLocation(location)
  const season = getOdishaSeason(month)
  
  // Use tempValue for calculations, fallback to temp if tempValue not available
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
  const avgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity) || 50), 0) / weatherData.length
  const maxTemp = Math.max(...weatherData.map(day => day.tempValue || parseInt(day.temp) || 0))
  const minTemp = Math.min(...weatherData.map(day => day.tempValue || parseInt(day.temp) || 0))
  
  // Get crop-specific weather requirements
  const cropWeatherRequirements = getCropWeatherRequirements(crop, season)
  
  let riskLevel = "Low"
  let riskFactors = []
  let solutions = []
  
  // Temperature risk assessment
  const tempRisk = assessTemperatureRisk(avgTemp, maxTemp, minTemp, cropWeatherRequirements, crop, season)
  if (tempRisk.level === "High") {
    riskLevel = "High"
    riskFactors.push(tempRisk.factor)
    solutions.push(tempRisk.solution)
  } else if (tempRisk.level === "Medium" && riskLevel === "Low") {
    riskLevel = "Medium"
    riskFactors.push(tempRisk.factor)
    solutions.push(tempRisk.solution)
  }
  
  // Rainfall risk assessment
  const rainfallRisk = assessRainfallRisk(rainyDays, season, crop, location)
  if (rainfallRisk.level === "High") {
    riskLevel = "High"
    riskFactors.push(rainfallRisk.factor)
    solutions.push(rainfallRisk.solution)
  } else if (rainfallRisk.level === "Medium" && riskLevel === "Low") {
    riskLevel = "Medium"
    riskFactors.push(rainfallRisk.factor)
    solutions.push(rainfallRisk.solution)
  }
  
  // Humidity risk assessment
  const humidityRisk = assessHumidityRisk(avgHumidity, cropWeatherRequirements, crop, season)
  if (humidityRisk.level === "High") {
    riskLevel = "High"
    riskFactors.push(humidityRisk.factor)
    solutions.push(humidityRisk.solution)
  } else if (humidityRisk.level === "Medium" && riskLevel === "Low") {
    riskLevel = "Medium"
    riskFactors.push(humidityRisk.factor)
    solutions.push(humidityRisk.solution)
  }
  
  // Location-specific weather risks
  const locationRisk = assessLocationWeatherRisk(state, location, season, avgTemp, rainyDays)
  if (locationRisk.level === "High") {
    riskLevel = "High"
    riskFactors.push(locationRisk.factor)
    solutions.push(locationRisk.solution)
  } else if (locationRisk.level === "Medium" && riskLevel === "Low") {
    riskLevel = "Medium"
    riskFactors.push(locationRisk.factor)
    solutions.push(locationRisk.solution)
  }
  
  return {
    level: riskLevel,
    riskFactors,
    solutions,
    details: {
      temperature: tempRisk,
      rainfall: rainfallRisk,
      humidity: humidityRisk,
      location: locationRisk
    }
  }
}

// Get crop-specific weather requirements
function getCropWeatherRequirements(crop, season) {
  // Normalize crop name - handle variations like "Maize (Corn)" -> "maize"
  const normalizedCrop = crop.split(" ")[0].split("(")[0].toLowerCase()
  
  const requirements = {
    'rice': {
      temperature: { optimal: 25, min: 20, max: 35, criticalMin: 15, criticalMax: 40 },
      humidity: { optimal: 70, min: 50, max: 90 },
      rainfall: { optimal: 150, min: 100, max: 300 }
    },
    'wheat': {
      temperature: { optimal: 20, min: 15, max: 28, criticalMin: 5, criticalMax: 35 },
      humidity: { optimal: 60, min: 40, max: 80 },
      rainfall: { optimal: 50, min: 30, max: 100 }
    },
    'maize': {
      temperature: { optimal: 25, min: 18, max: 32, criticalMin: 10, criticalMax: 38 },
      humidity: { optimal: 65, min: 45, max: 85 },
      rainfall: { optimal: 80, min: 50, max: 150 }
    },
    'cotton': {
      temperature: { optimal: 28, min: 22, max: 36, criticalMin: 15, criticalMax: 42 },
      humidity: { optimal: 55, min: 35, max: 75 },
      rainfall: { optimal: 60, min: 40, max: 120 }
    },
    'sugarcane': {
      temperature: { optimal: 26, min: 20, max: 35, criticalMin: 12, criticalMax: 40 },
      humidity: { optimal: 75, min: 60, max: 90 },
      rainfall: { optimal: 120, min: 80, max: 200 }
    },
    'turmeric': {
      temperature: { optimal: 22, min: 18, max: 30, criticalMin: 10, criticalMax: 35 },
      humidity: { optimal: 70, min: 50, max: 85 },
      rainfall: { optimal: 100, min: 70, max: 180 }
    },
    'chilli': {
      temperature: { optimal: 24, min: 20, max: 32, criticalMin: 15, criticalMax: 38 },
      humidity: { optimal: 60, min: 40, max: 80 },
      rainfall: { optimal: 70, min: 50, max: 130 }
    },
    'tomato': {
      temperature: { optimal: 22, min: 18, max: 30, criticalMin: 10, criticalMax: 35 },
      humidity: { optimal: 65, min: 45, max: 85 },
      rainfall: { optimal: 80, min: 60, max: 150 }
    },
    'potato': {
      temperature: { optimal: 18, min: 15, max: 25, criticalMin: 5, criticalMax: 30 },
      humidity: { optimal: 70, min: 50, max: 85 },
      rainfall: { optimal: 100, min: 70, max: 180 }
    },
    'onion': {
      temperature: { optimal: 20, min: 15, max: 28, criticalMin: 8, criticalMax: 32 },
      humidity: { optimal: 60, min: 40, max: 80 },
      rainfall: { optimal: 60, min: 40, max: 120 }
    },
    'brinjal': {
      temperature: { optimal: 24, min: 20, max: 32, criticalMin: 15, criticalMax: 38 },
      humidity: { optimal: 65, min: 45, max: 85 },
      rainfall: { optimal: 80, min: 60, max: 150 }
    }
  }
  
  const baseRequirements = requirements[normalizedCrop] || requirements['rice']
  
  // Season-specific adjustments
  if (season === 'kharif') {
    // Monsoon crops - more rainfall tolerance
    return {
      ...baseRequirements,
      rainfall: { ...baseRequirements.rainfall, max: baseRequirements.rainfall.max + 100 }
    }
  } else if (season === 'rabi') {
    // Winter crops - lower temperature tolerance
    return {
      ...baseRequirements,
      temperature: { ...baseRequirements.temperature, min: baseRequirements.temperature.min - 5 }
    }
  }
  
  return baseRequirements
}

// Assess temperature risk
function assessTemperatureRisk(avgTemp, maxTemp, minTemp, requirements, crop, season) {
  const { optimal, min, max, criticalMin, criticalMax } = requirements.temperature
  
  if (maxTemp > criticalMax || minTemp < criticalMin) {
    return {
      level: "High",
      factor: `Extreme temperature risk: ${minTemp}°C - ${maxTemp}°C for ${crop} in ${season}`,
      solution: `Implement temperature control measures: shade nets, mulching, or greenhouse protection`
    }
  } else if (avgTemp > max || avgTemp < min) {
    return {
      level: "High",
      factor: `Temperature outside optimal range: ${avgTemp}°C for ${crop} in ${season}`,
      solution: `Adjust planting time or use temperature management techniques`
    }
  } else if (avgTemp > optimal + 5 || avgTemp < optimal - 5) {
    return {
      level: "Medium",
      factor: `Temperature suboptimal: ${avgTemp}°C for ${crop} in ${season}`,
      solution: `Monitor closely and prepare for temperature management if needed`
    }
  }
  
  return { level: "Low", factor: null, solution: null }
}

// Assess rainfall risk
function assessRainfallRisk(rainyDays, season, crop, location) {
  const state = getStateFromLocation(location)
  
  if (season === 'kharif') {
    // Monsoon season
    if (rainyDays < 2) {
      return {
        level: "High",
        factor: `Drought risk: Only ${rainyDays} rainy days in monsoon season`,
        solution: `Implement drought management: irrigation, mulching, drought-resistant varieties`
      }
    } else if (rainyDays > 8) {
      return {
        level: "High",
        factor: `Flood risk: ${rainyDays} rainy days in monsoon season`,
        solution: `Implement flood management: drainage, raised beds, flood-resistant varieties`
      }
    } else if (rainyDays < 4) {
      return {
        level: "Medium",
        factor: `Low rainfall: Only ${rainyDays} rainy days in monsoon season`,
        solution: `Monitor soil moisture and prepare irrigation backup`
      }
    }
  } else if (season === 'rabi') {
    // Winter season
    if (rainyDays > 5) {
      return {
        level: "High",
        factor: `Excess moisture: ${rainyDays} rainy days in winter season`,
        solution: `Improve drainage and avoid waterlogging`
      }
    } else if (rainyDays > 3) {
      return {
        level: "Medium",
        factor: `High moisture: ${rainyDays} rainy days in winter season`,
        solution: `Monitor soil moisture and ensure proper drainage`
      }
    }
  } else if (season === 'zaid') {
    // Summer season
    if (rainyDays > 3) {
      return {
        level: "Medium",
        factor: `Unexpected rainfall: ${rainyDays} rainy days in summer season`,
        solution: `Monitor for disease risks and adjust irrigation`
      }
    }
  }
  
  return { level: "Low", factor: null, solution: null }
}

// Assess humidity risk
function assessHumidityRisk(avgHumidity, requirements, crop, season) {
  const { optimal, min, max } = requirements.humidity
  
  if (avgHumidity > max) {
    return {
      level: "High",
      factor: `High humidity risk: ${avgHumidity}% for ${crop} in ${season}`,
      solution: `Improve air circulation, reduce plant density, use fungicides preventively`
    }
  } else if (avgHumidity < min) {
    return {
      level: "High",
      factor: `Low humidity risk: ${avgHumidity}% for ${crop} in ${season}`,
      solution: `Increase irrigation frequency, use mulching, consider misting`
    }
  } else if (avgHumidity > optimal + 10 || avgHumidity < optimal - 10) {
    return {
      level: "Medium",
      factor: `Suboptimal humidity: ${avgHumidity}% for ${crop} in ${season}`,
      solution: `Monitor plant health and adjust irrigation accordingly`
    }
  }
  
  return { level: "Low", factor: null, solution: null }
}

// Assess location-specific weather risks
function assessLocationWeatherRisk(state, location, season, avgTemp, rainyDays) {
  const locationRisks = {
    'rajasthan': {
      kharif: avgTemp > 38 ? "High heat stress" : null,
      rabi: avgTemp < 8 ? "Cold stress" : null,
      zaid: avgTemp > 42 ? "Extreme heat" : null
    },
    'punjab': {
      kharif: rainyDays > 10 ? "Flood risk" : null,
      rabi: avgTemp < 5 ? "Frost risk" : null
    },
    'odisha': {
      kharif: rainyDays < 3 ? "Drought risk" : rainyDays > 12 ? "Flood risk" : null,
      rabi: avgTemp > 32 ? "Heat stress" : null
    },
    'karnataka': {
      kharif: avgTemp > 36 ? "Heat stress" : null,
      rabi: rainyDays > 6 ? "Excess moisture" : null
    }
  }
  
  const stateRisks = locationRisks[state]
  if (stateRisks && stateRisks[season]) {
    return {
      level: "High",
      factor: stateRisks[season],
      solution: `Location-specific risk mitigation for ${state} in ${season} season`
    }
  }
  
  return { level: "Low", factor: null, solution: null }
}

// Calculate priority tasks with detailed risk solutions for clickable panel
function calculatePriorityTasks(soilHealthResult, weatherRiskResult, aiRecommendations, crop, location, month) {
  const allRisks = []
  const allSolutions = []
  const priorityLevels = []
  
  // Collect soil health risks
  if (soilHealthResult.riskFactors && soilHealthResult.riskFactors.length > 0) {
    soilHealthResult.riskFactors.forEach((risk, index) => {
      allRisks.push({
        category: "Soil Health",
        risk: risk,
        solution: soilHealthResult.recommendations[index] || "Improve soil conditions",
        priority: "High",
        impact: "Yield reduction, nutrient deficiency",
        urgency: "Immediate action required"
      })
    })
  }
  
  // Collect weather risks
  if (weatherRiskResult.riskFactors && weatherRiskResult.riskFactors.length > 0) {
    weatherRiskResult.riskFactors.forEach((risk, index) => {
      allRisks.push({
        category: "Weather Risk",
        risk: risk,
        solution: weatherRiskResult.solutions[index] || "Implement weather protection measures",
        priority: weatherRiskResult.level,
        impact: "Crop damage, yield loss",
        urgency: weatherRiskResult.level === "High" ? "Immediate action required" : "Monitor closely"
      })
    })
  }
  
  // AI recommendations are now excluded from priority tasks as requested by user
  // They are still used for yield calculations but not displayed in priority tasks panel
  
  // Add crop-specific seasonal risks
  const seasonalRisks = getSeasonalCropRisks(crop, month, location)
  seasonalRisks.forEach(risk => {
    allRisks.push(risk)
  })
  
  // Categorize by priority
  const highPriorityTasks = allRisks.filter(task => task.priority === "High" || task.priority === "high")
  const mediumPriorityTasks = allRisks.filter(task => task.priority === "Medium" || task.priority === "medium")
  const lowPriorityTasks = allRisks.filter(task => task.priority === "Low" || task.priority === "low")
  
  return {
    count: allRisks.length,
    highPriority: highPriorityTasks.length,
    mediumPriority: mediumPriorityTasks.length,
    lowPriority: lowPriorityTasks.length,
    tasks: allRisks,
    categories: {
      soilHealth: allRisks.filter(task => task.category === "Soil Health"),
      weatherRisk: allRisks.filter(task => task.category === "Weather Risk"),
      seasonalRisks: allRisks.filter(task => task.category === "Seasonal Risk"),
      ...(allRisks.filter(task => task.category === "AI Recommendation").length > 0 && {
        aiRecommendations: allRisks.filter(task => task.category === "AI Recommendation")
      })
    },
    summary: {
      totalRisks: allRisks.length,
      criticalRisks: highPriorityTasks.length,
      moderateRisks: mediumPriorityTasks.length,
      lowRisks: lowPriorityTasks.length,
      immediateAction: highPriorityTasks.filter(task => task.urgency === "Immediate action required").length
    }
  }
}

// Get seasonal crop-specific risks
function getSeasonalCropRisks(crop, month, location) {
  // Ensure crop is defined and has a fallback
  const cropType = crop || "Rice"
  
  // Normalize crop name - handle variations like "Maize (Corn)" -> "maize"
  const normalizedCrop = cropType.split(" ")[0].split("(")[0].toLowerCase()
  
  const season = getOdishaSeason(month)
  const state = getStateFromLocation(location)
  const risks = []
  
  // Crop-specific seasonal risks
  const cropRisks = {
    'rice': {
      kharif: [
        {
          category: "Seasonal Risk",
          risk: "Monsoon flooding risk for rice cultivation",
          solution: "Prepare drainage system and use flood-resistant varieties",
          priority: "High",
          impact: "Crop damage, yield loss",
          urgency: "Monitor weather forecasts"
        }
      ],
      rabi: [
        {
          category: "Seasonal Risk",
          risk: "Cold stress risk for rice in winter",
          solution: "Use cold-tolerant varieties and provide protection",
          priority: "Medium",
          impact: "Reduced growth, yield loss",
          urgency: "Monitor temperature"
        }
      ]
    },
    'wheat': {
      rabi: [
        {
          category: "Seasonal Risk",
          risk: "Frost damage risk for wheat",
          solution: "Use frost protection measures and resistant varieties",
          priority: "High",
          impact: "Crop damage, yield loss",
          urgency: "Monitor temperature forecasts"
        }
      ]
    },
    'cotton': {
      kharif: [
        {
          category: "Seasonal Risk",
          risk: "Pest pressure during monsoon for cotton",
          solution: "Implement integrated pest management",
          priority: "High",
          impact: "Pest damage, yield loss",
          urgency: "Regular monitoring required"
        }
      ]
    }
  }
  
  const cropSpecificRisks = cropRisks[normalizedCrop]
  if (cropSpecificRisks && cropSpecificRisks[season]) {
    risks.push(...cropSpecificRisks[season])
  }
  
  // Location-specific seasonal risks
  const locationRisks = {
    'rajasthan': {
      kharif: [
        {
          category: "Seasonal Risk",
          risk: "Drought risk in Rajasthan during monsoon",
          solution: "Implement water conservation and drought-resistant varieties",
          priority: "High",
          impact: "Water stress, yield loss",
          urgency: "Immediate water management required"
        }
      ]
    },
    'odisha': {
      kharif: [
        {
          category: "Seasonal Risk",
          risk: "Cyclone risk during monsoon in Odisha",
          solution: "Prepare cyclone-resistant structures and early warning system",
          priority: "High",
          impact: "Complete crop loss",
          urgency: "Monitor weather alerts"
        }
      ]
    }
  }
  
  const locationSpecificRisks = locationRisks[state]
  if (locationSpecificRisks && locationSpecificRisks[season]) {
    risks.push(...locationSpecificRisks[season])
  }
  
  return risks
}

function calculateDynamicYieldIncrease(currentYield, recommendations) {
  let totalImprovement = 0
  let confidence = 0
  
  // Calculate realistic yield improvement based on agricultural practices
  recommendations.forEach(rec => {
    let recImprovement = 0
    let recConfidence = 0
    
    if (rec.priority === 'high') {
      // High priority recommendations have higher impact
      recImprovement = rec.expectedIncrease * 0.75  // 75% effectiveness
      recConfidence = 0.4
    } else if (rec.priority === 'medium') {
      // Medium priority recommendations have moderate impact
      recImprovement = rec.expectedIncrease * 0.6  // 60% effectiveness
      recConfidence = 0.3
    } else {
      // Low priority recommendations have lower impact
      recImprovement = rec.expectedIncrease * 0.4  // 40% effectiveness
      recConfidence = 0.2
    }
    
    // Apply diminishing returns for multiple similar recommendations
    if (totalImprovement > 0) {
      recImprovement = recImprovement * (1 - (totalImprovement * 0.08))  // 8% diminishing returns
    }
    
    totalImprovement += Math.max(0, recImprovement)
    confidence += recConfidence
  })
  
  // Calculate the actual yield improvement percentage
  // This represents the % increase from current yield to improved yield
  const improvementPercentage = Math.min(14, Math.max(2, Math.round(totalImprovement)))
  const finalConfidence = Math.min(100, Math.round(confidence * 100))
  
  // Calculate what the improved yield would be
  const improvedYield = currentYield * (1 + improvementPercentage / 100)
  
  return {
    percentage: improvementPercentage,
    confidence: finalConfidence,
    recommendations: recommendations.length,
    display: `${improvementPercentage}%`,
    calculation: {
      currentYield: currentYield.toFixed(2),
      improvedYield: improvedYield.toFixed(2),
      totalImprovement: totalImprovement.toFixed(1),
      yieldIncrease: (improvedYield - currentYield).toFixed(2)
    }
  }
}

// Fallback static calculation
async function calculateStaticPredictions(soilData, weatherData, crop, month, hectare, location) {
  // Get state from location
  const state = getStateFromLocation(location)
  
  const soilHealthScore = Math.round(
    (soilData.ph >= 6.0 && soilData.ph <= 7.0 ? 25 : 15) +
    (soilData.moisture >= 40 && soilData.moisture <= 70 ? 25 : 15) +
    (soilData.nitrogen >= 20 ? 20 : 10) +
    (soilData.phosphorus >= 15 ? 15 : 8) +
    (soilData.potassium >= 150 ? 15 : 8)
  )

  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length

  let weatherRisk = "Low"
  if (avgTemp > 35 || rainyDays > 4) weatherRisk = "High"
  else if (avgTemp > 30 || rainyDays > 2) weatherRisk = "Medium"

  const baseYield = await getBaseYield(crop, state)
  const soilFactor = soilHealthScore / 100
  const weatherFactor = weatherRisk === "Low" ? 1.1 : weatherRisk === "Medium" ? 1.0 : 0.9
  const predictedYield = Math.round(baseYield * soilFactor * weatherFactor)

  // Calculate yield increase based on soil and weather factors
  const yieldIncreasePercentage = Math.max(0, Math.round((soilFactor * weatherFactor - 1) * 100))
  const yieldIncreaseRange = `${yieldIncreasePercentage}-${yieldIncreasePercentage + 15}%`
  
  // Create yield increase details for breakdown
  const yieldIncreaseDetails = {
    percentage: yieldIncreasePercentage,
    confidence: 75,
    recommendations: 0,
    display: yieldIncreaseRange,
    calculation: {
      currentYield: baseYield.toFixed(2),
      improvedYield: predictedYield.toFixed(1),
      totalImprovement: yieldIncreasePercentage.toFixed(1),
      yieldIncrease: (predictedYield - baseYield).toFixed(2)
    }
  }

  // Create detailed soil health breakdown
  const soilHealthDetails = {
    score: soilHealthScore,
    factors: {
      ph: {
        value: soilData.ph,
        score: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? 25 : 15,
        status: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? "Optimal" : "Suboptimal",
        recommendation: soilData.ph < 6.0 ? "Add lime to increase pH" : soilData.ph > 7.0 ? "Add sulfur to decrease pH" : "pH is optimal"
      },
      moisture: {
        value: soilData.moisture,
        score: soilData.moisture >= 40 && soilData.moisture <= 70 ? 25 : 15,
        status: soilData.moisture >= 40 && soilData.moisture <= 70 ? "Good" : "Needs attention",
        recommendation: soilData.moisture < 40 ? "Increase irrigation" : soilData.moisture > 70 ? "Improve drainage" : "Moisture is optimal"
      },
      nitrogen: {
        value: soilData.nitrogen,
        score: soilData.nitrogen >= 20 ? 20 : 10,
        status: soilData.nitrogen >= 20 ? "Adequate" : "Low",
        recommendation: soilData.nitrogen < 20 ? "Apply nitrogen fertilizer" : "Nitrogen levels are adequate"
      },
      phosphorus: {
        value: soilData.phosphorus,
        score: soilData.phosphorus >= 15 ? 15 : 8,
        status: soilData.phosphorus >= 15 ? "Adequate" : "Low",
        recommendation: soilData.phosphorus < 15 ? "Apply phosphorus fertilizer" : "Phosphorus levels are adequate"
      },
      potassium: {
        value: soilData.potassium,
        score: soilData.potassium >= 150 ? 15 : 8,
        status: soilData.potassium >= 150 ? "Adequate" : "Low",
        recommendation: soilData.potassium < 150 ? "Apply potassium fertilizer" : "Potassium levels are adequate"
      }
    }
  }

  // Create detailed weather risk breakdown
  const weatherRiskDetails = {
    risk: weatherRisk,
    factors: {
      temperature: {
        value: avgTemp.toFixed(1),
        status: avgTemp > 35 ? "High Risk" : avgTemp > 30 ? "Medium Risk" : "Low Risk",
        impact: avgTemp > 35 ? "Heat stress can reduce yield" : avgTemp > 30 ? "Moderate heat stress" : "Temperature is favorable"
      },
      rainfall: {
        value: rainyDays,
        status: rainyDays > 4 ? "High Risk" : rainyDays > 2 ? "Medium Risk" : "Low Risk",
        impact: rainyDays > 4 ? "Excessive rain can cause waterlogging" : rainyDays > 2 ? "Moderate rain risk" : "Rainfall is manageable"
      }
    }
  }

  // Create priority tasks breakdown
  const priorityTasksDetails = {
    count: weatherRisk === "High" ? 3 : weatherRisk === "Medium" ? 1 : 0,
    tasks: weatherRisk === "High" ? [
      "Monitor soil moisture levels daily",
      "Implement drainage system if needed",
      "Apply stress-relief fertilizers"
    ] : weatherRisk === "Medium" ? [
      "Monitor weather conditions closely"
    ] : [
      "Continue regular monitoring"
    ]
  }

  // Add missing fields for frontend compatibility
  soilHealthDetails.riskFactors = []
  soilHealthDetails.recommendations = []
  soilHealthDetails.breakdown = {
    ph: {
      points: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? 25 : 15,
      risk: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? null : `pH ${soilData.ph} is outside optimal range (6.0-7.0)`,
      recommendation: soilData.ph >= 6.0 && soilData.ph <= 7.0 ? "pH is optimal" : (soilData.ph < 6.0 ? "Add lime to increase pH" : "Add sulfur to decrease pH")
    },
    moisture: {
      points: soilData.moisture >= 40 && soilData.moisture <= 70 ? 25 : 15,
      risk: soilData.moisture >= 40 && soilData.moisture <= 70 ? null : `Moisture ${soilData.moisture}% is outside optimal range (40-70%)`,
      recommendation: soilData.moisture >= 40 && soilData.moisture <= 70 ? "Moisture is optimal" : (soilData.moisture < 40 ? "Increase irrigation" : "Improve drainage")
    },
    nitrogen: {
      points: soilData.nitrogen >= 20 ? 20 : 10,
      risk: soilData.nitrogen >= 20 ? null : `Low nitrogen levels (${soilData.nitrogen})`,
      recommendation: soilData.nitrogen >= 20 ? "Nitrogen levels are adequate" : "Apply nitrogen fertilizer"
    },
    phosphorus: {
      points: soilData.phosphorus >= 15 ? 15 : 8,
      risk: soilData.phosphorus >= 15 ? null : `Low phosphorus levels (${soilData.phosphorus})`,
      recommendation: soilData.phosphorus >= 15 ? "Phosphorus levels are adequate" : "Apply phosphorus fertilizer"
    },
    potassium: {
      points: soilData.potassium >= 150 ? 15 : 8,
      risk: soilData.potassium >= 150 ? null : `Low potassium levels (${soilData.potassium})`,
      recommendation: soilData.potassium >= 150 ? "Potassium levels are adequate" : "Apply potassium fertilizer"
    }
  }

  // Populate risk factors and recommendations
  if (soilData.ph < 6.0 || soilData.ph > 7.0) {
    soilHealthDetails.riskFactors.push(`pH ${soilData.ph} is outside optimal range (6.0-7.0)`)
    soilHealthDetails.recommendations.push(soilData.ph < 6.0 ? "Add lime to increase pH" : "Add sulfur to decrease pH")
  }
  if (soilData.moisture < 40 || soilData.moisture > 70) {
    soilHealthDetails.riskFactors.push(`Moisture ${soilData.moisture}% is outside optimal range (40-70%)`)
    soilHealthDetails.recommendations.push(soilData.moisture < 40 ? "Increase irrigation" : "Improve drainage")
  }
  if (soilData.nitrogen < 20) {
    soilHealthDetails.riskFactors.push(`Low nitrogen levels (${soilData.nitrogen})`)
    soilHealthDetails.recommendations.push("Apply nitrogen fertilizer")
  }
  if (soilData.phosphorus < 15) {
    soilHealthDetails.riskFactors.push(`Low phosphorus levels (${soilData.phosphorus})`)
    soilHealthDetails.recommendations.push("Apply phosphorus fertilizer")
  }
  if (soilData.potassium < 150) {
    soilHealthDetails.riskFactors.push(`Low potassium levels (${soilData.potassium})`)
    soilHealthDetails.recommendations.push("Apply potassium fertilizer")
  }

  return {
    predictedYield: Number.parseFloat(predictedYield.toFixed(1)),
    yieldIncrease: yieldIncreaseRange,
    yieldIncreaseDetails: yieldIncreaseDetails,
    soilHealthScore,
    soilHealthDetails: soilHealthDetails,
    weatherRisk,
    weatherRiskDetails: weatherRiskDetails,
    priorityTasks: weatherRisk === "High" ? 3 : weatherRisk === "Medium" ? 1 : 0,
    priorityTasksDetails: priorityTasksDetails,
    confidence: 75
  }
}

// AI-powered fallback function for missing crops
async function getAICropData(crop, state = 'odisha') {
  try {
    // Simulate AI API call with realistic crop data based on agricultural knowledge
    const aiCropDatabase = {
      // Cereals & Grains
      'wheat': { yield: 2.8, trend: 'stable', variability: 0.15, season: 'rabi', waterNeed: 'medium' },
      'barley': { yield: 2.2, trend: 'stable', variability: 0.18, season: 'rabi', waterNeed: 'low' },
      'sorghum': { yield: 1.8, trend: 'stable', variability: 0.20, season: 'kharif', waterNeed: 'low' },
      'pearl_millet': { yield: 1.5, trend: 'stable', variability: 0.22, season: 'kharif', waterNeed: 'low' },
      'foxtail_millet': { yield: 1.2, trend: 'stable', variability: 0.25, season: 'kharif', waterNeed: 'low' },
      'bajra': { yield: 1.4, trend: 'stable', variability: 0.20, season: 'kharif', waterNeed: 'low' },
      
      // Pulses
      'cowpea': { yield: 0.8, trend: 'increasing', variability: 0.25, season: 'kharif', waterNeed: 'low' },
      'kidney_bean': { yield: 1.2, trend: 'stable', variability: 0.22, season: 'rabi', waterNeed: 'medium' },
      'lima_bean': { yield: 1.0, trend: 'stable', variability: 0.24, season: 'kharif', waterNeed: 'medium' },
      'moth_bean': { yield: 0.6, trend: 'stable', variability: 0.28, season: 'kharif', waterNeed: 'low' },
      'cluster_bean': { yield: 0.7, trend: 'stable', variability: 0.26, season: 'kharif', waterNeed: 'low' },
      
      // Oilseeds
      'soybean': { yield: 1.8, trend: 'increasing', variability: 0.20, season: 'kharif', waterNeed: 'medium' },
      'rapeseed': { yield: 1.2, trend: 'increasing', variability: 0.18, season: 'rabi', waterNeed: 'medium' },
      'linseed': { yield: 0.8, trend: 'stable', variability: 0.25, season: 'rabi', waterNeed: 'low' },
      'safflower': { yield: 0.9, trend: 'stable', variability: 0.22, season: 'rabi', waterNeed: 'low' },
      'coconut': { yield: 45.0, trend: 'stable', variability: 0.15, season: 'perennial', waterNeed: 'high' },
      'oil_palm': { yield: 20.0, trend: 'increasing', variability: 0.12, season: 'perennial', waterNeed: 'high' },
      
      // Fiber Crops
      'jute': { yield: 2.8, trend: 'stable', variability: 0.18, season: 'kharif', waterNeed: 'high' },
      'kenaf': { yield: 2.2, trend: 'stable', variability: 0.20, season: 'kharif', waterNeed: 'medium' },
      'flax': { yield: 1.5, trend: 'stable', variability: 0.22, season: 'rabi', waterNeed: 'medium' },
      
      // Commercial Crops
      'sugarcane': { yield: 65.0, trend: 'increasing', variability: 0.12, season: 'perennial', waterNeed: 'very_high' },
      'tobacco': { yield: 1.8, trend: 'stable', variability: 0.20, season: 'rabi', waterNeed: 'medium' },
      'tea': { yield: 2.5, trend: 'stable', variability: 0.15, season: 'perennial', waterNeed: 'high' },
      'coffee': { yield: 0.8, trend: 'stable', variability: 0.18, season: 'perennial', waterNeed: 'medium' },
      'rubber': { yield: 1.2, trend: 'stable', variability: 0.16, season: 'perennial', waterNeed: 'high' },
      
      // Spices & Condiments
      'turmeric': { yield: 8.0, trend: 'increasing', variability: 0.20, season: 'kharif', waterNeed: 'medium' },
      'ginger': { yield: 12.0, trend: 'increasing', variability: 0.18, season: 'kharif', waterNeed: 'medium' },
      'cardamom': { yield: 0.3, trend: 'stable', variability: 0.25, season: 'perennial', waterNeed: 'high' },
      'black_pepper': { yield: 0.8, trend: 'stable', variability: 0.22, season: 'perennial', waterNeed: 'medium' },
      'cinnamon': { yield: 0.5, trend: 'stable', variability: 0.20, season: 'perennial', waterNeed: 'medium' },
      
      // Fruits
      'mango': { yield: 12.0, trend: 'stable', variability: 0.20, season: 'perennial', waterNeed: 'medium' },
      'banana': { yield: 35.0, trend: 'increasing', variability: 0.15, season: 'perennial', waterNeed: 'high' },
      'citrus': { yield: 15.0, trend: 'stable', variability: 0.18, season: 'perennial', waterNeed: 'medium' },
      'guava': { yield: 20.0, trend: 'stable', variability: 0.16, season: 'perennial', waterNeed: 'medium' },
      'papaya': { yield: 45.0, trend: 'increasing', variability: 0.14, season: 'perennial', waterNeed: 'medium' },
      
      // Vegetables (additional)
      'cabbage': { yield: 25.0, trend: 'stable', variability: 0.18, season: 'rabi', waterNeed: 'medium' },
      'cauliflower': { yield: 20.0, trend: 'stable', variability: 0.20, season: 'rabi', waterNeed: 'medium' },
      'carrot': { yield: 30.0, trend: 'increasing', variability: 0.16, season: 'rabi', waterNeed: 'medium' },
      'radish': { yield: 20.0, trend: 'stable', variability: 0.18, season: 'rabi', waterNeed: 'low' },
      'cucumber': { yield: 15.0, trend: 'increasing', variability: 0.20, season: 'kharif', waterNeed: 'high' },
      'pumpkin': { yield: 18.0, trend: 'stable', variability: 0.18, season: 'kharif', waterNeed: 'medium' },
      'okra': { yield: 12.0, trend: 'stable', variability: 0.20, season: 'kharif', waterNeed: 'medium' },
      'spinach': { yield: 8.0, trend: 'stable', variability: 0.22, season: 'rabi', waterNeed: 'medium' },
      'lettuce': { yield: 10.0, trend: 'increasing', variability: 0.20, season: 'rabi', waterNeed: 'medium' },
      'broccoli': { yield: 15.0, trend: 'increasing', variability: 0.18, season: 'rabi', waterNeed: 'medium' }
    }

    // Normalize crop name for lookup
    const normalizedCrop = crop.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    // Try exact match first
    let cropData = aiCropDatabase[normalizedCrop]
    
    // If no exact match, try partial matching
    if (!cropData) {
      for (const [key, data] of Object.entries(aiCropDatabase)) {
        if (key.includes(normalizedCrop) || normalizedCrop.includes(key)) {
          cropData = data
          break
        }
      }
    }

    // If still no match, generate realistic data based on crop type
    if (!cropData) {
      cropData = generateRealisticCropData(crop, state)
    }

    // Adjust for state-specific climate if needed
    cropData = adjustForStateClimate(cropData, crop, state)

    return cropData
  } catch (error) {
    console.error('AI crop data fetch error:', error)
    // Fallback to basic data
    return generateRealisticCropData(crop, state)
  }
}

// Generate realistic crop data when AI database doesn't have the crop
function generateRealisticCropData(crop, state) {
  const cropLower = crop.toLowerCase()
  
  // Categorize crop and assign realistic yields
  let baseYield, trend, variability, season, waterNeed
  
  if (cropLower.includes('wheat') || cropLower.includes('barley')) {
    baseYield = 2.5; trend = 'stable'; variability = 0.15; season = 'rabi'; waterNeed = 'medium'
  } else if (cropLower.includes('sugarcane')) {
    baseYield = 60.0; trend = 'increasing'; variability = 0.12; season = 'perennial'; waterNeed = 'very_high'
  } else if (cropLower.includes('cotton')) {
    baseYield = 0.5; trend = 'stable'; variability = 0.25; season = 'kharif'; waterNeed = 'medium'
  } else if (cropLower.includes('soybean')) {
    baseYield = 1.8; trend = 'increasing'; variability = 0.20; season = 'kharif'; waterNeed = 'medium'
  } else if (cropLower.includes('pulse') || cropLower.includes('gram') || cropLower.includes('dal')) {
    baseYield = 0.8; trend = 'stable'; variability = 0.22; season = 'rabi'; waterNeed = 'low'
  } else if (cropLower.includes('oilseed') || cropLower.includes('mustard') || cropLower.includes('sunflower')) {
    baseYield = 1.0; trend = 'increasing'; variability = 0.20; season = 'rabi'; waterNeed = 'medium'
  } else if (cropLower.includes('fruit') || cropLower.includes('mango') || cropLower.includes('banana')) {
    baseYield = 15.0; trend = 'stable'; variability = 0.18; season = 'perennial'; waterNeed = 'medium'
  } else if (cropLower.includes('vegetable') || cropLower.includes('tomato') || cropLower.includes('potato')) {
    baseYield = 12.0; trend = 'increasing'; variability = 0.20; season = 'rabi'; waterNeed = 'medium'
  } else if (cropLower.includes('spice') || cropLower.includes('turmeric') || cropLower.includes('ginger')) {
    baseYield = 6.0; trend = 'increasing'; variability = 0.22; season = 'kharif'; waterNeed = 'medium'
  } else if (cropLower.includes('amla') || cropLower.includes('neem') || cropLower.includes('tulsi') || cropLower.includes('medicinal')) {
    baseYield = 8.0; trend = 'increasing'; variability = 0.20; season = 'perennial'; waterNeed = 'medium'
  } else {
    // Generic fallback
    baseYield = 2.0; trend = 'stable'; variability = 0.25; season = 'kharif'; waterNeed = 'medium'
  }

  return {
    yield: baseYield,
    trend,
    variability,
    season,
    waterNeed
  }
}

// Adjust crop data for state-specific climate and agricultural conditions
function adjustForStateClimate(cropData, crop, state) {
  const adjusted = { ...cropData }
  const cropLower = crop.toLowerCase()
  const stateLower = state.toLowerCase()
  
  // State-specific climate and agricultural adjustments
  switch (stateLower) {
    case 'odisha':
      // Tropical climate with high humidity and rainfall
      if (cropLower.includes('rice') || cropLower.includes('paddy')) {
        adjusted.yield *= 1.1
        adjusted.trend = 'increasing'
      } else if (cropLower.includes('coconut') || cropLower.includes('banana')) {
        adjusted.yield *= 1.05
      } else if (cropLower.includes('cotton') || cropLower.includes('jute')) {
        adjusted.yield *= 0.9
      } else if (cropLower.includes('wheat') || cropLower.includes('barley')) {
        adjusted.yield *= 0.8
        adjusted.variability *= 1.1
      }
      break
      
    case 'punjab':
    case 'haryana':
      // High productivity states with good irrigation
      if (cropLower.includes('wheat') || cropLower.includes('rice')) {
        adjusted.yield *= 1.3 // High productivity states
        adjusted.trend = 'increasing'
      } else if (cropLower.includes('sugarcane')) {
        adjusted.yield *= 1.2
      } else if (cropLower.includes('cotton')) {
        adjusted.yield *= 1.1
      }
      adjusted.variability *= 0.8 // Lower variability due to good irrigation
      break
      
    case 'uttar_pradesh':
    case 'bihar':
      // Gangetic plains with good soil fertility
      if (cropLower.includes('rice') || cropLower.includes('wheat')) {
        adjusted.yield *= 1.1
        adjusted.trend = 'increasing'
      } else if (cropLower.includes('sugarcane')) {
        adjusted.yield *= 1.15
      } else if (cropLower.includes('mango') || cropLower.includes('litchi')) {
        adjusted.yield *= 1.2 // Good for fruits
      }
      break
      
    case 'maharashtra':
      // Diverse climate - good for sugarcane and cotton
      if (cropLower.includes('sugarcane')) {
        adjusted.yield *= 1.25 // Maharashtra is top sugarcane producer
      } else if (cropLower.includes('cotton')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('grapes') || cropLower.includes('turmeric')) {
        adjusted.yield *= 1.2
      } else if (cropLower.includes('soybean')) {
        adjusted.yield *= 1.15
      }
      break
      
    case 'karnataka':
    case 'tamil_nadu':
    case 'andhra_pradesh':
    case 'telangana':
      // Southern states - good for rice, sugarcane, and tropical crops
      if (cropLower.includes('rice')) {
        adjusted.yield *= 1.2
      } else if (cropLower.includes('sugarcane')) {
        adjusted.yield *= 1.3 // Tamil Nadu has highest sugarcane yield
      } else if (cropLower.includes('coconut') || cropLower.includes('banana')) {
        adjusted.yield *= 1.15
      } else if (cropLower.includes('coffee') || cropLower.includes('tea')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('turmeric') || cropLower.includes('chilli')) {
        adjusted.yield *= 1.1
      }
      break
      
    case 'gujarat':
      // Good for groundnut, cotton, and cumin
      if (cropLower.includes('groundnut')) {
        adjusted.yield *= 1.2
      } else if (cropLower.includes('cotton')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('cumin') || cropLower.includes('castor')) {
        adjusted.yield *= 1.15
      } else if (cropLower.includes('bajra')) {
        adjusted.yield *= 1.1
      }
      break
      
    case 'rajasthan':
      // Arid climate - good for drought-resistant crops
      if (cropLower.includes('bajra') || cropLower.includes('jowar')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('mustard') || cropLower.includes('cumin')) {
        adjusted.yield *= 1.05
      } else if (cropLower.includes('wheat')) {
        adjusted.yield *= 0.9 // Less suitable for wheat
        adjusted.variability *= 1.2
      } else if (cropLower.includes('rice')) {
        adjusted.yield *= 0.7 // Not suitable for rice
        adjusted.variability *= 1.3
      }
      break
      
    case 'west_bengal':
      // Good for rice, jute, and potato
      if (cropLower.includes('rice')) {
        adjusted.yield *= 1.15
      } else if (cropLower.includes('jute')) {
        adjusted.yield *= 1.2
      } else if (cropLower.includes('potato')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('tea')) {
        adjusted.yield *= 1.1
      }
      break
      
    case 'madhya_pradesh':
      // Good for soybean, wheat, and pulses
      if (cropLower.includes('soybean')) {
        adjusted.yield *= 1.2
      } else if (cropLower.includes('wheat')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('chickpea') || cropLower.includes('lentil')) {
        adjusted.yield *= 1.1
      } else if (cropLower.includes('mustard')) {
        adjusted.yield *= 1.05
      }
      break
      
    default:
      // Generic adjustment for other states
      if (cropLower.includes('rice')) {
        adjusted.yield *= 1.05
      } else if (cropLower.includes('wheat')) {
        adjusted.yield *= 1.0
      }
      break
  }
  
  return adjusted
}

// Enhanced getBaseYield function with AI fallback for all states
async function getBaseYield(crop, state = 'odisha') {
  // First check if crop exists in state-specific data
  let stateData
  if (state === 'odisha') {
    // Use dedicated Odisha database for Odisha
    stateData = getOdishaHistoricalYieldData(crop, 'odisha')
  } else {
    // Use multi-state database for other states
    stateData = getMultiStateHistoricalYieldData(crop, state)
  }
  
  if (stateData && stateData.averageYield) {
    return stateData.averageYield
  }
  
  // If not found, use AI fallback
  try {
    const aiData = await getAICropData(crop, state)
    return aiData.yield
  } catch (error) {
    console.error('Error getting AI crop data:', error)
    // Final fallback
    return 2.0
  }
}

// Synchronous version for backward compatibility
function getBaseYieldSync(crop, state = 'odisha') {
  // First check if crop exists in state-specific data
  let stateData
  if (state === 'odisha') {
    // Use dedicated Odisha database for Odisha
    stateData = getOdishaHistoricalYieldData(crop, 'odisha')
  } else {
    // Use multi-state database for other states
    stateData = getMultiStateHistoricalYieldData(crop, state)
  }
  
  if (stateData && stateData.averageYield) {
    return stateData.averageYield
  }
  
  // Use AI fallback synchronously (with cached data)
  const aiData = getAICropData(crop, state)
  return aiData.yield || 2.0
}

// Enhanced function to get comprehensive crop information for all states
async function getCropInfo(crop, state = 'odisha') {
  try {
    // First check if crop exists in state-specific data
    let stateData
    if (state === 'odisha') {
      // Use dedicated Odisha database for Odisha
      stateData = getOdishaHistoricalYieldData(crop, 'odisha')
    } else {
      // Use multi-state database for other states
      stateData = getMultiStateHistoricalYieldData(crop, state)
    }
    
    if (stateData && stateData.averageYield) {
      return {
        ...stateData,
        source: 'state_database',
        isStateSpecific: true,
        state: state
      }
    }
    
    // If not found, use AI fallback
    const aiData = await getAICropData(crop, state)
    return {
      averageYield: aiData.yield,
      trend: aiData.trend,
      variability: aiData.variability,
      season: aiData.season,
      waterNeed: aiData.waterNeed,
      source: 'ai_fallback',
      isStateSpecific: false,
      state: state,
      aiGenerated: true
    }
  } catch (error) {
    console.error('Error getting crop info:', error)
    return {
      averageYield: 2.0,
      trend: 'stable',
      variability: 0.25,
      season: 'kharif',
      waterNeed: 'medium',
      source: 'fallback',
      isStateSpecific: false,
      state: state,
      aiGenerated: false
    }
  }
}
