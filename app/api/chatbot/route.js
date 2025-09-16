export async function POST(request) {
  try {
    const { message, userData, analysisData, locale } = await request.json()

    console.log("[Chatbot] Processing message:", message)
    console.log("[Chatbot] User data:", userData)
    console.log("[Chatbot] Analysis data available:", !!analysisData)

    // Simple intent recognition
    const intent = recognizeIntent(message)
    
    // Generate AI-enhanced response with real data
    const { origin } = new URL(request.url)
    const response = await generateAIEnhancedResponse(intent, message, userData, analysisData, origin, locale)

    return Response.json({
      success: true,
      response: response.content,
      intent: intent,
      suggestions: response.suggestions || [],
      dataUsed: response.dataUsed || []
    })
  } catch (error) {
    console.error("[Chatbot] Error:", error)
    return Response.json({ 
      success: false, 
      error: "Failed to process chatbot request" 
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ ok: true, route: 'chatbot' })
}

function recognizeIntent(message) {
  const lowerMessage = message.toLowerCase()
  
  // Crop-related intents
  if (lowerMessage.includes('crop') || lowerMessage.includes('plant') || lowerMessage.includes('grow')) {
    return 'crop_recommendation'
  }
  
  // Soil-related intents
  if (lowerMessage.includes('soil') || lowerMessage.includes('ph') || lowerMessage.includes('nutrient')) {
    return 'soil_analysis'
  }
  
  // Weather-related intents
  if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('temperature')) {
    return 'weather_info'
  }
  
  // Irrigation-related intents
  if (lowerMessage.includes('water') || lowerMessage.includes('irrigation') || lowerMessage.includes('drip')) {
    return 'irrigation_advice'
  }
  
  // Fertilizer-related intents
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('npk') || lowerMessage.includes('nutrient')) {
    return 'fertilizer_advice'
  }
  
  // Yield-related intents
  if (lowerMessage.includes('yield') || lowerMessage.includes('production') || lowerMessage.includes('harvest')) {
    return 'yield_prediction'
  }
  
  // Pest-related intents
  if (lowerMessage.includes('pest') || lowerMessage.includes('disease') || lowerMessage.includes('insect')) {
    return 'pest_management'
  }
  
  // General farming advice
  if (lowerMessage.includes('advice') || lowerMessage.includes('help') || lowerMessage.includes('suggestion')) {
    return 'general_advice'
  }
  
  return 'general_inquiry'
}

async function generateAIEnhancedResponse(intent, message, userData, analysisData, baseUrl, locale = 'en') {
  // Use real data if available
  if (analysisData) {
    return await generateDynamicDataDrivenResponse(intent, message, userData, analysisData, locale)
  }

  // Try to fetch soil and weather dynamically if we have a location
  try {
    if (userData?.location && baseUrl) {
      const month = (userData.month || new Date().toLocaleDateString('en-US', { month: 'long' })).toLowerCase()
      const available = await getAvailableDataForLocationServer(userData.location, month, baseUrl)
      const constructed = {
        predictions: null,
        soilData: available.soilData || null,
        weatherData: available.weatherData || null,
        marketAnalysis: null,
        recommendations: null
      }
      if (constructed.soilData || constructed.weatherData) {
        return await generateDynamicDataDrivenResponse(intent, message, userData, constructed, locale)
      }
    }
  } catch (e) {
    console.warn('Failed to build dynamic data:', e?.message || e)
  }

  // Last resort: attempt Groq-only answer, else ask for minimal info
  return await generateChatbotResponse(intent, message, userData, baseUrl, locale)
}

// Server-side helper to fetch soil and weather from sibling routes
async function getAvailableDataForLocationServer(location, month, baseUrl) {
  const headers = { 'Content-Type': 'application/json' }
  let weatherData = null
  let soilData = null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  const weatherPromise = fetch(`${baseUrl}/api/weather`, { method: 'POST', headers, body: JSON.stringify({ location, month }), signal: controller.signal })
  const soilPromise = fetch(`${baseUrl}/api/soil`, { method: 'POST', headers, body: JSON.stringify({ location, month }), signal: controller.signal })

  const [weatherRes, soilRes] = await Promise.allSettled([weatherPromise, soilPromise]).finally(() => clearTimeout(timeout))

  if (weatherRes.status === 'fulfilled') {
    try {
      if (weatherRes.value.ok) {
        const w = await weatherRes.value.json()
        weatherData = w.weatherData || null
      } else {
        const t = await weatherRes.value.text().catch(() => '<no body>')
        console.warn('Weather API non-OK:', weatherRes.value.status, t)
      }
    } catch (e) { console.warn('Weather parse error:', e?.message || e) }
  } else {
    console.warn('Weather fetch failed:', weatherRes.reason?.message || weatherRes.reason)
  }

  if (soilRes.status === 'fulfilled') {
    try {
      if (soilRes.value.ok) {
        const s = await soilRes.value.json()
        soilData = s.data || null
      } else {
        const t = await soilRes.value.text().catch(() => '<no body>')
        console.warn('Soil API non-OK:', soilRes.value.status, t)
      }
    } catch (e) { console.warn('Soil parse error:', e?.message || e) }
  } else {
    console.warn('Soil fetch failed:', soilRes.reason?.message || soilRes.reason)
  }

  return { location, month, weatherData, soilData }
}

async function generateDynamicDataDrivenResponse(intent, message, userData, analysisData, locale = 'en') {
  const { predictions, soilData, weatherData, marketAnalysis, recommendations } = analysisData
  const dataUsed = []
  
  // Get current timestamp for dynamic context
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' })
  const currentHour = currentDate.getHours()
  
  // Calculate dynamic values based on real data
  const avgTemp = weatherData && weatherData.length > 0 ? 
    Math.round(weatherData.reduce((sum, day) => sum + (day.tempValue || 0), 0) / weatherData.length) : 25
  
  const rainyDays = weatherData && weatherData.length > 0 ? 
    weatherData.filter(day => (day.rainValue || 0) > 0).length : 0
    
  const soilPh = soilData?.ph || 7.0
  const soilMoisture = soilData?.moisture || 50
  const expectedYield = predictions?.predictedYield || 3.0

  // Derive region/country if available
  const region = analysisData.locationData?.region || analysisData.locationData?.state || ''
  const country = analysisData.locationData?.country || ''

  // Derive climate from avgTemp & rainyDays
  const climate = avgTemp >= 30 ? 'warm' : avgTemp <= 15 ? 'cool' : 'temperate'

  // Derive soil type roughly from texture or moisture if present
  const soilType = soilData?.texture?.sand ? (soilData.texture.sand > 50 ? 'sandy' : soilData.texture.clay > 35 ? 'clay' : 'loamy') : 'loamy'

  // Current season
  const monthIdx = currentDate.getMonth() + 1
  const season = monthIdx >= 3 && monthIdx <= 5 ? 'spring' : monthIdx >= 6 && monthIdx <= 8 ? 'summer' : monthIdx >= 9 && monthIdx <= 11 ? 'autumn' : 'winter'
  
  // Generate dynamic alerts based on current conditions
  let alerts = []
  let yieldMethods = []
  
  // Weather-based dynamic alerts
  if (avgTemp > 35) {
    alerts.push({
      type: "urgent",
      message: `🌡️ High temperature alert! Current: ${avgTemp}°C`,
      action: "Increase irrigation frequency and apply mulch immediately",
      details: `Temperature is ${avgTemp}°C which is above optimal range. Your crops may experience heat stress. Water 2-3 times daily and apply organic mulch to retain soil moisture.`,
      clickable: true
    })
  }
  
  if (rainyDays > 4) {
    alerts.push({
      type: "medium", 
      message: `🌧️ High rainfall expected (${rainyDays} rainy days this week)`,
      action: "Ensure proper drainage and avoid field operations",
      details: `You have ${rainyDays} rainy days this week. Excessive rainfall can cause waterlogging. Check drainage systems, postpone field activities, and monitor for fungal diseases.`,
      clickable: true
    })
  }
  
  // Soil-based dynamic alerts
  if (soilPh < 6.5) {
    alerts.push({
      type: "high",
      message: `⚠️ Soil pH is low (${soilPh}) - needs correction`,
      action: "Apply 2-3 tons lime per hectare",
      details: `Your soil pH is ${soilPh} which is below the optimal range of 6.5-7.5. This affects nutrient availability. Apply agricultural lime at 2-3 tons per hectare and test again in 2-3 weeks.`,
      clickable: true
    })
  }
  
  if (soilMoisture < 40) {
    alerts.push({
      type: "urgent",
      message: `🚨 Critical soil moisture! Current: ${soilMoisture}%`,
      action: "Apply 5-7 cm irrigation water immediately",
      details: `Soil moisture at ${soilMoisture}% is critically low. Your crops are under water stress. Apply 5-7 cm irrigation water immediately and monitor soil moisture daily.`,
      clickable: true
    })
  }
  
  // Generate dynamic yield methods based on current conditions
  if (expectedYield < 4.0) {
    yieldMethods.push({
      category: "Soil Management",
      methods: [
        `Apply 120-150 kg N/hectare in 3 splits (current yield: ${expectedYield}t/ha)`,
        `Use 60-80 kg P2O5/hectare at sowing`,
        `Apply 40-60 kg K2O/hectare`,
        `Add 5-10 tons farmyard manure per hectare`
      ],
      clickable: true
    })
    
    yieldMethods.push({
      category: "Irrigation Management", 
      methods: [
        `Critical irrigation at crown root initiation (21-25 DAS)`,
        `Irrigate at flowering stage (60-65 DAS)`,
        `Apply irrigation at grain filling stage (85-90 DAS)`,
        `Use sprinkler irrigation for 20-25% water saving`
      ],
      clickable: true
    })
  }
  
  let response = ""
  
  // Add location context
  if (userData.location) {
    response += `📍 **Dynamic Analysis for ${userData.location}:**\n\n`
    dataUsed.push("location")
  }
  
  // Try to get AI response from Groq first
  let aiResponse = null
  try {
    const systemPrompt = `You are CropWiseAI, an intelligent farming assistant. Answer in ${locale} language. You help farmers with:

1. Crop recommendations and planning
2. Soil analysis and improvement
3. Weather information and farming impact
4. Irrigation and water management
5. Fertilizer and nutrient advice
6. Yield predictions and optimization
7. Pest and disease management
8. Market insights and pricing

Current context:
- Location: ${userData.location || 'Not specified'}${region || country ? ` (${[region, country].filter(Boolean).join(', ')})` : ''}
- Climate: ${climate}
- Soil Type: ${soilType}
- Current Season: ${season}
- Previous Crop: ${userData.previousCrop || 'Not specified'}
- Crop: ${userData.crop || 'Not specified'}
- Farm Size: ${userData.hectare || 'Not specified'} hectares
- Month: ${userData.month || 'Not specified'}

${analysisData ? `
Available data:
- Soil pH: ${analysisData.soilData?.ph || 'N/A'}
- Soil Moisture: ${analysisData.soilData?.moisture || 'N/A'}%
- Temperature: ${avgTemp}°C
- Rainy Days: ${rainyDays}
- Expected Yield: ${analysisData.predictions?.predictedYield || 'N/A'} tons/hectare
- Weather Risk: ${analysisData.predictions?.weatherRisk || 'N/A'}
` : ''}

Provide detailed, practical, and actionable farming advice. Use simple language that farmers can understand. Include specific recommendations, quantities, and timing. Be encouraging and supportive.

If essential details are missing, ask 1–2 concise follow-up questions tailored to the user's goal. Prefer inferring from context; only ask for information that is truly required to give a precise answer. Avoid generic checklists.`

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not set')
    }
    const groqController = new AbortController()
    const groqTimeout = setTimeout(() => groqController.abort(), 8000)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      }),
      signal: groqController.signal
    }).finally(() => clearTimeout(groqTimeout))

    if (groqResponse.ok) {
      const groqData = await groqResponse.json()
      aiResponse = groqData.choices[0].message.content
    } else {
      const errorText = await groqResponse.text().catch(() => '<no body>')
      console.warn('Groq AI non-OK response:', groqResponse.status, errorText)
    }
  } catch (error) {
    console.error('Error calling Groq AI:', error)
  }

  // Use AI response if available, otherwise fallback to dynamic functions
  if (aiResponse) {
    response += aiResponse
    response += `\n\n📊 **Real-Time Analysis (${currentMonth} ${currentDate.getDate()}, ${currentHour.toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}):**\n`
    response += `• Current Temperature: ${avgTemp}°C\n`
    response += `• Rainy Days This Week: ${rainyDays}\n`
    response += `• Soil pH: ${soilPh}\n`
    response += `• Soil Moisture: ${soilMoisture}%\n`
    response += `• Expected Yield: ${expectedYield}t/ha\n`
  } else {
    // Fallback to dynamic response functions
    switch (intent) {
      case 'crop_recommendation':
        response += generateDynamicCropRecommendation(userData, analysisData, currentMonth, avgTemp, rainyDays, dataUsed)
        break
      case 'soil_analysis':
        response += generateDynamicSoilAnalysis(soilData, weatherData, alerts, dataUsed)
        break
      case 'weather_info':
        response += generateDynamicWeatherInfo(weatherData, predictions, currentHour, avgTemp, rainyDays, dataUsed)
        break
      case 'irrigation_advice':
        response += generateDynamicIrrigationAdvice(soilData, weatherData, recommendations, soilMoisture, avgTemp, dataUsed)
        break
      case 'fertilizer_advice':
        response += generateDynamicFertilizerAdvice(soilData, recommendations, soilPh, dataUsed)
        break
      case 'yield_prediction':
        response += generateDynamicYieldPrediction(predictions, soilData, weatherData, yieldMethods, expectedYield, dataUsed)
        break
      case 'pest_management':
        response += generateDynamicPestManagement(weatherData, soilData, predictions, avgTemp, rainyDays, dataUsed)
        break
      default:
        response += generateDynamicGeneralAdvice(analysisData, message, alerts, yieldMethods, dataUsed)
    }
  }
  
  // Add data source information
  if (dataUsed.length > 0) {
    response += `\n\n📊 **Data Sources Used:** ${dataUsed.join(", ")}`
  }
  
  return {
    content: response,
    dataUsed: dataUsed,
    alerts: alerts,
    yieldMethods: yieldMethods,
    dynamicData: {
      currentTemp: avgTemp,
      rainyDays,
      soilPh,
      soilMoisture,
      expectedYield,
      currentMonth,
      currentHour
    }
  }
}

function generateDataDrivenResponse(intent, message, userData, analysisData) {
  const { predictions, soilData, weatherData, marketAnalysis, recommendations } = analysisData
  const dataUsed = []
  
  let response = ""
  
  // Add location context
  if (userData.location) {
    response += `📍 **Location Analysis for ${userData.location}:**\n\n`
    dataUsed.push("location")
  }
  
  // Intent-specific responses with real data
  switch (intent) {
    case 'crop_recommendation':
      response += generateCropRecommendationWithData(userData, analysisData, dataUsed)
      break
    case 'soil_analysis':
      response += generateSoilAnalysisWithData(soilData, dataUsed)
      break
    case 'weather_info':
      response += generateWeatherInfoWithData(weatherData, dataUsed)
      break
    case 'irrigation_advice':
      response += generateIrrigationAdviceWithData(soilData, weatherData, recommendations, dataUsed)
      break
    case 'fertilizer_advice':
      response += generateFertilizerAdviceWithData(soilData, recommendations, dataUsed)
      break
    case 'yield_prediction':
      response += generateYieldPredictionWithData(predictions, analysisData, dataUsed)
      break
    case 'pest_management':
      response += generatePestManagementWithData(weatherData, soilData, dataUsed)
      break
    default:
      response += generateGeneralAdviceWithData(analysisData, dataUsed)
  }
  
  // Add data source information
  if (dataUsed.length > 0) {
    response += `\n\n📊 **Data Sources Used:** ${dataUsed.join(", ")}`
  }
  
  return {
    content: response,
    dataUsed: dataUsed
  }
}

function generateCropRecommendationWithData(userData, analysisData, dataUsed) {
  let response = ""
  
  if (analysisData.predictions) {
    response += `🌱 **Crop Analysis for ${userData.crop || 'your selected crop'}:**\n`
    response += `• Expected Yield: ${analysisData.predictions.predictedYield} tons/hectare\n`
    response += `• Confidence Level: ${analysisData.predictions.confidence}%\n`
    response += `• Weather Risk: ${analysisData.predictions.weatherRisk}\n\n`
    dataUsed.push("predictions")
  }
  
  if (analysisData.soilData) {
    response += `🌍 **Soil Suitability:**\n`
    response += `• pH Level: ${analysisData.soilData.ph} (${getSoilPhStatus(analysisData.soilData.ph)})\n`
    response += `• Moisture: ${analysisData.soilData.moisture}% (${getMoistureStatus(analysisData.soilData.moisture)})\n`
    response += `• Nutrients: N-${analysisData.soilData.nitrogen}, P-${analysisData.soilData.phosphorus}, K-${analysisData.soilData.potassium}\n\n`
    dataUsed.push("soil")
  }
  
  if (analysisData.marketAnalysis) {
    response += `💰 **Market Outlook:**\n`
    response += `• Current Price: ₹${analysisData.marketAnalysis.currentPrice}/quintal\n`
    response += `• Price Trend: ${analysisData.marketAnalysis.trend}\n`
    response += `• Expected Revenue: ₹${analysisData.marketAnalysis.expectedRevenue.toLocaleString()}\n\n`
    dataUsed.push("market")
  }
  
  response += `✅ **Recommendation:** Based on current conditions, ${userData.crop || 'your crop'} is suitable for cultivation with proper management.`
  
  return response
}

function generateSoilAnalysisWithData(soilData, dataUsed) {
  if (!soilData) return "Soil data not available for your location."
  
  let response = `🌍 **Real-Time Soil Analysis:**\n\n`
  response += `• **pH Level:** ${soilData.ph} (${getSoilPhStatus(soilData.ph)})\n`
  response += `• **Moisture:** ${soilData.moisture}% (${getMoistureStatus(soilData.moisture)})\n`
  response += `• **Nitrogen:** ${soilData.nitrogen} (${getNutrientStatus(soilData.nitrogen, 'nitrogen')})\n`
  response += `• **Phosphorus:** ${soilData.phosphorus} (${getNutrientStatus(soilData.phosphorus, 'phosphorus')})\n`
  response += `• **Potassium:** ${soilData.potassium} (${getNutrientStatus(soilData.potassium, 'potassium')})\n`
  response += `• **Organic Matter:** ${soilData.organicMatter}%\n\n`
  
  response += `🔧 **Recommendations:**\n`
  if (soilData.ph < 6.0) response += `• Add lime to increase pH\n`
  if (soilData.ph > 8.0) response += `• Add sulfur to decrease pH\n`
  if (soilData.moisture < 40) response += `• Increase irrigation frequency\n`
  if (soilData.moisture > 80) response += `• Improve drainage\n`
  if (soilData.nitrogen < 50) response += `• Apply nitrogen-rich fertilizer\n`
  if (soilData.phosphorus < 30) response += `• Add phosphorus fertilizer\n`
  if (soilData.potassium < 100) response += `• Apply potassium fertilizer\n`
  
  dataUsed.push("soil")
  return response
}

function generateWeatherInfoWithData(weatherData, dataUsed) {
  if (!weatherData || weatherData.length === 0) return "Weather data not available for your location."
  
  let response = `🌤️ **Current Weather Conditions:**\n\n`
  
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || 0), 0) / weatherData.length
  const rainyDays = weatherData.filter(day => (day.rainValue || 0) > 0).length
  const totalRain = weatherData.reduce((sum, day) => sum + (day.rainValue || 0), 0)
  
  response += `• **Average Temperature:** ${Math.round(avgTemp)}°C\n`
  response += `• **Rainy Days This Week:** ${rainyDays}\n`
  response += `• **Total Rainfall:** ${totalRain}mm\n\n`
  
  response += `📅 **7-Day Forecast:**\n`
  weatherData.slice(0, 7).forEach(day => {
    response += `• ${day.day}: ${day.temp} - ${day.condition} (${day.rain})\n`
  })
  
  response += `\n🌾 **Farming Impact:**\n`
  if (avgTemp > 35) response += `• High temperature - increase irrigation\n`
  if (avgTemp < 15) response += `• Low temperature - protect crops from frost\n`
  if (rainyDays > 4) response += `• High rainfall - watch for waterlogging\n`
  if (totalRain < 10) response += `• Low rainfall - irrigation needed\n`
  
  dataUsed.push("weather")
  return response
}

function generateIrrigationAdviceWithData(soilData, weatherData, recommendations, dataUsed) {
  let response = `💧 **Smart Irrigation Plan:**\n\n`
  
  if (soilData) {
    response += `🌍 **Based on Soil Conditions:**\n`
    response += `• Current moisture: ${soilData.moisture}%\n`
    if (soilData.moisture < 40) {
      response += `• ⚠️ Low moisture - immediate irrigation needed\n`
    } else if (soilData.moisture > 70) {
      response += `• ✅ Good moisture levels - reduce irrigation\n`
    } else {
      response += `• ✅ Optimal moisture - maintain current schedule\n`
    }
    dataUsed.push("soil")
  }
  
  if (weatherData) {
    const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || 0), 0) / weatherData.length
    const rainyDays = weatherData.filter(day => (day.rainValue || 0) > 0).length
    
    response += `\n🌤️ **Based on Weather Forecast:**\n`
    response += `• Average temperature: ${Math.round(avgTemp)}°C\n`
    response += `• Rainy days: ${rainyDays}\n`
    
    if (avgTemp > 30 && rainyDays < 2) {
      response += `• 🔥 Hot and dry - increase irrigation frequency\n`
    } else if (rainyDays > 3) {
      response += `• 🌧️ Wet period - reduce irrigation\n`
    } else {
      response += `• ✅ Normal conditions - maintain regular schedule\n`
    }
    dataUsed.push("weather")
  }
  
  if (recommendations && recommendations.irrigation) {
    response += `\n🔧 **Recommended System:**\n`
    response += `• Type: ${recommendations.irrigation.type}\n`
    response += `• Efficiency: ${recommendations.irrigation.efficiency}\n`
    response += `• Description: ${recommendations.irrigation.description}\n`
    dataUsed.push("recommendations")
  }
  
  return response
}

function generateFertilizerAdviceWithData(soilData, recommendations, dataUsed) {
  let response = `🌿 **Precision Fertilizer Plan:**\n\n`
  
  if (soilData) {
    response += `🌍 **Based on Soil Analysis:**\n`
    response += `• Nitrogen: ${soilData.nitrogen} (${getNutrientStatus(soilData.nitrogen, 'nitrogen')})\n`
    response += `• Phosphorus: ${soilData.phosphorus} (${getNutrientStatus(soilData.phosphorus, 'phosphorus')})\n`
    response += `• Potassium: ${soilData.potassium} (${getNutrientStatus(soilData.potassium, 'potassium')})\n\n`
    
    response += `📋 **Fertilizer Recommendations:**\n`
    if (soilData.nitrogen < 50) response += `• Apply 50-75 kg N/hectare\n`
    if (soilData.phosphorus < 30) response += `• Apply 25-40 kg P2O5/hectare\n`
    if (soilData.potassium < 100) response += `• Apply 40-60 kg K2O/hectare\n`
    dataUsed.push("soil")
  }
  
  if (recommendations && recommendations.fertilizer) {
    response += `\n🔧 **Application Details:**\n`
    response += `• Type: ${recommendations.fertilizer.type}\n`
    response += `• Method: ${recommendations.fertilizer.application}\n`
    response += `• Timing: ${recommendations.fertilizer.timing}\n`
    dataUsed.push("recommendations")
  }
  
  return response
}

function generateYieldPredictionWithData(predictions, analysisData, dataUsed) {
  if (!predictions) return "Yield prediction data not available."
  
  let response = `📈 **Yield Prediction Analysis:**\n\n`
  response += `• **Expected Yield:** ${predictions.predictedYield} tons/hectare\n`
  response += `• **Confidence Level:** ${predictions.confidence}%\n`
  response += `• **Weather Risk:** ${predictions.weatherRisk}\n`
  response += `• **Soil Health Score:** ${predictions.soilHealthScore}\n\n`
  
  if (analysisData.marketAnalysis) {
    response += `💰 **Revenue Projection:**\n`
    response += `• Expected Revenue: ₹${analysisData.marketAnalysis.expectedRevenue.toLocaleString()}\n`
    response += `• Current Market Price: ₹${analysisData.marketAnalysis.currentPrice}/quintal\n`
    response += `• Price Trend: ${analysisData.marketAnalysis.trend}\n\n`
    dataUsed.push("market")
  }
  
  response += `🎯 **Optimization Tips:**\n`
  if (predictions.confidence < 70) response += `• Improve data accuracy for better predictions\n`
  if (predictions.weatherRisk === 'High') response += `• Implement weather protection measures\n`
  if (predictions.soilHealthScore < 60) response += `• Focus on soil health improvement\n`
  
  dataUsed.push("predictions")
  return response
}

function generatePestManagementWithData(weatherData, soilData, dataUsed) {
  let response = `🐛 **Integrated Pest Management:**\n\n`
  
  if (weatherData) {
    const avgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || 60), 0) / weatherData.length
    const rainyDays = weatherData.filter(day => (day.rainValue || 0) > 0).length
    
    response += `🌤️ **Weather-Based Risk Assessment:**\n`
    response += `• Average Humidity: ${Math.round(avgHumidity)}%\n`
    response += `• Rainy Days: ${rainyDays}\n\n`
    
    if (avgHumidity > 70) {
      response += `⚠️ **High Risk Period:**\n`
      response += `• High humidity increases pest activity\n`
      response += `• Monitor crops daily for pest signs\n`
      response += `• Apply preventive treatments\n`
    } else if (rainyDays > 3) {
      response += `🌧️ **Wet Period Alert:**\n`
      response += `• Fungal diseases risk is high\n`
      response += `• Ensure proper drainage\n`
      response += `• Apply fungicide if needed\n`
    } else {
      response += `✅ **Low Risk Period:**\n`
      response += `• Normal pest monitoring schedule\n`
      response += `• Weekly inspection recommended\n`
    }
    dataUsed.push("weather")
  }
  
  if (soilData) {
    response += `\n🌍 **Soil Health Impact:**\n`
    response += `• Soil pH: ${soilData.ph} (${getSoilPhStatus(soilData.ph)})\n`
    response += `• Organic Matter: ${soilData.organicMatter}%\n\n`
    
    if (soilData.organicMatter > 3) {
      response += `✅ **Healthy Soil:** Good organic matter supports beneficial insects\n`
    } else {
      response += `⚠️ **Improve Soil:** Add organic matter to boost natural pest control\n`
    }
    dataUsed.push("soil")
  }
  
  response += `\n🔧 **Management Strategy:**\n`
  response += `• Use resistant crop varieties\n`
  response += `• Implement crop rotation\n`
  response += `• Apply biological controls\n`
  response += `• Monitor pest populations regularly\n`
  
  return response
}

function generateGeneralAdviceWithData(analysisData, dataUsed) {
  let response = `🤖 **AI-Enhanced Farming Advice:**\n\n`
  
  if (analysisData.predictions) {
    response += `📊 **Current Farm Status:**\n`
    response += `• Yield Potential: ${analysisData.predictions.predictedYield} tons/hectare\n`
    response += `• Confidence: ${analysisData.predictions.confidence}%\n`
    response += `• Weather Risk: ${analysisData.predictions.weatherRisk}\n\n`
    dataUsed.push("predictions")
  }
  
  if (analysisData.soilData) {
    response += `🌍 **Soil Health:**\n`
    response += `• pH: ${analysisData.soilData.ph} (${getSoilPhStatus(analysisData.soilData.ph)})\n`
    response += `• Moisture: ${analysisData.soilData.moisture}% (${getMoistureStatus(analysisData.soilData.moisture)})\n`
    response += `• Nutrients: N-${analysisData.soilData.nitrogen}, P-${analysisData.soilData.phosphorus}, K-${analysisData.soilData.potassium}\n\n`
    dataUsed.push("soil")
  }
  
  if (analysisData.weatherData) {
    const avgTemp = analysisData.weatherData.reduce((sum, day) => sum + (day.tempValue || 0), 0) / analysisData.weatherData.length
    response += `🌤️ **Weather Conditions:**\n`
    response += `• Temperature: ${Math.round(avgTemp)}°C\n`
    response += `• Rainy Days: ${analysisData.weatherData.filter(day => (day.rainValue || 0) > 0).length}\n\n`
    dataUsed.push("weather")
  }
  
  response += `💡 **Smart Recommendations:**\n`
  response += `• Monitor conditions daily\n`
  response += `• Adjust practices based on real-time data\n`
  response += `• Focus on soil health improvement\n`
  response += `• Plan irrigation based on weather forecast\n`
  
  return response
}

// Helper functions
function getSoilPhStatus(ph) {
  if (ph < 6.0) return "Acidic - needs lime"
  if (ph > 8.0) return "Alkaline - needs sulfur"
  return "Optimal"
}

function getMoistureStatus(moisture) {
  if (moisture < 40) return "Low - needs irrigation"
  if (moisture > 70) return "High - good for growth"
  return "Moderate"
}

function getNutrientStatus(value, nutrient) {
  const thresholds = {
    nitrogen: { low: 30, high: 70 },
    phosphorus: { low: 20, high: 50 },
    potassium: { low: 80, high: 150 }
  }
  
  const threshold = thresholds[nutrient] || { low: 30, high: 70 }
  
  if (value < threshold.low) return "Low - needs fertilizer"
  if (value > threshold.high) return "High - reduce application"
  return "Optimal"
}

async function generateChatbotResponse(intent, message, userData, baseUrl, locale = 'en') {
  // Try to get AI response from Groq first
  try {
    const systemPrompt = `You are CropWiseAI, an intelligent farming assistant. Answer in ${locale} language. You help farmers with:

1. Crop recommendations and planning
2. Soil analysis and improvement
3. Weather information and farming impact
4. Irrigation and water management
5. Fertilizer and nutrient advice
6. Yield predictions and optimization
7. Pest and disease management
8. Market insights and pricing

Current context:
- Location: ${userData.location || 'Not specified'}
- Crop: ${userData.crop || 'Not specified'}
- Farm Size: ${userData.hectare || 'Not specified'} hectares
- Month: ${userData.month || 'Not specified'}

Provide detailed, practical, and actionable farming advice. Use simple language that farmers can understand. Include specific recommendations, quantities, and timing. Be encouraging and supportive.`

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not set')
    }
    const groqController = new AbortController()
    const groqTimeout = setTimeout(() => groqController.abort(), 8000)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      }),
      signal: groqController.signal
    }).finally(() => clearTimeout(groqTimeout))

    if (groqResponse.ok) {
      const groqData = await groqResponse.json()
      return {
        content: groqData.choices[0].message.content,
        suggestions: [
          "Tell me more about this topic",
          "What are the best practices?",
          "How can I improve my farming?"
        ]
      }
    } else {
      const errorText = await groqResponse.text().catch(() => '<no body>')
      console.warn('Groq AI fallback non-OK:', groqResponse.status, errorText)
    }
  } catch (error) {
    console.error('Error calling Groq AI for fallback:', error)
  }

  // Strictly dynamic fallback: try internal APIs based on provided context
  try {
    if (userData?.location && baseUrl) {
      const month = (userData.month || new Date().toLocaleDateString('en-US', { month: 'long' })).toLowerCase()
      const available = await getAvailableDataForLocationServer(userData.location, month, baseUrl)
      const constructed = {
        predictions: null,
        soilData: available.soilData || null,
        weatherData: available.weatherData || null,
        marketAnalysis: null,
        recommendations: null
      }
      if (constructed.soilData || constructed.weatherData) {
        return await generateDynamicDataDrivenResponse(intent, message, userData, constructed)
      }
    }
  } catch (e) {
    console.warn('Dynamic fallback error:', e?.message || e)
  }

  // If still no data, request minimal info to proceed dynamically
  const missing = []
  if (!userData?.location) missing.push('farm location')
  if (!userData?.crop) missing.push('crop type')
  if (!userData?.month) missing.push('planting month/season')
  const prompt = missing.length ? `Please share your ${missing.join(', ')}.` : 'Please add more farm details.'
  return { content: `I could not reach the AI service right now. ${prompt}`, suggestions: [] }
}

// Dynamic response functions
function generateDynamicCropRecommendation(userData, analysisData, currentMonth, avgTemp, rainyDays, dataUsed) {
  let response = `🌱 **Dynamic Crop Analysis for ${userData.crop || 'your crop'}:**\n\n`
  
  // Real-time conditions analysis
  response += `📊 **Current Conditions (${currentMonth}):**\n`
  response += `• Temperature: ${avgTemp}°C (${avgTemp > 35 ? 'Hot - needs heat protection' : avgTemp < 15 ? 'Cool - good for growth' : 'Optimal'})\n`
  response += `• Rainy Days: ${rainyDays} (${rainyDays > 4 ? 'Wet period - watch drainage' : rainyDays < 2 ? 'Dry period - irrigation needed' : 'Normal'})\n\n`
  
  if (analysisData.predictions) {
    response += `🎯 **Yield Potential:**\n`
    response += `• Expected: ${analysisData.predictions.predictedYield} tons/hectare\n`
    response += `• Confidence: ${analysisData.predictions.confidence}%\n`
    response += `• Risk Level: ${analysisData.predictions.weatherRisk}\n\n`
    dataUsed.push("predictions")
  }
  
  // Dynamic recommendations based on current conditions
  response += `💡 **Smart Recommendations:**\n`
  if (avgTemp > 35) {
    response += `• Apply mulch to protect roots from heat\n`
    response += `• Increase irrigation frequency to 2-3 times daily\n`
    response += `• Consider shade nets for sensitive crops\n`
  }
  if (rainyDays > 4) {
    response += `• Ensure proper drainage to prevent waterlogging\n`
    response += `• Apply fungicide as preventive measure\n`
    response += `• Avoid field operations during heavy rain\n`
  }
  if (analysisData.soilData?.ph < 6.5) {
    response += `• Apply lime to improve soil pH (current: ${analysisData.soilData.ph})\n`
  }
  
  dataUsed.push("weather", "soil")
  return response
}

function generateDynamicSoilAnalysis(soilData, weatherData, alerts, dataUsed) {
  if (!soilData) return "Soil data not available for your location."
  
  let response = `🌍 **Real-Time Soil Health Analysis:**\n\n`
  
  // Current soil status
  response += `📊 **Current Soil Status:**\n`
  response += `• pH Level: ${soilData.ph} (${getSoilPhStatus(soilData.ph)})\n`
  response += `• Moisture: ${soilData.moisture}% (${getMoistureStatus(soilData.moisture)})\n`
  response += `• Nitrogen: ${soilData.nitrogen} (${getNutrientStatus(soilData.nitrogen, 'nitrogen')})\n`
  response += `• Phosphorus: ${soilData.phosphorus} (${getNutrientStatus(soilData.phosphorus, 'phosphorus')})\n`
  response += `• Potassium: ${soilData.potassium} (${getNutrientStatus(soilData.potassium, 'potassium')})\n\n`
  
  // Dynamic recommendations based on current conditions
  response += `🔧 **Immediate Actions Needed:**\n`
  if (soilData.ph < 6.0) {
    response += `• URGENT: Apply 2-3 tons lime per hectare (pH too low)\n`
  }
  if (soilData.ph > 8.0) {
    response += `• Apply sulfur to decrease pH (currently too alkaline)\n`
  }
  if (soilData.moisture < 40) {
    response += `• CRITICAL: Increase irrigation immediately (moisture too low)\n`
  }
  if (soilData.moisture > 80) {
    response += `• Improve drainage (moisture too high)\n`
  }
  if (soilData.nitrogen < 50) {
    response += `• Apply nitrogen-rich fertilizer (N level low)\n`
  }
  
  dataUsed.push("soil")
  return response
}

function generateDynamicWeatherInfo(weatherData, predictions, currentHour, avgTemp, rainyDays, dataUsed) {
  if (!weatherData || weatherData.length === 0) return "Weather data not available for your location."
  
  let response = `🌤️ **Dynamic Weather Analysis:**\n\n`
  
  // Current conditions
  response += `📊 **Current Conditions (${currentHour}:00):**\n`
  response += `• Temperature: ${avgTemp}°C\n`
  response += `• Rainy Days This Week: ${rainyDays}\n`
  response += `• Weather Risk: ${predictions?.weatherRisk || 'Medium'}\n\n`
  
  // 7-day forecast with farming impact
  response += `📅 **7-Day Farming Forecast:**\n`
  weatherData.slice(0, 7).forEach((day, index) => {
    const farmingImpact = getFarmingImpact(day.tempValue, day.rainValue, index)
    response += `• ${day.day}: ${day.temp} - ${day.condition} (${day.rain}) - ${farmingImpact}\n`
  })
  
  // Dynamic farming advice
  response += `\n🌾 **Farming Impact Analysis:**\n`
  if (avgTemp > 35) {
    response += `• 🔥 High temperature - increase irrigation frequency\n`
    response += `• Apply mulch to retain soil moisture\n`
    response += `• Consider early morning or evening field work\n`
  }
  if (avgTemp < 15) {
    response += `• ❄️ Low temperature - protect crops from frost\n`
    response += `• Cover sensitive plants at night\n`
    response += `• Delay planting until temperature rises\n`
  }
  if (rainyDays > 4) {
    response += `• 🌧️ High rainfall - watch for waterlogging\n`
    response += `• Ensure proper drainage\n`
    response += `• Apply fungicide as preventive measure\n`
  }
  if (rainyDays < 2) {
    response += `• ☀️ Dry period - irrigation needed\n`
    response += `• Monitor soil moisture daily\n`
    response += `• Consider drought-resistant varieties\n`
  }
  
  dataUsed.push("weather")
  return response
}

function generateDynamicIrrigationAdvice(soilData, weatherData, recommendations, soilMoisture, avgTemp, dataUsed) {
  let response = `💧 **Smart Irrigation Plan:**\n\n`
  
  // Current moisture analysis
  response += `🌍 **Current Soil Moisture: ${soilMoisture}%**\n`
  if (soilMoisture < 40) {
    response += `• 🚨 CRITICAL: Immediate irrigation needed\n`
    response += `• Apply 5-7 cm water immediately\n`
    response += `• Monitor every 4 hours\n`
  } else if (soilMoisture > 70) {
    response += `• ✅ Good moisture - reduce irrigation\n`
    response += `• Check drainage systems\n`
    response += `• Avoid overwatering\n`
  } else {
    response += `• ✅ Optimal moisture - maintain current schedule\n`
    response += `• Monitor daily\n`
  }
  
  // Weather-based recommendations
  if (weatherData) {
    const rainyDays = weatherData.filter(day => (day.rainValue || 0) > 0).length
    response += `\n🌤️ **Weather-Based Adjustments:**\n`
    response += `• Temperature: ${avgTemp}°C\n`
    response += `• Rainy Days: ${rainyDays}\n\n`
    
    if (avgTemp > 30 && rainyDays < 2) {
      response += `• 🔥 Hot and dry - increase irrigation by 50%\n`
      response += `• Water 2-3 times daily\n`
      response += `• Use drip irrigation for efficiency\n`
    } else if (rainyDays > 3) {
      response += `• 🌧️ Wet period - reduce irrigation by 30%\n`
      response += `• Focus on drainage\n`
      response += `• Monitor for waterlogging\n`
    } else {
      response += `• ✅ Normal conditions - maintain regular schedule\n`
      response += `• Water every 2-3 days\n`
    }
  }
  
  dataUsed.push("soil", "weather")
  return response
}

function generateDynamicFertilizerAdvice(soilData, recommendations, soilPh, dataUsed) {
  let response = `🌿 **Precision Fertilizer Plan:**\n\n`
  
  if (soilData) {
    response += `🌍 **Soil Nutrient Analysis:**\n`
    response += `• Nitrogen: ${soilData.nitrogen} (${getNutrientStatus(soilData.nitrogen, 'nitrogen')})\n`
    response += `• Phosphorus: ${soilData.phosphorus} (${getNutrientStatus(soilData.phosphorus, 'phosphorus')})\n`
    response += `• Potassium: ${soilData.potassium} (${getNutrientStatus(soilData.potassium, 'potassium')})\n`
    response += `• pH Level: ${soilPh} (${getSoilPhStatus(soilPh)})\n\n`
    
    response += `📋 **Dynamic Fertilizer Recommendations:**\n`
    if (soilData.nitrogen < 50) {
      response += `• Apply 50-75 kg N/hectare in 3 splits\n`
      response += `• Use urea or ammonium sulfate\n`
    }
    if (soilData.phosphorus < 30) {
      response += `• Apply 25-40 kg P2O5/hectare at sowing\n`
      response += `• Use DAP or superphosphate\n`
    }
    if (soilData.potassium < 100) {
      response += `• Apply 40-60 kg K2O/hectare\n`
      response += `• Use MOP or SOP\n`
    }
    if (soilPh < 6.5) {
      response += `• First apply lime to correct pH, then fertilizers\n`
    }
    dataUsed.push("soil")
  }
  
  return response
}

function generateDynamicYieldPrediction(predictions, soilData, weatherData, yieldMethods, expectedYield, dataUsed) {
  if (!predictions) return "Yield prediction data not available."
  
  let response = `📈 **Dynamic Yield Analysis:**\n\n`
  
  response += `🎯 **Current Yield Potential:**\n`
  response += `• Expected: ${expectedYield} tons/hectare\n`
  response += `• Confidence: ${predictions.confidence}%\n`
  response += `• Weather Risk: ${predictions.weatherRisk}\n`
  response += `• Soil Health: ${predictions.soilHealthScore || 75}/100\n\n`
  
  // Dynamic optimization based on current yield
  if (expectedYield < 4.0) {
    response += `⚠️ **Yield Optimization Needed:**\n`
    response += `• Current yield (${expectedYield}t/ha) is below potential\n`
    response += `• Focus on soil health improvement\n`
    response += `• Optimize irrigation and fertilization\n`
    response += `• Consider crop rotation\n\n`
  }
  
  if (yieldMethods.length > 0) {
    response += `🔧 **Yield Improvement Methods:**\n`
    yieldMethods.forEach(method => {
      response += `\n**${method.category}:**\n`
      method.methods.forEach(m => response += `• ${m}\n`)
    })
  }
  
  dataUsed.push("predictions", "soil", "weather")
  return response
}

function generateDynamicPestManagement(weatherData, soilData, predictions, avgTemp, rainyDays, dataUsed) {
  let response = `🐛 **Dynamic Pest Management:**\n\n`
  
  // Weather-based risk assessment
  const avgHumidity = weatherData ? 
    Math.round(weatherData.reduce((sum, day) => sum + (day.humidityValue || 60), 0) / weatherData.length) : 60
  
  response += `🌤️ **Current Risk Assessment:**\n`
  response += `• Temperature: ${avgTemp}°C\n`
  response += `• Humidity: ${avgHumidity}%\n`
  response += `• Rainy Days: ${rainyDays}\n\n`
  
  // Dynamic risk analysis
  if (avgHumidity > 70) {
    response += `⚠️ **HIGH RISK PERIOD:**\n`
    response += `• High humidity increases pest activity\n`
    response += `• Monitor crops daily for pest signs\n`
    response += `• Apply preventive treatments\n`
    response += `• Use biological controls\n`
  } else if (rainyDays > 3) {
    response += `🌧️ **WET PERIOD ALERT:**\n`
    response += `• Fungal diseases risk is high\n`
    response += `• Ensure proper drainage\n`
    response += `• Apply fungicide if needed\n`
    response += `• Avoid overhead irrigation\n`
  } else {
    response += `✅ **LOW RISK PERIOD:**\n`
    response += `• Normal pest monitoring schedule\n`
    response += `• Weekly inspection recommended\n`
    response += `• Focus on prevention\n`
  }
  
  dataUsed.push("weather", "soil")
  return response
}

function generateDynamicGeneralAdvice(analysisData, message, alerts, yieldMethods, dataUsed) {
  let response = `🤖 **AI-Enhanced Dynamic Analysis:**\n\n`
  
  // Current farm status
  if (analysisData.predictions) {
    response += `📊 **Farm Status:**\n`
    response += `• Yield Potential: ${analysisData.predictions.predictedYield} tons/hectare\n`
    response += `• Confidence: ${analysisData.predictions.confidence}%\n`
    response += `• Weather Risk: ${analysisData.predictions.weatherRisk}\n\n`
    dataUsed.push("predictions")
  }
  
  // Show active alerts
  if (alerts.length > 0) {
    response += `🚨 **Active Alerts:**\n`
    alerts.slice(0, 3).forEach(alert => {
      response += `• ${alert.message}\n`
    })
    response += `\n`
  }
  
  // Show yield methods if available
  if (yieldMethods.length > 0) {
    response += `📈 **Yield Optimization:**\n`
    yieldMethods.slice(0, 2).forEach(method => {
      response += `• ${method.category}: ${method.methods.length} methods available\n`
    })
    response += `\n`
  }
  
  response += `💡 **Smart Recommendations:**\n`
  response += `• Monitor conditions daily\n`
  response += `• Adjust practices based on real-time data\n`
  response += `• Focus on soil health improvement\n`
  response += `• Plan irrigation based on weather forecast\n`
  
  return response
}

// Helper function for farming impact
function getFarmingImpact(temp, rain, dayIndex) {
  if (temp > 35) return "Hot - increase irrigation"
  if (temp < 15) return "Cool - protect from frost"
  if (rain > 10) return "Heavy rain - watch drainage"
  if (rain > 0) return "Light rain - good for crops"
  return "Normal conditions"
}
