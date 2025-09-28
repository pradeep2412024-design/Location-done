"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Thermometer, AlertTriangle, Sprout, Droplets, Cloud, Sun, CheckCircle } from "lucide-react"
import { useI18n } from "@/i18n"
import { useAuth } from "@/app/contexts/AuthContext"
import LanguageSwitch from "@/components/LanguageSwitch"
import EnhancedCropWiseChatbot from "@/components/EnhancedCropWiseChatbot"
import { useAppContext } from "@/contexts/AppContext"
import FarmDetailsForm from "@/components/FarmDetailsForm"
import EnhancedCropRecommendations from "@/components/EnhancedCropRecommendations"
import AdvancedMarketAnalysis from "@/components/AdvancedMarketAnalysis"
import GovernmentSchemes from "@/components/GovernmentSchemes"
import AgriculturalBackground from "@/components/AgriculturalBackground"

const formatLocation = (location, t) => {
	if (!location || typeof location !== "string") return location || ""
	const parts = location.split(",").map((p) => p.trim())
	if (parts.length === 2) {
		const cityKey = parts[0].toLowerCase().replace(/\s+/g, "_")
		const stateKey = parts[1].toLowerCase().replace(/\s+/g, "_")
		const cityRaw = t(`locations.cities.${cityKey}`)
		const stateRaw = t(`locations.states.${stateKey}`)
		const city = cityRaw && !cityRaw.startsWith("locations.") ? cityRaw : parts[0]
		const state = stateRaw && !stateRaw.startsWith("locations.") ? stateRaw : parts[1]
		return `${city}, ${state}`
	}
	return location
}

const formatDays = (duration, t) => {
	if (!duration) return ""
	const label1 = t("dashboard.units.days")
	const label2 = t("units.days")
	const resolved = label1 && !label1.includes(".") ? label1 : label2 && !label2.includes(".") ? label2 : "days"
	return String(duration).replace(/\bdays\b/i, resolved)
}

// Get state from location string
const getStateFromLocation = (location) => {
  if (!location) return 'odisha'
  
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
  if (locationLower.includes('uttar pradesh') || locationLower.includes('lucknow') || locationLower.includes('kanpur') || locationLower.includes('ghaziabad')) return 'uttar_pradesh'
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
  
  return 'odisha' // Default to Odisha
}

const recommendedCrops = [
  {
    name: "Chickpea (gram)",
    match: "85%",
    duration: "120 days",
    marketDemand: "High",
    yield: "4.0 tons/hectare",
    reasons: [
      "Optimal soil pH for chickpea cultivation",
      "Good soil moisture levels for growth",
      "Good soil moisture levels for growth",
      "Excellent nutrient levels support high yield",
      "Favorable weather conditions expected",
    ],
  },
  {
    name: "Wheat",
    match: "75%",
    duration: "150 days",
    marketDemand: "Moderate",
    yield: "3.5 tons/hectare",
    reasons: [
      "Wheat can tolerate a wider range of soil pH",
      "Moderate nutrient levels can still support good yield",
      "Weather patterns are generally favorable for wheat",
    ],
  },
]

const calculateYieldPrediction = (soilData, weatherData, cropType = "Chickpea (gram)", location = "") => {
  // Crop-specific base yields and optimal conditions
  const cropData = {
    Rice: { baseYield: 5.5, optimalPH: 6.0, optimalMoisture: 80, tempRange: [25, 32] },
    Wheat: { baseYield: 4.2, optimalPH: 6.5, optimalMoisture: 65, tempRange: [20, 28] },
    Chickpea: { baseYield: 4.0, optimalPH: 6.5, optimalMoisture: 70, tempRange: [22, 30] },
    Maize: { baseYield: 6.0, optimalPH: 6.2, optimalMoisture: 75, tempRange: [24, 30] },
    Sugarcane: { baseYield: 80.0, optimalPH: 6.8, optimalMoisture: 85, tempRange: [26, 35] },
    Potato: { baseYield: 25.0, optimalPH: 5.5, optimalMoisture: 70, tempRange: [15, 25] },
    Cotton: { baseYield: 3.5, optimalPH: 6.8, optimalMoisture: 55, tempRange: [22, 36] },
    Turmeric: { baseYield: 8.0, optimalPH: 5.5, optimalMoisture: 60, tempRange: [18, 30] },
    Chilli: { baseYield: 2.5, optimalPH: 6.0, optimalMoisture: 55, tempRange: [20, 32] },
    Pumpkin: { baseYield: 15.0, optimalPH: 6.0, optimalMoisture: 65, tempRange: [20, 30] },
    Rosemary: { baseYield: 1.5, optimalPH: 6.5, optimalMoisture: 50, tempRange: [15, 25] },
  }

  const normalizedCrop = cropType.split(" ")[0] // Get first word (Rice, Wheat, etc.)
  const crop = cropData[normalizedCrop] || cropData["Chickpea"]

  let baseYield = crop.baseYield
  let confidence = 85

  // Location-based adjustments
  const locationFactors = {
    punjab: 1.15,
    haryana: 1.12,
    "uttar pradesh": 1.08,
    bihar: 1.05,
    "west bengal": 1.1,
    maharashtra: 1.06,
    karnataka: 1.04,
    "tamil nadu": 1.03,
    gujarat: 1.07,
    rajasthan: 0.95,
    "madhya pradesh": 1.02,
    odisha: 1.01,
  }

  const locationKey = location.toLowerCase()
  const locationFactor = Object.keys(locationFactors).find((key) => locationKey.includes(key))
  if (locationFactor) {
    baseYield *= locationFactors[locationFactor]
    confidence += 5
  }

  // Adjust based on soil pH
  const phDifference = Math.abs(soilData.ph - crop.optimalPH)
  if (phDifference < 0.3) {
    baseYield += crop.baseYield * 0.12
    confidence += 8
  } else if (phDifference > 1.0) {
    baseYield -= crop.baseYield * 0.08
    confidence -= 12
  }

  // Adjust based on soil moisture
  const moistureDiff = Math.abs(soilData.moisture - crop.optimalMoisture)
  if (moistureDiff < 10) {
    baseYield += crop.baseYield * 0.08
    confidence += 5
  } else if (moistureDiff > 25) {
    baseYield -= crop.baseYield * 0.12
    confidence -= 10
  }

  // Adjust based on nutrients
  const avgNutrients = (soilData.nitrogen + soilData.phosphorus + soilData.potassium) / 3
  if (avgNutrients >= 70) {
    baseYield += crop.baseYield * 0.1
    confidence += 6
  } else if (avgNutrients < 50) {
    baseYield -= crop.baseYield * 0.06
    confidence -= 8
  }

  // Weather impact
  const rainyDays = weatherData.filter((day) => day.condition.includes("rain") || day.condition.includes("Rain")).length
  const avgTemp =
    weatherData.reduce((sum, day) => sum + (day.tempValue || Number.parseInt(day.temp.split("°")[0])), 0) /
    weatherData.length

  if (avgTemp < crop.tempRange[0] || avgTemp > crop.tempRange[1]) {
    baseYield -= crop.baseYield * 0.05
    confidence -= 5
  }

  if (rainyDays > 3) {
    baseYield -= crop.baseYield * 0.04
    confidence -= 6
  } else if (rainyDays === 0 && normalizedCrop !== "Wheat") {
    baseYield -= crop.baseYield * 0.03
    confidence -= 4
  }

  // Ensure reasonable bounds
  baseYield = Math.max(crop.baseYield * 0.6, Math.min(crop.baseYield * 1.4, baseYield))
  confidence = Math.max(60, Math.min(95, confidence))

  return {
    crop: cropType,
    yield: `${baseYield.toFixed(2)} tons/hectare`,
    confidence: `${confidence}%`,
    factors: generateYieldFactors(soilData, weatherData, normalizedCrop),
    weatherImpact: generateWeatherImpact(weatherData, soilData, normalizedCrop),
  }
}

const generateYieldFactors = (soilData, weatherData, cropType = "Chickpea") => {
  const factors = []

  // Crop-specific pH recommendations
  const phRecommendations = {
    Rice: { optimal: 6.0, range: [5.5, 6.5] },
    Wheat: { optimal: 6.5, range: [6.0, 7.0] },
    Chickpea: { optimal: 6.5, range: [6.0, 7.5] },
    Maize: { optimal: 6.2, range: [5.8, 7.0] },
    Potato: { optimal: 5.5, range: [5.0, 6.0] },
    Cotton: { optimal: 6.8, range: [6.0, 8.0] },
    Turmeric: { optimal: 5.5, range: [5.0, 6.5] },
    Chilli: { optimal: 6.0, range: [5.5, 7.0] },
    Pumpkin: { optimal: 6.0, range: [5.5, 6.5] },
    Rosemary: { optimal: 6.5, range: [6.0, 7.0] },
  }

  const phData = phRecommendations[cropType] || phRecommendations["Chickpea"]

  if (soilData.ph >= phData.range[0] && soilData.ph <= phData.range[1]) {
    factors.push({ key: "dashboard.yield.factor_keys.optimal_ph" })
  } else if (soilData.ph < phData.range[0]) {
    factors.push({ key: "dashboard.yield.factor_keys.acidic_soil" })
  } else {
    factors.push({ key: "dashboard.yield.factor_keys.alkaline_soil" })
  }

  // Moisture factor
  if (soilData.moisture < 40) {
    factors.push({ key: "dashboard.yield.factor_keys.low_moisture" })
  } else if (soilData.moisture > 80) {
    factors.push({ key: "dashboard.yield.factor_keys.high_moisture" })
  } else {
    factors.push({ key: "dashboard.yield.factor_keys.good_moisture" })
  }

  // Nutrient factor
  const avgNutrients = (soilData.nitrogen + soilData.phosphorus + soilData.potassium) / 3
  if (avgNutrients >= 70) {
    factors.push({ key: "dashboard.yield.factor_keys.excellent_nutrients" })
  } else if (avgNutrients < 50) {
    factors.push({ key: "dashboard.yield.factor_keys.low_nutrients" })
  } else {
    factors.push({ key: "dashboard.yield.factor_keys.moderate_nutrients" })
  }

  // Weather factor
  const rainyDays = weatherData.filter((day) => day.condition.includes("Rain") || day.rainValue > 2).length
  if (rainyDays > 3) {
    factors.push({ key: "dashboard.yield.factor_keys.excessive_rain" })
  } else if (rainyDays === 0) {
    factors.push({ key: "dashboard.yield.factor_keys.dry_weather" })
  } else {
    factors.push({ key: "dashboard.yield.factor_keys.favorable_weather" })
  }

  return factors.slice(0, 4)
}

const generateWeatherImpact = (weatherData, soilData, cropType = "Chickpea") => {
  const impacts = []

  const rainyDays = weatherData.filter((day) => day.condition.includes("Rain") || day.rainValue > 2).length

  const avgTemp =
    weatherData.reduce((sum, day) => sum + (day.tempValue || Number.parseInt(day.temp.split("°")[0])), 0) /
    weatherData.length

  const avgHumidity =
    weatherData.reduce((sum, day) => sum + (day.humidityValue || Number.parseInt(day.humidity)), 0) / weatherData.length

  const totalRainfall = weatherData.reduce((sum, day) => sum + (day.rainValue || Number.parseInt(day.rain) || 0), 0)

  if (rainyDays > 2) {
    impacts.push({ key: "dashboard.weather_impact.items.monitor_drainage" })
    impacts.push({ key: "dashboard.weather_impact.items.apply_fungicide" })
  }

  if (avgTemp > 32) {
    impacts.push({ key: "dashboard.weather_impact.items.provide_shade" })
    impacts.push({ key: "dashboard.weather_impact.items.increase_irrigation" })
  } else if (avgTemp < 20) {
    impacts.push({ key: "dashboard.weather_impact.items.cold_stress" })
  }

  if (avgHumidity > 75) {
    impacts.push({ key: "dashboard.weather_impact.items.ensure_air_circulation" })
    impacts.push({ key: "dashboard.weather_impact.items.watch_fungal" })
  }

  if (totalRainfall < 10 && soilData.moisture < 50) {
    impacts.push({ key: "dashboard.weather_impact.items.implement_drip" })
  }

  if (totalRainfall > 50) {
    impacts.push({ key: "dashboard.weather_impact.items.prepare_drainage" })
  }

  return impacts.slice(0, 4) // Limit to 4 impacts
}

// Generate dynamic yield factors based on actual API data
const generateDynamicYieldFactors = (farmData) => {
  if (!farmData?.predictions) return []
  
  const factors = []
  const predictions = farmData.predictions
  const userInfo = farmData.userInfo
  
  // Soil Health Score Factor
  if (predictions.soilHealthScore !== undefined) {
    const score = predictions.soilHealthScore
    let soilStatus = "Optimal"
    let impact = "Positive"
    
    if (score < 50) {
      soilStatus = "Poor"
      impact = "Negative"
    } else if (score < 70) {
      soilStatus = "Moderate"
      impact = "Neutral"
    } else if (score < 85) {
      soilStatus = "Good"
      impact = "Positive"
    }
    
    factors.push({
      key: `Soil Health: ${score}/100 (${soilStatus})`,
      impact: impact,
      description: `Current soil health score of ${score} affects yield ${impact.toLowerCase()}ly`
    })
  }
  
  // Weather Risk Factor
  if (predictions.weatherRisk) {
    const risk = predictions.weatherRisk
    let riskImpact = "Low"
    let riskDescription = "Favorable weather conditions"
    
    if (risk === "High") {
      riskImpact = "High"
      riskDescription = "Adverse weather conditions may reduce yield"
    } else if (risk === "Medium") {
      riskImpact = "Medium"
      riskDescription = "Moderate weather risks present"
    }
    
    factors.push({
      key: `Weather Risk: ${risk}`,
      impact: riskImpact,
      description: riskDescription
    })
  }
  
  // Predicted Yield Increase Factor
  if (predictions.yieldIncreaseDetails) {
    const increase = predictions.yieldIncreaseDetails.percentage || 0
    let increaseStatus = "No increase"
    let increaseDescription = "No significant yield improvements expected"
    
    if (increase > 10) {
      increaseStatus = "High increase"
      increaseDescription = "Significant yield improvements expected"
    } else if (increase > 5) {
      increaseStatus = "Moderate increase"
      increaseDescription = "Moderate yield improvements expected"
    } else if (increase > 0) {
      increaseStatus = "Low increase"
      increaseDescription = "Minor yield improvements expected"
    }
    
    factors.push({
      key: `Yield Increase: +${increase}%`,
      impact: increase > 5 ? "High" : increase > 0 ? "Medium" : "Low",
      description: increaseDescription
    })
  }
  
  // Location Factor
  if (userInfo?.location) {
    const location = userInfo.location
    factors.push({
      key: `Location: ${location}`,
      impact: "Medium",
      description: `Regional factors for ${location} affecting yield potential`
    })
  }
  
  // Crop Factor
  if (userInfo?.crop) {
    const crop = userInfo.crop
    factors.push({
      key: `Crop: ${crop}`,
      impact: "High",
      description: `${crop} specific requirements and yield potential`
    })
  }
  
  return factors.slice(0, 4) // Limit to 4 factors
}

// Generate dynamic weather impact based on actual API data
const generateDynamicWeatherImpact = (farmData) => {
  if (!farmData?.predictions) return []
  
  const impacts = []
  const predictions = farmData.predictions
  const weatherData = farmData.weatherData
  const userInfo = farmData.userInfo
  
  // Weather Risk Analysis
  if (predictions.weatherRiskDetails) {
    const weatherDetails = predictions.weatherRiskDetails
    
    // Temperature Impact
    if (weatherDetails.details?.temperature && weatherDetails.details.temperature.level !== "Low") {
      impacts.push({
        key: `Temperature Risk: ${weatherDetails.details.temperature.factor}`,
        solution: weatherDetails.details.temperature.solution,
        priority: weatherDetails.details.temperature.level
      })
    }
    
    // Rainfall Impact
    if (weatherDetails.details?.rainfall && weatherDetails.details.rainfall.level !== "Low") {
      impacts.push({
        key: `Rainfall Risk: ${weatherDetails.details.rainfall.factor}`,
        solution: weatherDetails.details.rainfall.solution,
        priority: weatherDetails.details.rainfall.level
      })
    }
    
    // Humidity Impact
    if (weatherDetails.details?.humidity && weatherDetails.details.humidity.level !== "Low") {
      impacts.push({
        key: `Humidity Risk: ${weatherDetails.details.humidity.factor}`,
        solution: weatherDetails.details.humidity.solution,
        priority: weatherDetails.details.humidity.level
      })
    }
    
    // Location-specific Impact
    if (weatherDetails.details?.location && weatherDetails.details.location.level !== "Low") {
      impacts.push({
        key: `Location Risk: ${weatherDetails.details.location.factor}`,
        solution: weatherDetails.details.location.solution,
        priority: weatherDetails.details.location.level
      })
    }
  }
  
  // Weather Data Analysis
  if (weatherData && weatherData.length > 0) {
    const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp?.split('°')[0]) || 0), 0) / weatherData.length
    const rainyDays = weatherData.filter(day => day.condition?.toLowerCase().includes('rain') || day.rainValue > 2).length
    const avgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity?.replace('%', '')) || 0), 0) / weatherData.length
    
    // Temperature-based recommendations
    if (avgTemp > 35) {
      impacts.push({
        key: `High Temperature Alert: ${avgTemp.toFixed(1)}°C average`,
        solution: "Implement shade nets, increase irrigation frequency, and monitor for heat stress",
        priority: "High"
      })
    } else if (avgTemp < 15) {
      impacts.push({
        key: `Low Temperature Alert: ${avgTemp.toFixed(1)}°C average`,
        solution: "Protect crops from cold stress, consider greenhouse or row covers",
        priority: "High"
      })
    }
    
    // Rainfall-based recommendations
    if (rainyDays > 5) {
      impacts.push({
        key: `Excessive Rainfall: ${rainyDays} rainy days`,
        solution: "Improve drainage, prevent waterlogging, and monitor for fungal diseases",
        priority: "High"
      })
    } else if (rainyDays === 0) {
      impacts.push({
        key: `No Rainfall: ${rainyDays} rainy days`,
        solution: "Implement irrigation system, monitor soil moisture, and consider drought-resistant varieties",
        priority: "Medium"
      })
    }
    
    // Humidity-based recommendations
    if (avgHumidity > 80) {
      impacts.push({
        key: `High Humidity: ${avgHumidity.toFixed(1)}% average`,
        solution: "Improve air circulation, reduce plant density, and apply preventive fungicides",
        priority: "Medium"
      })
    } else if (avgHumidity < 40) {
      impacts.push({
        key: `Low Humidity: ${avgHumidity.toFixed(1)}% average`,
        solution: "Increase irrigation frequency, use mulching, and consider misting systems",
        priority: "Medium"
      })
    }
  }
  
  // Crop-specific weather recommendations
  if (userInfo?.crop) {
    const crop = userInfo.crop.toLowerCase()
    
    if (crop.includes('rice') && weatherData) {
      const totalRainfall = weatherData.reduce((sum, day) => sum + (day.rainValue || 0), 0)
      if (totalRainfall < 100) {
        impacts.push({
          key: "Rice Water Requirements",
          solution: "Maintain flooded field conditions, ensure adequate water supply for rice cultivation",
          priority: "High"
        })
      }
    }
    
    if (crop.includes('wheat') && weatherData) {
      const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || 0), 0) / weatherData.length
      if (avgTemp > 30) {
        impacts.push({
          key: "Wheat Heat Stress",
          solution: "Monitor for heat stress, ensure adequate irrigation during grain filling stage",
          priority: "High"
        })
      }
    }
  }
  
  // If no specific impacts, add general favorable conditions
  if (impacts.length === 0) {
    impacts.push({
      key: "Favorable Weather Conditions",
      solution: "Current weather conditions are optimal for crop growth",
      priority: "Low"
    })
  }
  
  return impacts.slice(0, 4) // Limit to 4 impacts
}

const generateOptimizationRecommendations = (soilData, weatherData, cropType = "Chickpea", location = "", month = "", t) => {
  const recommendations = []

  // Comprehensive crop-specific irrigation recommendations
  const irrigationData = {
    Rice: { 
      typeKey: "dashboard.optimization.irrigation.flood", 
      efficiency: "15-25%",
      waterRequirement: "1200-1500mm",
      timing: "Continuous flooding",
      frequency: "Daily",
      depth: "5-10cm"
    },
    Wheat: { 
      typeKey: "dashboard.optimization.irrigation.sprinkler", 
      efficiency: "10-18%",
      waterRequirement: "400-600mm",
      timing: "Critical growth stages",
      frequency: "Weekly",
      depth: "15-20cm"
    },
    Chickpea: { 
      typeKey: "dashboard.optimization.irrigation.drip", 
      efficiency: "8-15%",
      waterRequirement: "300-400mm",
      timing: "Flowering and pod filling",
      frequency: "Bi-weekly",
      depth: "10-15cm"
    },
    Maize: { 
      typeKey: "dashboard.optimization.irrigation.drip", 
      efficiency: "12-20%",
      waterRequirement: "500-800mm",
      timing: "Tasseling and silking",
      frequency: "Weekly",
      depth: "15-20cm"
    },
    Potato: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "15-25%",
      waterRequirement: "400-600mm",
      timing: "Tuber formation",
      frequency: "Bi-weekly",
      depth: "10-15cm"
    },
    Cotton: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "12-20%",
      waterRequirement: "600-800mm",
      timing: "Flowering and boll development",
      frequency: "Weekly",
      depth: "20-25cm"
    },
    Turmeric: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "10-18%",
      waterRequirement: "300-500mm",
      timing: "Rhizome development",
      frequency: "Bi-weekly",
      depth: "8-12cm"
    },
    Chilli: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "12-20%",
      waterRequirement: "400-600mm",
      timing: "Flowering and fruit setting",
      frequency: "Weekly",
      depth: "10-15cm"
    },
    Pumpkin: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "15-25%",
      waterRequirement: "500-700mm",
      timing: "Fruit development",
      frequency: "Weekly",
      depth: "15-20cm"
    },
    Rosemary: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "8-15%",
      waterRequirement: "200-300mm",
      timing: "Establishment phase",
      frequency: "Bi-weekly",
      depth: "5-10cm"
    },
    Onion: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "12-20%",
      waterRequirement: "350-450mm",
      timing: "Bulb formation",
      frequency: "Weekly",
      depth: "8-12cm"
    },
    Sugarcane: {
      typeKey: "dashboard.optimization.irrigation.flood",
      efficiency: "20-30%",
      waterRequirement: "1500-2000mm",
      timing: "Continuous growth",
      frequency: "Daily",
      depth: "10-15cm"
    },
    Tomato: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "15-25%",
      waterRequirement: "400-600mm",
      timing: "Flowering and fruit development",
      frequency: "Weekly",
      depth: "10-15cm"
    },
    Brinjal: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "12-20%",
      waterRequirement: "400-500mm",
      timing: "Flowering and fruit setting",
      frequency: "Weekly",
      depth: "10-15cm"
    },
    Okra: {
      typeKey: "dashboard.optimization.irrigation.drip",
      efficiency: "10-18%",
      waterRequirement: "300-400mm",
      timing: "Flowering and pod development",
      frequency: "Bi-weekly",
      depth: "8-12cm"
    },
    
    // ADDITIONAL MAJOR CROPS FROM DATABASE
    // GRAINS & CEREALS
    "Jowar": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-600mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "12-18cm" },
    "Bajra": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-500mm", timing: "Flowering and grain filling", frequency: "Bi-weekly", depth: "10-15cm" },
    "Ragi": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-600mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "8-12cm" },
    "Barley": { typeKey: "dashboard.optimization.irrigation.sprinkler", efficiency: "8-15%", waterRequirement: "350-500mm", timing: "Critical growth stages", frequency: "Weekly", depth: "12-18cm" },
    "Oats": { typeKey: "dashboard.optimization.irrigation.sprinkler", efficiency: "10-18%", waterRequirement: "400-600mm", timing: "Critical growth stages", frequency: "Weekly", depth: "10-15cm" },
    "Quinoa": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "300-500mm", timing: "Flowering and seed development", frequency: "Bi-weekly", depth: "8-12cm" },
    
    // PULSES
    "Black Gram": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Flowering and pod filling", frequency: "Bi-weekly", depth: "8-12cm" },
    "Green Gram": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "350-450mm", timing: "Flowering and pod filling", frequency: "Bi-weekly", depth: "8-12cm" },
    "Horse Gram": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "6-10cm" },
    "Bengal Gram": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Flowering and pod filling", frequency: "Bi-weekly", depth: "8-12cm" },
    "Pigeon Pea": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-500mm", timing: "Flowering and pod development", frequency: "Bi-weekly", depth: "10-15cm" },
    "Lentil": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "6-10cm" },
    "Pea": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Flowering and pod filling", frequency: "Bi-weekly", depth: "8-12cm" },
    "Soybean": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and pod filling", frequency: "Weekly", depth: "10-15cm" },
    
    // OILSEEDS
    "Groundnut": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Flowering and peg penetration", frequency: "Weekly", depth: "10-15cm" },
    "Mustard": { typeKey: "dashboard.optimization.irrigation.sprinkler", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Flowering and siliqua development", frequency: "Bi-weekly", depth: "8-12cm" },
    "Sesame": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Flowering and capsule development", frequency: "Bi-weekly", depth: "6-10cm" },
    "Sunflower": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and seed development", frequency: "Weekly", depth: "12-18cm" },
    "Niger": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "6-10cm" },
    "Castor": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-500mm", timing: "Flowering and capsule development", frequency: "Bi-weekly", depth: "8-12cm" },
    "Linseed": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "6-10cm" },
    "Safflower": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "350-450mm", timing: "Flowering and head development", frequency: "Bi-weekly", depth: "8-12cm" },
    "Rapeseed": { typeKey: "dashboard.optimization.irrigation.sprinkler", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Flowering and siliqua development", frequency: "Bi-weekly", depth: "8-12cm" },
    "Canola": { typeKey: "dashboard.optimization.irrigation.sprinkler", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Flowering and siliqua development", frequency: "Bi-weekly", depth: "8-12cm" },
    
    // COMMERCIAL CROPS
    "Jute": { typeKey: "dashboard.optimization.irrigation.flood", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Vegetative growth", frequency: "Daily", depth: "5-10cm" },
    "Mesta": { typeKey: "dashboard.optimization.irrigation.flood", efficiency: "15-25%", waterRequirement: "600-800mm", timing: "Vegetative growth", frequency: "Daily", depth: "5-10cm" },
    "Tobacco": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Flowering and leaf development", frequency: "Weekly", depth: "10-15cm" },
    "Rubber": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Continuous growth", frequency: "Daily", depth: "15-20cm" },
    "Tea": { typeKey: "dashboard.optimization.irrigation.sprinkler", efficiency: "12-20%", waterRequirement: "1200-1800mm", timing: "Continuous growth", frequency: "Daily", depth: "10-15cm" },
    "Coffee": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Flowering and fruit development", frequency: "Daily", depth: "12-18cm" },
    "Cocoa": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1200-1800mm", timing: "Flowering and pod development", frequency: "Daily", depth: "15-20cm" },
    
    // VEGETABLES
    "Cucumber": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "400-600mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Bottle Gourd": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "500-700mm", timing: "Fruit development", frequency: "Weekly", depth: "12-18cm" },
    "Bitter Gourd": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Watermelon": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "500-700mm", timing: "Fruit development", frequency: "Weekly", depth: "15-20cm" },
    "Muskmelon": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "500-700mm", timing: "Fruit development", frequency: "Weekly", depth: "15-20cm" },
    "Cauliflower": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-500mm", timing: "Head formation", frequency: "Weekly", depth: "8-12cm" },
    "Cabbage": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-500mm", timing: "Head formation", frequency: "Weekly", depth: "8-12cm" },
    "Carrot": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "350-450mm", timing: "Root development", frequency: "Weekly", depth: "8-12cm" },
    "Radish": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Root development", frequency: "Bi-weekly", depth: "6-10cm" },
    "Spinach": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Leaf development", frequency: "Bi-weekly", depth: "5-8cm" },
    "Lettuce": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "350-450mm", timing: "Head formation", frequency: "Weekly", depth: "6-10cm" },
    "Broccoli": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-500mm", timing: "Head formation", frequency: "Weekly", depth: "8-12cm" },
    "Capsicum": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Beetroot": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "350-450mm", timing: "Root development", frequency: "Weekly", depth: "8-12cm" },
    "Turnip": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Root development", frequency: "Bi-weekly", depth: "6-10cm" },
    "Kohlrabi": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "350-450mm", timing: "Bulb development", frequency: "Weekly", depth: "8-12cm" },
    "Artichoke": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "500-700mm", timing: "Head development", frequency: "Weekly", depth: "12-18cm" },
    "Asparagus": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Spear development", frequency: "Weekly", depth: "10-15cm" },
    
    // TUBERS & ROOTS
    "Sweet Potato": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "500-700mm", timing: "Tuber formation", frequency: "Weekly", depth: "12-18cm" },
    "Cassava": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Tuber development", frequency: "Weekly", depth: "10-15cm" },
    "Yam": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "500-700mm", timing: "Tuber formation", frequency: "Weekly", depth: "12-18cm" },
    "Taro": { typeKey: "dashboard.optimization.irrigation.flood", efficiency: "15-25%", waterRequirement: "600-800mm", timing: "Corm development", frequency: "Daily", depth: "5-10cm" },
    "Arrowroot": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Rhizome development", frequency: "Weekly", depth: "8-12cm" },
    "Ginger": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Rhizome development", frequency: "Weekly", depth: "8-12cm" },
    
    // SPICES & CONDIMENTS
    "Coriander": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering and seed development", frequency: "Bi-weekly", depth: "5-8cm" },
    "Cumin": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering and seed development", frequency: "Bi-weekly", depth: "5-8cm" },
    "Fenugreek": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering and seed development", frequency: "Bi-weekly", depth: "5-8cm" },
    "Fennel": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Flowering and seed development", frequency: "Bi-weekly", depth: "6-10cm" },
    "Cardamom": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Continuous growth", frequency: "Daily", depth: "10-15cm" },
    "Pepper": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Flowering and berry development", frequency: "Daily", depth: "12-18cm" },
    "Cloves": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Flowering and bud development", frequency: "Daily", depth: "12-18cm" },
    "Cinnamon": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Continuous growth", frequency: "Daily", depth: "10-15cm" },
    "Nutmeg": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Flowering and fruit development", frequency: "Daily", depth: "12-18cm" },
    "Mace": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Flowering and fruit development", frequency: "Daily", depth: "12-18cm" },
    "Star Anise": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Daily", depth: "10-15cm" },
    "Bay Leaves": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Continuous growth", frequency: "Weekly", depth: "8-12cm" },
    "Oregano": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "5-8cm" },
    "Thyme": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "5-8cm" },
    "Sage": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "5-8cm" },
    "Basil": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "300-400mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "6-10cm" },
    
    // FRUITS
    "Mango": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Banana": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "20-30%", waterRequirement: "1200-1800mm", timing: "Continuous growth", frequency: "Daily", depth: "15-25cm" },
    "Litchi": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Coconut": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Continuous growth", frequency: "Daily", depth: "20-30cm" },
    "Grapes": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "600-800mm", timing: "Flowering and berry development", frequency: "Weekly", depth: "15-25cm" },
    "Pomegranate": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Guava": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Papaya": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Apple": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Orange": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Lemon": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Lime": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Pineapple": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Strawberry": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "8-12cm" },
    "Blueberry": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Raspberry": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Blackberry": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    "Cranberry": { typeKey: "dashboard.optimization.irrigation.flood", efficiency: "15-25%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Daily", depth: "5-10cm" },
    "Kiwi": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Avocado": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Fig": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Date": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Custard Apple": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Sapota": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Jackfruit": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Breadfruit": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" },
    "Dragon Fruit": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "10-15cm" },
    
    // FIBER CROPS
    "Hemp": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "400-600mm", timing: "Vegetative growth", frequency: "Weekly", depth: "10-15cm" },
    "Flax": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "350-500mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "8-12cm" },
    "Sisal": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Vegetative growth", frequency: "Bi-weekly", depth: "6-10cm" },
    "Coir": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Continuous growth", frequency: "Daily", depth: "20-30cm" },
    "Kapok": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    
    // MEDICINAL CROPS
    "Aloe Vera": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "200-300mm", timing: "Leaf development", frequency: "Bi-weekly", depth: "5-8cm" },
    "Neem": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-600mm", timing: "Continuous growth", frequency: "Weekly", depth: "15-25cm" },
    "Tulsi": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "250-350mm", timing: "Flowering stage", frequency: "Bi-weekly", depth: "5-8cm" },
    "Ashwagandha": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "8-15%", waterRequirement: "300-400mm", timing: "Root development", frequency: "Bi-weekly", depth: "6-10cm" },
    "Brahmi": { typeKey: "dashboard.optimization.irrigation.flood", efficiency: "10-18%", waterRequirement: "400-600mm", timing: "Continuous growth", frequency: "Daily", depth: "5-10cm" },
    "Shatavari": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-500mm", timing: "Root development", frequency: "Bi-weekly", depth: "8-12cm" },
    "Giloy": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "10-18%", waterRequirement: "400-500mm", timing: "Vine growth", frequency: "Bi-weekly", depth: "8-12cm" },
    "Amla": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Haritaki": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Bibhitaki": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    "Triphala": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "500-700mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "15-25cm" },
    
    // MISCELLANEOUS
    "Bamboo": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "800-1200mm", timing: "Continuous growth", frequency: "Daily", depth: "20-30cm" },
    "Cashew": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and nut development", frequency: "Weekly", depth: "20-30cm" },
    "Areca Nut": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Continuous growth", frequency: "Daily", depth: "20-30cm" },
    "Betel Nut": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "15-25%", waterRequirement: "1000-1500mm", timing: "Continuous growth", frequency: "Daily", depth: "20-30cm" },
    "Oil Palm": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "20-30%", waterRequirement: "1500-2000mm", timing: "Continuous growth", frequency: "Daily", depth: "25-35cm" },
    "Date Palm": { typeKey: "dashboard.optimization.irrigation.drip", efficiency: "12-20%", waterRequirement: "600-800mm", timing: "Flowering and fruit development", frequency: "Weekly", depth: "20-30cm" }
  }

  // Get crop type (handle variations like "Rice (Paddy)" -> "Rice")
  const normalizedCropType = cropType.split(" ")[0].split("(")[0]
  const irrigation = irrigationData[normalizedCropType] || irrigationData["Chickpea"]
  
  // Weather-based irrigation timing calculation
  const irrigationAvgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  const totalRainfall = weatherData.reduce((sum, day) => sum + (day.rainValue || 0), 0)
  const irrigationAvgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity) || 0), 0) / weatherData.length
  
  // Calculate irrigation efficiency based on multiple factors
  let irrigationEfficiency = irrigation.efficiency
  let irrigationTiming = irrigation.timing
  let irrigationFrequency = irrigation.frequency
  let irrigationCostBenefit = "High"
  let irrigationImplementationTime = "1-2 weeks"
  
  // Adjust based on soil moisture
  if (soilData.moisture < 30) {
    irrigationEfficiency = irrigation.efficiency.split("-")[1] + "%"
    irrigationFrequency = "Daily"
    irrigationCostBenefit = "Very High"
  } else if (soilData.moisture < 50) {
    irrigationEfficiency = irrigation.efficiency.split("-")[1] + "%"
    irrigationFrequency = irrigation.frequency
    irrigationCostBenefit = "High"
  } else if (soilData.moisture > 80) {
    irrigationEfficiency = irrigation.efficiency.split("-")[0] + "%"
    irrigationFrequency = "Bi-weekly"
    irrigationCostBenefit = "Medium"
  }
  
  // Adjust based on weather conditions
  if (irrigationAvgTemp > 35) {
    irrigationFrequency = "Daily"
    irrigationTiming = "Early morning (5-7 AM)"
    irrigationCostBenefit = "Very High"
  } else if (irrigationAvgTemp < 15) {
    irrigationFrequency = "Bi-weekly"
    irrigationTiming = "Mid-day (10-12 PM)"
    irrigationCostBenefit = "Medium"
  }
  
  if (totalRainfall > 50) {
    irrigationFrequency = "Bi-weekly"
    irrigationCostBenefit = "Low"
  } else if (totalRainfall < 10) {
    irrigationFrequency = "Daily"
    irrigationCostBenefit = "Very High"
  }
  
  // Location-based adjustments
  const locationMultiplier = location.toLowerCase().includes('rajasthan') ? 1.3 : 
                           location.toLowerCase().includes('punjab') ? 0.8 :
                           location.toLowerCase().includes('haryana') ? 0.9 : 1.0
  
  if (locationMultiplier > 1.2) {
    irrigationFrequency = "Daily"
    irrigationCostBenefit = "Very High"
  }

  // Eco-friendly irrigation alternatives
  const ecoIrrigationAlternatives = {
    drip: {
      alternatives: ["Mulching", "Cover Crops", "Rainwater Harvesting"],
      benefits: "Water conservation, soil moisture retention, reduced evaporation",
      environmentalImpact: "Very High",
      costSavings: "20-30% water costs"
    },
    sprinkler: {
      alternatives: ["Smart Irrigation", "Soil Moisture Sensors", "Weather-based Scheduling"],
      benefits: "Precision watering, reduced waste, better crop health",
      environmentalImpact: "High",
      costSavings: "15-25% water costs"
    },
    flood: {
      alternatives: ["Contour Farming", "Terracing", "Water Recycling"],
      benefits: "Soil conservation, reduced runoff, improved water use",
      environmentalImpact: "Medium",
      costSavings: "10-20% water costs"
    }
  }

  // Extract irrigation type from typeKey (e.g., "dashboard.optimization.irrigation.drip" -> "drip")
  const irrigationType = irrigation.typeKey.split('.').pop() || "drip"
  const irrigationEco = ecoIrrigationAlternatives[irrigationType] || ecoIrrigationAlternatives["drip"]

  recommendations.push({
    titleKey: irrigation.typeKey,
    subtitleKey: "dashboard.optimization.irrigation.subtitle",
    descriptionKey: "dashboard.optimization.irrigation.description",
    improvementKey: "dashboard.optimization.irrigation.improvement",
    params: { 
      crop: t(`crops.${cropType.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || cropType, 
      moisture: soilData.moisture.toFixed(2), 
      efficiency: irrigationEfficiency,
      waterRequirement: irrigation.waterRequirement,
      timing: irrigationTiming,
      frequency: irrigationFrequency,
      depth: irrigation.depth,
      costBenefit: irrigationCostBenefit,
      implementationTime: irrigationImplementationTime,
      // Eco-friendly parameters
      alternatives: irrigationEco.alternatives.join(", "),
      benefits: irrigationEco.benefits,
      environmentalImpact: irrigationEco.environmentalImpact,
      costSavings: irrigationEco.costSavings
    },
    icon: "💧",
    costBenefit: irrigationCostBenefit,
    implementationTime: irrigationImplementationTime,
    priority: irrigationCostBenefit === "Very High" ? "High" : irrigationCostBenefit === "High" ? "Medium" : "Low"
  })

  // Enhanced pest management algorithm
  const rainyDays = weatherData.filter((day) => day.condition.includes("rain") || day.rainValue > 2).length
  const pestAvgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity) || 0), 0) / weatherData.length
  const pestAvgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  
  // Comprehensive crop-specific pest risk factors for ALL crops
  const pestRiskFactors = {
    // GRAINS & CEREALS
    "Rice": { baseRisk: 0.15, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Wheat": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Maize": { baseRisk: 0.18, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Jowar": { baseRisk: 0.14, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Bajra": { baseRisk: 0.13, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Ragi": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Barley": { baseRisk: 0.11, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Oats": { baseRisk: 0.10, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Quinoa": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    
    // PULSES
    "Black Gram": { baseRisk: 0.11, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Green Gram": { baseRisk: 0.12, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Horse Gram": { baseRisk: 0.09, humidityFactor: 1.1, tempFactor: 0.9, rainFactor: 1.0 },
    "Bengal Gram": { baseRisk: 0.10, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Chickpea": { baseRisk: 0.10, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Pigeon Pea": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Lentil": { baseRisk: 0.09, humidityFactor: 1.1, tempFactor: 0.9, rainFactor: 1.0 },
    "Pea": { baseRisk: 0.11, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Soybean": { baseRisk: 0.17, humidityFactor: 1.6, tempFactor: 1.4, rainFactor: 1.5 },
    "Kidney Bean": { baseRisk: 0.14, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    "Lima Bean": { baseRisk: 0.14, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    "Navy Bean": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Pinto Bean": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    
    // OILSEEDS
    "Groundnut": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    "Mustard": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Sesame": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Sunflower": { baseRisk: 0.15, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    "Niger": { baseRisk: 0.11, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Castor": { baseRisk: 0.14, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Linseed": { baseRisk: 0.11, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Safflower": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Rapeseed": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Canola": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    
    // COMMERCIAL CROPS
    "Cotton": { baseRisk: 0.25, humidityFactor: 1.8, tempFactor: 1.5, rainFactor: 1.6 },
    "Sugarcane": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    "Jute": { baseRisk: 0.18, humidityFactor: 1.6, tempFactor: 1.4, rainFactor: 1.5 },
    "Mesta": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.3, rainFactor: 1.4 },
    "Tobacco": { baseRisk: 0.20, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Rubber": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.4, rainFactor: 1.5 },
    "Tea": { baseRisk: 0.21, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Coffee": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.4, rainFactor: 1.5 },
    "Cocoa": { baseRisk: 0.22, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    
    // VEGETABLES
    "Potato": { baseRisk: 0.20, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Tomato": { baseRisk: 0.24, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Onion": { baseRisk: 0.14, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Chilli": { baseRisk: 0.22, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Brinjal": { baseRisk: 0.23, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Okra": { baseRisk: 0.19, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Cucumber": { baseRisk: 0.21, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Bottle Gourd": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Bitter Gourd": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Watermelon": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Muskmelon": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Cauliflower": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Cabbage": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Carrot": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Radish": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Spinach": { baseRisk: 0.11, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Lettuce": { baseRisk: 0.12, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Broccoli": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Capsicum": { baseRisk: 0.21, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Beetroot": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Turnip": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Kohlrabi": { baseRisk: 0.14, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Artichoke": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Asparagus": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    
    // TUBERS & ROOTS
    "Sweet Potato": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Cassava": { baseRisk: 0.16, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Yam": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Taro": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Arrowroot": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Ginger": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Turmeric": { baseRisk: 0.12, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    
    // SPICES & CONDIMENTS
    "Coriander": { baseRisk: 0.10, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Cumin": { baseRisk: 0.09, humidityFactor: 1.1, tempFactor: 0.9, rainFactor: 1.0 },
    "Fenugreek": { baseRisk: 0.10, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Fennel": { baseRisk: 0.11, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Cardamom": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Pepper": { baseRisk: 0.21, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Cloves": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Cinnamon": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Nutmeg": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Mace": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Star Anise": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Bay Leaves": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Oregano": { baseRisk: 0.09, humidityFactor: 1.1, tempFactor: 0.9, rainFactor: 1.0 },
    "Thyme": { baseRisk: 0.09, humidityFactor: 1.1, tempFactor: 0.9, rainFactor: 1.0 },
    "Sage": { baseRisk: 0.09, humidityFactor: 1.1, tempFactor: 0.9, rainFactor: 1.0 },
    "Basil": { baseRisk: 0.11, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    
    // FRUITS
    "Mango": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Banana": { baseRisk: 0.22, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Litchi": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Coconut": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Grapes": { baseRisk: 0.21, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Pomegranate": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Guava": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Papaya": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Apple": { baseRisk: 0.16, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Orange": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Lemon": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Lime": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Pineapple": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Strawberry": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Blueberry": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Raspberry": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Blackberry": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Cranberry": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Kiwi": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Avocado": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Fig": { baseRisk: 0.16, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Date": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Custard Apple": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Sapota": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Jackfruit": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Breadfruit": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Dragon Fruit": { baseRisk: 0.16, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    
    // FIBER CROPS
    "Hemp": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Flax": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Sisal": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Coir": { baseRisk: 0.20, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Kapok": { baseRisk: 0.18, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    
    // MEDICINAL CROPS
    "Aloe Vera": { baseRisk: 0.08, humidityFactor: 1.0, tempFactor: 0.8, rainFactor: 0.9 },
    "Neem": { baseRisk: 0.14, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Tulsi": { baseRisk: 0.10, humidityFactor: 1.2, tempFactor: 1.0, rainFactor: 1.1 },
    "Ashwagandha": { baseRisk: 0.11, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Brahmi": { baseRisk: 0.13, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Shatavari": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Giloy": { baseRisk: 0.12, humidityFactor: 1.3, tempFactor: 1.1, rainFactor: 1.2 },
    "Amla": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Haritaki": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Bibhitaki": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    "Triphala": { baseRisk: 0.15, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 },
    
    // MISCELLANEOUS
    "Bamboo": { baseRisk: 0.16, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Cashew": { baseRisk: 0.17, humidityFactor: 1.5, tempFactor: 1.2, rainFactor: 1.3 },
    "Areca Nut": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Betel Nut": { baseRisk: 0.19, humidityFactor: 1.6, tempFactor: 1.3, rainFactor: 1.4 },
    "Oil Palm": { baseRisk: 0.21, humidityFactor: 1.7, tempFactor: 1.4, rainFactor: 1.5 },
    "Date Palm": { baseRisk: 0.16, humidityFactor: 1.4, tempFactor: 1.2, rainFactor: 1.3 }
  }
  
  const pestFactors = pestRiskFactors[normalizedCropType] || pestRiskFactors["Chickpea"]
  
  // Calculate comprehensive pest risk
  let pestRisk = pestFactors.baseRisk
  
  // Humidity impact
  if (pestAvgHumidity > 80) {
    pestRisk *= pestFactors.humidityFactor
  } else if (pestAvgHumidity > 70) {
    pestRisk *= (pestFactors.humidityFactor * 0.8)
  } else if (pestAvgHumidity < 40) {
    pestRisk *= 0.7 // Lower risk in dry conditions
  }
  
  // Temperature impact
  if (pestAvgTemp > 30) {
    pestRisk *= pestFactors.tempFactor
  } else if (pestAvgTemp < 15) {
    pestRisk *= 0.6 // Lower risk in cold conditions
  }
  
  // Rainfall impact
  if (rainyDays > 5) {
    pestRisk *= pestFactors.rainFactor
  } else if (rainyDays > 3) {
    pestRisk *= (pestFactors.rainFactor * 0.8)
  } else if (rainyDays === 0) {
    pestRisk *= 0.8 // Lower risk in dry conditions
  }
  
  // Location-based pest risk adjustments
  const locationPestRisk = location.toLowerCase().includes('kerala') ? 1.3 :
                          location.toLowerCase().includes('west bengal') ? 1.2 :
                          location.toLowerCase().includes('tamil nadu') ? 1.2 :
                          location.toLowerCase().includes('rajasthan') ? 0.8 :
                          location.toLowerCase().includes('punjab') ? 0.9 : 1.0
  
  pestRisk *= locationPestRisk
  
  // Convert to percentage and categorize
  const pestRiskPercent = Math.min(35, Math.max(5, pestRisk * 100))
  let pestRiskLevel = "Low"
  let pestControlStrategy = "Preventive monitoring"
  let pestCostBenefit = "Medium"
  let pestImplementationTime = "1 week"
  
  if (pestRiskPercent > 25) {
    pestRiskLevel = "Very High"
    pestControlStrategy = "Intensive IPM with chemical control"
    pestCostBenefit = "Very High"
    pestImplementationTime = "Immediate"
  } else if (pestRiskPercent > 20) {
    pestRiskLevel = "High"
    pestControlStrategy = "Enhanced IPM with biological control"
    pestCostBenefit = "High"
    pestImplementationTime = "2-3 days"
  } else if (pestRiskPercent > 15) {
    pestRiskLevel = "Medium"
    pestControlStrategy = "Integrated Pest Management"
    pestCostBenefit = "High"
    pestImplementationTime = "1 week"
  } else {
    pestRiskLevel = "Low"
    pestControlStrategy = "Preventive monitoring and cultural practices"
    pestCostBenefit = "Medium"
    pestImplementationTime = "1-2 weeks"
  }
  
  // Crop-specific pest recommendations
  const cropSpecificPests = {
    Rice: ["Brown Plant Hopper", "Rice Blast", "Sheath Blight"],
    Wheat: ["Aphids", "Rust", "Powdery Mildew"],
    Chickpea: ["Pod Borer", "Fusarium Wilt", "Ascochyta Blight"],
    Maize: ["Fall Armyworm", "Corn Borer", "Rust"],
    Potato: ["Late Blight", "Colorado Beetle", "Aphids"],
    Cotton: ["Bollworm", "Whitefly", "Aphids"],
    Chilli: ["Thrips", "Mites", "Anthracnose"],
    Tomato: ["Fruit Borer", "Blight", "Mosaic Virus"],
    Brinjal: ["Fruit Borer", "Shoot Borer", "Mites"],
    Okra: ["Fruit Borer", "Yellow Mosaic", "Powdery Mildew"]
  }
  
  const commonPests = cropSpecificPests[cropType] || cropSpecificPests["Chickpea"]

  // Eco-friendly pest management alternatives
  const ecoPestAlternatives = {
    "Intensive IPM with chemical control": {
      alternatives: ["Neem-based pesticides", "Botanical extracts", "Biopesticides"],
      benefits: "Reduced chemical residues, soil health preservation, biodiversity protection",
      environmentalImpact: "Medium",
      costSavings: "30-40% chemical costs"
    },
    "Enhanced IPM with biological control": {
      alternatives: ["Beneficial insects", "Microbial pesticides", "Trap crops"],
      benefits: "Natural pest control, sustainable farming, long-term effectiveness",
      environmentalImpact: "High",
      costSavings: "40-60% chemical costs"
    },
    "Integrated Pest Management": {
      alternatives: ["Cultural practices", "Physical barriers", "Biological control"],
      benefits: "Holistic approach, minimal environmental impact, cost-effective",
      environmentalImpact: "Very High",
      costSavings: "50-70% chemical costs"
    },
    "Preventive monitoring and cultural practices": {
      alternatives: ["Crop rotation", "Intercropping", "Sanitation practices"],
      benefits: "Prevention-focused, zero chemical use, soil health improvement",
      environmentalImpact: "Very High",
      costSavings: "60-80% chemical costs"
    }
  }

  const pestEco = ecoPestAlternatives[pestControlStrategy] || ecoPestAlternatives["Integrated Pest Management"]

  recommendations.push({
    titleKey: "dashboard.optimization.pest.title",
    subtitleKey: "dashboard.optimization.pest.subtitle",
    descriptionKey: "dashboard.optimization.pest.description",
    improvementKey: "dashboard.optimization.pest.improvement",
    params: { 
      crop: cropType.toLowerCase(), 
      risk: `${pestRiskPercent.toFixed(1)}%`,
      riskLevel: pestRiskLevel,
      strategy: pestControlStrategy,
      commonPests: commonPests.join(", "),
      avgHumidity: pestAvgHumidity.toFixed(1),
      rainyDays: rainyDays,
      avgTemp: pestAvgTemp.toFixed(1),
      costBenefit: pestCostBenefit,
      implementationTime: pestImplementationTime,
      // Eco-friendly parameters
      alternatives: pestEco.alternatives.join(", "),
      benefits: pestEco.benefits,
      environmentalImpact: pestEco.environmentalImpact,
      costSavings: pestEco.costSavings
    },
    icon: "🛡️",
    costBenefit: pestCostBenefit,
    implementationTime: pestImplementationTime,
    priority: pestRiskLevel === "Very High" || pestRiskLevel === "High" ? "High" : "Medium"
  })

  // Sophisticated nutrient management system
  const avgNutrients = (soilData.nitrogen + soilData.phosphorus + soilData.potassium) / 3
  
  // Comprehensive crop-specific nutrient requirements for ALL crops
  const nutrientRequirements = {
    // GRAINS & CEREALS
    "Rice": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Wheat": { N: 120, P: 60, K: 80, pH: [6.0, 7.5] },
    "Maize": { N: 150, P: 80, K: 100, pH: [5.8, 7.0] },
    "Jowar": { N: 100, P: 50, K: 70, pH: [6.0, 7.5] },
    "Bajra": { N: 80, P: 40, K: 60, pH: [6.0, 7.5] },
    "Ragi": { N: 90, P: 45, K: 65, pH: [5.5, 7.0] },
    "Barley": { N: 110, P: 55, K: 75, pH: [6.0, 7.5] },
    "Oats": { N: 100, P: 50, K: 70, pH: [6.0, 7.5] },
    "Quinoa": { N: 120, P: 60, K: 80, pH: [6.0, 7.5] },
    
    // PULSES
    "Black Gram": { N: 50, P: 25, K: 35, pH: [6.0, 7.5] },
    "Green Gram": { N: 60, P: 30, K: 40, pH: [6.0, 7.5] },
    "Horse Gram": { N: 40, P: 20, K: 30, pH: [6.0, 7.5] },
    "Bengal Gram": { N: 50, P: 25, K: 35, pH: [6.0, 7.5] },
    "Chickpea": { N: 60, P: 30, K: 40, pH: [6.0, 7.5] },
    "Pigeon Pea": { N: 70, P: 35, K: 45, pH: [6.0, 7.5] },
    "Lentil": { N: 45, P: 22, K: 32, pH: [6.0, 7.5] },
    "Pea": { N: 55, P: 28, K: 38, pH: [6.0, 7.5] },
    "Soybean": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Kidney Bean": { N: 65, P: 32, K: 42, pH: [6.0, 7.0] },
    "Lima Bean": { N: 65, P: 32, K: 42, pH: [6.0, 7.0] },
    "Navy Bean": { N: 60, P: 30, K: 40, pH: [6.0, 7.0] },
    "Pinto Bean": { N: 60, P: 30, K: 40, pH: [6.0, 7.0] },
    
    // OILSEEDS
    "Groundnut": { N: 70, P: 35, K: 50, pH: [6.0, 7.0] },
    "Mustard": { N: 80, P: 40, K: 60, pH: [6.0, 7.5] },
    "Sesame": { N: 60, P: 30, K: 45, pH: [6.0, 7.5] },
    "Sunflower": { N: 90, P: 45, K: 65, pH: [6.0, 7.5] },
    "Niger": { N: 50, P: 25, K: 35, pH: [6.0, 7.5] },
    "Castor": { N: 80, P: 40, K: 60, pH: [6.0, 7.5] },
    "Linseed": { N: 55, P: 28, K: 40, pH: [6.0, 7.5] },
    "Safflower": { N: 70, P: 35, K: 50, pH: [6.0, 7.5] },
    "Rapeseed": { N: 80, P: 40, K: 60, pH: [6.0, 7.5] },
    "Canola": { N: 80, P: 40, K: 60, pH: [6.0, 7.5] },
    
    // COMMERCIAL CROPS
    "Cotton": { N: 200, P: 100, K: 150, pH: [6.0, 8.0] },
    "Sugarcane": { N: 250, P: 120, K: 180, pH: [6.0, 7.5] },
    "Jute": { N: 120, P: 60, K: 90, pH: [6.0, 7.5] },
    "Mesta": { N: 100, P: 50, K: 75, pH: [6.0, 7.5] },
    "Tobacco": { N: 150, P: 75, K: 110, pH: [6.0, 7.0] },
    "Rubber": { N: 180, P: 90, K: 130, pH: [5.5, 7.0] },
    "Tea": { N: 160, P: 80, K: 120, pH: [4.5, 6.0] },
    "Coffee": { N: 140, P: 70, K: 100, pH: [5.5, 6.5] },
    "Cocoa": { N: 120, P: 60, K: 90, pH: [5.5, 7.0] },
    
    // VEGETABLES
    "Potato": { N: 100, P: 50, K: 120, pH: [5.0, 6.0] },
    "Tomato": { N: 120, P: 60, K: 100, pH: [6.0, 7.0] },
    "Onion": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Chilli": { N: 80, P: 40, K: 60, pH: [5.5, 7.0] },
    "Brinjal": { N: 100, P: 50, K: 80, pH: [6.0, 7.0] },
    "Okra": { N: 60, P: 30, K: 50, pH: [6.0, 7.5] },
    "Cucumber": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    "Bottle Gourd": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Bitter Gourd": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Watermelon": { N: 70, P: 35, K: 55, pH: [6.0, 7.0] },
    "Muskmelon": { N: 70, P: 35, K: 55, pH: [6.0, 7.0] },
    "Cauliflower": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    "Cabbage": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Carrot": { N: 75, P: 37, K: 55, pH: [6.0, 7.0] },
    "Radish": { N: 60, P: 30, K: 45, pH: [6.0, 7.0] },
    "Spinach": { N: 70, P: 35, K: 50, pH: [6.0, 7.0] },
    "Lettuce": { N: 65, P: 32, K: 48, pH: [6.0, 7.0] },
    "Broccoli": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    "Capsicum": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Beetroot": { N: 75, P: 37, K: 55, pH: [6.0, 7.0] },
    "Turnip": { N: 60, P: 30, K: 45, pH: [6.0, 7.0] },
    "Kohlrabi": { N: 70, P: 35, K: 50, pH: [6.0, 7.0] },
    "Artichoke": { N: 100, P: 50, K: 80, pH: [6.0, 7.0] },
    "Asparagus": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    
    // TUBERS & ROOTS
    "Sweet Potato": { N: 80, P: 40, K: 60, pH: [5.5, 6.5] },
    "Cassava": { N: 70, P: 35, K: 55, pH: [5.5, 7.0] },
    "Yam": { N: 85, P: 42, K: 65, pH: [5.5, 6.5] },
    "Taro": { N: 90, P: 45, K: 70, pH: [5.5, 6.5] },
    "Arrowroot": { N: 75, P: 37, K: 55, pH: [5.5, 6.5] },
    "Ginger": { N: 80, P: 40, K: 60, pH: [5.5, 6.5] },
    "Turmeric": { N: 85, P: 42, K: 65, pH: [5.5, 6.5] },
    
    // SPICES & CONDIMENTS
    "Coriander": { N: 50, P: 25, K: 35, pH: [6.0, 7.0] },
    "Cumin": { N: 45, P: 22, K: 32, pH: [6.0, 7.0] },
    "Fenugreek": { N: 50, P: 25, K: 35, pH: [6.0, 7.0] },
    "Fennel": { N: 55, P: 28, K: 38, pH: [6.0, 7.0] },
    "Cardamom": { N: 120, P: 60, K: 90, pH: [5.5, 6.5] },
    "Pepper": { N: 100, P: 50, K: 75, pH: [5.5, 6.5] },
    "Cloves": { N: 110, P: 55, K: 80, pH: [5.5, 6.5] },
    "Cinnamon": { N: 90, P: 45, K: 70, pH: [5.5, 6.5] },
    "Nutmeg": { N: 100, P: 50, K: 75, pH: [5.5, 6.5] },
    "Mace": { N: 100, P: 50, K: 75, pH: [5.5, 6.5] },
    "Star Anise": { N: 95, P: 47, K: 72, pH: [5.5, 6.5] },
    "Bay Leaves": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Oregano": { N: 45, P: 22, K: 32, pH: [6.0, 7.0] },
    "Thyme": { N: 45, P: 22, K: 32, pH: [6.0, 7.0] },
    "Sage": { N: 45, P: 22, K: 32, pH: [6.0, 7.0] },
    "Basil": { N: 50, P: 25, K: 35, pH: [6.0, 7.0] },
    
    // FRUITS
    "Mango": { N: 100, P: 50, K: 80, pH: [6.0, 7.5] },
    "Banana": { N: 150, P: 75, K: 120, pH: [6.0, 7.5] },
    "Litchi": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    "Coconut": { N: 120, P: 60, K: 90, pH: [6.0, 7.5] },
    "Grapes": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Pomegranate": { N: 70, P: 35, K: 55, pH: [6.0, 7.5] },
    "Guava": { N: 85, P: 42, K: 65, pH: [6.0, 7.5] },
    "Papaya": { N: 100, P: 50, K: 80, pH: [6.0, 7.0] },
    "Apple": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    "Orange": { N: 110, P: 55, K: 85, pH: [6.0, 7.0] },
    "Lemon": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Lime": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Pineapple": { N: 95, P: 47, K: 72, pH: [5.5, 6.5] },
    "Strawberry": { N: 80, P: 40, K: 60, pH: [5.5, 6.5] },
    "Blueberry": { N: 70, P: 35, K: 55, pH: [4.5, 5.5] },
    "Raspberry": { N: 75, P: 37, K: 55, pH: [5.5, 6.5] },
    "Blackberry": { N: 75, P: 37, K: 55, pH: [5.5, 6.5] },
    "Cranberry": { N: 70, P: 35, K: 55, pH: [4.5, 5.5] },
    "Kiwi": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    "Avocado": { N: 100, P: 50, K: 80, pH: [6.0, 7.0] },
    "Fig": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Date": { N: 90, P: 45, K: 70, pH: [6.0, 7.5] },
    "Custard Apple": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Sapota": { N: 85, P: 42, K: 65, pH: [6.0, 7.0] },
    "Jackfruit": { N: 95, P: 47, K: 72, pH: [6.0, 7.0] },
    "Breadfruit": { N: 95, P: 47, K: 72, pH: [6.0, 7.0] },
    "Dragon Fruit": { N: 75, P: 37, K: 55, pH: [6.0, 7.0] },
    
    // FIBER CROPS
    "Hemp": { N: 100, P: 50, K: 75, pH: [6.0, 7.0] },
    "Flax": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Sisal": { N: 70, P: 35, K: 55, pH: [6.0, 7.5] },
    "Coir": { N: 120, P: 60, K: 90, pH: [6.0, 7.5] },
    "Kapok": { N: 90, P: 45, K: 70, pH: [6.0, 7.0] },
    
    // MEDICINAL CROPS
    "Aloe Vera": { N: 40, P: 20, K: 30, pH: [6.0, 7.0] },
    "Neem": { N: 80, P: 40, K: 60, pH: [6.0, 7.5] },
    "Tulsi": { N: 50, P: 25, K: 35, pH: [6.0, 7.0] },
    "Ashwagandha": { N: 60, P: 30, K: 45, pH: [6.0, 7.0] },
    "Brahmi": { N: 70, P: 35, K: 50, pH: [6.0, 7.0] },
    "Shatavari": { N: 65, P: 32, K: 48, pH: [6.0, 7.0] },
    "Giloy": { N: 65, P: 32, K: 48, pH: [6.0, 7.0] },
    "Amla": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Haritaki": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Bibhitaki": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    "Triphala": { N: 80, P: 40, K: 60, pH: [6.0, 7.0] },
    
    // MISCELLANEOUS
    "Bamboo": { N: 120, P: 60, K: 90, pH: [6.0, 7.0] },
    "Cashew": { N: 100, P: 50, K: 80, pH: [6.0, 7.0] },
    "Areca Nut": { N: 110, P: 55, K: 85, pH: [6.0, 7.0] },
    "Betel Nut": { N: 110, P: 55, K: 85, pH: [6.0, 7.0] },
    "Oil Palm": { N: 200, P: 100, K: 150, pH: [5.5, 7.0] },
    "Date Palm": { N: 90, P: 45, K: 70, pH: [6.0, 7.5] }
  }
  
  const cropNutrients = nutrientRequirements[normalizedCropType] || nutrientRequirements["Chickpea"]
  
  // Calculate nutrient deficiencies
  const nDeficiency = Math.max(0, cropNutrients.N - soilData.nitrogen)
  const pDeficiency = Math.max(0, cropNutrients.P - soilData.phosphorus)
  const kDeficiency = Math.max(0, cropNutrients.K - soilData.potassium)
  const totalDeficiency = nDeficiency + pDeficiency + kDeficiency
  
  // pH analysis
  const optimalPH = cropNutrients.pH
  const phDeviation = Math.min(
    Math.abs(soilData.ph - optimalPH[0]),
    Math.abs(soilData.ph - optimalPH[1])
  )
  
  // Determine nutrient management strategy
  let nutrientStrategy = "Balanced NPK"
  let applicationMethod = "Soil application"
  let applicationTiming = "Pre-planting"
  let nutrientCostBenefit = "High"
  let nutrientImplementationTime = "1-2 weeks"
  let priority = "Medium"
  
  if (totalDeficiency > 100) {
    nutrientStrategy = "High-dose NPK with micronutrients"
    applicationMethod = "Split application (pre-planting + side dressing)"
    applicationTiming = "Pre-planting + 30 days after sowing"
    nutrientCostBenefit = "Very High"
    priority = "High"
  } else if (totalDeficiency > 50) {
    nutrientStrategy = "Targeted NPK application"
    applicationMethod = "Soil application with foliar spray"
    applicationTiming = "Pre-planting + flowering stage"
    nutrientCostBenefit = "High"
    priority = "High"
  } else if (totalDeficiency > 20) {
    nutrientStrategy = "Balanced NPK with organic matter"
    applicationMethod = "Soil application"
    applicationTiming = "Pre-planting"
    nutrientCostBenefit = "High"
    priority = "Medium"
  } else if (phDeviation > 1.0) {
    nutrientStrategy = "pH correction with lime/sulfur"
    applicationMethod = "Soil amendment"
    applicationTiming = "30 days before planting"
    nutrientCostBenefit = "Medium"
    priority = "Medium"
  } else {
    nutrientStrategy = "Maintenance fertilization"
    applicationMethod = "Light soil application"
    applicationTiming = "During growth stages"
    nutrientCostBenefit = "Medium"
    priority = "Low"
  }
  
  // Seasonal timing adjustments
  const seasonalTiming = {
    "january": "Pre-planting application",
    "february": "Pre-planting application", 
    "march": "Pre-planting + early growth",
    "april": "Pre-planting + early growth",
    "may": "Early growth stage",
    "june": "Active growth stage",
    "july": "Active growth stage",
    "august": "Flowering stage",
    "september": "Flowering stage",
    "october": "Pre-planting application",
    "november": "Pre-planting application",
    "december": "Pre-planting application"
  }
  
  const currentTiming = seasonalTiming[month.toLowerCase()] || "Pre-planting application"
  
  // Calculate expected improvement
  const expectedImprovement = Math.min(30, Math.max(5, totalDeficiency * 0.2))
  
  // Environmentally-friendly fertilizer recommendations
  const ecoFriendlyFertilizers = {
    Rice: {
      organic: ["Vermicompost", "Farm Yard Manure", "Green Manure"],
      bio: ["Azospirillum", "Phosphobacteria", "Potash Mobilizing Bacteria"],
      natural: ["Neem Cake", "Mustard Cake", "Sesame Cake"],
      efficiency: "85-95%",
      costPerAcre: "₹8,000-12,000",
      environmentalImpact: "Very Low"
    },
    Wheat: {
      organic: ["Compost", "Vermicompost", "Crop Residue"],
      bio: ["Azotobacter", "PSB", "KMB"],
      natural: ["Neem Cake", "Castor Cake"],
      efficiency: "80-90%",
      costPerAcre: "₹6,000-10,000",
      environmentalImpact: "Low"
    },
    Chickpea: {
      organic: ["Farm Yard Manure", "Compost", "Green Manure"],
      bio: ["Rhizobium", "PSB", "VAM"],
      natural: ["Neem Cake", "Groundnut Cake"],
      efficiency: "90-95%",
      costPerAcre: "₹4,000-7,000",
      environmentalImpact: "Very Low"
    },
    Maize: {
      organic: ["Compost", "Vermicompost", "Crop Residue"],
      bio: ["Azospirillum", "PSB", "KMB"],
      natural: ["Neem Cake", "Soybean Cake"],
      efficiency: "85-92%",
      costPerAcre: "₹7,000-11,000",
      environmentalImpact: "Low"
    },
    Potato: {
      organic: ["Compost", "Vermicompost", "Farm Yard Manure"],
      bio: ["PSB", "KMB", "VAM"],
      natural: ["Neem Cake", "Mustard Cake"],
      efficiency: "88-95%",
      costPerAcre: "₹9,000-14,000",
      environmentalImpact: "Low"
    },
    Cotton: {
      organic: ["Compost", "Vermicompost", "Green Manure"],
      bio: ["Azospirillum", "PSB", "KMB"],
      natural: ["Neem Cake", "Castor Cake"],
      efficiency: "82-90%",
      costPerAcre: "₹10,000-15,000",
      environmentalImpact: "Low"
    },
    Chilli: {
      organic: ["Vermicompost", "Compost", "Farm Yard Manure"],
      bio: ["PSB", "KMB", "VAM"],
      natural: ["Neem Cake", "Mustard Cake"],
      efficiency: "85-93%",
      costPerAcre: "₹6,000-9,000",
      environmentalImpact: "Very Low"
    },
    Tomato: {
      organic: ["Compost", "Vermicompost", "Farm Yard Manure"],
      bio: ["PSB", "KMB", "VAM"],
      natural: ["Neem Cake", "Soybean Cake"],
      efficiency: "87-94%",
      costPerAcre: "₹7,000-11,000",
      environmentalImpact: "Low"
    },
    Brinjal: {
      organic: ["Compost", "Vermicompost", "Farm Yard Manure"],
      bio: ["PSB", "KMB", "VAM"],
      natural: ["Neem Cake", "Mustard Cake"],
      efficiency: "85-92%",
      costPerAcre: "₹6,000-10,000",
      environmentalImpact: "Low"
    },
    Okra: {
      organic: ["Compost", "Vermicompost", "Farm Yard Manure"],
      bio: ["PSB", "KMB", "VAM"],
      natural: ["Neem Cake", "Groundnut Cake"],
      efficiency: "88-95%",
      costPerAcre: "₹5,000-8,000",
      environmentalImpact: "Very Low"
    }
  }

  const cropEcoFertilizers = ecoFriendlyFertilizers[normalizedCropType] || ecoFriendlyFertilizers["Chickpea"]

  // Cost-effectiveness analysis
  const costEffectiveness = {
    irrigation: {
      drip: { cost: "₹25,000-40,000/acre", savings: "30-50% water", roi: "2-3 years", environmental: "High" },
      sprinkler: { cost: "₹15,000-25,000/acre", savings: "20-30% water", roi: "1-2 years", environmental: "Medium" },
      flood: { cost: "₹5,000-10,000/acre", savings: "0% water", roi: "Immediate", environmental: "Low" }
    },
    pest: {
      ipm: { cost: "₹3,000-6,000/acre", savings: "40-60% chemicals", roi: "1 season", environmental: "High" },
      biological: { cost: "₹2,000-4,000/acre", savings: "60-80% chemicals", roi: "1 season", environmental: "Very High" },
      chemical: { cost: "₹4,000-8,000/acre", savings: "0% chemicals", roi: "Immediate", environmental: "Very Low" }
    },
    nutrients: {
      organic: { cost: "₹6,000-12,000/acre", savings: "Long-term soil health", roi: "2-3 years", environmental: "Very High" },
      bio: { cost: "₹1,000-3,000/acre", savings: "30-40% chemical fertilizers", roi: "1 season", environmental: "High" },
      chemical: { cost: "₹8,000-15,000/acre", savings: "Immediate results", roi: "Immediate", environmental: "Low" }
    }
  }

  // Calculate cost-effectiveness score
  // irrigationType already defined above
  const pestType = pestControlStrategy.includes("Intensive") ? "chemical" :
                   pestControlStrategy.includes("Enhanced") ? "ipm" : "biological"
  const nutrientType = nutrientStrategy.includes("High-dose") ? "chemical" :
                       nutrientStrategy.includes("Targeted") ? "bio" : "organic"

  const irrigationCost = costEffectiveness.irrigation[irrigationType]
  const pestCost = costEffectiveness.pest[pestType]
  const nutrientCost = costEffectiveness.nutrients[nutrientType]

  // Overall cost-effectiveness score
  const totalCost = (parseInt(irrigationCost.cost.split("-")[0].replace("₹", "").replace(",", "")) + 
                    parseInt(pestCost.cost.split("-")[0].replace("₹", "").replace(",", "")) + 
                    parseInt(nutrientCost.cost.split("-")[0].replace("₹", "").replace(",", ""))) / 3

  const environmentalScore = (irrigationCost.environmental === "High" ? 3 : 
                             irrigationCost.environmental === "Medium" ? 2 : 1) +
                            (pestCost.environmental === "Very High" ? 4 : 
                             pestCost.environmental === "High" ? 3 : 
                             pestCost.environmental === "Medium" ? 2 : 1) +
                            (nutrientCost.environmental === "Very High" ? 4 : 
                             nutrientCost.environmental === "High" ? 3 : 
                             nutrientCost.environmental === "Medium" ? 2 : 1)

  const costEffectivenessScore = Math.round((environmentalScore / 11) * 100)

  // Always show nutrient management (not just for low NPK)
  recommendations.push({
    title: "Eco-Friendly Nutrient Management",
    subtitle: "Sustainable Fertilization • " + applicationTiming,
    description: `${nutrientStrategy} using ${cropEcoFertilizers.organic.join(", ")} and ${cropEcoFertilizers.bio.join(", ")}. Soil-friendly approach with ${cropEcoFertilizers.efficiency} efficiency. Cost: ${cropEcoFertilizers.costPerAcre}/acre. Environmental Impact: ${cropEcoFertilizers.environmental}.`,
    improvement: `Expected improvement: ${expectedImprovement.toFixed(0)}-${(expectedImprovement + 10).toFixed(0)}% nutrient efficiency with ${cropEcoFertilizers.efficiency} eco-friendly efficiency`,
    icon: "🌱",
    costBenefit: nutrientCostBenefit,
    implementationTime: nutrientImplementationTime,
    priority: priority,
    params: {
      crop: cropType.toLowerCase(),
      nDeficiency: nDeficiency.toFixed(0),
      pDeficiency: pDeficiency.toFixed(0),
      kDeficiency: kDeficiency.toFixed(0),
      phDeviation: phDeviation.toFixed(1),
      strategy: nutrientStrategy,
      method: applicationMethod,
      timing: applicationTiming,
      currentTiming: currentTiming,
      expectedImprovement: expectedImprovement.toFixed(0),
      costBenefit: nutrientCostBenefit,
      implementationTime: nutrientImplementationTime,
      // Eco-friendly parameters
      organicFertilizers: cropEcoFertilizers.organic.join(", "),
      bioFertilizers: cropEcoFertilizers.bio.join(", "),
      naturalFertilizers: cropEcoFertilizers.natural.join(", "),
      efficiency: cropEcoFertilizers.efficiency,
      costPerAcre: cropEcoFertilizers.costPerAcre,
      environmentalImpact: cropEcoFertilizers.environmental
    },
    costBenefit: nutrientCostBenefit,
    implementationTime: nutrientImplementationTime,
    priority: priority
  })

  // Add Cost-Effectiveness Analysis recommendation
  recommendations.push({
    title: "Cost-Effectiveness Analysis",
    subtitle: "ROI & Sustainability • Comprehensive",
    description: `Total investment: ₹${totalCost.toFixed(0)}/acre. Environmental score: ${costEffectivenessScore}%. Irrigation: ${irrigationCost.savings} water savings, ROI: ${irrigationCost.roi}. Pest: ${pestCost.savings} chemical reduction, ROI: ${pestCost.roi}. Nutrients: ${nutrientCost.savings}, ROI: ${nutrientCost.roi}.`,
    improvement: `Expected ROI: 150-300% over 2-3 years with sustainable practices`,
    icon: "💰",
    costBenefit: costEffectivenessScore > 70 ? "Very High" : costEffectivenessScore > 50 ? "High" : "Medium",
    implementationTime: "Immediate",
    priority: "High",
    params: {
      totalCost: `₹${totalCost.toFixed(0)}/acre`,
      environmentalScore: `${costEffectivenessScore}%`,
      irrigationSavings: irrigationCost.savings,
      irrigationROI: irrigationCost.roi,
      pestSavings: pestCost.savings,
      pestROI: pestCost.roi,
      nutrientSavings: nutrientCost.savings,
      nutrientROI: nutrientCost.roi,
      expectedROI: "150-300%",
      timeframe: "2-3 years"
    }
  })

  return recommendations
}

// Generate dynamic, step-by-step plan to achieve predicted yield increase
const generateYieldIncreasePlan = (soilData, weatherData, predictions, cropType = "Crop") => {
  const steps = []
  const crop = (cropType || "").toLowerCase()
  const targetIncrease = Math.max(5, predictions?.improvementPercent || predictions?.improvement || 15)

  // Base allocations (will adjust with conditions)
  let irrigationPct = 4
  let fertilityPct = 5
  let varietyPct = 3
  let managementPct = Math.max(0, targetIncrease - (irrigationPct + fertilityPct + varietyPct))

  // Adjust based on soil moisture
  if (soilData?.moisture !== undefined) {
    if (soilData.moisture < 40) irrigationPct += 4
    if (soilData.moisture > 70) managementPct += 2
  }

  // Adjust based on soil pH
  if (soilData?.ph !== undefined) {
    if (soilData.ph < 6.0) fertilityPct += 4
    else if (soilData.ph > 7.8) fertilityPct += 3
  }

  // Adjust based on NPK
  if (soilData?.nitrogen !== undefined && soilData.nitrogen < 50) fertilityPct += 2
  if (soilData?.phosphorus !== undefined && soilData.phosphorus < 30) fertilityPct += 2
  if (soilData?.potassium !== undefined && soilData.potassium < 100) fertilityPct += 2

  // Weather based adjustments
  if (Array.isArray(weatherData) && weatherData.length > 0) {
    const avgTemp = weatherData.reduce((s, d) => s + (d.tempValue || 0), 0) / weatherData.length
    const rainyDays = weatherData.filter(d => (d.rainValue || 0) > 0).length
    if (avgTemp > 35) irrigationPct += 3
    if (rainyDays > 4) managementPct += 2
  }

  // Crop-specific tweaks
  if (crop.includes("rice")) irrigationPct += 2
  if (crop.includes("wheat") || crop.includes("maize")) fertilityPct += 1

  // Normalize to targetIncrease with minimum 2% per non-zero bucket
  const buckets = [
    { name: 'irrigation', val: irrigationPct },
    { name: 'fertility', val: fertilityPct },
    { name: 'variety', val: varietyPct },
    { name: 'management', val: managementPct },
  ]
  const active = buckets.filter(b => b.val > 0)
  const minPer = 2
  let remaining = targetIncrease - active.length * minPer
  const sum = active.reduce((s,b)=>s+b.val,0) || 1
  active.forEach(b => { b.val = minPer + Math.max(0, Math.round((b.val / sum) * remaining)) })
  // Adjust rounding error
  const adjSum = active.reduce((s,b)=>s+b.val,0)
  const diff = targetIncrease - adjSum
  if (diff !== 0 && active.length > 0) active[0].val += diff
  irrigationPct = active.find(b=>b.name==='irrigation')?.val || 0
  fertilityPct = active.find(b=>b.name==='fertility')?.val || 0
  varietyPct = active.find(b=>b.name==='variety')?.val || 0
  managementPct = active.find(b=>b.name==='management')?.val || 0

  // Build steps
  if (irrigationPct > 0) {
    const items = []
    if (soilData?.moisture !== undefined && soilData.moisture < 40) items.push("Immediate irrigation: apply 5–7 cm water; re-check moisture in 24h")
    if (Array.isArray(weatherData)) {
      const avgTemp = weatherData.reduce((s, d) => s + (d.tempValue || 0), 0) / weatherData.length
      const rainy = weatherData.filter(d => (d.rainValue || 0) > 0).length
      if (avgTemp > 35) items.push("Increase irrigation frequency during heat (>35°C); irrigate early morning/evening")
      if (rainy > 4) items.push("Reduce irrigation during wet weeks; focus on drainage inspection")
    }
    items.push(crop.includes("rice") ? "Maintain 5–10 cm standing water; use AWD where suitable" : "Adopt drip/sprinkler and irrigate at crop-critical stages")
    steps.push({
      title: "Optimize Irrigation",
      action: crop.includes("rice") ? "Maintain 5-10cm standing water; use alternate wetting/drying if feasible" : "Adopt drip/sprinkler; irrigate at crop-critical stages",
      details: soilData?.moisture !== undefined ? `Current soil moisture: ${soilData.moisture}%` : undefined,
      impact: `${irrigationPct}%`,
      items
    })
  }
  if (fertilityPct > 0) {
    const items = []
    items.push("Split-apply N (basal + 2 splits) matched to crop stages")
    if (soilData?.nitrogen !== undefined && soilData.nitrogen < 50) items.push("Apply 50–75 kg N/ha additionally (urea/ammonium sources)")
    if (soilData?.phosphorus !== undefined && soilData.phosphorus < 30) items.push("Apply 25–40 kg P₂O₅/ha at sowing (DAP/SSP)")
    if (soilData?.potassium !== undefined && soilData.potassium < 100) items.push("Apply 40–60 kg K₂O/ha (MOP/SOP)")
    if (soilData?.ph !== undefined) {
      if (soilData.ph < 6.5) items.push("Correct pH with agricultural lime; re-test in 2–3 weeks")
      if (soilData.ph > 7.5) items.push("Apply gypsum/sulfur to adjust alkaline soils; add organic matter")
    }
    steps.push({
      title: "Improve Fertility & pH",
      action: `Apply recommended NPK splits${soilData?.ph !== undefined ? soilData.ph < 6.5 ? "; add lime to correct pH" : soilData.ph > 7.5 ? "; add sulfur/gypsum to adjust pH" : "" : ""}`,
      details: soilData ? `N:${soilData.nitrogen ?? "?"}, P:${soilData.phosphorus ?? "?"}, K:${soilData.potassium ?? "?"}, pH:${soilData.ph ?? "?"}` : undefined,
      impact: `${fertilityPct}%`,
      items
    })
  }
  if (varietyPct > 0) {
    const items = []
    items.push("Use certified seeds; maintain recommended seed rate and spacing")
    items.push("Choose high-yielding, locally recommended variety for the state")
    steps.push({
      title: "Use High-Yield Variety/Seed",
      action: "Use certified seeds and recommended seed rate; consider HYV suited to state",
      details: crop ? `Crop: ${cropType}` : undefined,
      impact: `${varietyPct}%`,
      items
    })
  }
  if (managementPct > 0) {
    const items = []
    items.push("Weed control at 20–30 DAS (pre/post-emergence as needed)")
    items.push("Weekly scouting for pests/diseases; apply IPM as thresholds are reached")
    items.push("Mulching/residue management to conserve moisture and suppress weeds")
    if (Array.isArray(weatherData)) items.push("Plan field operations around forecasted rain/heat days")
    steps.push({
      title: "Crop & Field Management",
      action: "Weed control at 25-30 DAS; timely pest-disease monitoring; proper spacing",
      details: Array.isArray(weatherData) ? "Adjust operations around rainy/heat days" : undefined,
      impact: `${managementPct}%`,
      items
    })
  }

  // Ensure at least 3 actionable steps
  while (steps.length < 3) {
    steps.push({ title: "Best Practices", action: "Mulching, residue management, and timely interculture", impact: "2%", items: ["Adopt mulching", "Maintain residues", "Interculture on time"] })
  }

  return steps
}

const marketData = {
  currentPrice: "₹4,850/quintal",
  priceChange: "+2.3%",
  demandForecast: "High",
  bestSellingTime: "October 2025",
  profitMargin: "₹1,25,000/hectare",
}

const weatherForecast = [
  { day: "Mon", date: "2025-09-09", temp: "30°/24°C", condition: "Partly cloudy", humidity: 65, wind: "12 km/h" },
  { day: "Tue", date: "2025-09-10", temp: "32°/25°C", condition: "Sunny", humidity: 58, wind: "8 km/h" },
  { day: "Wed", date: "2025-09-11", temp: "29°/23°C", condition: "Light rain", humidity: 78, wind: "15 km/h" },
  { day: "Thu", date: "2025-09-12", temp: "31°/24°C", condition: "Cloudy", humidity: 70, wind: "10 km/h" },
  { day: "Fri", date: "2025-09-13", temp: "33°/26°C", condition: "Light rain", humidity: 72, wind: "14 km/h" },
  { day: "Sat", date: "2025-09-14", temp: "34°/27°C", condition: "Sunny", humidity: 60, wind: "9 km/h" },
  { day: "Sun", date: "2025-09-15", temp: "32°/25°C", condition: "Partly cloudy", humidity: 63, wind: "11 km/h" },
]

const sustainabilityData = {
  carbonFootprint: "2.1 tons CO2/hectare",
  waterUsage: "450mm/season",
  soilHealth: "Improving",
  biodiversityScore: 78,
}

const generateWeatherRiskAnalysis = (weatherData, crop, month) => {
  if (!weatherData || weatherData.length === 0) return []

  const risks = []
  const avgTemp =
    weatherData.reduce((sum, day) => sum + (day.tempValue || Number.parseInt(day.temp)), 0) / weatherData.length
  const totalRain = weatherData.reduce((sum, day) => sum + (day.rainValue || Number.parseInt(day.rain)), 0)
  const avgHumidity =
    weatherData.reduce((sum, day) => sum + (day.humidityValue || Number.parseInt(day.humidity)), 0) / weatherData.length
  const rainyDays = weatherData.filter((day) => (day.rainValue || Number.parseInt(day.rain)) > 0).length

  // Get crop-specific weather requirements (same as main weather risk calculation)
  const normalizedCrop = (crop || "Rice").split(" ")[0].split("(")[0].toLowerCase()
  const cropWeatherRequirements = {
    'rice': { temperature: { min: 20, max: 35, criticalMin: 15, criticalMax: 40 }, humidity: { min: 50, max: 90 }, rainfall: { min: 100, max: 300 } },
    'wheat': { temperature: { min: 15, max: 28, criticalMin: 5, max: 35 }, humidity: { min: 40, max: 80 }, rainfall: { min: 30, max: 100 } },
    'maize': { temperature: { min: 18, max: 32, criticalMin: 10, criticalMax: 38 }, humidity: { min: 45, max: 85 }, rainfall: { min: 50, max: 150 } },
    'cotton': { temperature: { min: 22, max: 36, criticalMin: 15, criticalMax: 42 }, humidity: { min: 35, max: 75 }, rainfall: { min: 40, max: 120 } },
    'chickpea': { temperature: { min: 15, max: 30, criticalMin: 5, criticalMax: 35 }, humidity: { min: 40, max: 70 }, rainfall: { min: 30, max: 80 } }
  }
  const requirements = cropWeatherRequirements[normalizedCrop] || cropWeatherRequirements['rice']

  // Temperature risk analysis using crop-specific requirements
  if (avgTemp > requirements.temperature.criticalMax || avgTemp < requirements.temperature.criticalMin) {
    risks.push({
      typeKey: "dashboard.risks.types.high_temp_alert",
      messageKey: "dashboard.risks.messages.high_temp_alert",
      params: { avgTemp: avgTemp.toFixed(1), crop },
      severity: "high",
      color: "red",
    })
  } else if (avgTemp < 15) {
    risks.push({
      typeKey: "dashboard.risks.types.low_temp_warning",
      messageKey: "dashboard.risks.messages.low_temp_warning",
      params: { avgTemp: avgTemp.toFixed(1), crop },
      severity: "medium",
      color: "blue",
    })
  }

  // Rainfall risk analysis using crop-specific requirements
  if (totalRain > requirements.rainfall.max) {
    risks.push({
      typeKey: "dashboard.risks.types.heavy_rainfall_risk",
      messageKey: "dashboard.risks.messages.heavy_rainfall_risk",
      params: { totalRain, crop, max: requirements.rainfall.max },
      severity: "high",
      color: "yellow",
    })
  } else if (totalRain < requirements.rainfall.min) {
    risks.push({
      typeKey: "dashboard.risks.types.drought_stress_alert",
      messageKey: "dashboard.risks.messages.drought_stress_alert",
      params: { totalRain, crop, min: requirements.rainfall.min },
      severity: "medium",
      color: "orange",
    })
  }

  // Humidity and disease risk using crop-specific requirements
  if (avgHumidity > requirements.humidity.max || avgHumidity < requirements.humidity.min) {
    risks.push({
      typeKey: "dashboard.risks.types.fungal_disease_risk",
      messageKey: "dashboard.risks.messages.fungal_disease_risk",
      params: { avgHumidity: avgHumidity.toFixed(1), crop, min: requirements.humidity.min, max: requirements.humidity.max },
      severity: "medium",
      color: "purple",
    })
  }

  // Crop-specific recommendations
  const cropRecommendations = {
    Rice: "dashboard.risks.crop_guidance.rice",
    Wheat: "dashboard.risks.crop_guidance.wheat",
    "Maize (Corn)": "dashboard.risks.crop_guidance.maize_corn",
    Cotton: "dashboard.risks.crop_guidance.cotton",
    Sugarcane: "dashboard.risks.crop_guidance.sugarcane",
  }

  if (cropRecommendations[crop]) {
    risks.push({
      typeKey: "dashboard.risks.types.crop_specific_guidance",
      messageKey: cropRecommendations[crop],
      severity: "low",
      color: "green",
    })
  }

  return risks
}

const generateAIFertilityRecommendations = (soilData, crop, month, weatherData, t) => {
  if (!soilData) return []

  const recommendations = []
  const { ph, nitrogen, phosphorus, potassium, organicMatter, moisture, texture } = soilData

  // Get crop-specific requirements (same as main soil health calculation)
  const normalizedCrop = (crop || "Rice").split(" ")[0].split("(")[0].toLowerCase()
  const cropRequirements = {
    'rice': { ph: { min: 5.5, max: 7.0 }, nitrogen: { min: 20, max: 35 }, phosphorus: { min: 15, max: 25 }, potassium: { min: 150, max: 250 }, organicMatter: { min: 2.5, max: 5.0 } },
    'wheat': { ph: { min: 6.0, max: 7.5 }, nitrogen: { min: 18, max: 30 }, phosphorus: { min: 12, max: 22 }, potassium: { min: 120, max: 200 }, organicMatter: { min: 2.0, max: 4.0 } },
    'maize': { ph: { min: 5.8, max: 7.0 }, nitrogen: { min: 22, max: 35 }, phosphorus: { min: 15, max: 28 }, potassium: { min: 160, max: 280 }, organicMatter: { min: 2.2, max: 4.5 } },
    'cotton': { ph: { min: 6.0, max: 8.0 }, nitrogen: { min: 15, max: 28 }, phosphorus: { min: 10, max: 20 }, potassium: { min: 100, max: 180 }, organicMatter: { min: 1.8, max: 3.8 } },
    'chickpea': { ph: { min: 6.0, max: 7.5 }, nitrogen: { min: 12, max: 22 }, phosphorus: { min: 8, max: 15 }, potassium: { min: 80, max: 140 }, organicMatter: { min: 1.8, max: 3.5 } }
  }
  const requirements = cropRequirements[normalizedCrop] || cropRequirements['rice']

  // AI-powered nitrogen analysis using crop-specific requirements
  const nitrogenStatus = nitrogen >= requirements.nitrogen.min && nitrogen <= requirements.nitrogen.max ? "optimal" : 
                        nitrogen >= requirements.nitrogen.min * 0.8 ? "moderate" : "deficient"
  if (nitrogenStatus === "deficient") {
    recommendations.push({
      nutrient: "nitrogen",
      priority: "high",
      actionKey: "dashboard.fertility.action.nitrogen.deficient",
      timingKey: "dashboard.fertility.timing.nitrogen.deficient",
      expectedKey: "dashboard.fertility.expected.nitrogen.deficient",
      params: { value: nitrogen, crop: t(`crops.${crop.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || crop, month: t(`months.${month.toLowerCase()}`) || month },
    })
  } else if (nitrogenStatus === "moderate") {
    recommendations.push({
      nutrient: "nitrogen",
      priority: "medium",
      actionKey: "dashboard.fertility.action.nitrogen.moderate",
      timingKey: "dashboard.fertility.timing.nitrogen.moderate",
      expectedKey: "dashboard.fertility.expected.nitrogen.moderate",
      params: { value: nitrogen, crop: t(`crops.${crop.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || crop, month: t(`months.${month.toLowerCase()}`) || month },
    })
  }

  // AI-powered phosphorus analysis using crop-specific requirements
  if (phosphorus < requirements.phosphorus.min) {
    recommendations.push({
      nutrient: "phosphorus",
      priority: "high",
      actionKey: "dashboard.fertility.action.phosphorus.low",
      timingKey: "dashboard.fertility.timing.phosphorus.low",
      expectedKey: "dashboard.fertility.expected.phosphorus.low",
      params: { value: phosphorus, min: requirements.phosphorus.min, max: requirements.phosphorus.max },
    })
  }

  // AI-powered potassium analysis using crop-specific requirements
  if (potassium < requirements.potassium.min) {
    recommendations.push({
      nutrient: "potassium",
      priority: "medium",
      actionKey: "dashboard.fertility.action.potassium.low",
      timingKey: "dashboard.fertility.timing.potassium.low",
      expectedKey: "dashboard.fertility.expected.potassium.low",
      params: { value: potassium, min: requirements.potassium.min, max: requirements.potassium.max },
    })
  }

  // AI pH management using crop-specific requirements
  if (ph < requirements.ph.min) {
    recommendations.push({
      nutrient: "ph_correction",
      priority: "high",
      actionKey: "dashboard.fertility.action.ph_correction.acidic",
      timingKey: "dashboard.fertility.timing.ph_correction.acidic",
      expectedKey: "dashboard.fertility.expected.ph_correction.acidic",
      params: { value: ph, crop, min: requirements.ph.min, max: requirements.ph.max },
    })
  } else if (ph > requirements.ph.max) {
    recommendations.push({
      nutrient: "ph_correction",
      priority: "medium",
      actionKey: "dashboard.fertility.action.ph_correction.alkaline",
      timingKey: "dashboard.fertility.timing.ph_correction.alkaline",
      expectedKey: "dashboard.fertility.expected.ph_correction.alkaline",
      params: { value: ph, min: requirements.ph.min, max: requirements.ph.max },
    })
  }

  // AI organic matter enhancement using crop-specific requirements
  if (organicMatter < requirements.organicMatter.min) {
    recommendations.push({
      nutrient: "organic_matter",
      priority: "medium",
      actionKey: "dashboard.fertility.action.organic_matter.low",
      timingKey: "dashboard.fertility.timing.organic_matter.low",
      expectedKey: "dashboard.fertility.expected.organic_matter.low",
      params: { value: organicMatter },
    })
  }

  // Weather-integrated recommendations
  if (weatherData) {
    const avgHumidity =
      weatherData.reduce((sum, day) => sum + (day.humidityValue || Number.parseInt(day.humidity)), 0) /
      weatherData.length
    const totalRain = weatherData.reduce((sum, day) => sum + (day.rainValue || Number.parseInt(day.rain)), 0)

    if (totalRain > 30 && avgHumidity > 70) {
      recommendations.push({
        nutrient: "weather_adaptive",
        priority: "medium",
        actionKey: "dashboard.fertility.action.weather_adaptive",
        timingKey: "dashboard.fertility.timing.weather_adaptive",
        expectedKey: "dashboard.fertility.expected.weather_adaptive",
      })
    }
  }

  return recommendations
}

const generateDynamicIoTData = (weatherData, soilData, crop, month) => {
  if (!weatherData || !soilData)
    return {
      soilMoisture: 45 + Math.random() * 20,
      temperature: 28 + Math.random() * 8,
      humidity: 60 + Math.random() * 20,
      lightIntensity: 70 + Math.random() * 25,
      lastUpdated: new Date().toLocaleTimeString(),
    }

  // AI analysis based on real weather and soil data
  const currentWeather = weatherData[0] || {}
  const baseTemp = Number.parseFloat(currentWeather.temp) || 28
  const baseHumidity = Number.parseFloat(currentWeather.humidity?.replace("%", "")) || 65

  // Intelligent sensor simulation based on real conditions
  const soilMoisture = Math.max(20, Math.min(90, soilData.moisture + (Math.random() - 0.5) * 10))
  const temperature = Math.max(15, Math.min(45, baseTemp + (Math.random() - 0.5) * 4))
  const humidity = Math.max(30, Math.min(95, baseHumidity + (Math.random() - 0.5) * 8))
  const lightIntensity = currentWeather.condition?.toLowerCase().includes("cloud")
    ? 45 + Math.random() * 30
    : 75 + Math.random() * 20

  return {
    soilMoisture,
    temperature,
    humidity,
    lightIntensity,
    lastUpdated: new Date().toLocaleTimeString(),
    alerts: generateIoTAlerts(soilMoisture, temperature, humidity, crop),
  }
}

const generateIoTAlerts = (moisture, temp, humidity, crop) => {
  const alerts = []
  const cropRequirements = {
    Rice: { minMoisture: 70, maxTemp: 35, maxHumidity: 85 },
    Wheat: { minMoisture: 45, maxTemp: 30, maxHumidity: 70 },
    Chickpea: { minMoisture: 40, maxTemp: 32, maxHumidity: 65 },
    Maize: { minMoisture: 50, maxTemp: 35, maxHumidity: 75 },
  }

  const requirements = cropRequirements[crop?.split(" ")[0]] || cropRequirements.Chickpea

  if (moisture < requirements.minMoisture) {
    alerts.push({
      type: "critical",
      messageKey: "dashboard.alerts.messages.low_moisture",
      actionKey: "dashboard.alerts.actions.start_irrigation",
      params: { moisture: moisture.toFixed(1), crop },
    })
  }

  if (temp > requirements.maxTemp) {
    alerts.push({
      type: "warning",
      messageKey: "dashboard.alerts.messages.high_temp",
      actionKey: "dashboard.alerts.actions.provide_shade",
      params: { temp: temp.toFixed(1), crop },
    })
  }

  if (humidity > requirements.maxHumidity) {
    alerts.push({
      type: "warning",
      messageKey: "dashboard.alerts.messages.high_humidity",
      actionKey: "dashboard.alerts.actions.improve_ventilation",
      params: { humidity: humidity.toFixed(1), crop },
    })
  }

  return alerts
}

const generateDynamicTimeline = (crop, month, location, weatherData, soilData) => {
  const cropTimelines = {
    Rice: {
      phases: [
        {
          phaseKey: "dashboard.timeline.phases.rice.land_prep",
          duration: "15-20 days",
          activities: [
            { key: "dashboard.timeline.activities_list.field_preparation" },
            { key: "dashboard.timeline.activities_list.seed_treatment" },
            { key: "dashboard.timeline.activities_list.nursery_bed_preparation" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.ensure_drainage" },
            { key: "dashboard.timeline.critical.maintain_nursery_moisture" },
            { key: "dashboard.timeline.critical.monitor_seed_germination" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.rice.transplanting",
          duration: "5-7 days",
          activities: [
            { key: "dashboard.timeline.activities_list.seedling_transplantation" },
            { key: "dashboard.timeline.activities_list.field_flooding" },
            { key: "dashboard.timeline.activities_list.initial_fertilizer" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.maintain_water_level", params: { cm: "2-3" } },
            { key: "dashboard.timeline.critical.proper_spacing" },
            { key: "dashboard.timeline.critical.apply_starter_fertilizer" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.vegetative",
          duration: "45-60 days",
          activities: [
            { key: "dashboard.timeline.activities_list.water_management" },
            { key: "dashboard.timeline.activities_list.weed_control" },
            { key: "dashboard.timeline.activities_list.nitrogen_application" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.monitor_water_levels" },
            { key: "dashboard.timeline.critical.control_weeds_early" },
            { key: "dashboard.timeline.critical.apply_n_at_tillering" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.reproductive",
          duration: "30-35 days",
          activities: [
            { key: "dashboard.timeline.activities_list.panicle_initiation_care" },
            { key: "dashboard.timeline.activities_list.pest_monitoring" },
            { key: "dashboard.timeline.activities_list.potassium_application" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.ensure_adequate_water" },
            { key: "dashboard.timeline.critical.monitor_stem_borer" },
            { key: "dashboard.timeline.critical.apply_potassium" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.maturation",
          duration: "20-25 days",
          activities: [
            { key: "dashboard.timeline.activities_list.gradual_water_reduction" },
            { key: "dashboard.timeline.activities_list.harvest_preparation" },
            { key: "dashboard.timeline.activities_list.post_harvest_processing" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.reduce_irrigation_gradually" },
            { key: "dashboard.timeline.critical.harvest_at_maturity", params: { percent: 80 } },
            { key: "dashboard.timeline.critical.proper_drying_storage" },
          ],
        },
      ],
    },
    Wheat: {
      phases: [
        {
          phaseKey: "dashboard.timeline.phases.wheat.land_prep_sowing",
          duration: "10-15 days",
          activities: [
            { key: "dashboard.timeline.activities_list.field_preparation" },
            { key: "dashboard.timeline.activities_list.seed_treatment" },
            { key: "dashboard.timeline.activities_list.sowing_operations" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.ensure_soil_moisture" },
            { key: "dashboard.timeline.critical.use_certified_seeds" },
            { key: "dashboard.timeline.critical.maintain_seed_rate" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.wheat.establishment",
          duration: "15-20 days",
          activities: [
            { key: "dashboard.timeline.activities_list.irrigation_management" },
            { key: "dashboard.timeline.activities_list.weed_control" },
            { key: "dashboard.timeline.activities_list.gap_filling" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.provide_light_irrigation" },
            { key: "dashboard.timeline.critical.control_early_weeds" },
            { key: "dashboard.timeline.critical.ensure_uniform_stand" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.wheat.tillering",
          duration: "30-40 days",
          activities: [
            { key: "dashboard.timeline.activities_list.nitrogen_application" },
            { key: "dashboard.timeline.activities_list.irrigation_scheduling" },
            { key: "dashboard.timeline.activities_list.pest_monitoring" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.apply_first_n_dose" },
            { key: "dashboard.timeline.critical.maintain_soil_moisture" },
            { key: "dashboard.timeline.critical.monitor_aphids" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.wheat.stem_elongation",
          duration: "25-30 days",
          activities: [
            { key: "dashboard.timeline.activities_list.second_n_application" },
            { key: "dashboard.timeline.activities_list.disease_monitoring" },
            { key: "dashboard.timeline.activities_list.water_management" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.apply_remaining_n" },
            { key: "dashboard.timeline.critical.watch_for_rust" },
            { key: "dashboard.timeline.critical.ensure_adequate_water" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.wheat.grain_filling_harvest",
          duration: "30-35 days",
          activities: [
            { key: "dashboard.timeline.activities_list.final_irrigation" },
            { key: "dashboard.timeline.activities_list.harvest_timing" },
            { key: "dashboard.timeline.activities_list.post_harvest_handling" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.stop_irrigation_before_harvest" },
            { key: "dashboard.timeline.critical.harvest_at_physiological_maturity" },
            { key: "dashboard.timeline.critical.proper_storage" },
          ],
        },
      ],
    },
    Chickpea: {
      phases: [
        {
          phaseKey: "dashboard.timeline.phases.chickpea.land_prep_sowing",
          duration: "10-12 days",
          activities: [
            { key: "dashboard.timeline.activities_list.field_preparation" },
            { key: "dashboard.timeline.activities_list.seed_treatment_rhizobium" },
            { key: "dashboard.timeline.activities_list.sowing" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.ensure_residual_moisture" },
            { key: "dashboard.timeline.critical.treat_seeds_fungicide" },
            { key: "dashboard.timeline.critical.maintain_proper_depth" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.chickpea.establishment",
          duration: "20-25 days",
          activities: [
            { key: "dashboard.timeline.activities_list.weed_management" },
            { key: "dashboard.timeline.activities_list.thinning_if_required" },
            { key: "dashboard.timeline.activities_list.light_irrigation" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.control_weeds_early" },
            { key: "dashboard.timeline.critical.avoid_waterlogging" },
            { key: "dashboard.timeline.critical.monitor_germination_percentage" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.vegetative",
          duration: "40-50 days",
          activities: [
            { key: "dashboard.timeline.activities_list.phosphorus_application" },
            { key: "dashboard.timeline.activities_list.pest_monitoring" },
            { key: "dashboard.timeline.activities_list.irrigation_management" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.apply_phosphorus_fertilizer" },
            { key: "dashboard.timeline.critical.monitor_pod_borer" },
            { key: "dashboard.timeline.critical.provide_irrigation_if_needed" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.chickpea.flowering_pod",
          duration: "25-30 days",
          activities: [
            { key: "dashboard.timeline.activities_list.critical_irrigation" },
            { key: "dashboard.timeline.activities_list.pest_control" },
            { key: "dashboard.timeline.activities_list.micronutrient_spray" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.ensure_water_during_flowering" },
            { key: "dashboard.timeline.critical.control_gram_pod_borer" },
            { key: "dashboard.timeline.critical.apply_boron_spray" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.chickpea.pod_filling_harvest",
          duration: "25-30 days",
          activities: [
            { key: "dashboard.timeline.activities_list.final_irrigation" },
            { key: "dashboard.timeline.activities_list.harvest_preparation" },
            { key: "dashboard.timeline.activities_list.threshing" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.stop_irrigation_before_maturity" },
            { key: "dashboard.timeline.critical.harvest_when_pods_rattle" },
            { key: "dashboard.timeline.critical.proper_drying" },
          ],
        },
      ],
    },
    Jowar: {
      phases: [
        {
          phaseKey: "dashboard.timeline.phases.jowar.land_prep_sowing",
          duration: "10-12 days",
          activities: [
            { key: "dashboard.timeline.activities_list.field_preparation" },
            { key: "dashboard.timeline.activities_list.seed_treatment" },
            { key: "dashboard.timeline.activities_list.sowing_operations" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.avoid_waterlogging" },
            { key: "dashboard.timeline.critical.ensure_soil_moisture" },
            { key: "dashboard.timeline.critical.proper_spacing" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.jowar.establishment",
          duration: "15-20 days",
          activities: [
            { key: "dashboard.timeline.activities_list.weed_control" },
            { key: "dashboard.timeline.activities_list.irrigation_management" },
            { key: "dashboard.timeline.activities_list.gap_filling" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.control_weeds_early" },
            { key: "dashboard.timeline.critical.monitor_water_levels" },
            { key: "dashboard.timeline.critical.provide_irrigation_if_needed" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.vegetative",
          duration: "40-50 days",
          activities: [
            { key: "dashboard.timeline.activities_list.nitrogen_application" },
            { key: "dashboard.timeline.activities_list.pest_monitoring" },
            { key: "dashboard.timeline.activities_list.irrigation_management" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.apply_first_n_dose" },
            { key: "dashboard.timeline.critical.maintain_soil_moisture" },
            { key: "dashboard.timeline.critical.monitor_aphids" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.reproductive",
          duration: "25-30 days",
          activities: [
            { key: "dashboard.timeline.activities_list.pest_monitoring" },
            { key: "dashboard.timeline.activities_list.potassium_application" },
            { key: "dashboard.timeline.activities_list.irrigation_management" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.ensure_adequate_water" },
            { key: "dashboard.timeline.critical.monitor_stem_borer" },
            { key: "dashboard.timeline.critical.apply_potassium" },
          ],
        },
        {
          phaseKey: "dashboard.timeline.phases.common.maturation",
          duration: "20-25 days",
          activities: [
            { key: "dashboard.timeline.activities_list.final_irrigation" },
            { key: "dashboard.timeline.activities_list.harvest_preparation" },
            { key: "dashboard.timeline.activities_list.post_harvest_processing" },
          ],
          criticalPoints: [
            { key: "dashboard.timeline.critical.stop_irrigation_before_maturity" },
            { key: "dashboard.timeline.critical.harvest_when_pods_rattle" },
            { key: "dashboard.timeline.critical.proper_drying" },
          ],
        },
      ],
    },
  }

  const defaultTimeline = cropTimelines.Chickpea
  const timeline = cropTimelines[crop?.split(" ")[0]] || defaultTimeline

  // AI enhancement based on weather and soil conditions
  return timeline.phases.map((phase) => ({
    ...phase,
    weatherConsiderations: generateWeatherConsiderations(phase, weatherData, month),
    soilRecommendations: generateSoilRecommendations(phase, soilData, crop),
  }))
}

const generateWeatherConsiderations = (phase, weatherData, month) => {
  if (!weatherData || weatherData.length === 0) return []

  const considerations = []
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp?.split('°')[0]) || 0), 0) / weatherData.length
  const totalRain = weatherData.reduce((sum, day) => sum + Number.parseFloat(day.rain?.replace("mm", "") || 0), 0)

  if (avgTemp > 35) {
    considerations.push({ key: "dashboard.timeline.considerations.high_temp", params: { avg: avgTemp.toFixed(1) } })
  }
  if (totalRain > 50) {
    considerations.push({ key: "dashboard.timeline.considerations.heavy_rain", params: { rain: totalRain } })
  }
  if (totalRain < 5) {
    considerations.push({ key: "dashboard.timeline.considerations.low_rain", params: { rain: totalRain } })
  }

  return considerations
}

const generateSoilRecommendations = (phase, soilData, crop) => {
  if (!soilData) return []

  const recommendations = []

  if (soilData.ph < 6.0) {
    recommendations.push({
      key: "dashboard.timeline.soil_reco.ph_acidic",
      params: { ph: soilData.ph },
    })
  }
  if (soilData.ph > 8.0) {
    recommendations.push({ key: "dashboard.timeline.soil_reco.ph_alkaline", params: { ph: soilData.ph } })
  }
  if (soilData.nitrogen < 40) {
    recommendations.push({ key: "dashboard.timeline.soil_reco.low_n", params: { n: soilData.nitrogen } })
  }
  if (soilData.moisture < 30) {
    recommendations.push({
      key: "dashboard.timeline.soil_reco.low_moisture",
      params: { moisture: soilData.moisture },
    })
  }

  return recommendations
}

const generateDynamicSustainability = (soilData, weatherData, crop, farmSize, location, t) => {
  // AI-powered sustainability calculations based on real data
  const carbonFootprint = calculateCarbonFootprint(crop, farmSize, soilData, t)
  const waterUsage = calculateWaterUsage(crop, weatherData, soilData, farmSize, t)
  const soilHealth = assessSoilHealth(soilData)
  const biodiversityScore = calculateBiodiversityScore(crop, location, soilData)

  return {
    carbonFootprint,
    waterUsage,
    soilHealth,
    biodiversityScore,
    recommendations: generateSustainabilityRecommendations(soilData, weatherData, crop),
  }
}

const calculateCarbonFootprint = (crop, farmSize, soilData, t) => {
  const cropEmissions = {
    Rice: 2.8, // tons CO2/hectare
    Wheat: 1.4,
    Chickpea: 0.8, // Lower due to nitrogen fixation
    Maize: 1.6,
  }

  const baseCrop = crop?.split(" ")[0] || "Chickpea"
  const baseEmission = cropEmissions[baseCrop] || 1.2

  // Adjust based on soil health (better soil = lower emissions)
  const soilHealthFactor = soilData?.organicMatter > 3 ? 0.9 : 1.1
  const totalEmission = (baseEmission * Number.parseFloat(farmSize || 5) * soilHealthFactor).toFixed(1)
  const perHectare = (baseEmission * soilHealthFactor).toFixed(2)
  return t("dashboard.sustainability.carbon_display", {
    total: totalEmission,
    unit: t("units.tons_co2"),
    per: perHectare,
    perUnit: t("units.per_hectare"),
  })
}

const calculateWaterUsage = (crop, weatherData, soilData, farmSize, t) => {
  const cropWaterNeeds = {
    Rice: 1200, // mm/season
    Wheat: 450,
    Chickpea: 300,
    Maize: 600,
  }

  const baseCrop = crop?.split(" ")[0] || "Chickpea"
  const baseWater = cropWaterNeeds[baseCrop] || 400

  // Adjust based on rainfall and soil moisture retention
  const totalRainfall =
    weatherData?.reduce((sum, day) => sum + Number.parseFloat(day.rain?.replace("mm", "") || 0), 0) || 0

  const irrigationNeeded = Math.max(0, baseWater - totalRainfall)
  const soilEfficiency = soilData?.moisture > 60 ? 0.9 : 1.1 // Better moisture retention = less water needed

  const totalWater = (irrigationNeeded * soilEfficiency).toFixed(0)
  return t("dashboard.sustainability.water_display", {
    total: totalWater,
    mm: t("units.mm"),
    rainfall: totalRainfall,
  })
}

const assessSoilHealth = (soilData) => {
  if (!soilData) return "Unknown"

  let score = 0
  let factors = 0

  // pH assessment
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5) score += 25
  else if (soilData.ph >= 5.5 && soilData.ph <= 8.0) score += 15
  else score += 5
  factors++

  // Organic matter
  if (soilData.organicMatter > 3) score += 25
  else if (soilData.organicMatter > 2) score += 15
  else score += 5
  factors++

  // Nutrient levels
  const avgNutrients = (soilData.nitrogen + soilData.phosphorus + soilData.potassium) / 3
  if (avgNutrients > 60) score += 25
  else if (avgNutrients > 40) score += 15
  else score += 5
  factors++

  // Moisture retention
  if (soilData.moisture > 50) score += 25
  else if (soilData.moisture > 30) score += 15
  else score += 5
  factors++

  const finalScore = Math.min(100, Math.max(0, score)) // Cap between 0-100

  if (finalScore > 80) return "Excellent"
  else if (finalScore > 60) return "Good"
  else if (finalScore > 40) return "Fair"
  else return "Needs Improvement"
}

const calculateBiodiversityScore = (crop, location, soilData) => {
  let score = 50 // Base score

  // Crop diversity bonus
  if (crop?.toLowerCase().includes("chickpea") || crop?.toLowerCase().includes("legume")) {
    score += 15 // Nitrogen-fixing crops improve biodiversity
  }

  // Soil health impact
  if (soilData?.organicMatter > 3) score += 20
  else if (soilData?.organicMatter > 2) score += 10

  // Location-based factors (Indian regions)
  if (location?.toLowerCase().includes("kerala") || location?.toLowerCase().includes("karnataka")) {
    score += 10 // Higher biodiversity regions
  }

  return Math.min(100, Math.max(0, score))
}

const generateSustainabilityRecommendations = (soilData, weatherData, crop) => {
  const recommendations = []

  if (soilData?.organicMatter < 2) {
    recommendations.push({
      category: "Soil Health",
      action: "Increase organic matter through compost and crop residue incorporation",
      impact: "Improve carbon sequestration and soil biodiversity",
    })
  }

  if (weatherData?.some((day) => Number.parseFloat(day.rain?.replace("mm", "") || 0) > 20)) {
    recommendations.push({
      category: "Water Conservation",
      action: "Install rainwater harvesting systems to capture excess rainfall",
      impact: "Reduce irrigation dependency and groundwater depletion",
    })
  }

  if (crop?.toLowerCase().includes("rice")) {
    recommendations.push({
      categoryKey: "dashboard.sustainability.emission_reduction",
      actionKey: "dashboard.sustainability.awd_action",
      impactKey: "dashboard.sustainability.methane_reduction",
    })
  }

  return recommendations
}

const generateDynamicMarketAnalysis = (crop, location, month, weatherData, soilData, t) => {
  // AI-powered market analysis based on crop, location, and conditions
  const cropPrices = {
    Rice: { base: 2800, seasonal: { june: 1.1, july: 1.05, august: 0.95, september: 0.9, october: 1.2 } },
    Wheat: { base: 2200, seasonal: { march: 1.15, april: 1.1, may: 0.95, november: 1.05, december: 1.1 } },
    Chickpea: { base: 5500, seasonal: { march: 1.2, april: 1.15, may: 0.9, november: 0.95, december: 1.1 } },
    Maize: { base: 1800, seasonal: { june: 1.05, july: 1.0, august: 0.95, september: 0.9, october: 1.1 } },
  }

  const baseCrop = crop?.split(" ")[0] || "Chickpea"
  const priceData = cropPrices[baseCrop] || cropPrices.Chickpea
  const seasonalMultiplier = priceData.seasonal[month?.toLowerCase()] || 1.0

  // Weather impact on prices
  let weatherMultiplier = 1.0
  const totalRainfall =
    weatherData?.reduce((sum, day) => sum + Number.parseFloat(day.rain?.replace("mm", "") || 0), 0) || 0

  if (totalRainfall > 100)
    weatherMultiplier = 1.1 // Excess rain may affect supply
  else if (totalRainfall < 20) weatherMultiplier = 1.15 // Drought conditions increase prices

  // Quality premium based on soil conditions
  let qualityMultiplier = 1.0
  if (soilData?.ph >= 6.0 && soilData?.ph <= 7.5 && soilData?.organicMatter > 2.5) {
    qualityMultiplier = 1.05 // Premium for better quality
  }

  const currentPrice = Math.round(priceData.base * seasonalMultiplier * weatherMultiplier * qualityMultiplier)
  const basePrice = Math.round(priceData.base * seasonalMultiplier)
  const priceChange = currentPrice - basePrice

  // Demand forecast based on conditions
  let demandForecast = "Medium"
  if (weatherMultiplier > 1.1) demandForecast = "High"
  else if (qualityMultiplier > 1.0) demandForecast = "Good"

  // Best selling time analysis
  const bestMonths = Object.entries(priceData.seasonal)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([month]) => month.charAt(0).toUpperCase() + month.slice(1))

  const profitMargin = calculateProfitMargin(currentPrice, baseCrop, soilData, t)

  const unitQuintal = t("units.quintal")
  return {
    currentPrice: `₹${currentPrice}/${unitQuintal}`,
    priceChange: priceChange >= 0 ? `+₹${priceChange}` : `₹${priceChange}`,
    demandForecast,
    bestSellingTime: bestMonths
      .map((m) => {
        const key = `months.${m.toLowerCase()}`
        const label = t(key)
        return label && !label.includes(".") ? label : m
      })
      .join(` ${t("common.or")} `),
    profitMargin,
    marketInsights: generateMarketInsights(crop, location, weatherData, currentPrice, basePrice),
  }
}

const calculateProfitMargin = (price, crop, soilData, t) => {
  const productionCosts = {
    Rice: 1800,
    Wheat: 1400,
    Chickpea: 2200,
    Maize: 1200,
  }

  const baseCost = productionCosts[crop] || 1800

  // Adjust cost based on soil conditions (better soil = lower input costs)
  const soilEfficiency = soilData?.organicMatter > 2.5 ? 0.95 : 1.05
  const adjustedCost = baseCost * soilEfficiency

  const profit = price - adjustedCost
  const margin = ((profit / price) * 100).toFixed(1)

  const profitValue = Math.round(profit)
  const unit = t && typeof t === "function" ? t("units.quintal") : "quintal"
  const template = t && typeof t === "function" ? t("dashboard.market.profit_display", { margin, profit: profitValue, unit }) : null
  return template && !String(template).includes("dashboard.market.profit_display")
    ? template
    : `${margin}% (₹${profitValue}/${unit} profit)`
}

const generateMarketInsights = (crop, location, weatherData, currentPrice, basePrice) => {
  const insights = []

  if (currentPrice > basePrice) {
    insights.push({
      type: "opportunity",
      messageKey: "dashboard.market.insights.prices_above_avg",
      params: { percent: ((currentPrice / basePrice - 1) * 100).toFixed(1) },
      actionKey: "dashboard.market.insights.actions.forward_or_contract",
    })
  }

  const totalRainfall =
    weatherData?.reduce((sum, day) => sum + Number.parseFloat(day.rain?.replace("mm", "") || 0), 0) || 0

  if (totalRainfall > 100) {
    insights.push({
      type: "risk",
      messageKey: "dashboard.market.insights.excess_rainfall_quality",
      actionKey: "dashboard.market.insights.focus_post_harvest",
    })
  }

  if (location?.toLowerCase().includes("punjab") || location?.toLowerCase().includes("haryana")) {
    insights.push({
      type: "advantage",
      messageKey: "dashboard.market.insights.market_access_good",
      actionKey: "dashboard.market.insights.leverage_mandis",
    })
  }

  return insights
}

const generateDynamicDiseaseAlerts = (weatherData, soilData, crop, month, location) => {
  const alerts = []

  if (!weatherData || !soilData)
    return [{ diseaseKey: "dashboard.disease.loading", risk: "Unknown", confidence: "0%", actionKey: "dashboard.disease.fetching" }]

  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp?.split('°')[0]) || 0), 0) / weatherData.length
  const avgHumidity =
    weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity?.replace("%", "")) || 60), 0) /
    weatherData.length
  const totalRainfall = weatherData.reduce((sum, day) => sum + Number.parseFloat(day.rain?.replace("mm", "") || 0), 0)

  // Crop-specific disease analysis
  const cropDiseases = {
    Rice: [
      {
        disease: "Blast Disease",
        conditions: { tempRange: [25, 30], humidityMin: 80, rainfallMin: 50 },
        action: "Apply tricyclazole fungicide preventively",
      },
      {
        disease: "Bacterial Leaf Blight",
        conditions: { tempRange: [28, 34], humidityMin: 70, rainfallMin: 30 },
        action: "Use copper-based bactericides and avoid overhead irrigation",
      },
    ],
    Wheat: [
      {
        disease: "Yellow Rust",
        conditions: { tempRange: [10, 25], humidityMin: 60, rainfallMin: 20 },
        action: "Apply propiconazole or tebuconazole fungicide",
      },
      {
        disease: "Powdery Mildew",
        conditions: { tempRange: [15, 22], humidityMin: 50, rainfallMin: 10 },
        action: "Spray sulfur-based fungicide or triadimefon",
      },
    ],
    Chickpea: [
      {
        disease: "Fusarium Wilt",
        conditions: { tempRange: [25, 30], soilMoistureMax: 40, phRange: [6.0, 7.5] },
        action: "Use resistant varieties and avoid waterlogging",
      },
      {
        disease: "Ascochyta Blight",
        conditions: { tempRange: [20, 25], humidityMin: 70, rainfallMin: 25 },
        action: "Apply mancozeb or chlorothalonil fungicide",
      },
    ],
  }

  const baseCrop = crop?.split(" ")[0] || "Chickpea"
  const diseases = cropDiseases[baseCrop] || cropDiseases.Chickpea

  diseases.forEach((diseaseInfo) => {
    let riskScore = 0
    const riskFactors = []

    // Temperature risk
    if (diseaseInfo.conditions.tempRange) {
      const [minTemp, maxTemp] = diseaseInfo.conditions.tempRange
      if (avgTemp >= minTemp && avgTemp <= maxTemp) {
        riskScore += 30
        riskFactors.push({ key: "dashboard.disease.factors.optimal_temp", params: { temp: avgTemp.toFixed(1) } })
      }
    }

    // Humidity risk
    if (diseaseInfo.conditions.humidityMin && avgHumidity >= diseaseInfo.conditions.humidityMin) {
      riskScore += 25
      riskFactors.push({ key: "dashboard.disease.factors.high_humidity", params: { humidity: avgHumidity.toFixed(1) } })
    }

    // Rainfall risk
    if (diseaseInfo.conditions.rainfallMin && totalRainfall >= diseaseInfo.conditions.rainfallMin) {
      riskScore += 20
      riskFactors.push({ key: "dashboard.disease.factors.adequate_rainfall", params: { rain: totalRainfall } })
    }

    // Soil conditions
    if (diseaseInfo.conditions.soilMoistureMax && soilData.moisture <= diseaseInfo.conditions.soilMoistureMax) {
      riskScore += 15
      riskFactors.push({ key: "dashboard.disease.factors.suitable_soil_moisture" })
    }

    if (diseaseInfo.conditions.phRange) {
      const [minPh, maxPh] = diseaseInfo.conditions.phRange
      if (soilData.ph >= minPh && soilData.ph <= maxPh) {
        riskScore += 10
        riskFactors.push({ key: "dashboard.disease.factors.favorable_ph" })
      }
    }

    // Determine risk level
    let risk = "Low"
    const confidence = Math.min(95, Math.max(60, riskScore + 20))

    if (riskScore >= 60) {
      risk = "High"
    } else if (riskScore >= 35) {
      risk = "Medium"
    }

    alerts.push({
      diseaseKey: `dashboard.disease.names.${(diseaseInfo.disease || "").toLowerCase().replace(/\s+/g, "_")}`,
      risk,
      confidence: `${confidence}%`,
      actionKey: `dashboard.disease.actions.${(diseaseInfo.action || "").toLowerCase().replace(/[^a-z]+/g, "_")}`,
      riskFactors: riskFactors.length > 0 ? riskFactors : [{ key: "dashboard.disease.factors.not_favorable" }],
    })
  })

  return alerts
}

// Helper function to determine season from month
const getSeasonFromMonth = (monthNum) => {
  if (monthNum >= 6 && monthNum <= 10) return "kharif"      // June-October
  if (monthNum >= 11 || monthNum <= 2) return "rabi"        // November-February  
  if (monthNum >= 3 && monthNum <= 5) return "summer"       // March-May
  return "kharif" // Default fallback
}

// Helper function to calculate crop rotation score
const getCropRotationScore = (previousCrop, currentCrop) => {
  const rotationMatrix = {
    // Good rotations (positive score)
    "Rice": { "Wheat": 8, "Chickpea": 6, "Potato": 5, "Onion": 4 },
    "Wheat": { "Rice": 8, "Maize": 6, "Soybean": 5, "Groundnut": 4 },
    "Maize": { "Wheat": 6, "Chickpea": 8, "Potato": 5, "Onion": 4 },
    "Chickpea": { "Wheat": 8, "Rice": 6, "Maize": 5, "Cotton": 4 },
    "Cotton": { "Wheat": 6, "Chickpea": 8, "Maize": 5, "Groundnut": 6 },
    "Sugarcane": { "Wheat": 5, "Chickpea": 6, "Maize": 4 },
    "Groundnut": { "Wheat": 6, "Cotton": 6, "Maize": 5, "Chickpea": 4 },
    "Soybean": { "Wheat": 8, "Maize": 6, "Cotton": 5 },
    "Potato": { "Wheat": 6, "Rice": 5, "Maize": 4, "Onion": 3 },
    "Onion": { "Wheat": 5, "Rice": 4, "Maize": 4, "Potato": 3 },
    "Tomato": { "Wheat": 5, "Maize": 4, "Chickpea": 6 },
    "Chilli": { "Wheat": 5, "Maize": 4, "Chickpea": 6 },
    "Turmeric": { "Wheat": 4, "Rice": 5, "Maize": 3 },
    "Ginger": { "Wheat": 4, "Rice": 5, "Maize": 3 },
    
    // Poor rotations (negative score)
    "Rice": { "Rice": -10, "Sugarcane": -5 },
    "Wheat": { "Wheat": -10, "Barley": -8 },
    "Maize": { "Maize": -10, "Sorghum": -8 },
    "Cotton": { "Cotton": -10, "Okra": -5 },
    "Sugarcane": { "Sugarcane": -15, "Rice": -3 },
    "Potato": { "Potato": -10, "Tomato": -8 },
    "Tomato": { "Tomato": -10, "Potato": -8, "Chilli": -5 },
    "Chilli": { "Chilli": -10, "Tomato": -5, "Capsicum": -8 }
  }
  
  const previous = previousCrop.toLowerCase()
  const current = currentCrop.toLowerCase()
  
  // Check for exact matches first
  if (rotationMatrix[previous] && rotationMatrix[previous][current]) {
    return rotationMatrix[previous][current]
  }
  
  // Check for partial matches (e.g., "Rice" matches "rice")
  for (const prevCrop in rotationMatrix) {
    if (prevCrop.toLowerCase() === previous) {
      for (const currCrop in rotationMatrix[prevCrop]) {
        if (currCrop.toLowerCase() === current) {
          return rotationMatrix[prevCrop][currCrop]
        }
      }
    }
  }
  
  return 0 // No specific rotation data available
}

const generateDynamicRecommendedCrops = (soilData, weatherData, location, currentMonth, t, previousCrop = null) => {
  if (!soilData || !weatherData) return recommendedCrops // Fallback to static data

  const cropSuitability = [
    {
      name: "Rice",
      requirements: { phRange: [5.5, 7.0], moistureMin: 60, tempRange: [25, 35], rainfallMin: 100 },
      yield: { base: 5.5, unit: "tons/hectare" },
      duration: "120-150 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "High"
    },
    {
      name: "Wheat",
      requirements: { phRange: [6.0, 7.5], moistureMin: 40, tempRange: [15, 25], rainfallMin: 30 },
      yield: { base: 4.2, unit: "tons/hectare" },
      duration: "120-150 days",
      marketDemand: "High",
      seasons: ["rabi"],
      waterRequirement: "Medium"
    },
    {
      name: "Chickpea (Gram)",
      requirements: { phRange: [6.0, 7.5], moistureMin: 35, tempRange: [20, 30], rainfallMin: 20 },
      yield: { base: 4.0, unit: "tons/hectare" },
      duration: "90-120 days",
      marketDemand: "High",
      seasons: ["rabi"],
      waterRequirement: "Low"
    },
    {
      name: "Maize",
      requirements: { phRange: [5.8, 7.8], moistureMin: 45, tempRange: [21, 30], rainfallMin: 50 },
      yield: { base: 6.0, unit: "tons/hectare" },
      duration: "90-120 days",
      marketDemand: "Moderate",
      seasons: ["kharif", "summer"],
      waterRequirement: "Medium"
    },
    {
      name: "Sugarcane",
      requirements: { phRange: [6.0, 8.0], moistureMin: 70, tempRange: [26, 35], rainfallMin: 150 },
      yield: { base: 80, unit: "tons/hectare" },
      duration: "300-365 days",
      marketDemand: "Moderate",
      seasons: ["year_round"],
      waterRequirement: "Very High"
    },
    {
      name: "Bajra (Pearl Millet)",
      requirements: { phRange: [6.0, 8.5], moistureMin: 30, tempRange: [25, 35], rainfallMin: 25 },
      yield: { base: 1.4, unit: "tons/hectare" },
      duration: "80-100 days",
      marketDemand: "Moderate",
      seasons: ["kharif"],
      waterRequirement: "Low"
    },
    {
      name: "Jowar (Sorghum)",
      requirements: { phRange: [6.0, 8.0], moistureMin: 35, tempRange: [22, 32], rainfallMin: 30 },
      yield: { base: 2.5, unit: "tons/hectare" },
      duration: "100-120 days",
      marketDemand: "Moderate",
      seasons: ["kharif"],
      waterRequirement: "Low"
    },
    {
      name: "Ragi (Finger Millet)",
      requirements: { phRange: [5.5, 7.5], moistureMin: 40, tempRange: [20, 30], rainfallMin: 35 },
      yield: { base: 1.8, unit: "tons/hectare" },
      duration: "90-110 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "Low"
    },
    {
      name: "Cotton",
      requirements: { phRange: [6.0, 8.0], moistureMin: 50, tempRange: [22, 36], rainfallMin: 60 },
      yield: { base: 3.5, unit: "tons/hectare" },
      duration: "150-180 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "Medium"
    },
    {
      name: "Groundnut",
      requirements: { phRange: [6.0, 7.5], moistureMin: 40, tempRange: [25, 35], rainfallMin: 50 },
      yield: { base: 2.8, unit: "tons/hectare" },
      duration: "100-130 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "Medium"
    },
    {
      name: "Soybean",
      requirements: { phRange: [6.0, 7.5], moistureMin: 45, tempRange: [20, 30], rainfallMin: 40 },
      yield: { base: 2.2, unit: "tons/hectare" },
      duration: "90-120 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "Medium"
    },
    {
      name: "Turmeric",
      requirements: { phRange: [5.5, 7.5], moistureMin: 50, tempRange: [18, 30], rainfallMin: 80 },
      yield: { base: 8.0, unit: "tons/hectare" },
      duration: "200-250 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "Medium"
    },
    {
      name: "Ginger",
      requirements: { phRange: [5.5, 7.0], moistureMin: 60, tempRange: [20, 28], rainfallMin: 100 },
      yield: { base: 12.0, unit: "tons/hectare" },
      duration: "200-250 days",
      marketDemand: "High",
      seasons: ["kharif"],
      waterRequirement: "High"
    },
    {
      name: "Chilli",
      requirements: { phRange: [6.0, 7.5], moistureMin: 40, tempRange: [20, 32], rainfallMin: 30 },
      yield: { base: 2.5, unit: "tons/hectare" },
      duration: "120-150 days",
      marketDemand: "High",
      seasons: ["kharif", "rabi"],
      waterRequirement: "Medium"
    },
    {
      name: "Tomato",
      requirements: { phRange: [6.0, 7.0], moistureMin: 50, tempRange: [18, 28], rainfallMin: 40 },
      yield: { base: 25.0, unit: "tons/hectare" },
      duration: "90-120 days",
      marketDemand: "High",
      seasons: ["kharif", "rabi"],
      waterRequirement: "Medium"
    },
    {
      name: "Potato",
      requirements: { phRange: [5.5, 6.5], moistureMin: 60, tempRange: [15, 25], rainfallMin: 50 },
      yield: { base: 25.0, unit: "tons/hectare" },
      duration: "90-120 days",
      marketDemand: "High",
      seasons: ["rabi"],
      waterRequirement: "Medium"
    },
    {
      name: "Onion",
      requirements: { phRange: [6.0, 7.5], moistureMin: 50, tempRange: [15, 30], rainfallMin: 30 },
      yield: { base: 20.0, unit: "tons/hectare" },
      duration: "120-150 days",
      marketDemand: "High",
      seasons: ["rabi"],
      waterRequirement: "Medium"
    }
  ]

  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp?.split('°')[0]) || 0), 0) / weatherData.length
  const totalRainfall = weatherData.reduce((sum, day) => sum + (day.rainValue || parseInt(day.rain?.replace("mm", "")) || 0), 0)

  const scoredCrops = cropSuitability.map((crop) => {
    let score = 0
    const reasons = []

    // pH suitability
    if (soilData.ph >= crop.requirements.phRange[0] && soilData.ph <= crop.requirements.phRange[1]) {
      score += 25
      reasons.push({ key: 'dashboard.recommended.reasons.optimal_ph', params: { ph: soilData.ph, crop: crop.name.toLowerCase() } })
    } else {
      score += 10
      reasons.push({ key: 'dashboard.recommended.reasons.ph_manageable', params: { ph: soilData.ph, crop: crop.name.toLowerCase() } })
    }

    // Moisture suitability
    if (soilData.moisture >= crop.requirements.moistureMin) {
      score += 20
      reasons.push({ key: 'dashboard.recommended.reasons.good_moisture', params: { moisture: soilData.moisture } })
    } else {
      score += 5
      reasons.push({ key: 'dashboard.recommended.reasons.moisture_irrigation', params: { moisture: soilData.moisture } })
    }

    // Enhanced temperature suitability with more nuanced scoring
    const tempOptimal = avgTemp >= crop.requirements.tempRange[0] && avgTemp <= crop.requirements.tempRange[1]
    const tempClose = Math.abs(avgTemp - crop.requirements.tempRange[0]) <= 3 || Math.abs(avgTemp - crop.requirements.tempRange[1]) <= 3
    
    if (tempOptimal) {
      score += 20
      reasons.push({ key: 'dashboard.recommended.reasons.optimal_temp', params: { temp: avgTemp.toFixed(1), min: crop.requirements.tempRange[0], max: crop.requirements.tempRange[1] } })
    } else if (tempClose) {
      score += 15
      reasons.push({ key: 'dashboard.recommended.reasons.favorable_temp', params: { temp: avgTemp.toFixed(1) } })
    } else {
      score += 8
      reasons.push({ key: 'dashboard.recommended.reasons.temp_manageable', params: { temp: avgTemp.toFixed(1) } })
    }

    // Rainfall suitability
    if (totalRainfall >= crop.requirements.rainfallMin) {
      score += 15
      reasons.push({ key: 'dashboard.recommended.reasons.adequate_rainfall', params: { rainfall: totalRainfall } })
    } else {
      score += 5
      reasons.push({ key: 'dashboard.recommended.reasons.rainfall_irrigation', params: { rainfall: totalRainfall } })
    }

    // Nutrient levels
    const avgNutrients = (soilData.nitrogen + soilData.phosphorus + soilData.potassium) / 3
    if (avgNutrients > 50) {
      score += 15
      reasons.push({ key: 'dashboard.recommended.reasons.excellent_nutrients', params: { nutrients: avgNutrients.toFixed(1) } })
    } else {
      score += 8
      reasons.push({ key: 'dashboard.recommended.reasons.moderate_nutrients', params: {} })
    }

    // Enhanced location-specific bonuses
    const locationLower = location?.toLowerCase() || ""
    
    // Punjab - Wheat and Rice belt
    if (locationLower.includes("punjab") && (crop.name === "Wheat" || crop.name === "Rice")) {
      score += 8
      reasons.push({ key: 'dashboard.recommended.reasons.punjab_specialty', params: { crop: crop.name, location } })
    }
    
    // Odisha - Rice and millets
    if (locationLower.includes("odisha") && (crop.name === "Rice" || crop.name.includes("Bajra") || crop.name.includes("Ragi"))) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.odisha_specialty', params: { crop: crop.name, location } })
    }
    
    // Tamil Nadu - Cotton and sugarcane
    if (locationLower.includes("tamil") && (crop.name === "Cotton" || crop.name === "Sugarcane")) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.tamil_specialty', params: { crop: crop.name, location } })
    }
    
    // Gujarat - Cotton and groundnut
    if (locationLower.includes("gujarat") && (crop.name === "Cotton" || crop.name === "Groundnut")) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.gujarat_specialty', params: { crop: crop.name, location } })
    }
    
    // Karnataka - Ragi and coffee
    if (locationLower.includes("karnataka") && (crop.name.includes("Ragi") || crop.name === "Coffee")) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.karnataka_specialty', params: { crop: crop.name, location } })
    }
    
    // Maharashtra - Sugarcane and cotton
    if (locationLower.includes("maharashtra") && (crop.name === "Sugarcane" || crop.name === "Cotton")) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.maharashtra_specialty', params: { crop: crop.name, location } })
    }
    
    // Andhra Pradesh - Rice and chilli
    if (locationLower.includes("andhra") && (crop.name === "Rice" || crop.name === "Chilli")) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.andhra_specialty', params: { crop: crop.name, location } })
    }
    
    // Kerala - Spices and coconut
    if (locationLower.includes("kerala") && (crop.name === "Turmeric" || crop.name === "Ginger" || crop.name === "Coconut")) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.kerala_specialty', params: { crop: crop.name, location } })
    }
    
    // Coastal areas - Coconut and spices
    if (locationLower.includes("coastal") && (crop.name === "Coconut" || crop.name === "Turmeric" || crop.name === "Ginger")) {
      score += 4
      reasons.push({ key: 'dashboard.recommended.reasons.coastal_suitable', params: { crop: crop.name, location } })
    }
    
    // Arid regions - Millets and drought-resistant crops
    if (locationLower.includes("rajasthan") && (crop.name.includes("Bajra") || crop.name.includes("Jowar"))) {
      score += 6
      reasons.push({ key: 'dashboard.recommended.reasons.arid_suitable', params: { crop: crop.name, location } })
    }

    // Enhanced seasonal appropriateness with detailed month mapping
    const monthNum = new Date(`${currentMonth} 1, 2024`).getMonth() + 1
    const season = getSeasonFromMonth(monthNum)
    
    // Check if current season matches crop's preferred seasons
    if (crop.seasons && crop.seasons.includes(season)) {
      score += 15
      reasons.push({ key: 'dashboard.recommended.reasons.optimal_season', params: { month: currentMonth, crop: crop.name.toLowerCase(), season } })
    } else if (crop.seasons && crop.seasons.includes("year_round")) {
      score += 10
      reasons.push({ key: 'dashboard.recommended.reasons.year_round_crop', params: { crop: crop.name.toLowerCase() } })
    } else {
      score += 3
      reasons.push({ key: 'dashboard.recommended.reasons.off_season', params: { month: currentMonth, crop: crop.name.toLowerCase() } })
    }
    
    // Water requirement bonus based on rainfall
    if (crop.waterRequirement === "Low" && totalRainfall < 50) {
      score += 8
      reasons.push({ key: 'dashboard.recommended.reasons.drought_resistant', params: { crop: crop.name.toLowerCase() } })
    } else if (crop.waterRequirement === "High" && totalRainfall > 100) {
      score += 8
      reasons.push({ key: 'dashboard.recommended.reasons.adequate_water', params: { crop: crop.name.toLowerCase() } })
    }
    
    // Crop rotation bonus/penalty
    if (previousCrop) {
      const rotationScore = getCropRotationScore(previousCrop, crop.name)
      if (rotationScore > 0) {
        score += rotationScore
        reasons.push({ key: 'dashboard.recommended.reasons.good_rotation', params: { previous: previousCrop, current: crop.name.toLowerCase() } })
      } else if (rotationScore < 0) {
        score += rotationScore // This will reduce the score
        reasons.push({ key: 'dashboard.recommended.reasons.poor_rotation', params: { previous: previousCrop, current: crop.name.toLowerCase() } })
      }
    }

    const match = Math.min(95, Math.max(45, score))
    const adjustedYield = (crop.yield.base * (score / 85)).toFixed(1)

    // Get translated crop name using local alias map and t()
    let cropKey = crop.name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')
    const aliasMap = {
      jowar: 'jowar_sorghum',
      maize: 'maize_corn',
      bajra: 'bajra_pearl_millet',
      ragi: 'ragi_finger_millet',
      chickpea_gram: 'chickpea_gram',
    }
    if (crop.name === 'Chickpea (Gram)') cropKey = 'chickpea_gram'
    if (aliasMap[cropKey]) cropKey = aliasMap[cropKey]
    const key = `crops.${cropKey}`
    const translatedProbe = t(key)
    const translatedName = translatedProbe && !translatedProbe.includes('.') ? translatedProbe : crop.name

    return {
      name: translatedName,
      match: `${match}%`,
      duration: crop.duration,
      marketDemand: crop.marketDemand,
      yield: `${adjustedYield} ${crop.yield.unit}`,
      reasons: reasons.slice(0, 4), // Top 4 reasons
    }
  })

  return scoredCrops.sort((a, b) => Number.parseFloat(b.match) - Number.parseFloat(a.match)).slice(0, 3)
}

const generateGovernmentSchemes = (crop, location, farmSize) => {
  const schemes = [
    {
      name: "PM-KISAN",
      eligibility: "Eligible",
      amount: "₹6,000/year",
      status: "Active",
      description: "Direct income support to farmers",
    },
    {
      name: "Pradhan Mantri Fasal Bima Yojana",
      eligibility: Number.parseFloat(farmSize) <= 10 ? "Eligible" : "Partial Coverage",
      amount: `₹${Math.round(Number.parseFloat(farmSize) * 500)} premium`,
      status: "Apply Now",
      description: "Crop insurance against natural calamities",
    },
    {
      name: "Soil Health Card Scheme",
      eligibility: "Eligible",
      amount: "Free soil testing",
      status: "Available",
      description: "Free soil testing and nutrient recommendations",
    },
  ]

  // Add crop-specific schemes
  if (crop?.toLowerCase().includes("chickpea") || crop?.toLowerCase().includes("gram")) {
    schemes.push({
      name: "National Food Security Mission - Pulses",
      eligibility: "Eligible",
      amount: "₹15,000/hectare subsidy",
      status: "Apply Now",
      description: "Support for pulse cultivation and productivity enhancement",
    })
  }

  // Add location-specific schemes
  if (location?.toLowerCase().includes("maharashtra")) {
    schemes.push({
      name: "Jalyukt Shivar Abhiyan",
      eligibility: "Eligible",
      amount: "₹50,000 for water conservation",
      status: "Available",
      description: "Water conservation and drought mitigation",
    })
  }

  return schemes
}

export default function Dashboard() {
  const router = useRouter()
  const { t } = useI18n()
  const { setUserData, setAnalysisData } = useAppContext()
  const { user, logout } = useAuth()
  const [farmData, setFarmData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showFloatingBox, setShowFloatingBox] = useState(false)
  const [selectedExternalTool, setSelectedExternalTool] = useState(null)

  const [showUserInputForm, setShowUserInputForm] = useState(false)
  const [showPriorityTasksPanel, setShowPriorityTasksPanel] = useState(false)
  const [showYieldIncreasePanel, setShowYieldIncreasePanel] = useState(false)
  const [showSoilHealthPanel, setShowSoilHealthPanel] = useState(false)
  const [showWeatherRiskPanel, setShowWeatherRiskPanel] = useState(false)
  const [userInputData, setUserInputData] = useState({
    location: "",
    crop: "",
    month: "",
    hectare: "",
  })
  const [apiData, setApiData] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Store data for chatbot access
  useEffect(() => {
    if (apiData) {
      try {
        localStorage.setItem('dashboardData', JSON.stringify(apiData))
      } catch (error) {
        console.error('Error storing dashboard data:', error)
      }
    }
  }, [apiData])
  const translateCondition = (cond) => {
    if (!cond) return ""
    const s = String(cond).toLowerCase()
    if (s.includes("patchy") && s.includes("rain")) return t("weather.conditions.patchy_rain_nearby")
    if (s.includes("heavy") && s.includes("rain")) return t("weather.conditions.heavy_rain")
    if (s.includes("moderate") && s.includes("rain")) return t("weather.conditions.moderate_rain")
    if (s.includes("light") && s.includes("rain")) return t("weather.conditions.light_rain")
    if (s.includes("partly") && s.includes("cloud")) return t("weather.conditions.partly_cloudy")
    if (s.includes("sun")) return t("weather.conditions.sunny")
    if (s.includes("cloud")) return t("weather.conditions.cloudy")
    return cond
  }

  const translateWeekday = (abbr) => {
    const key = String(abbr || "").toLowerCase()
    const map = {
      mon: "weather.weekdays.mon",
      tue: "weather.weekdays.tue",
      wed: "weather.weekdays.wed",
      thu: "weather.weekdays.thu",
      fri: "weather.weekdays.fri",
      sat: "weather.weekdays.sat",
      sun: "weather.weekdays.sun",
    }
    return map[key] ? t(map[key]) : abbr
  }

  function translateCropName(name) {
    if (!name) return ""
    let slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
    const aliasMap = {
      jowar: "jowar_sorghum",
      maize: "maize_corn",
      bajra: "bajra_pearl_millet",
      ragi: "ragi_finger_millet",
      "chickpea_gram": "chickpea_gram",
    }
    if (aliasMap[slug]) slug = aliasMap[slug]
    const key = `crops.${slug}`
    const translated = t(key)
    return translated === key ? name : translated
  }

  const formatYieldDisplay = (yieldStr) => {
    if (!yieldStr) return ""
    const firstSpace = yieldStr.indexOf(" ")
    const value = firstSpace > -1 ? yieldStr.slice(0, firstSpace) : yieldStr
    return `${value} ${t("units.tons_per_hectare")}`
  }

  const [iotData, setIotData] = useState({
    soilMoisture: 41,
    temperature: 28,
    humidity: 65,
    lightIntensity: 85,
    lastUpdated: new Date().toLocaleTimeString(),
  })

  const [soilData, setSoilData] = useState({
    ph: 6.67,
    moisture: 41,
    nitrogen: 79,
    phosphorus: 73,
    potassium: 75,
    organicMatter: 2.85,
    salinity: 0.25,
  })

  const fetchWeatherData = async (location) => {
    try {
      setIsLoading(true)
      console.log("[v0] Fetching weather data for location:", location)

      const response = await fetch("/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch weather data")
      }

      const data = await response.json()
      console.log("[v0] Weather data received:", data)

      setApiData((prevData) => ({
        ...prevData,
        weatherData: data.weatherData,
      }))
    } catch (error) {
      console.error("[v0] Weather API error:", error)
      // Fall back to generated weather data based on location
      const fallbackWeatherData = generateLocationBasedWeather(location)
      setApiData((prevData) => ({
        ...prevData,
        weatherData: fallbackWeatherData,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const generateLocationBasedWeather = (location) => {
    // Generate realistic weather data based on location and season
    const baseTemp = location.toLowerCase().includes("mumbai")
      ? 32
      : location.toLowerCase().includes("delhi")
        ? 30
        : location.toLowerCase().includes("bangalore")
          ? 26
          : 28

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"]

    return days.map((day, index) => {
      const tempVariation = Math.random() * 6 - 3 // ±3°C variation
      const maxTemp = Math.round(baseTemp + tempVariation)
      const minTemp = Math.round(maxTemp - 8)
      const humidity = Math.round(55 + Math.random() * 25) // 55-80%
      const rainChance = Math.random()
      const rain = rainChance < 0.3 ? Math.round(Math.random() * 10) : 0

      return {
        day,
        date: `2025-09-${String(9 + index).padStart(2, "0")}`,
        temp: `${maxTemp}°/${minTemp}°C`,
        rain: `${rain}mm`,
        humidity: `${humidity}%`,
        condition: rain > 0 ? "Light Rain" : conditions[Math.floor(Math.random() * 3)],
        windSpeed: `${Math.round(8 + Math.random() * 10)} km/h`,
        tempValue: maxTemp,
        humidityValue: humidity,
        rainValue: rain,
      }
    })
  }

  const fetchSoilData = async (location, crop, month, hectare) => {
    try {
      const response = await fetch("/api/soil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location, crop, month, hectare }),
      })

      if (response.ok) {
        const result = await response.json()
        return result.data
      }
    } catch (error) {
      console.error("Failed to fetch soil data:", error)
    }
    return null
  }

  const handleUserInputSubmit = async (e) => {
    if (e && e.preventDefault) {
    e.preventDefault()
    }
    setApiLoading(true)
    setApiError(null)

    console.log("[v0] handleUserInputSubmit called with data:", userInputData)

    try {
      const response = await fetch("/api/crop-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInputData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Enhanced farm data updated:", data)
        setFarmData(data)
        localStorage.setItem("farmData", JSON.stringify(data))
        setShowUserInputForm(false) // Close the form modal
        
        // Update context for chatbot
        if (data.userInfo) {
          setUserData({
            location: data.userInfo.location || '',
            crop: data.userInfo.nextCrop || data.userInfo.crop || '',
            month: data.userInfo.cultivationMonth || '',
            hectare: data.userInfo.farmSize || '',
            previousCrop: data.userInfo.previousCrop || '',
            nextCrop: data.userInfo.nextCrop || ''
          })
        }
        
        if (data.predictions || data.soilData || data.weatherData || data.marketAnalysis) {
          setAnalysisData({
            predictions: data.predictions,
            soilData: data.soilData,
            weatherData: data.weatherData,
            marketAnalysis: data.marketAnalysis,
            recommendations: data.recommendations,
            locationData: data.locationData,
            userInfo: data.userInfo
          })
        }
        
        console.log("[v0] Form closed and dashboard updated with new data")
      } else {
        console.log("[v0] API response not ok:", response.status)
        throw new Error(`API call failed with status: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] API Error:", error)
      setApiError("Failed to fetch data. Please try again.")
    } finally {
      setApiLoading(false)
    }
  }

  const fetchCropAnalysis = async (formData) => {
    setIsLoading(true)
    try {
      // Fetch soil data
      const soilData = await fetchSoilData(formData.location, formData.crop, formData.month, formData.hectare)

      // Fetch weather data
      const weatherData = await fetchWeatherData(formData.location)

      // Try to fetch from your backend API
      try {
        const response = await fetch("/api/crop-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const result = await response.json()
          // Merge with fetched soil and weather data
          const combinedData = {
            ...result,
            soilData: soilData || result.soilData,
            weatherData: weatherData || result.weatherData,
          }
          setApiData(combinedData)
          setIsLoading(false)
          return
        }
      } catch (apiError) {
        console.error("Backend API failed, using fallback data:", apiError)
      }

      const fallbackData = {
        location: formData.location,
        crop: formData.crop,
        month: formData.month,
        hectare: formData.hectare,
        soilData: soilData || {
          ph: 6.2 + Math.random() * 1.0,
          moisture: 35 + Math.random() * 30,
          nitrogen: 60 + Math.random() * 30,
          phosphorus: 50 + Math.random() * 40,
          potassium: 55 + Math.random() * 35,
          organicMatter: 2.1 + Math.random() * 1.5,
          salinity: 0.2 + Math.random() * 0.3,
        },
        weatherData: weatherData || [
          { day: "Mon", temp: 32, condition: "Sunny", rainfall: 0, humidity: 65, wind: 12 },
          { day: "Tue", temp: 29, condition: "Partly Cloudy", rainfall: 0, humidity: 70, wind: 8 },
          { day: "Wed", temp: 31, condition: "Light Rain", rainfall: 5, humidity: 78, wind: 15 },
          { day: "Thu", temp: 28, condition: "Cloudy", rainfall: 2, humidity: 72, wind: 10 },
          { day: "Fri", temp: 30, condition: "Light Rain", rainfall: 8, humidity: 80, wind: 18 },
          { day: "Sat", temp: 33, condition: "Sunny", rainfall: 0, humidity: 58, wind: 14 },
          { day: "Sun", temp: 34, condition: "Hot", rainfall: 0, humidity: 55, wind: 16 },
        ],
        marketData: {
          currentPrice: `₹${4500 + Math.random() * 1000}/${t("units.quintal")}`,
          priceChange: `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 5).toFixed(1)}%`,
          demandForecast: Math.random() > 0.5 ? "High" : "Medium",
          bestSellingTime: `${t(`months.${(formData.month || "january").toLowerCase()}`)} ${new Date().getFullYear()}`,
          profitMargin: `₹${(80000 + Math.random() * 60000).toFixed(0)}/hectare`,
        },
        yieldPrediction: {
          expectedYield: (3.5 + Math.random() * 2.5).toFixed(1),
          confidence: (75 + Math.random() * 20).toFixed(0),
        },
      }

      setApiData(fallbackData)
    } catch (error) {
      console.error("Error fetching crop analysis:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockApiData = (inputData) => {
    return {
      location: inputData.location,
      crop: inputData.crop,
      month: inputData.month,
      hectare: Number.parseFloat(inputData.hectare) || 1,
      soilData: {
        ph: 6.2 + Math.random() * 1.0,
        moisture: 35 + Math.random() * 30,
        nitrogen: 60 + Math.random() * 30,
        phosphorus: 50 + Math.random() * 40,
        potassium: 55 + Math.random() * 35,
        organicMatter: 2.1 + Math.random() * 1.5,
        salinity: 0.2 + Math.random() * 0.3,
      },
      weatherData: [
        { day: "Mon", date: "2025-09-09", temp: "30°/24°C", condition: "Partly cloudy", humidity: 65, wind: "12 km/h" },
        { day: "Tue", date: "2025-09-10", temp: "32°/25°C", condition: "Sunny", humidity: 58, wind: "8 km/h" },
        { day: "Wed", date: "2025-09-11", temp: "29°/23°C", condition: "Light rain", humidity: 78, wind: "15 km/h" },
        { day: "Thu", date: "2025-09-12", temp: "31°/24°C", condition: "Cloudy", humidity: 70, wind: "10 km/h" },
        { day: "Fri", date: "2025-09-13", temp: "33°/26°C", condition: "Light rain", humidity: 72, wind: "14 km/h" },
        { day: "Sat", date: "2025-09-14", temp: "34°/27°C", condition: "Sunny", humidity: 60, wind: "9 km/h" },
        { day: "Sun", date: "2025-09-15", temp: "32°/25°C", condition: "Partly cloudy", humidity: 63, wind: "11 km/h" },
      ],
      marketData: {
        currentPrice: `₹${4500 + Math.random() * 1000}/${t("units.quintal")}`,
        priceChange: `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 5).toFixed(1)}%`,
        demandForecast: Math.random() > 0.5 ? "High" : "Medium",
        bestSellingTime: `${t(`months.${(inputData.month || "january").toLowerCase()}`)} ${new Date().getFullYear()}`,
        profitMargin: `₹${(80000 + Math.random() * 60000).toFixed(0)}/hectare`,
      },
      yieldPrediction: {
        expectedYield: (3.5 + Math.random() * 2.5).toFixed(1),
        confidence: (75 + Math.random() * 20).toFixed(0),
      },
    }
  }

  useEffect(() => {
    const storedData = localStorage.getItem("farmData")
    console.log("[v0] Checking stored farm data:", storedData)

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        console.log("[v0] Enhanced farm data loaded:", parsedData)
        setFarmData(parsedData)

        // Update context for chatbot
        if (parsedData.userInfo) {
          setUserData({
            location: parsedData.userInfo.location || '',
            crop: parsedData.userInfo.nextCrop || parsedData.userInfo.crop || '',
            month: parsedData.userInfo.cultivationMonth || '',
            hectare: parsedData.userInfo.farmSize || '',
            previousCrop: parsedData.userInfo.previousCrop || '',
            nextCrop: parsedData.userInfo.nextCrop || ''
          })
        }
        
        if (parsedData.predictions || parsedData.soilData || parsedData.weatherData || parsedData.marketAnalysis) {
          setAnalysisData({
            predictions: parsedData.predictions,
            soilData: parsedData.soilData,
            weatherData: parsedData.weatherData,
            marketAnalysis: parsedData.marketAnalysis,
            recommendations: parsedData.recommendations,
            locationData: parsedData.locationData,
            userInfo: parsedData.userInfo
          })
        }

        // Set user input data from stored farm data for dynamic updates
        if (parsedData.userInfo) {
          setUserInputData({
            location: parsedData.userInfo.location || "",
            crop: parsedData.userInfo.nextCrop || "",
            month: parsedData.userInfo.cultivationMonth || "",
            hectare: parsedData.userInfo.farmSize || "",
          })
        }
      } catch (error) {
        console.error("[v0] Error parsing stored farm data:", error)
        router.push("/")
        return
      }
    } else {
      console.log("[v0] No farm data found, redirecting to home")
      router.push("/")
      return
    }

    console.log("[v0] Setting loading to false")
    setIsLoading(false)
  }, [router])

  const getCurrentSoilData = () => {
    if (farmData?.soilData) {
      return {
        ...farmData.soilData,
        source: farmData.soilData.source || "SoilGrids API",
        lastUpdated: farmData.soilData.lastUpdated || new Date().toISOString(),
      }
    }
    if (apiData?.soilData) {
      return {
        ...apiData.soilData,
        source: "SoilGrids API",
        lastUpdated: new Date().toISOString(),
      }
    }
    // Fallback to static data if no API data available
    return {
      ph: 6.5,
      moisture: 65,
      nitrogen: 75,
      phosphorus: 60,
      potassium: 80,
      organicMatter: 3.2,
      salinity: 0.3,
      texture: { sand: 40, silt: 35, clay: 25 },
      bulkDensity: 1.4,
      cec: 15,
      source: "Fallback Data",
      lastUpdated: new Date().toISOString(),
    }
  }

  const getCurrentWeatherData = () => {
    if (farmData?.weatherData) {
      return farmData.weatherData
    }
    if (apiData?.weatherData) {
      return apiData.weatherData
    }
    // Fallback to static weather data if no API data available
    return [
      { day: "Today", date: "2024-01-15", temp: "28°C", condition: "Sunny", rain: "0mm", humidity: "65%" },
      { day: "Tomorrow", date: "2024-01-16", temp: "30°C", condition: "Partly Cloudy", rain: "2mm", humidity: "70%" },
      { day: "Wed", date: "2024-01-17", temp: "27°C", condition: "Cloudy", rain: "5mm", humidity: "75%" },
      { day: "Thu", date: "2024-01-18", temp: "29°C", condition: "Sunny", rain: "0mm", humidity: "68%" },
      { day: "Fri", date: "2024-01-19", temp: "31°C", condition: "Hot", rain: "0mm", humidity: "60%" },
      { day: "Sat", date: "2024-01-20", temp: "26°C", condition: "Rainy", rain: "8mm", humidity: "80%" },
      { day: "Sun", date: "2024-01-21", temp: "28°C", condition: "Sunny", rain: "0mm", humidity: "65%" },
    ]
  }

  const getCurrentMarketData = () => {
    if (farmData?.marketAnalysis) {
      return {
        currentPrice: `₹${farmData.marketAnalysis.currentPrice}/${t("units.quintal")}`,
        priceChange: farmData.marketAnalysis.trend === "increasing" ? "+2.5%" : "+0.8%",
        demandForecast: farmData.marketAnalysis.demand === "high" ? "High" : "Medium",
        bestSellingTime: `${t(`months.${(farmData.userInfo?.cultivationMonth || "june").toLowerCase()}`)} ${new Date().getFullYear()}`,
        profitMargin: `₹${farmData.marketAnalysis.expectedRevenue}/hectare`,
      }
    }
    if (apiData?.marketData) {
      return apiData.marketData
    }
    return marketData
  }

  const currentSoilData = getCurrentSoilData()
  const currentWeatherData = getCurrentWeatherData()
  const currentMarketData = getCurrentMarketData()

  const dynamicIoTData = generateDynamicIoTData(
    currentWeatherData,
    currentSoilData,
    farmData?.userInfo?.nextCrop || userInputData.crop,
    farmData?.userInfo?.cultivationMonth || userInputData.month,
  )

  // Use dynamic timeline from API response if available, otherwise generate locally
  const dynamicTimeline = farmData?.dynamicTimeline || generateDynamicTimeline(
    farmData?.userInfo?.nextCrop || userInputData.crop,
    farmData?.userInfo?.cultivationMonth || userInputData.month,
    farmData?.userInfo?.location || userInputData.location,
    currentWeatherData,
    currentSoilData,
  )

  const dynamicSustainability = generateDynamicSustainability(
    currentSoilData,
    currentWeatherData,
    farmData?.userInfo?.nextCrop || userInputData.crop,
    farmData?.userInfo?.farmSize || userInputData.hectare,
    farmData?.userInfo?.location || userInputData.location,
    t,
  )

  const dynamicMarketAnalysis = generateDynamicMarketAnalysis(
    farmData?.userInfo?.nextCrop || userInputData.crop,
    farmData?.userInfo?.location || userInputData.location,
    farmData?.userInfo?.cultivationMonth || userInputData.month,
    currentWeatherData,
    currentSoilData,
    t,
  )

  const dynamicDiseaseAlerts = generateDynamicDiseaseAlerts(
    currentWeatherData,
    currentSoilData,
    farmData?.userInfo?.nextCrop || userInputData.crop,
    farmData?.userInfo?.cultivationMonth || userInputData.month,
    farmData?.userInfo?.location || userInputData.location,
  )

  const dynamicRecommendedCrops = generateDynamicRecommendedCrops(
    currentSoilData,
    currentWeatherData,
    farmData?.userInfo?.location || userInputData.location,
    farmData?.userInfo?.cultivationMonth || userInputData.month,
    t,
    farmData?.userInfo?.previousCrop || null
  )

  const dynamicGovernmentSchemes = generateGovernmentSchemes(
    farmData?.userInfo?.nextCrop || userInputData.crop,
    farmData?.userInfo?.location || userInputData.location,
    farmData?.userInfo?.farmSize || userInputData.hectare,
  )

  console.log("[v0] Current soil data:", currentSoilData)
  console.log("[v0] Current weather data:", currentWeatherData)
  console.log("[v0] Farm data structure:", farmData)
  console.log("[v0] User input data:", userInputData)
  console.log("[v0] Farm data predictions:", farmData?.predictions)
  console.log("[v0] Farm data userInfo:", farmData?.userInfo)

  const yieldPredictionData = farmData?.predictions
    ? {
        crop: farmData.userInfo?.crop || userInputData.crop || "Chickpea (gram)",
        yield: `${farmData.predictions.predictedYield} tons/hectare`,
        confidence: `${farmData.predictions.confidence}%`,
        factors: generateDynamicYieldFactors(farmData),
        weatherImpact: generateDynamicWeatherImpact(farmData),
        steps: generateYieldIncreasePlan(
          currentSoilData,
          currentWeatherData,
          { improvementPercent: farmData.predictions?.improvementPercent || farmData.predictions?.expectedIncrease || 15 },
          farmData.userInfo?.nextCrop || userInputData.crop
        ),
      }
    : calculateYieldPrediction(
        currentSoilData,
        currentWeatherData,
        farmData?.userInfo?.crop || userInputData.crop || "Chickpea (gram)",
        farmData?.userInfo?.location || userInputData.location || "",
      )

  // Always use dynamic optimization recommendations for comprehensive data
  const optimizationData = generateOptimizationRecommendations(
    currentSoilData,
    currentWeatherData,
    farmData?.userInfo?.crop?.split(" ")[0] || userInputData.crop?.split(" ")[0] || "Chickpea",
    farmData?.userInfo?.location || userInputData.location || "",
    farmData?.userInfo?.month || userInputData.month || "",
    t,
  )

  const soilNutrients = [
    {
      name: t("dashboard.soil_metrics.nitrogen_n"),
      value: currentSoilData?.nitrogen || 75,
      color: "bg-green-500",
    },
    {
      name: t("dashboard.soil_metrics.phosphorus_p"),
      value: currentSoilData?.phosphorus || 60,
      color: "bg-blue-500",
    },
    {
      name: t("dashboard.soil_metrics.potassium_k"),
      value: currentSoilData?.potassium || 80,
      color: "bg-purple-500",
    },
    {
      name: t("dashboard.soil_metrics.organic_matter"),
      value: (currentSoilData?.organicMatter || 3.2) * 10,
      color: "bg-orange-500",
    },
  ]

  const diseaseAlerts = [
    { disease: "Fusarium Wilt", risk: "Low", confidence: "92%", action: "Monitor weekly" },
    { disease: "Aphid Infestation", risk: "Medium", confidence: "78%", action: "Apply neem oil" },
  ]

  const governmentSchemes = [
    { name: "PM-KISAN", eligibility: "Eligible", amount: "₹6,000/year", status: "Active" },
    { name: "Crop Insurance", eligibility: "Recommended", amount: "₹2,500 premium", status: "Apply Now" },
  ]

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊", priority: "high" },
    { id: "yield", label: "Yield Prediction", icon: "📈", priority: "high" },
    { id: "recommended", label: "Recommended Crops", icon: "🌱", priority: "high" },
    { id: "market", label: "Market Analysis", icon: "💰", priority: "high" },
    { id: "optimization", label: "Optimization", icon: "⚡", priority: "medium" },
    { id: "iot", label: "IoT Sensors", icon: "📡", priority: "medium" },
    { id: "timeline", label: "Timeline", icon: "📅", priority: "medium" },
    { id: "sustainability", label: "Sustainability", icon: "🌍", priority: "low" },
    { id: "schemes", label: "Government Schemes", icon: "🏛️", priority: "low" },
  ]

  const timelineData = [
    {
      phase: "Land Preparation",
      activities: ["Plowing", "Leveling", "Soil testing"],
      criticalPoints: ["Ensure proper drainage", "Check soil pH levels"],
    },
    {
      phase: "Sowing",
      activities: ["Seed treatment", "Sowing", "Initial irrigation"],
      criticalPoints: ["Use quality seeds", "Maintain proper spacing", "Ensure adequate moisture"],
    },
    {
      phase: "Growth Management",
      activities: ["Regular monitoring", "Fertilizer application", "Pest control"],
      criticalPoints: ["Monitor growth stages", "Apply nutrients as needed", "Watch for pest signs"],
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weather Forecast */}
              <Card className="farmer-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    {t("dashboard.weather.title")}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">{t("dashboard.common.live_data")}</span>
                    </div>
                  </CardTitle>
                  <p className="text-xs text-gray-600">
                    {t("dashboard.weather.realtime_for")} {farmData?.userInfo?.location || userInputData.location} • {t("dashboard.common.updated")} {new Date().toLocaleTimeString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentWeatherData.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-1.5 border-b border-amber-200 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-center min-w-[50px]">
                            <div className="font-medium text-gray-900 text-sm">{translateWeekday(day.day)}</div>
                            <div className="text-xs text-gray-500">{day.date.slice(-5)}</div>
                          </div>
                          <Thermometer className="w-3 h-3 text-orange-500" />
                          <div className="font-medium text-gray-900 text-sm">{day.temp}</div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="text-center">
                            <div className="text-gray-600">{day.rain}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">{day.humidity}</div>
                          </div>
                          <div className="text-right min-w-[70px]">
                            <div className="font-medium text-gray-900 text-xs">{translateCondition(day.condition)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-amber-200 pt-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                      {t("dashboard.weather_risk.title")}
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {t("dashboard.weather_risk.badge")}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {farmData?.predictions?.weatherRiskDetails ? (
                        // Use API weather risk data for consistency
                        farmData.predictions.weatherRiskDetails.riskFactors?.map((risk, index) => (
                          <div
                            key={index}
                            className={`flex items-start space-x-2 p-2 bg-${
                              farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                              farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                            }-50 rounded-lg border border-${
                              farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                              farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                            }-200`}
                          >
                            <div className={`w-2 h-2 bg-${
                              farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                              farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                            }-500 rounded-full mt-1.5`}></div>
                            <div className="text-xs w-full">
                              <div className="mb-1">
                                <span className={`font-semibold text-${
                                  farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                                  farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                                }-800`}>
                                  Risk Factor:
                                </span>
                                <span className={`text-${
                                  farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                                  farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                                }-700 ml-1`}>
                                  {risk}
                                </span>
                              </div>
                              {farmData.predictions.weatherRiskDetails.solutions && farmData.predictions.weatherRiskDetails.solutions[index] && (
                                <div className="mt-1">
                                  <span className={`font-semibold text-${
                                    farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                                    farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                                  }-800`}>
                                    Solution:
                                  </span>
                                  <span className={`text-${
                                    farmData.predictions.weatherRiskDetails.level === "High" ? "red" :
                                    farmData.predictions.weatherRiskDetails.level === "Medium" ? "yellow" : "green"
                                  }-700 ml-1`}>
                                    {farmData.predictions.weatherRiskDetails.solutions[index]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        // Fallback to dashboard calculation if no API data
                        generateWeatherRiskAnalysis(
                          currentWeatherData,
                          t(`crops.${(farmData?.userInfo?.nextCrop || userInputData.crop || "").toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || (farmData?.userInfo?.nextCrop || userInputData.crop),
                          t(`months.${(farmData?.userInfo?.cultivationMonth || userInputData.month || "").toLowerCase()}`) || (farmData?.userInfo?.cultivationMonth || userInputData.month),
                        ).map((risk, index) => (
                          <div
                            key={index}
                            className={`flex items-start space-x-2 p-2 bg-${risk.color}-50 rounded-lg border border-${risk.color}-200`}
                          >
                            <div className={`w-2 h-2 bg-${risk.color}-500 rounded-full mt-1.5`}></div>
                            <div className="text-xs">
                              <span className={`font-semibold text-${risk.color}-800`}>
                                {risk.typeKey ? t(risk.typeKey) : risk.type}:
                              </span>
                              <span className={`text-${risk.color}-700 ml-1`}>
                                {risk.messageKey ? t(risk.messageKey, risk.params) : risk.message}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      {(!farmData?.predictions?.weatherRiskDetails?.riskFactors || farmData.predictions.weatherRiskDetails.riskFactors.length === 0) && 
                       (!farmData?.predictions?.weatherRiskDetails ? generateWeatherRiskAnalysis(
                         currentWeatherData,
                         t(`crops.${(farmData?.userInfo?.nextCrop || userInputData.crop || "").toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || (farmData?.userInfo?.nextCrop || userInputData.crop),
                         t(`months.${(farmData?.userInfo?.cultivationMonth || userInputData.month || "").toLowerCase()}`) || (farmData?.userInfo?.cultivationMonth || userInputData.month),
                       ).length === 0 : true) && (
                        <div className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                          <div className="text-xs">
                            <span className="font-semibold text-green-800">Optimal Conditions:</span>
                            <span className="text-green-700 ml-1">
                              Weather conditions are favorable for {t(`crops.${(farmData?.userInfo?.nextCrop || userInputData.crop || "").toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || (farmData?.userInfo?.nextCrop || userInputData.crop)}{" "}
                              cultivation.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Soil Condition Analysis */}
              <Card className="farmer-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    {t("dashboard.soil.title")}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">{t("dashboard.common.live_data")}</span>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {t("dashboard.soil.realtime_from")} {currentSoilData.source} • {t("dashboard.soil.coordinates")} {" "}
                    {currentSoilData.coordinates?.lat?.toFixed(4)}, {currentSoilData.coordinates?.lon?.toFixed(4)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* pH and Moisture */}
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {currentSoilData.ph?.toFixed(2) || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">{t("dashboard.soil_metrics.ph_level")}</div>
                        <div className="text-xs text-green-600 mt-1">{t("dashboard.common.live_data")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {currentSoilData.moisture?.toFixed(1) || "N/A"}%
                        </div>
                        <div className="text-sm text-gray-600">{t("dashboard.soil_metrics.moisture")}</div>
                        <div className="text-xs text-green-600 mt-1">{t("dashboard.common.live_data")}</div>
                      </div>
                    </div>

                    {/* Nutrient Levels */}
                    <div className="space-y-4">
                      {soilNutrients.map((nutrient, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{nutrient.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{nutrient.value}%</span>
                              <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">{t("dashboard.common.live_data")}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${nutrient.color}`}
                              style={{ width: `${Math.min(nutrient.value, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Soil Fertility Suggestions */}
                    <div className="border-t border-amber-200 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Sprout className="w-4 h-4 mr-2 text-green-600" />
                        {t("dashboard.fertility.title")}
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {t("dashboard.fertility.badge_for", {
                            crop: t(`crops.${(farmData?.userInfo?.nextCrop || userInputData.crop || "").toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || (farmData?.userInfo?.nextCrop || userInputData.crop),
                            month: t(`months.${(farmData?.userInfo?.cultivationMonth || userInputData.month || "").toLowerCase()}`) || (farmData?.userInfo?.cultivationMonth || userInputData.month),
                          })}
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {farmData?.predictions?.soilHealthDetails ? (
                          // Use API soil health data for consistency
                          farmData.predictions.soilHealthDetails.recommendations?.map((recommendation, index) => (
                            <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-900">Soil Improvement</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                  Recommendation
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 mb-2">{recommendation}</p>
                              <p className="text-xs text-blue-600 mb-1">
                                <strong>Timing:</strong> Apply as soon as possible
                              </p>
                              <p className="text-xs text-green-600">
                                <strong>Expected Result:</strong> Improved soil health and crop yield
                              </p>
                            </div>
                          ))
                        ) : (
                          // Fallback to dashboard calculation if no API data
                          generateAIFertilityRecommendations(
                            currentSoilData,
                            farmData?.userInfo?.nextCrop || userInputData.crop,
                            farmData?.userInfo?.cultivationMonth || userInputData.month,
                            currentWeatherData,
                            t,
                          ).map((rec, index) => (
                            <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-900">{t(`dashboard.fertility.nutrient.${rec.nutrient}`)}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    rec.priority === "high"
                                      ? "bg-red-100 text-red-700"
                                      : rec.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {t(`dashboard.fertility.priority.${rec.priority}`)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 mb-2">{rec.actionKey ? t(rec.actionKey, rec.params) : rec.action}</p>
                              <p className="text-xs text-blue-600 mb-1">
                                <strong>{t("dashboard.fertility.timing_label")}</strong> {rec.timingKey ? t(rec.timingKey, rec.params) : rec.timing}
                              </p>
                              <p className="text-xs text-green-600">
                                <strong>{t("dashboard.fertility.expected_result")}</strong> {rec.expectedKey ? t(rec.expectedKey, rec.params) : rec.expectedImprovement}
                              </p>
                            </div>
                          ))
                        )}
                        {(!farmData?.predictions?.soilHealthDetails?.recommendations || farmData.predictions.soilHealthDetails.recommendations.length === 0) && 
                         (!farmData?.predictions?.soilHealthDetails ? generateAIFertilityRecommendations(
                           currentSoilData,
                           farmData?.userInfo?.nextCrop || userInputData.crop,
                           farmData?.userInfo?.cultivationMonth || userInputData.month,
                           currentWeatherData,
                           t,
                         ).length === 0 : true) && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-700">
                              <strong>Excellent Soil Health!</strong> Your soil parameters are optimal for{" "}
                              {farmData?.userInfo?.nextCrop || userInputData.crop}. Continue with regular maintenance
                              fertilization.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "yield":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crop Yield Prediction */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">{t("dashboard.yield.title")}</CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.yield.subtitle")}</p>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-orange-600 mb-2">
                    {(() => {
                      const cropKey = `crops.${(yieldPredictionData.crop || "").toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`;
                      const translated = t(cropKey);
                      return translated !== cropKey ? translated : yieldPredictionData.crop || "Crop";
                    })()}
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{formatYieldDisplay(yieldPredictionData.yield)}</div>
                  <div className="text-sm text-gray-600">{t("dashboard.yield.confidence")}: {yieldPredictionData.confidence}</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">{t("dashboard.yield.factors")}</h4>
                    <div className="space-y-2">
                      {yieldPredictionData.factors.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            factor.impact === "High" ? "bg-green-500" :
                            factor.impact === "Medium" ? "bg-yellow-500" :
                            factor.impact === "Low" ? "bg-red-500" :
                            "bg-orange-500"
                          }`}></div>
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 font-medium">{factor.key}</span>
                            {factor.description && (
                              <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Impact Analysis */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">{t("dashboard.weather_impact.title")}</CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.weather_impact.subtitle")}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {yieldPredictionData.weatherImpact.map((impact, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border-l-4 border-orange-400">
                      <div className="flex items-start space-x-3">
                        <Thermometer className={`w-5 h-5 mt-0.5 ${
                          impact.priority === "High" ? "text-red-500" :
                          impact.priority === "Medium" ? "text-yellow-500" :
                          "text-green-500"
                        }`} />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-900 mb-1">{impact.key}</h5>
                          {impact.solution && (
                            <p className="text-xs text-gray-600">{impact.solution}</p>
                          )}
                          {impact.priority && (
                            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                              impact.priority === "High" ? "bg-red-100 text-red-700" :
                              impact.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {impact.priority} Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "optimization":
        return (
          <div className="space-y-6">
            {optimizationData.map((optimization, index) => (
              <Card key={index} className="bg-amber-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{optimization.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{optimization.titleKey ? t(optimization.titleKey) : optimization.title}</h3>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                          {optimization.subtitleKey ? t(optimization.subtitleKey).split(" • ")[1] : optimization.subtitle.split(" • ")[1]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{optimization.subtitleKey ? t(optimization.subtitleKey).split(" • ")[0] : optimization.subtitle.split(" • ")[0]}</p>

                      <p className="text-sm text-gray-700 mb-4">{optimization.descriptionKey ? t(optimization.descriptionKey, optimization.params) : optimization.description}</p>

                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">{optimization.improvementKey ? t(optimization.improvementKey, optimization.params) : optimization.improvement}</span>
                      </div>
                      
                      {/* Cost-Benefit Analysis and Implementation Timeline */}
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-600">Cost-Benefit</span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              optimization.costBenefit === "Very High" ? "bg-red-100 text-red-700" :
                              optimization.costBenefit === "High" ? "bg-orange-100 text-orange-700" :
                              optimization.costBenefit === "Medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {optimization.costBenefit || "Medium"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {optimization.costBenefit === "Very High" ? "Immediate action required" :
                             optimization.costBenefit === "High" ? "High priority implementation" :
                             optimization.costBenefit === "Medium" ? "Moderate priority" :
                             "Low priority"}
                          </p>
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-600">Timeline</span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              optimization.priority === "High" ? "bg-red-100 text-red-700" :
                              optimization.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {optimization.priority || "Medium"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {optimization.implementationTime || "1-2 weeks"}
                          </p>
                        </div>
                      </div>

                      {/* Eco-Friendly Information */}
                      {(optimization.params?.alternatives || optimization.params?.organicFertilizers || optimization.params?.environmentalScore) && (
                        <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-green-800">🌱 Eco-Friendly Options</span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              optimization.params?.environmentalImpact === "Very High" ? "bg-green-100 text-green-700" :
                              optimization.params?.environmentalImpact === "High" ? "bg-blue-100 text-blue-700" :
                              optimization.params?.environmentalImpact === "Medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {optimization.params?.environmentalImpact || "Medium"}
                            </span>
                          </div>
                          
                          {optimization.params?.alternatives && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 mb-1">Alternatives:</p>
                              <p className="text-xs text-green-600">{optimization.params.alternatives}</p>
                            </div>
                          )}
                          
                          {optimization.params?.organicFertilizers && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 mb-1">Organic Fertilizers:</p>
                              <p className="text-xs text-green-600">{optimization.params.organicFertilizers}</p>
                            </div>
                          )}
                          
                          {optimization.params?.bioFertilizers && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 mb-1">Bio-Fertilizers:</p>
                              <p className="text-xs text-green-600">{optimization.params.bioFertilizers}</p>
                            </div>
                          )}
                          
                          {optimization.params?.benefits && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 mb-1">Benefits:</p>
                              <p className="text-xs text-green-600">{optimization.params.benefits}</p>
                            </div>
                          )}
                          
                          {optimization.params?.costSavings && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 mb-1">Cost Savings:</p>
                              <p className="text-xs text-green-600">{optimization.params.costSavings}</p>
                            </div>
                          )}
                          
                          {optimization.params?.environmentalScore && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 mb-1">Environmental Score:</p>
                              <p className="text-xs text-green-600">{optimization.params.environmentalScore}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cost-Effectiveness Analysis */}
                      {optimization.title === "Cost-Effectiveness Analysis" && (
                        <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-blue-800">💰 Cost-Effectiveness Analysis</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-medium text-blue-700 mb-1">Total Investment:</p>
                              <p className="text-blue-600">{optimization.params?.totalCost}</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-700 mb-1">Environmental Score:</p>
                              <p className="text-blue-600">{optimization.params?.environmentalScore}</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-700 mb-1">Expected ROI:</p>
                              <p className="text-blue-600">{optimization.params?.expectedROI}</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-700 mb-1">Timeframe:</p>
                              <p className="text-blue-600">{optimization.params?.timeframe}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case "iot":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="farmer-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  {t("dashboard.sensor.title")}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">{t("dashboard.sensor.badge")}</span>
                  </div>
                </CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.sensor.subtitle")}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">{t("dashboard.iot.soil_moisture")}</span>
                      <Droplets className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-blue-900">
                        {dynamicIoTData.soilMoisture.toFixed(1)}%
                      </span>
                      <div className="text-xs text-blue-600 mt-1">{t("dashboard.iot.real_soil_data")}</div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700">{t("dashboard.iot.temperature")}</span>
                      <Thermometer className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-red-900">{dynamicIoTData.temperature.toFixed(1)}°C</span>
                      <div className="text-xs text-red-600 mt-1">{t("dashboard.iot.weather_api_enhanced")}</div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">{t("dashboard.iot.humidity")}</span>
                      <Cloud className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-green-900">{dynamicIoTData.humidity.toFixed(1)}%</span>
                      <div className="text-xs text-green-600 mt-1">{t("dashboard.iot.realtime_correlation")}</div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-700">{t("dashboard.iot.light_intensity")}</span>
                      <Sun className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-yellow-900">
                        {dynamicIoTData.lightIntensity.toFixed(1)}%
                      </span>
                      <div className="text-xs text-yellow-600 mt-1">{t("dashboard.iot.weather_condition_based")}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 text-center">
                  {t("dashboard.iot.last_updated")}: {dynamicIoTData.lastUpdated} • {t("dashboard.iot.ai_enhanced")}
                </div>
              </CardContent>
            </Card>

            <Card className="farmer-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t("dashboard.alerts.title")}</CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.alerts.subtitle")}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dynamicIoTData.alerts?.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.type === "critical"
                          ? "bg-red-50 border-red-200"
                          : alert.type === "warning"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 ${
                            alert.type === "critical"
                              ? "text-red-600"
                              : alert.type === "warning"
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        />
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              alert.type === "critical"
                                ? "text-red-800"
                                : alert.type === "warning"
                                  ? "text-yellow-800"
                                  : "text-green-800"
                            }`}
                          >
                            {alert.messageKey ? t(alert.messageKey, alert.params) : alert.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              alert.type === "critical"
                                ? "text-red-600"
                                : alert.type === "warning"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {t("dashboard.alerts.action_label")}: {alert.actionKey ? t(alert.actionKey, alert.params) : alert.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700">
                        All sensor readings are within optimal range for{" "}
                        {farmData?.userInfo?.nextCrop || userInputData.crop}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "timeline":
        return (
          <div className="space-y-6">
            <Card className="farmer-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  {t("dashboard.timeline.title_for", { crop: t(`crops.${(farmData?.userInfo?.nextCrop || userInputData.crop || "").toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`) || (farmData?.userInfo?.nextCrop || userInputData.crop) })}
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {t("dashboard.timeline.customized_for", { location: formatLocation(farmData?.userInfo?.location || userInputData.location, t) })}
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.timeline.subtitle")}</p>
              </CardHeader>
            </Card>

            {dynamicTimeline.map((phase, index) => (
              <Card key={index} className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    {phase.phaseKey ? t(phase.phaseKey) : phase.phase}
                    <span className="text-sm text-gray-600 font-normal">{formatDays(phase.duration, t)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t("dashboard.timeline.activities")}</h4>
                      <ul className="space-y-1">
                        {phase.activities.map((activity, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{activity.key ? t(activity.key, activity.params) : 
                               (typeof activity === 'string' ? activity : 
                                activity.message || activity.action || JSON.stringify(activity))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t("dashboard.timeline.critical_points")}</h4>
                      <ul className="space-y-1">
                        {phase.criticalPoints.map((point, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span className="text-sm text-gray-700">{point.key ? t(point.key, point.params) : 
                               (typeof point === 'string' ? point : 
                                point.message || point.action || JSON.stringify(point))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {phase.weatherConsiderations && phase.weatherConsiderations.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Cloud className="w-4 h-4 mr-2" />
                        {t("dashboard.timeline.weather_considerations")}
                      </h4>
                      <ul className="space-y-1">
                        {phase.weatherConsiderations.map((consideration, idx) => (
                          <li key={idx} className="text-sm text-blue-700">
                            • {consideration.key ? t(consideration.key, consideration.params) : 
                               (typeof consideration === 'string' ? consideration : 
                                consideration.message || consideration.action || JSON.stringify(consideration))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dynamic Soil Recommendations */}
                  {phase.soilRecommendations && phase.soilRecommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Soil Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {phase.soilRecommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm">
                            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                              rec.priority === 'High' ? 'bg-red-100 text-red-800' : 
                              rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </div>
                            <span className="text-yellow-700">{rec.message}</span>
                            <div className="text-yellow-600 mt-1 ml-4">→ {rec.action}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dynamic Weather Recommendations */}
                  {phase.weatherRecommendations && phase.weatherRecommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Cloud className="w-4 h-4 mr-2" />
                        Weather Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {phase.weatherRecommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm">
                            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                              rec.priority === 'High' ? 'bg-red-100 text-red-800' : 
                              rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </div>
                            <span className="text-blue-700">{rec.message}</span>
                            <div className="text-blue-600 mt-1 ml-4">→ {rec.action}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dynamic Activities */}
                  {phase.dynamicActivities && phase.dynamicActivities.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Additional Activities
                      </h4>
                      <ul className="space-y-1">
                        {phase.dynamicActivities.map((activity, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {typeof activity === 'string' ? activity : activity.message || activity.action || JSON.stringify(activity)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Critical Alerts */}
                  {phase.criticalAlerts && phase.criticalAlerts.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Critical Alerts
                      </h4>
                      <ul className="space-y-2">
                        {phase.criticalAlerts.map((alert, idx) => (
                          <li key={idx} className="text-sm">
                            <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 mr-2">
                              CRITICAL
                            </div>
                            <span className="text-red-700">{alert.message}</span>
                            <div className="text-red-600 mt-1 ml-4">→ {alert.action}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {phase.soilRecommendations && phase.soilRecommendations.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-medium text-amber-900 mb-2 flex items-center">
                        <Sprout className="w-4 h-4 mr-2" />
                        {t("dashboard.timeline.soil_based")}
                      </h4>
                      <ul className="space-y-1">
                        {phase.soilRecommendations.map((recommendation, idx) => (
                          <li key={idx} className="text-sm text-amber-700">
                            • {recommendation.key ? t(recommendation.key, recommendation.params) : 
                               (typeof recommendation === 'string' ? recommendation : 
                                recommendation.message || recommendation.action || JSON.stringify(recommendation))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case "sustainability":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="farmer-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  {t("dashboard.sustainability.header_title")}
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{t("dashboard.sustainability.header_badge")}</span>
                </CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.sustainability.header_subtitle")}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">{t("dashboard.sustainability.carbon_footprint")}</span>
                    <span className="text-sm text-gray-600">{dynamicSustainability.carbonFootprint}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">{t("dashboard.sustainability.water_usage")}</span>
                    <span className="text-sm text-gray-600">{dynamicSustainability.waterUsage}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">{t("dashboard.sustainability.soil_health")}</span>
                    <span
                      className={`text-sm font-medium ${
                        (dynamicSustainability.soilHealth || "").toLowerCase() === "excellent"
                          ? "text-green-600"
                          : (dynamicSustainability.soilHealth || "").toLowerCase() === "good"
                            ? "text-blue-600"
                            : (dynamicSustainability.soilHealth || "").toLowerCase() === "fair"
                              ? "text-yellow-600"
                              : "text-red-600"
                      }`}
                    >
                      {t(`dashboard.values.soil_health.${(dynamicSustainability.soilHealth || "unknown").toLowerCase()}`)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">{t("dashboard.sustainability.biodiversity_score")}</span>
                    <span className="text-sm text-blue-600">{dynamicSustainability.biodiversityScore}/100</span>
                  </div>
                </div>

                {dynamicSustainability.recommendations && dynamicSustainability.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">{t("dashboard.sustainability.recommendations_title")}</h4>
                    <div className="space-y-3">
                      {dynamicSustainability.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">{rec.categoryKey ? t(rec.categoryKey) : rec.category}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{rec.actionKey ? t(rec.actionKey) : rec.action}</p>
                          <p className="text-xs text-blue-600">{rec.impactKey ? t(rec.impactKey) : rec.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="farmer-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  {t("dashboard.disease.header_title")}
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{t("dashboard.common.realtime_analysis")}</span>
                </CardTitle>
                <p className="text-sm text-gray-600">{t("dashboard.alerts.risk_assessment")}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dynamicDiseaseAlerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{alert.diseaseKey ? t(alert.diseaseKey) : alert.disease}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            alert.risk === "Low"
                              ? "bg-green-100 text-green-800"
                              : alert.risk === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {t(`dashboard.disease.risk_levels.${(alert.risk || "low").toLowerCase()}`)} {t("dashboard.disease.risk_label")}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{t("dashboard.disease.ai_confidence")}: {alert.confidence}</div>
                      <div className="text-sm text-blue-600 mb-2">{alert.actionKey ? t(alert.actionKey) : alert.action}</div>
                      {alert.riskFactors && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {Array.isArray(alert.riskFactors)
                            ? `${t("dashboard.disease.risk_factors_prefix")}: ${alert.riskFactors
                                .map((f) => (f.key ? t(f.key, f.params) : f))
                                .join(", ")}`
                            : alert.riskFactors}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "market":
        return (
          <div className="space-y-6">
            {/* Advanced Market Analysis Component */}
            <AdvancedMarketAnalysis
              crop={farmData?.userInfo?.nextCrop || userInputData.crop || "Chickpea"}
              location={farmData?.userInfo?.location || userInputData.location || "Bhubaneswar, Odisha"}
              state={getStateFromLocation(farmData?.userInfo?.location || userInputData.location || "Bhubaneswar, Odisha")}
              month={farmData?.userInfo?.cultivationMonth || userInputData.month || "6"}
              onAnalysisUpdate={(data) => {
                // Update any parent state if needed
                console.log("Market analysis updated:", data)
              }}
            />

          </div>
        )

      case "recommended":
        return (
          <EnhancedCropRecommendations
            location={farmData?.userInfo?.location || userInputData.location}
            month={farmData?.userInfo?.cultivationMonth || userInputData.month}
            soilData={currentSoilData}
            weatherData={currentWeatherData}
            previousCrop={farmData?.userInfo?.previousCrop}
            t={t}
          />
        )

      case "schemes":
        return (
          <GovernmentSchemes 
            crop={farmData?.userInfo?.crop || userInputData.crop || ""}
            location={farmData?.userInfo?.location || userInputData.location || "Bhubaneswar, Odisha"}
            state={getStateFromLocation(farmData?.userInfo?.location || userInputData.location || "Bhubaneswar, Odisha")}
            farmSize={farmData?.userInfo?.hectare || userInputData.hectare || "2"}
          />
        )

      default:
        return null
    }
  }

  console.log("[v0] Dashboard render - isLoading:", isLoading, "farmData:", !!farmData)

  if (isLoading) {
    console.log("[v0] Rendering loading state")
    return (
      <div className="min-h-screen agricultural-bg flex items-center justify-center">
        <div className="text-lg text-green-700">Loading dashboard...</div>
      </div>
    )
  }

  if (!farmData) {
    console.log("[v0] Rendering no data state")
    return (
      <div className="min-h-screen agricultural-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4 text-green-700">No farm data found</div>
          <Button onClick={() => router.push("/")} className="green-gradient hover:opacity-90">
            Go Back to Home
          </Button>
        </div>
      </div>
    )
  }

  console.log("[v0] Rendering main dashboard")
  return (
    <AgriculturalBackground className="animated-gradient">
      <div className="dashboard-header">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="p-2">
                ←
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 green-gradient logo-shine rounded-lg flex items-center justify-center shadow-lg">
                  <Sprout className="w-5 h-5 text-white relative z-10" />
                </div>
                <div>
                  <span className="text-xl font-bold text-green-800">CropWise AI</span>
                  <p className="text-xs text-green-600">Smart Farming Solutions</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Pre-populate form with current data
                  if (farmData?.userInfo) {
                    setUserInputData({
                      location: farmData.userInfo.location || "",
                      crop: farmData.userInfo.nextCrop || "",
                      month: farmData.userInfo.cultivationMonth || "",
                      hectare: farmData.userInfo.farmSize || ""
                    })
                  }
                  setShowUserInputForm(true)
                }}
                className="relative"
              >
                Update Farm Details
              </Button>
              <div className="flex items-center space-x-3">
              <div className="hidden sm:block">
                <LanguageSwitch />
              </div>
                {user && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-green-600">
                      Welcome, <span className="font-semibold">{user.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logout}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Current Location:</span>{" "}
              {farmData?.userInfo?.location || userInputData.location || "Please update farm data"}
            </p>
            <p>
              <span className="font-medium">Planning to cultivate:</span>{" "}
              {(farmData?.userInfo?.nextCrop || userInputData.crop) || "Not specified"} in {((farmData?.userInfo?.cultivationMonth || userInputData.month) || "Not specified").charAt(0).toUpperCase() + ((farmData?.userInfo?.cultivationMonth || userInputData.month) || "Not specified").slice(1)}
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
            <Card className="stat-card cursor-pointer" onClick={() => setShowYieldIncreasePanel(!showYieldIncreasePanel)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">{t("dashboard.metrics.predicted_yield_increase")}</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {farmData?.predictions?.yieldIncrease || "8-12%"}
                    </p>
                    <p className="text-xs text-green-500 mt-2">Click to view breakdown</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card cursor-pointer" onClick={() => setShowSoilHealthPanel(!showSoilHealthPanel)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">{t("dashboard.metrics.soil_health_score")}</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {farmData?.predictions?.soilHealthScore || "76"}/100
                    </p>
                    <p className="text-xs text-green-500 mt-2">Click to view analysis</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Sprout className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card cursor-pointer" onClick={() => setShowWeatherRiskPanel(!showWeatherRiskPanel)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">{t("dashboard.metrics.weather_risk")}</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">{t(`dashboard.disease.risk_levels.${(farmData?.predictions?.weatherRisk || "medium").toLowerCase()}`)}</p>
                    <p className="text-xs text-green-500 mt-2">Click to view factors</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Thermometer className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card cursor-pointer" onClick={() => setShowPriorityTasksPanel(!showPriorityTasksPanel)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">{t("dashboard.metrics.high_priority_tasks")}</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">{farmData?.predictions?.priorityTasks || "0"}</p>
                    <p className="text-xs text-green-500 mt-2">Click to view details</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs - Compact Layout */}
          <div className="pb-4">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-12 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "green-gradient hover:opacity-90 text-white shadow-lg"
                      : "text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-0.5">
                    <span className="text-sm">{tab.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">{renderTabContent()}</div>


      {/* Yield Increase Panel */}
      {showYieldIncreasePanel && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowYieldIncreasePanel(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Predicted Yield Increase Breakdown</h2>
              <button
                onClick={() => setShowYieldIncreasePanel(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const inferredIncrease = farmData?.predictions?.improvementPercent || farmData?.predictions?.expectedIncrease || 15
                const steps = generateYieldIncreasePlan(
                  currentSoilData,
                  currentWeatherData,
                  { improvementPercent: inferredIncrease },
                  farmData?.userInfo?.nextCrop || userInputData.crop
                )
                const base = farmData?.predictions?.yieldIncreaseDetails || {}
                const baseRecs = Array.isArray(base.recommendations) ? base.recommendations : []
                const normalizedRecommendations = baseRecs.length > 0
                  ? baseRecs.map((r) => {
                      if (typeof r === 'string') return r
                      if (r && typeof r === 'object') {
                        const title = r.title || r.key || 'Recommendation'
                        const impact = r.impact ? ` (+${r.impact})` : ''
                        const desc = r.description || r.solution || r.action || ''
                        return `${title}${impact}${desc ? ` — ${desc}` : ''}`
                      }
                      try { return JSON.stringify(r) } catch { return String(r) }
                    })
                  : steps.map(s => s.action)

                const merged = {
                  display: base.display || farmData?.predictions?.displayIncrease || undefined,
                  percentage: base.percentage ?? inferredIncrease,
                  confidence: base.confidence ?? (farmData?.predictions?.confidence || 85),
                  breakdown: base.breakdown || farmData?.predictions?.breakdown || undefined,
                  factors: base.factors || yieldPredictionData?.factors || undefined,
                  steps: (Array.isArray(base.steps) && base.steps.length > 0) ? base.steps : steps,
                  recommendations: normalizedRecommendations
                }
                return <YieldIncreasePanel data={merged} />
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Soil Health Panel */}
      {showSoilHealthPanel && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSoilHealthPanel(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Soil Health Analysis</h2>
              <button
                onClick={() => setShowSoilHealthPanel(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {farmData?.predictions?.soilHealthDetails ? (
                <SoilHealthPanel data={farmData.predictions.soilHealthDetails} />
              ) : (
                <div className="text-center py-8">
                  <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No soil health data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weather Risk Panel */}
      {showWeatherRiskPanel && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWeatherRiskPanel(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Weather Risk Analysis</h2>
              <button
                onClick={() => setShowWeatherRiskPanel(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {farmData?.predictions?.weatherRiskDetails ? (
                <WeatherRiskPanel data={farmData.predictions.weatherRiskDetails} />
              ) : (
                <div className="text-center py-8">
                  <Thermometer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No weather risk data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Priority Tasks Panel */}
      {showPriorityTasksPanel && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPriorityTasksPanel(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">High Priority Tasks</h2>
              <button
                onClick={() => setShowPriorityTasksPanel(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {farmData?.predictions?.priorityTasksData ? (
                <PriorityTasksPanel data={farmData.predictions.priorityTasksData} />
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No priority tasks data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Farm Details Modal */}
      {showUserInputForm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUserInputForm(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Update Farm Details</h2>
              <button
                onClick={() => setShowUserInputForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <FarmDetailsForm 
                userInputData={userInputData}
                setUserInputData={setUserInputData}
                onSubmit={handleUserInputSubmit}
                onCancel={() => setShowUserInputForm(false)}
                isLoading={apiLoading}
                error={apiError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Farmer Avatar */}
      <div className="farmer-avatar" title="Your Farming Assistant"></div>

      {/* CropWiseAI Chatbot */}
      <EnhancedCropWiseChatbot />
      
    </AgriculturalBackground>
  )
}

// Priority Tasks Panel Component
function PriorityTasksPanel({ data }) {
  const { t } = useI18n()
  
  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No priority tasks data available</p>
      </div>
    )
  }

  const { tasks, categories, summary } = data

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{summary.totalRisks}</div>
          <div className="text-sm text-gray-600">Total Risks</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{summary.criticalRisks}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.moderateRisks}</div>
          <div className="text-sm text-gray-600">Moderate</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{summary.immediateAction}</div>
          <div className="text-sm text-gray-600">Immediate Action</div>
        </div>
      </div>

      {/* Tasks by Category */}
      {Object.entries(categories).map(([category, categoryTasks]) => {
        if (!categoryTasks || categoryTasks.length === 0) return null
        
        return (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {category.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <div className="space-y-3">
              {categoryTasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">{task.risk}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                      task.priority === "High" || task.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : task.priority === "Medium" || task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-blue-600">
                      <strong>Solution:</strong> {task.solution}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Impact:</strong> {task.impact}
                    </div>
                    <div className="text-sm text-gray-500">
                      <strong>Urgency:</strong> {task.urgency}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* All Tasks List */}
      {tasks && tasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">All Priority Tasks</h3>
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  task.priority === "High" || task.priority === "high"
                    ? "bg-red-500"
                    : task.priority === "Medium" || task.priority === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{task.risk}</div>
                  <div className="text-sm text-gray-600">{task.solution}</div>
                </div>
                <div className="text-xs text-gray-500">{task.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Yield Increase Panel Component
function YieldIncreasePanel({ data }) {
  const { t } = useI18n()
  
  if (!data) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No yield increase data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-orange-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-orange-800 mb-2">Yield Increase Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{data.display || data.percentage || "0%"}</div>
            <div className="text-sm text-orange-700">Total Increase</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.confidence || "85"}%</div>
            <div className="text-sm text-orange-700">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.recommendations?.length || data.steps?.length || 0}</div>
            <div className="text-sm text-orange-700">Recommendations</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {data.breakdown && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Increase Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.breakdown).map(([factor, value]) => {
              const valNum = typeof value === 'number' ? value : (value && typeof value === 'object' ? (value.impact ?? 0) : 0)
              const desc = (value && typeof value === 'object') ? (value.description || value.key || '') : ''
              return (
                <div key={factor} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-orange-600 font-semibold">+{valNum}%</span>
                  </div>
                  {desc && (
                    <div className="text-xs text-gray-600 mt-1">{desc}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* Factors removed per request */}

      {/* Dynamic Step-by-step Recommendations to Achieve Increase */}
      {data.steps && data.steps.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Action Plan</h3>
          <div className="space-y-3">
            {data.steps.map((step, idx) => (
              <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-green-800">{step.title}</p>
                      {step.impact && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">~{step.impact} of increase</span>
                      )}
                    </div>
                    <p className="text-sm text-green-700 mt-1">{step.action}</p>
                    {step.details && (
                      <p className="text-xs text-green-700 mt-1">{step.details}</p>
                    )}
                    {Array.isArray(step.items) && step.items.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-green-800 space-y-1">
                        {step.items.map((it, i) => (
                          <li key={i}>{typeof it === 'string' ? it : (it?.text || String(it))}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Soil Health Panel Component
function SoilHealthPanel({ data }) {
  const { t } = useI18n()
  
  if (!data) {
    return (
      <div className="text-center py-8">
        <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No soil health data available</p>
      </div>
    )
  }

  const { score, riskFactors, recommendations, breakdown } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-green-800 mb-2">Soil Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{score}/100</div>
            <div className="text-sm text-green-700">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{riskFactors?.length || 0}</div>
            <div className="text-sm text-green-700">Risk Factors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{recommendations?.length || 0}</div>
            <div className="text-sm text-green-700">Recommendations</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Soil Health Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(breakdown).map(([factor, data]) => (
              <div key={factor} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`font-semibold ${
                    data.points >= 20 ? 'text-green-600' :
                    data.points >= 15 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {data.points}/25
                  </span>
                </div>
                {data.risk && (
                  <div className="text-sm text-red-600 mb-1">
                    <strong>Risk:</strong> {data.risk}
                  </div>
                )}
                {data.recommendation && (
                  <div className="text-sm text-blue-600">
                    <strong>Solution:</strong> {data.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {riskFactors && riskFactors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Factors</h3>
          <div className="space-y-3">
            {riskFactors.map((risk, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-red-800">{risk}</p>
                    {recommendations && recommendations[index] && (
                      <p className="text-sm text-red-600 mt-1">
                        <strong>Solution:</strong> {recommendations[index]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const recStr = (typeof rec === 'string') ? rec : (rec && typeof rec === 'object')
                ? `${rec.title || rec.key || 'Recommendation'}${rec.impact ? ` (+${rec.impact})` : ''}${rec.description ? ` — ${rec.description}` : rec.solution ? ` — ${rec.solution}` : rec.action ? ` — ${rec.action}` : ''}`
                : String(rec)
              return (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-blue-800">{recStr}</p>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Weather Risk Panel Component
function WeatherRiskPanel({ data }) {
  const { t } = useI18n()
  
  if (!data) {
    return (
      <div className="text-center py-8">
        <Thermometer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No weather risk data available</p>
      </div>
    )
  }

  const { level, riskFactors, solutions, details } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className={`p-6 rounded-lg ${
        level === "High" ? "bg-red-50" :
        level === "Medium" ? "bg-yellow-50" :
        "bg-green-50"
      }`}>
        <h3 className={`text-xl font-semibold mb-2 ${
          level === "High" ? "text-red-800" :
          level === "Medium" ? "text-yellow-800" :
          "text-green-800"
        }`}>
          Weather Risk Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${
              level === "High" ? "text-red-600" :
              level === "Medium" ? "text-yellow-600" :
              "text-green-600"
            }`}>
              {level}
            </div>
            <div className={`text-sm ${
              level === "High" ? "text-red-700" :
              level === "Medium" ? "text-yellow-700" :
              "text-green-700"
            }`}>
              Risk Level
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              level === "High" ? "text-red-600" :
              level === "Medium" ? "text-yellow-600" :
              "text-green-600"
            }`}>
              {riskFactors?.length || 0}
            </div>
            <div className={`text-sm ${
              level === "High" ? "text-red-700" :
              level === "Medium" ? "text-yellow-700" :
              "text-green-700"
            }`}>
              Risk Factors
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              level === "High" ? "text-red-600" :
              level === "Medium" ? "text-yellow-600" :
              "text-green-600"
            }`}>
              {solutions?.length || 0}
            </div>
            <div className={`text-sm ${
              level === "High" ? "text-red-700" :
              level === "Medium" ? "text-yellow-700" :
              "text-green-700"
            }`}>
              Solutions
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {riskFactors && riskFactors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Factors</h3>
          <div className="space-y-3">
            {riskFactors.map((risk, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-red-800">{risk}</p>
                    {solutions && solutions[index] && (
                      <p className="text-sm text-red-600 mt-1">
                        <strong>Solution:</strong> {solutions[index]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {details && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(details).map(([factor, data]) => (
              <div key={factor} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`font-semibold ${
                    data.level === "High" ? "text-red-600" :
                    data.level === "Medium" ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {data.level}
                  </span>
                </div>
                {data.factor && (
                  <div className="text-sm text-red-600 mb-1">
                    <strong>Risk:</strong> {data.factor}
                  </div>
                )}
                {data.solution && (
                  <div className="text-sm text-blue-600">
                    <strong>Solution:</strong> {data.solution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solutions */}
      {solutions && solutions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recommended Solutions</h3>
          <div className="space-y-3">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-blue-800">{solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
