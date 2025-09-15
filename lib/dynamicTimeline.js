// Dynamic Timeline Generator based on real-world conditions
export function generateDynamicTimeline(crop, month, location, weatherData, soilData, predictions) {
  const state = getStateFromLocation(location)
  const season = getOdishaSeason(month)
  const normalizedCrop = crop.split(" ")[0].split("(")[0].toLowerCase()
  
  // Get crop-specific growth requirements
  const cropRequirements = getCropSpecificSoilRequirements(normalizedCrop, season)
  const weatherRequirements = getCropWeatherRequirements(normalizedCrop, season)
  
  // Calculate current conditions
  const currentSoilHealth = calculateOdishaSoilHealthScore(soilData, location, normalizedCrop, month)
  const currentWeatherRisk = calculateOdishaWeatherRisk(weatherData, month, normalizedCrop, location)
  
  // Generate dynamic timeline based on conditions
  const timeline = generateCropSpecificTimeline(normalizedCrop, season, currentSoilHealth, currentWeatherRisk, weatherData, soilData, predictions)
  
  return timeline
}

// Generate crop-specific timeline with real-world adaptations
function generateCropSpecificTimeline(crop, season, soilHealth, weatherRisk, weatherData, soilData, predictions) {
  const baseTimeline = getBaseCropTimeline(crop, season)
  const adaptedTimeline = adaptTimelineToConditions(baseTimeline, soilHealth, weatherRisk, weatherData, soilData, predictions)
  
  return adaptedTimeline
}

// Get base timeline for each crop
function getBaseCropTimeline(crop, season) {
  const timelines = {
    'rice': {
      phases: [
        {
          name: "Land Preparation",
          duration: "15-20 days",
          activities: ["Deep plowing", "Leveling", "Bund preparation", "Water management"],
          criticalPoints: ["Ensure proper drainage", "Check soil pH (6.0-7.0)", "Prepare nursery bed"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 50, max: 85 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 300 } }
        },
        {
          name: "Nursery Preparation",
          duration: "25-30 days",
          activities: ["Seed treatment", "Nursery bed preparation", "Seedling care"],
          criticalPoints: ["Use quality seeds", "Maintain 1:1 soil:compost ratio", "Monitor germination"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 60, max: 80 } },
          weatherRequirements: { temperature: { min: 25, max: 30 }, rainfall: { min: 50, max: 150 } }
        },
        {
          name: "Transplanting",
          duration: "5-7 days",
          activities: ["Seedling transplantation", "Field flooding", "Initial fertilization"],
          criticalPoints: ["Transplant 25-30 day old seedlings", "Maintain 2-3cm water depth", "Proper spacing (20x20cm)"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 70, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 30 }, rainfall: { min: 100, max: 200 } }
        },
        {
          name: "Vegetative Growth",
          duration: "30-35 days",
          activities: ["Water management", "Fertilizer application", "Weed control"],
          criticalPoints: ["Maintain 2-5cm water depth", "Apply nitrogen at tillering", "Control weeds"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 60, max: 80 } },
          weatherRequirements: { temperature: { min: 25, max: 32 }, rainfall: { min: 80, max: 200 } }
        },
        {
          name: "Reproductive Stage",
          duration: "25-30 days",
          activities: ["Critical water management", "Potassium application", "Pest monitoring"],
          criticalPoints: ["Maintain 5-8cm water depth", "Apply potassium for grain filling", "Monitor stem borer"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 70, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 30 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Maturity & Harvest",
          duration: "20-25 days",
          activities: ["Water drainage", "Harvest preparation", "Post-harvest processing"],
          criticalPoints: ["Drain water 2 weeks before harvest", "Harvest when 80% grains mature", "Dry to 14% moisture"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 40, max: 60 } },
          weatherRequirements: { temperature: { min: 20, max: 30 }, rainfall: { min: 0, max: 50 } }
        }
      ]
    },
    'wheat': {
      phases: [
        {
          name: "Land Preparation",
          duration: "10-15 days",
          activities: ["Plowing", "Harrowing", "Leveling", "Soil testing"],
          criticalPoints: ["Fine tilth preparation", "Check soil pH (6.0-7.5)", "Ensure adequate moisture"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 40, max: 75 } },
          weatherRequirements: { temperature: { min: 15, max: 25 }, rainfall: { min: 30, max: 100 } }
        },
        {
          name: "Sowing",
          duration: "5-7 days",
          activities: ["Seed treatment", "Sowing", "Initial irrigation"],
          criticalPoints: ["Use quality seeds", "Proper spacing", "Adequate soil moisture"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 70 } },
          weatherRequirements: { temperature: { min: 15, max: 20 }, rainfall: { min: 20, max: 80 } }
        },
        {
          name: "Early Growth",
          duration: "25-30 days",
          activities: ["First irrigation", "Fertilizer application", "Weed control"],
          criticalPoints: ["First irrigation at 25-30 days", "Apply nitrogen at crown root", "Control weeds"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 45, max: 70 } },
          weatherRequirements: { temperature: { min: 15, max: 25 }, rainfall: { min: 30, max: 100 } }
        },
        {
          name: "Tillering & Stem Elongation",
          duration: "30-35 days",
          activities: ["Second irrigation", "Nitrogen application", "Pest monitoring"],
          criticalPoints: ["Second irrigation at 45-50 days", "Apply nitrogen at tillering", "Monitor aphids"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 75 } },
          weatherRequirements: { temperature: { min: 18, max: 28 }, rainfall: { min: 40, max: 120 } }
        },
        {
          name: "Flowering & Grain Development",
          duration: "25-30 days",
          activities: ["Third irrigation", "Potassium application", "Disease control"],
          criticalPoints: ["Third irrigation at flowering", "Apply potassium for grain filling", "Control rust"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 30 }, rainfall: { min: 50, max: 150 } }
        },
        {
          name: "Maturity & Harvest",
          duration: "15-20 days",
          activities: ["Final irrigation", "Harvest preparation", "Post-harvest processing"],
          criticalPoints: ["Stop irrigation before maturity", "Harvest when grains hard", "Store at 12% moisture"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 30, max: 60 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 0, max: 50 } }
        }
      ]
    },
    'coconut': {
      phases: [
        {
          name: "Land Preparation",
          duration: "20-25 days",
          activities: ["Land clearing", "Soil preparation", "Pit digging", "Organic matter addition"],
          criticalPoints: ["Clear land thoroughly", "Dig pits 1x1x1m", "Add organic matter", "Ensure drainage"],
          soilRequirements: { ph: { min: 5.5, max: 7.0 }, moisture: { min: 50, max: 80 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 100, max: 300 } }
        },
        {
          name: "Planting",
          duration: "5-10 days",
          activities: ["Seedling selection", "Planting", "Initial care"],
          criticalPoints: ["Select healthy seedlings", "Plant during monsoon", "Proper spacing (7.5x7.5m)"],
          soilRequirements: { ph: { min: 5.5, max: 7.0 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 32 }, rainfall: { min: 150, max: 250 } }
        },
        {
          name: "Early Growth (1-3 years)",
          duration: "2-3 years",
          activities: ["Regular watering", "Fertilizer application", "Weed control", "Pest monitoring"],
          criticalPoints: ["Maintain soil moisture", "Apply balanced fertilizer", "Control weeds", "Monitor pests"],
          soilRequirements: { ph: { min: 5.5, max: 7.0 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 120, max: 300 } }
        },
        {
          name: "Juvenile Stage (3-5 years)",
          duration: "2-3 years",
          activities: ["Increased fertilization", "Pruning", "Intercropping", "Disease control"],
          criticalPoints: ["Apply more fertilizer", "Prune dead leaves", "Plant intercrops", "Monitor diseases"],
          soilRequirements: { ph: { min: 5.5, max: 7.0 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 150, max: 350 } }
        },
        {
          name: "Mature Stage (5+ years)",
          duration: "Ongoing",
          activities: ["Regular maintenance", "Harvesting", "Fertilizer application", "Pest control"],
          criticalPoints: ["Harvest mature nuts", "Apply annual fertilizer", "Control pests", "Maintain soil health"],
          soilRequirements: { ph: { min: 5.5, max: 7.0 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 100, max: 300 } }
        }
      ]
    },
    'amla': {
      phases: [
        {
          name: "Land Preparation",
          duration: "15-20 days",
          activities: ["Land clearing", "Soil preparation", "Pit digging", "Organic matter addition"],
          criticalPoints: ["Clear land thoroughly", "Dig pits 1x1x1m", "Add organic matter", "Ensure drainage"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 80, max: 200 } }
        },
        {
          name: "Planting",
          duration: "5-10 days",
          activities: ["Seedling selection", "Planting", "Initial care"],
          criticalPoints: ["Select healthy seedlings", "Plant during monsoon", "Proper spacing (6x6m)"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 32 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Early Growth (1-3 years)",
          duration: "2-3 years",
          activities: ["Regular watering", "Fertilizer application", "Weed control", "Pest monitoring"],
          criticalPoints: ["Maintain soil moisture", "Apply balanced fertilizer", "Control weeds", "Monitor pests"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Juvenile Stage (3-5 years)",
          duration: "2-3 years",
          activities: ["Increased fertilization", "Pruning", "Intercropping", "Disease control"],
          criticalPoints: ["Apply more fertilizer", "Prune for shape", "Plant intercrops", "Monitor diseases"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 120, max: 300 } }
        },
        {
          name: "Mature Stage (5+ years)",
          duration: "Ongoing",
          activities: ["Regular maintenance", "Harvesting", "Fertilizer application", "Pest control"],
          criticalPoints: ["Harvest mature fruits", "Apply annual fertilizer", "Control pests", "Maintain soil health"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 80, max: 250 } }
        }
      ]
    },
    'mango': {
      phases: [
        {
          name: "Land Preparation",
          duration: "20-25 days",
          activities: ["Land clearing", "Soil preparation", "Pit digging", "Organic matter addition"],
          criticalPoints: ["Clear land thoroughly", "Dig pits 1x1x1m", "Add organic matter", "Ensure drainage"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Planting",
          duration: "5-10 days",
          activities: ["Graft selection", "Planting", "Initial care"],
          criticalPoints: ["Select quality grafts", "Plant during monsoon", "Proper spacing (10x10m)"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 32 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Early Growth (1-3 years)",
          duration: "2-3 years",
          activities: ["Regular watering", "Fertilizer application", "Weed control", "Pest monitoring"],
          criticalPoints: ["Maintain soil moisture", "Apply balanced fertilizer", "Control weeds", "Monitor pests"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Juvenile Stage (3-7 years)",
          duration: "4-5 years",
          activities: ["Increased fertilization", "Pruning", "Intercropping", "Disease control"],
          criticalPoints: ["Apply more fertilizer", "Prune for shape", "Plant intercrops", "Monitor diseases"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 120, max: 300 } }
        },
        {
          name: "Mature Stage (7+ years)",
          duration: "Ongoing",
          activities: ["Regular maintenance", "Harvesting", "Fertilizer application", "Pest control"],
          criticalPoints: ["Harvest mature fruits", "Apply annual fertilizer", "Control pests", "Maintain soil health"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 55, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 250 } }
        }
      ]
    },
    'banana': {
      phases: [
        {
          name: "Land Preparation",
          duration: "15-20 days",
          activities: ["Land clearing", "Soil preparation", "Pit digging", "Organic matter addition"],
          criticalPoints: ["Clear land thoroughly", "Dig pits 0.6x0.6x0.6m", "Add organic matter", "Ensure drainage"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 120, max: 300 } }
        },
        {
          name: "Planting",
          duration: "5-10 days",
          activities: ["Sucker selection", "Planting", "Initial care"],
          criticalPoints: ["Select healthy suckers", "Plant during monsoon", "Proper spacing (2x2m)"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 70, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 32 }, rainfall: { min: 150, max: 300 } }
        },
        {
          name: "Vegetative Growth",
          duration: "6-8 months",
          activities: ["Regular watering", "Fertilizer application", "Weed control", "Pest monitoring"],
          criticalPoints: ["Maintain soil moisture", "Apply balanced fertilizer", "Control weeds", "Monitor pests"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 65, max: 85 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 120, max: 300 } }
        },
        {
          name: "Flowering & Fruit Development",
          duration: "3-4 months",
          activities: ["Fertilizer application", "Pest control", "Bunch management"],
          criticalPoints: ["Apply potassium fertilizer", "Control pests", "Support bunches", "Monitor diseases"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 80 } },
          weatherRequirements: { temperature: { min: 25, max: 35 }, rainfall: { min: 100, max: 250 } }
        },
        {
          name: "Harvest & Post-Harvest",
          duration: "1-2 months",
          activities: ["Harvesting", "Post-harvest processing", "Sucker management"],
          criticalPoints: ["Harvest at right maturity", "Proper handling", "Select suckers for next crop"],
          soilRequirements: { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 70 } },
          weatherRequirements: { temperature: { min: 20, max: 35 }, rainfall: { min: 80, max: 200 } }
        }
      ]
    },
    'tomato': {
      phases: [
        {
          name: "Land Preparation",
          duration: "10-15 days",
          activities: ["Plowing", "Harrowing", "Leveling", "Soil testing"],
          criticalPoints: ["Fine tilth preparation", "Check soil pH (6.0-7.0)", "Ensure adequate moisture"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 50, max: 85 } },
          weatherRequirements: { temperature: { min: 18, max: 30 }, rainfall: { min: 60, max: 150 } }
        },
        {
          name: "Nursery Preparation",
          duration: "25-30 days",
          activities: ["Seed treatment", "Nursery bed preparation", "Seedling care"],
          criticalPoints: ["Use quality seeds", "Maintain 1:1 soil:compost ratio", "Monitor germination"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 60, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 28 }, rainfall: { min: 40, max: 100 } }
        },
        {
          name: "Transplanting",
          duration: "5-7 days",
          activities: ["Seedling transplantation", "Initial irrigation", "Fertilizer application"],
          criticalPoints: ["Transplant 25-30 day old seedlings", "Proper spacing (60x45cm)", "Apply starter fertilizer"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 70, max: 85 } },
          weatherRequirements: { temperature: { min: 20, max: 30 }, rainfall: { min: 60, max: 120 } }
        },
        {
          name: "Vegetative Growth",
          duration: "30-35 days",
          activities: ["Water management", "Fertilizer application", "Weed control", "Staking"],
          criticalPoints: ["Maintain soil moisture", "Apply nitrogen at vegetative stage", "Control weeds", "Provide support"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 60, max: 80 } },
          weatherRequirements: { temperature: { min: 20, max: 30 }, rainfall: { min: 50, max: 120 } }
        },
        {
          name: "Flowering & Fruit Development",
          duration: "45-60 days",
          activities: ["Fertilizer application", "Pest control", "Disease management"],
          criticalPoints: ["Apply potassium for fruit development", "Control pests", "Monitor diseases", "Maintain moisture"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 65, max: 85 } },
          weatherRequirements: { temperature: { min: 20, max: 30 }, rainfall: { min: 60, max: 150 } }
        },
        {
          name: "Harvest",
          duration: "30-45 days",
          activities: ["Harvesting", "Post-harvest handling", "Market preparation"],
          criticalPoints: ["Harvest at right maturity", "Proper handling", "Grading and packing"],
          soilRequirements: { ph: { min: 6.0, max: 7.0 }, moisture: { min: 50, max: 70 } },
          weatherRequirements: { temperature: { min: 18, max: 30 }, rainfall: { min: 40, max: 100 } }
        }
      ]
    }
  }
  
  return timelines[crop] || timelines['rice']
}

// Adapt timeline based on current conditions
function adaptTimelineToConditions(baseTimeline, soilHealth, weatherRisk, weatherData, soilData, predictions) {
  return baseTimeline.phases.map(phase => {
    const adaptedPhase = { ...phase }
    
    // Add dynamic recommendations based on soil health
    adaptedPhase.soilRecommendations = generateSoilRecommendations(phase, soilHealth, soilData)
    
    // Add dynamic recommendations based on weather risk
    adaptedPhase.weatherRecommendations = generateWeatherRecommendations(phase, weatherRisk, weatherData)
    
    // Add dynamic timing adjustments
    adaptedPhase.timingAdjustments = generateTimingAdjustments(phase, soilHealth, weatherRisk, weatherData)
    
    // Add dynamic activities based on conditions
    adaptedPhase.dynamicActivities = generateDynamicActivities(phase, soilHealth, weatherRisk, soilData, weatherData)
    
    // Add critical alerts based on current conditions
    adaptedPhase.criticalAlerts = generateCriticalAlerts(phase, soilHealth, weatherRisk, soilData, weatherData)
    
    return adaptedPhase
  })
}

// Generate soil-specific recommendations
function generateSoilRecommendations(phase, soilHealth, soilData) {
  const recommendations = []
  
  // pH recommendations
  if (soilData.ph < phase.soilRequirements.ph.min) {
    recommendations.push({
      type: "pH",
      priority: "High",
      message: `Soil pH (${soilData.ph}) is too acidic for ${phase.name}. Apply lime to raise pH to ${phase.soilRequirements.ph.min}-${phase.soilRequirements.ph.max}`,
      action: "Apply 2-3 tons of lime per hectare"
    })
  } else if (soilData.ph > phase.soilRequirements.ph.max) {
    recommendations.push({
      type: "pH",
      priority: "High",
      message: `Soil pH (${soilData.ph}) is too alkaline for ${phase.name}. Apply sulfur to lower pH to ${phase.soilRequirements.ph.min}-${phase.soilRequirements.ph.max}`,
      action: "Apply 1-2 tons of sulfur per hectare"
    })
  }
  
  // Moisture recommendations
  if (soilData.moisture < phase.soilRequirements.moisture.min) {
    recommendations.push({
      type: "moisture",
      priority: "High",
      message: `Soil moisture (${soilData.moisture}%) is too low for ${phase.name}. Increase irrigation frequency`,
      action: "Irrigate every 3-4 days until moisture reaches optimal range"
    })
  } else if (soilData.moisture > phase.soilRequirements.moisture.max) {
    recommendations.push({
      type: "moisture",
      priority: "High",
      message: `Soil moisture (${soilData.moisture}%) is too high for ${phase.name}. Improve drainage`,
      action: "Install drainage system or reduce irrigation frequency"
    })
  }
  
  // Nutrient recommendations
  if (soilData.nitrogen < 20) {
    recommendations.push({
      type: "nitrogen",
      priority: "Medium",
      message: `Nitrogen level (${soilData.nitrogen}) is low. Apply nitrogen fertilizer`,
      action: "Apply 50-75 kg N per hectare"
    })
  }
  
  if (soilData.phosphorus < 15) {
    recommendations.push({
      type: "phosphorus",
      priority: "Medium",
      message: `Phosphorus level (${soilData.phosphorus}) is low. Apply phosphorus fertilizer`,
      action: "Apply 30-40 kg P2O5 per hectare"
    })
  }
  
  if (soilData.potassium < 150) {
    recommendations.push({
      type: "potassium",
      priority: "Medium",
      message: `Potassium level (${soilData.potassium}) is low. Apply potassium fertilizer`,
      action: "Apply 40-60 kg K2O per hectare"
    })
  }
  
  return recommendations
}

// Generate weather-specific recommendations
function generateWeatherRecommendations(phase, weatherRisk, weatherData) {
  const recommendations = []
  
  if (weatherRisk.level === "High") {
    weatherRisk.riskFactors.forEach(risk => {
      if (risk.includes("Drought")) {
        recommendations.push({
          type: "drought",
          priority: "High",
          message: `Drought risk detected for ${phase.name}. Implement drought management`,
          action: "Increase irrigation frequency, use mulching, consider drought-resistant varieties"
        })
      } else if (risk.includes("Flood")) {
        recommendations.push({
          type: "flood",
          priority: "High",
          message: `Flood risk detected for ${phase.name}. Implement flood management`,
          action: "Improve drainage, use raised beds, consider flood-resistant varieties"
        })
      } else if (risk.includes("Heat")) {
        recommendations.push({
          type: "heat",
          priority: "High",
          message: `Heat stress risk detected for ${phase.name}. Implement heat management`,
          action: "Use shade nets, increase irrigation, apply mulch"
        })
      }
    })
  }
  
  // Temperature-based recommendations
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  if (avgTemp > phase.weatherRequirements.temperature.max) {
    recommendations.push({
      type: "temperature",
      priority: "Medium",
      message: `Temperature (${avgTemp}°C) is above optimal for ${phase.name}`,
      action: "Use shade nets, increase irrigation, apply mulch"
    })
  } else if (avgTemp < phase.weatherRequirements.temperature.min) {
    recommendations.push({
      type: "temperature",
      priority: "Medium",
      message: `Temperature (${avgTemp}°C) is below optimal for ${phase.name}`,
      action: "Use row covers, apply mulch, consider delayed planting"
    })
  }
  
  return recommendations
}

// Generate timing adjustments based on conditions
function generateTimingAdjustments(phase, soilHealth, weatherRisk, weatherData) {
  const adjustments = []
  
  // Soil-based timing adjustments
  if (soilHealth.score < 50) {
    adjustments.push({
      type: "soil",
      message: "Poor soil health detected. Delay planting by 1-2 weeks to improve soil conditions",
      adjustment: "Delay by 1-2 weeks"
    })
  }
  
  // Weather-based timing adjustments
  if (weatherRisk.level === "High") {
    adjustments.push({
      type: "weather",
      message: "High weather risk detected. Adjust timing to avoid critical weather periods",
      adjustment: "Adjust timing based on weather forecast"
    })
  }
  
  // Season-based timing adjustments
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
  if (rainyDays > 5) {
    adjustments.push({
      type: "rainfall",
      message: "High rainfall expected. Delay field operations to avoid waterlogging",
      adjustment: "Delay by 3-5 days"
    })
  }
  
  return adjustments
}

// Generate dynamic activities based on current conditions
function generateDynamicActivities(phase, soilHealth, weatherRisk, soilData, weatherData) {
  const activities = []
  
  // Soil-based activities
  if (soilData.ph < 6.0) {
    activities.push("Apply lime to raise soil pH")
  }
  if (soilData.moisture < 50) {
    activities.push("Increase irrigation frequency")
  }
  if (soilData.nitrogen < 20) {
    activities.push("Apply nitrogen fertilizer")
  }
  
  // Weather-based activities
  if (weatherRisk.level === "High") {
    activities.push("Implement risk mitigation measures")
  }
  
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
  if (rainyDays > 5) {
    activities.push("Improve drainage system")
  }
  
  return activities
}

// Generate critical alerts based on current conditions
function generateCriticalAlerts(phase, soilHealth, weatherRisk, soilData, weatherData) {
  const alerts = []
  
  // Critical soil alerts
  if (soilData.ph < 5.0 || soilData.ph > 8.0) {
    alerts.push({
      type: "critical",
      message: `Critical soil pH issue: ${soilData.ph}. Immediate action required`,
      action: "Apply pH correction immediately"
    })
  }
  
  if (soilData.moisture < 30) {
    alerts.push({
      type: "critical",
      message: `Critical soil moisture: ${soilData.moisture}%. Immediate irrigation required`,
      action: "Irrigate immediately"
    })
  }
  
  // Critical weather alerts
  if (weatherRisk.level === "High") {
    alerts.push({
      type: "critical",
      message: "High weather risk detected. Take immediate protective measures",
      action: "Implement emergency protection measures"
    })
  }
  
  return alerts
}

// Helper functions - simplified implementations for dynamic timeline
function getStateFromLocation(location) {
  const stateMapping = {
    'odisha': 'odisha', 'bhubaneswar': 'odisha', 'cuttack': 'odisha', 'puri': 'odisha',
    'punjab': 'punjab', 'amritsar': 'punjab', 'ludhiana': 'punjab', 'jalandhar': 'punjab',
    'uttar pradesh': 'uttar_pradesh', 'lucknow': 'uttar_pradesh', 'kanpur': 'uttar_pradesh',
    'maharashtra': 'maharashtra', 'mumbai': 'maharashtra', 'pune': 'maharashtra',
    'karnataka': 'karnataka', 'bangalore': 'karnataka', 'mysore': 'karnataka',
    'tamil nadu': 'tamil_nadu', 'chennai': 'tamil_nadu', 'coimbatore': 'tamil_nadu',
    'gujarat': 'gujarat', 'ahmedabad': 'gujarat', 'surat': 'gujarat',
    'rajasthan': 'rajasthan', 'jaipur': 'rajasthan', 'jodhpur': 'rajasthan',
    'west bengal': 'west_bengal', 'kolkata': 'west_bengal', 'howrah': 'west_bengal',
    'bihar': 'bihar', 'patna': 'bihar', 'gaya': 'bihar',
    'andhra pradesh': 'andhra_pradesh', 'hyderabad': 'andhra_pradesh', 'visakhapatnam': 'andhra_pradesh',
    'kerala': 'kerala', 'thiruvananthapuram': 'kerala', 'kochi': 'kerala',
    'madhya pradesh': 'madhya_pradesh', 'bhopal': 'madhya_pradesh', 'indore': 'madhya_pradesh',
    'haryana': 'haryana', 'gurgaon': 'haryana', 'faridabad': 'haryana'
  }
  
  const normalizedLocation = location.toLowerCase().trim()
  return stateMapping[normalizedLocation] || 'odisha'
}

function getOdishaSeason(month) {
  const monthLower = month.toLowerCase()
  if (['june', 'july', 'august', 'september'].includes(monthLower)) {
    return 'kharif'
  } else if (['october', 'november', 'december', 'january', 'february'].includes(monthLower)) {
    return 'rabi'
  } else {
    return 'zaid'
  }
}

function getCropSpecificSoilRequirements(crop, season) {
  const cropData = {
    'rice': { ph: { min: 6.0, max: 7.0 }, moisture: { min: 50, max: 85 }, nitrogen: { min: 20, max: 35 }, phosphorus: { min: 15, max: 25 }, potassium: { min: 150, max: 250 } },
    'wheat': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 40, max: 75 }, nitrogen: { min: 18, max: 30 }, phosphorus: { min: 12, max: 22 }, potassium: { min: 120, max: 200 } },
    'maize': { ph: { min: 5.8, max: 7.0 }, moisture: { min: 45, max: 80 }, nitrogen: { min: 22, max: 35 }, phosphorus: { min: 15, max: 28 }, potassium: { min: 160, max: 280 } },
    'cotton': { ph: { min: 6.0, max: 8.0 }, moisture: { min: 35, max: 70 }, nitrogen: { min: 15, max: 28 }, phosphorus: { min: 10, max: 20 }, potassium: { min: 100, max: 180 } },
    'sugarcane': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 90 }, nitrogen: { min: 25, max: 40 }, phosphorus: { min: 18, max: 30 }, potassium: { min: 180, max: 300 } },
    'coconut': { ph: { min: 5.5, max: 7.0 }, moisture: { min: 50, max: 80 }, nitrogen: { min: 20, max: 35 }, phosphorus: { min: 15, max: 25 }, potassium: { min: 150, max: 250 } },
    'amla': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 80 }, nitrogen: { min: 18, max: 30 }, phosphorus: { min: 12, max: 22 }, potassium: { min: 120, max: 200 } },
    'mango': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 50, max: 80 }, nitrogen: { min: 20, max: 35 }, phosphorus: { min: 15, max: 25 }, potassium: { min: 150, max: 250 } },
    'banana': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 60, max: 85 }, nitrogen: { min: 25, max: 40 }, phosphorus: { min: 18, max: 30 }, potassium: { min: 200, max: 350 } },
    'tomato': { ph: { min: 6.0, max: 7.0 }, moisture: { min: 50, max: 85 }, nitrogen: { min: 20, max: 35 }, phosphorus: { min: 15, max: 25 }, potassium: { min: 150, max: 250 } },
    'potato': { ph: { min: 5.5, max: 6.5 }, moisture: { min: 50, max: 80 }, nitrogen: { min: 15, max: 30 }, phosphorus: { min: 12, max: 20 }, potassium: { min: 120, max: 200 } },
    'onion': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 45, max: 75 }, nitrogen: { min: 15, max: 25 }, phosphorus: { min: 10, max: 18 }, potassium: { min: 100, max: 160 } },
    'chilli': { ph: { min: 5.5, max: 7.0 }, moisture: { min: 40, max: 70 }, nitrogen: { min: 12, max: 22 }, phosphorus: { min: 8, max: 15 }, potassium: { min: 80, max: 140 } },
    'brinjal': { ph: { min: 6.0, max: 7.0 }, moisture: { min: 50, max: 80 }, nitrogen: { min: 18, max: 30 }, phosphorus: { min: 12, max: 22 }, potassium: { min: 120, max: 200 } },
    'turmeric': { ph: { min: 5.0, max: 6.5 }, moisture: { min: 45, max: 75 }, nitrogen: { min: 15, max: 25 }, phosphorus: { min: 8, max: 18 }, potassium: { min: 80, max: 160 } },
    'ginger': { ph: { min: 5.5, max: 6.5 }, moisture: { min: 50, max: 80 }, nitrogen: { min: 15, max: 25 }, phosphorus: { min: 10, max: 18 }, potassium: { min: 100, max: 180 } },
    'mustard': { ph: { min: 6.0, max: 7.5 }, moisture: { min: 40, max: 70 }, nitrogen: { min: 15, max: 25 }, phosphorus: { min: 10, max: 18 }, potassium: { min: 80, max: 140 } },
    'soybean': { ph: { min: 6.0, max: 7.0 }, moisture: { min: 45, max: 80 }, nitrogen: { min: 15, max: 25 }, phosphorus: { min: 10, max: 18 }, potassium: { min: 100, max: 180 } },
    'groundnut': { ph: { min: 6.0, max: 7.0 }, moisture: { min: 40, max: 70 }, nitrogen: { min: 12, max: 20 }, phosphorus: { min: 8, max: 15 }, potassium: { min: 80, max: 140 } }
  }
  
  return cropData[crop] || cropData['rice']
}

function getCropWeatherRequirements(crop, season) {
  const weatherData = {
    'rice': { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 300 }, humidity: { min: 50, max: 90 } },
    'wheat': { temperature: { min: 15, max: 28 }, rainfall: { min: 30, max: 100 }, humidity: { min: 40, max: 80 } },
    'maize': { temperature: { min: 18, max: 32 }, rainfall: { min: 50, max: 150 }, humidity: { min: 45, max: 85 } },
    'cotton': { temperature: { min: 22, max: 36 }, rainfall: { min: 40, max: 120 }, humidity: { min: 35, max: 75 } },
    'sugarcane': { temperature: { min: 20, max: 35 }, rainfall: { min: 80, max: 200 }, humidity: { min: 60, max: 90 } },
    'coconut': { temperature: { min: 25, max: 35 }, rainfall: { min: 100, max: 300 }, humidity: { min: 50, max: 80 } },
    'amla': { temperature: { min: 20, max: 35 }, rainfall: { min: 80, max: 200 }, humidity: { min: 50, max: 80 } },
    'mango': { temperature: { min: 20, max: 35 }, rainfall: { min: 100, max: 250 }, humidity: { min: 50, max: 80 } },
    'banana': { temperature: { min: 25, max: 35 }, rainfall: { min: 120, max: 300 }, humidity: { min: 60, max: 85 } },
    'tomato': { temperature: { min: 18, max: 30 }, rainfall: { min: 60, max: 150 }, humidity: { min: 45, max: 85 } },
    'potato': { temperature: { min: 15, max: 25 }, rainfall: { min: 70, max: 180 }, humidity: { min: 50, max: 85 } },
    'onion': { temperature: { min: 15, max: 28 }, rainfall: { min: 40, max: 120 }, humidity: { min: 40, max: 80 } },
    'chilli': { temperature: { min: 20, max: 32 }, rainfall: { min: 50, max: 130 }, humidity: { min: 40, max: 80 } },
    'brinjal': { temperature: { min: 20, max: 32 }, rainfall: { min: 60, max: 150 }, humidity: { min: 45, max: 85 } },
    'turmeric': { temperature: { min: 18, max: 30 }, rainfall: { min: 70, max: 180 }, humidity: { min: 50, max: 85 } },
    'ginger': { temperature: { min: 18, max: 30 }, rainfall: { min: 80, max: 200 }, humidity: { min: 50, max: 85 } },
    'mustard': { temperature: { min: 15, max: 25 }, rainfall: { min: 30, max: 100 }, humidity: { min: 40, max: 70 } },
    'soybean': { temperature: { min: 20, max: 32 }, rainfall: { min: 60, max: 150 }, humidity: { min: 45, max: 80 } },
    'groundnut': { temperature: { min: 20, max: 35 }, rainfall: { min: 50, max: 120 }, humidity: { min: 40, max: 70 } }
  }
  
  return weatherData[crop] || weatherData['rice']
}

function calculateOdishaSoilHealthScore(soilData, location, crop, month) {
  // Simplified soil health calculation
  let score = 0
  let riskFactors = []
  let recommendations = []
  
  // pH scoring
  if (soilData.ph >= 6.0 && soilData.ph <= 7.0) {
    score += 25
  } else if (soilData.ph >= 5.5 && soilData.ph <= 7.5) {
    score += 20
  } else {
    score += 10
    riskFactors.push(`pH ${soilData.ph} is outside optimal range`)
    recommendations.push(`Adjust pH to 6.0-7.0 range`)
  }
  
  // Moisture scoring
  if (soilData.moisture >= 50 && soilData.moisture <= 80) {
    score += 25
  } else if (soilData.moisture >= 40 && soilData.moisture <= 90) {
    score += 20
  } else {
    score += 10
    riskFactors.push(`Moisture ${soilData.moisture}% is outside optimal range`)
    recommendations.push(`Adjust irrigation to maintain 50-80% moisture`)
  }
  
  // Nutrient scoring
  if (soilData.nitrogen >= 20) score += 15
  else if (soilData.nitrogen >= 15) score += 10
  else {
    score += 5
    riskFactors.push(`Low nitrogen: ${soilData.nitrogen}`)
    recommendations.push(`Apply nitrogen fertilizer`)
  }
  
  if (soilData.phosphorus >= 15) score += 15
  else if (soilData.phosphorus >= 10) score += 10
  else {
    score += 5
    riskFactors.push(`Low phosphorus: ${soilData.phosphorus}`)
    recommendations.push(`Apply phosphorus fertilizer`)
  }
  
  if (soilData.potassium >= 150) score += 20
  else if (soilData.potassium >= 100) score += 15
  else {
    score += 10
    riskFactors.push(`Low potassium: ${soilData.potassium}`)
    recommendations.push(`Apply potassium fertilizer`)
  }
  
  return { score: Math.min(100, score), riskFactors, recommendations }
}

function calculateOdishaWeatherRisk(weatherData, month, crop, location) {
  const avgTemp = weatherData.reduce((sum, day) => sum + (day.tempValue || parseInt(day.temp) || 0), 0) / weatherData.length
  const rainyDays = weatherData.filter(day => day.condition.includes("rain")).length
  const avgHumidity = weatherData.reduce((sum, day) => sum + (day.humidityValue || parseInt(day.humidity) || 50), 0) / weatherData.length
  
  let riskLevel = "Low"
  let riskFactors = []
  let solutions = []
  
  // Temperature risk
  if (avgTemp > 35 || avgTemp < 15) {
    riskLevel = "High"
    riskFactors.push(`Temperature ${avgTemp}°C is extreme`)
    solutions.push(`Implement temperature control measures`)
  } else if (avgTemp > 32 || avgTemp < 18) {
    riskLevel = "Medium"
    riskFactors.push(`Temperature ${avgTemp}°C is suboptimal`)
    solutions.push(`Monitor temperature closely`)
  }
  
  // Rainfall risk
  const season = getOdishaSeason(month)
  if (season === 'kharif') {
    if (rainyDays < 3) {
      riskLevel = "High"
      riskFactors.push(`Drought risk: Only ${rainyDays} rainy days in monsoon season`)
      solutions.push(`Implement drought management: irrigation, mulching, drought-resistant varieties`)
    } else if (rainyDays > 12) {
      riskLevel = "High"
      riskFactors.push(`Flood risk: ${rainyDays} rainy days in monsoon season`)
      solutions.push(`Implement flood management: drainage, raised beds, flood-resistant varieties`)
    }
  }
  
  return { level: riskLevel, riskFactors, solutions }
}
