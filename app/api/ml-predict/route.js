import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

// ML Model Integration API
export async function POST(request) {
  try {
    const body = await request.json()
    const { type, inputData } = body

    console.log(`[ML API] ${type} prediction requested:`, inputData)

    if (!type || !inputData) {
      return NextResponse.json({ 
        error: "Type and inputData are required" 
      }, { status: 400 })
    }

    // Validate input data
    const validation = validateMLInput(inputData)
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.message,
        missing_fields: validation.missing_fields 
      }, { status: 400 })
    }

    // Run ML prediction based on type
    let result
    switch (type) {
      case 'yield_prediction':
        result = await runYieldPrediction(inputData)
        break
      case 'crop_recommendation':
        result = await runCropRecommendation(inputData)
        break
      case 'comprehensive_analysis':
        result = await runComprehensiveAnalysis(inputData)
        break
      default:
        return NextResponse.json({ 
          error: "Invalid prediction type. Use: yield_prediction, crop_recommendation, or comprehensive_analysis" 
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type: type,
      result: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("ML API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}

// Validate ML input data
function validateMLInput(inputData) {
  const requiredFields = [
    'state', 'soil_ph', 'soil_moisture', 'soil_nitrogen', 
    'soil_phosphorus', 'soil_potassium', 'avg_temperature', 
    'humidity', 'rainfall'
  ]

  const missingFields = requiredFields.filter(field => 
    !(field in inputData) || inputData[field] === null || inputData[field] === undefined
  )

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missing_fields: missingFields
    }
  }

  // Validate ranges
  const validations = {
    soil_ph: [5.0, 8.5],
    soil_moisture: [20, 90],
    soil_nitrogen: [20, 100],
    soil_phosphorus: [15, 80],
    soil_potassium: [50, 250],
    avg_temperature: [15, 45],
    humidity: [30, 95],
    rainfall: [0, 20]
  }

  const outOfRange = []
  for (const [field, [min, max]] of Object.entries(validations)) {
    const value = inputData[field]
    if (value < min || value > max) {
      outOfRange.push(`${field}: ${value} (expected ${min}-${max})`)
    }
  }

  if (outOfRange.length > 0) {
    return {
      valid: false,
      message: `Values out of range: ${outOfRange.join(', ')}`,
      out_of_range: outOfRange
    }
  }

  return { valid: true }
}

// Run yield prediction using Python ML model
async function runYieldPrediction(inputData) {
  try {
    const pythonScript = path.join(process.cwd(), 'ml_models', 'predict_yield.py')
    
    if (!fs.existsSync(pythonScript)) {
      // Fallback to mock prediction if ML model not available
      return generateMockYieldPrediction(inputData)
    }

    const result = await runPythonScript(pythonScript, inputData)
    return result

  } catch (error) {
    console.error("Yield prediction error:", error)
    // Return mock prediction as fallback
    return generateMockYieldPrediction(inputData)
  }
}

// Run crop recommendation using Python ML model
async function runCropRecommendation(inputData) {
  try {
    const pythonScript = path.join(process.cwd(), 'ml_models', 'predict_crops.py')
    
    if (!fs.existsSync(pythonScript)) {
      // Fallback to mock recommendation if ML model not available
      return generateMockCropRecommendation(inputData)
    }

    const result = await runPythonScript(pythonScript, inputData)
    return result

  } catch (error) {
    console.error("Crop recommendation error:", error)
    // Return mock recommendation as fallback
    return generateMockCropRecommendation(inputData)
  }
}

// Run comprehensive analysis
async function runComprehensiveAnalysis(inputData) {
  try {
    const pythonScript = path.join(process.cwd(), 'ml_models', 'comprehensive_analysis.py')
    
    if (!fs.existsSync(pythonScript)) {
      // Fallback to mock analysis if ML model not available
      return generateMockComprehensiveAnalysis(inputData)
    }

    const result = await runPythonScript(pythonScript, inputData)
    return result

  } catch (error) {
    console.error("Comprehensive analysis error:", error)
    // Return mock analysis as fallback
    return generateMockComprehensiveAnalysis(inputData)
  }
}

// Run Python script with input data
async function runPythonScript(scriptPath, inputData) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let error = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
    })

    python.stderr.on('data', (data) => {
      error += data.toString()
    })

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output)
          resolve(result)
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${error}`))
      }
    })

    // Send input data to Python script
    python.stdin.write(JSON.stringify(inputData))
    python.stdin.end()
  })
}

// Mock yield prediction (fallback)
function generateMockYieldPrediction(inputData) {
  const { soil_ph, soil_moisture, soil_nitrogen, avg_temperature, state } = inputData
  
  // Simple heuristic-based prediction
  let baseYield = 3.5
  
  // Adjust based on soil pH
  if (soil_ph >= 6.0 && soil_ph <= 7.5) {
    baseYield += 0.5
  } else if (soil_ph < 5.5 || soil_ph > 8.0) {
    baseYield -= 0.3
  }
  
  // Adjust based on soil moisture
  if (soil_moisture >= 50 && soil_moisture <= 80) {
    baseYield += 0.3
  } else if (soil_moisture < 30 || soil_moisture > 90) {
    baseYield -= 0.2
  }
  
  // Adjust based on nitrogen
  if (soil_nitrogen >= 60) {
    baseYield += 0.4
  } else if (soil_nitrogen < 40) {
    baseYield -= 0.3
  }
  
  // Adjust based on temperature
  if (avg_temperature >= 20 && avg_temperature <= 35) {
    baseYield += 0.2
  } else if (avg_temperature < 15 || avg_temperature > 40) {
    baseYield -= 0.4
  }
  
  // State-specific adjustments
  const stateFactors = {
    'punjab': 1.2, 'haryana': 1.15, 'uttar_pradesh': 1.0,
    'maharashtra': 0.95, 'karnataka': 0.9, 'tamil_nadu': 1.1,
    'gujarat': 0.95, 'rajasthan': 0.8, 'bihar': 0.9,
    'west_bengal': 1.05, 'madhya_pradesh': 0.9, 'odisha': 0.85
  }
  
  const stateFactor = stateFactors[state] || 1.0
  const predictedYield = Math.max(0.5, Math.min(8.0, baseYield * stateFactor))
  
  return {
    success: true,
    predictions: {
      ensemble_yield: predictedYield,
      confidence_interval: {
        lower: predictedYield * 0.85,
        upper: predictedYield * 1.15,
        uncertainty: predictedYield * 0.1
      }
    },
    input_conditions: inputData
  }
}

// Mock crop recommendation (fallback)
function generateMockCropRecommendation(inputData) {
  const { state, soil_ph, avg_temperature, rainfall } = inputData
  
  // State-specific crop recommendations
  const stateCrops = {
    'punjab': ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane'],
    'haryana': ['Wheat', 'Rice', 'Mustard', 'Bajra', 'Jowar'],
    'uttar_pradesh': ['Rice', 'Wheat', 'Sugarcane', 'Potato', 'Mustard'],
    'maharashtra': ['Sugarcane', 'Cotton', 'Soybean', 'Turmeric', 'Grapes'],
    'karnataka': ['Rice', 'Ragi', 'Jowar', 'Maize', 'Coffee'],
    'tamil_nadu': ['Rice', 'Sugarcane', 'Cotton', 'Groundnut', 'Coconut'],
    'gujarat': ['Wheat', 'Cotton', 'Groundnut', 'Sugarcane', 'Mustard'],
    'rajasthan': ['Wheat', 'Mustard', 'Bajra', 'Jowar', 'Cotton'],
    'bihar': ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Lentil'],
    'west_bengal': ['Rice', 'Wheat', 'Jute', 'Potato', 'Mustard'],
    'madhya_pradesh': ['Wheat', 'Rice', 'Soybean', 'Maize', 'Chickpea'],
    'odisha': ['Rice', 'Maize', 'Ragi', 'Black Gram', 'Green Gram']
  }
  
  const availableCrops = stateCrops[state] || ['Rice', 'Wheat', 'Maize']
  
  // Score crops based on conditions
  const recommendations = availableCrops.map((crop, index) => {
    let score = 0.7 - (index * 0.1) // Base score decreasing by rank
    
    // Adjust score based on soil pH
    if (crop === 'Rice' && soil_ph >= 6.0 && soil_ph <= 7.0) score += 0.2
    if (crop === 'Wheat' && soil_ph >= 6.5 && soil_ph <= 7.5) score += 0.2
    if (crop === 'Maize' && soil_ph >= 6.0 && soil_ph <= 7.0) score += 0.2
    
    // Adjust score based on temperature
    if (crop === 'Rice' && avg_temperature >= 25 && avg_temperature <= 35) score += 0.1
    if (crop === 'Wheat' && avg_temperature >= 15 && avg_temperature <= 25) score += 0.1
    if (crop === 'Maize' && avg_temperature >= 20 && avg_temperature <= 30) score += 0.1
    
    // Adjust score based on rainfall
    if (crop === 'Rice' && rainfall >= 5) score += 0.1
    if (crop === 'Wheat' && rainfall >= 2 && rainfall <= 6) score += 0.1
    if (crop === 'Maize' && rainfall >= 3 && rainfall <= 8) score += 0.1
    
    return {
      crop: crop,
      score: Math.min(0.95, Math.max(0.3, score)),
      rank: index + 1,
      confidence: score > 0.7 ? 'High' : score > 0.4 ? 'Medium' : 'Low',
      reasons: generateCropReasons(crop, inputData)
    }
  })
  
  return {
    success: true,
    recommendations: recommendations.slice(0, 5)
  }
}

// Generate reasons for crop recommendation
function generateCropReasons(crop, inputData) {
  const reasons = []
  
  if (crop === 'Rice') {
    if (inputData.soil_moisture >= 60) reasons.push("High soil moisture suitable for rice")
    if (inputData.avg_temperature >= 25) reasons.push("Warm temperature ideal for rice growth")
    if (inputData.rainfall >= 5) reasons.push("Adequate rainfall for rice cultivation")
  } else if (crop === 'Wheat') {
    if (inputData.soil_ph >= 6.5) reasons.push("Optimal soil pH for wheat")
    if (inputData.avg_temperature >= 15 && inputData.avg_temperature <= 25) reasons.push("Cool temperature suitable for wheat")
    if (inputData.soil_nitrogen >= 60) reasons.push("Good nitrogen levels for wheat")
  } else if (crop === 'Maize') {
    if (inputData.soil_ph >= 6.0) reasons.push("Good soil pH for maize")
    if (inputData.avg_temperature >= 20) reasons.push("Warm temperature suitable for maize")
    if (inputData.rainfall >= 3) reasons.push("Adequate rainfall for maize")
  }
  
  if (reasons.length === 0) {
    reasons.push(`Suitable for ${inputData.state} conditions`)
  }
  
  return reasons
}

// Mock comprehensive analysis (fallback)
function generateMockComprehensiveAnalysis(inputData) {
  const yieldResult = generateMockYieldPrediction(inputData)
  const cropResult = generateMockCropRecommendation(inputData)
  
  return {
    success: true,
    yield_prediction: yieldResult.predictions,
    crop_recommendations: cropResult.recommendations,
    input_conditions: inputData,
    analysis_summary: `Predicted yield: ${yieldResult.predictions.ensemble_yield.toFixed(2)} tons/hectare. Top recommended crop: ${cropResult.recommendations[0]?.crop} with ${cropResult.recommendations[0]?.confidence} confidence.`
  }
}

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    route: 'ml-predict',
    description: 'ML Model Prediction API',
    endpoints: {
      'POST /api/ml-predict': {
        description: 'Run ML predictions',
        body: {
          type: 'yield_prediction | crop_recommendation | comprehensive_analysis',
          inputData: {
            state: 'string',
            soil_ph: 'number (5.0-8.5)',
            soil_moisture: 'number (20-90)',
            soil_nitrogen: 'number (20-100)',
            soil_phosphorus: 'number (15-80)',
            soil_potassium: 'number (50-250)',
            avg_temperature: 'number (15-45)',
            humidity: 'number (30-95)',
            rainfall: 'number (0-20)'
          }
        }
      }
    }
  })
}
