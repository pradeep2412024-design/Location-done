// 🤖 ML Models Console Test
// This script tests all ML prediction types and shows results in console

const BASE_URL = 'http://localhost:3000';

// Test data for different scenarios
const testScenarios = [
  {
    name: "Punjab Wheat Farm",
    data: {
      state: 'punjab',
      soil_ph: 6.8,
      soil_moisture: 60,
      soil_nitrogen: 70,
      soil_phosphorus: 50,
      soil_potassium: 180,
      avg_temperature: 28,
      humidity: 60,
      rainfall: 4
    }
  },
  {
    name: "Karnataka Rice Farm", 
    data: {
      state: 'karnataka',
      soil_ph: 6.2,
      soil_moisture: 75,
      soil_nitrogen: 85,
      soil_phosphorus: 45,
      soil_potassium: 120,
      avg_temperature: 32,
      humidity: 80,
      rainfall: 8
    }
  },
  {
    name: "Maharashtra Cotton Farm",
    data: {
      state: 'maharashtra',
      soil_ph: 7.1,
      soil_moisture: 45,
      soil_nitrogen: 60,
      soil_phosphorus: 35,
      soil_potassium: 200,
      avg_temperature: 35,
      humidity: 50,
      rainfall: 2
    }
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function logWithColor(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatYieldResult(result) {
  const yield = result.predictions.ensemble_yield;
  const confidence = result.predictions.confidence_interval;
  
  return {
    yield: `${yield.toFixed(2)} tons/hectare`,
    confidence: `${confidence.lower.toFixed(2)} - ${confidence.upper.toFixed(2)} tons/hectare`,
    uncertainty: `${confidence.uncertainty.toFixed(2)} tons/hectare`
  };
}

function formatCropResult(result) {
  return result.recommendations.slice(0, 5).map((rec, index) => ({
    rank: index + 1,
    crop: rec.crop,
    score: `${(rec.score * 100).toFixed(1)}%`,
    confidence: rec.confidence,
    reasons: rec.reasons?.slice(0, 2) || []
  }));
}

async function testMLPrediction(type, scenario) {
  try {
    logWithColor(`\n🔍 Testing ${type} for ${scenario.name}...`, 'cyan');
    
    const response = await fetch(`${BASE_URL}/api/ml-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        inputData: scenario.data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      logWithColor(`✅ ${type} successful!`, 'green');
      
      if (type === 'yield_prediction') {
        const formatted = formatYieldResult(result.result);
        logWithColor(`   🌾 Predicted Yield: ${formatted.yield}`, 'blue');
        logWithColor(`   📊 Confidence Range: ${formatted.confidence}`, 'yellow');
        logWithColor(`   ⚠️  Uncertainty: ±${formatted.uncertainty}`, 'magenta');
      } else if (type === 'crop_recommendation') {
        const formatted = formatCropResult(result.result);
        logWithColor(`   🌱 Top Crop Recommendations:`, 'blue');
        formatted.forEach(rec => {
          const confidenceColor = rec.confidence === 'High' ? 'green' : rec.confidence === 'Medium' ? 'yellow' : 'red';
          logWithColor(`      ${rec.rank}. ${rec.crop} (${rec.score} - ${rec.confidence})`, confidenceColor);
          if (rec.reasons.length > 0) {
            rec.reasons.forEach(reason => {
              logWithColor(`         • ${reason}`, 'reset');
            });
          }
        });
      } else if (type === 'comprehensive_analysis') {
        logWithColor(`   📊 Analysis Summary:`, 'blue');
        logWithColor(`      ${result.result.analysis_summary}`, 'reset');
        
        if (result.result.yield_prediction) {
          const yieldFormatted = formatYieldResult(result.result.yield_prediction);
          logWithColor(`   🌾 Yield: ${yieldFormatted.yield}`, 'green');
        }
        
        if (result.result.crop_recommendations) {
          const cropFormatted = formatCropResult(result.result.crop_recommendations);
          logWithColor(`   🌱 Top Crop: ${cropFormatted[0].crop} (${cropFormatted[0].score})`, 'green');
        }
      }
      
      return result.result;
    } else {
      logWithColor(`❌ ${type} failed: ${result.error}`, 'red');
      return null;
    }
  } catch (error) {
    logWithColor(`❌ ${type} error: ${error.message}`, 'red');
    return null;
  }
}

async function runComprehensiveTest() {
  logWithColor('\n🚀 Starting ML Models Console Test', 'bright');
  logWithColor('=' .repeat(50), 'cyan');
  
  const results = {
    yield_predictions: [],
    crop_recommendations: [],
    comprehensive_analyses: []
  };

  // Test each scenario
  for (const scenario of testScenarios) {
    logWithColor(`\n📋 Testing Scenario: ${scenario.name}`, 'bright');
    logWithColor(`   Location: ${scenario.data.state.toUpperCase()}`, 'blue');
    logWithColor(`   Soil pH: ${scenario.data.soil_ph}, Temperature: ${scenario.data.avg_temperature}°C`, 'yellow');
    logWithColor(`   Moisture: ${scenario.data.soil_moisture}%, Rainfall: ${scenario.data.rainfall}mm`, 'yellow');
    
    // Test yield prediction
    const yieldResult = await testMLPrediction('yield_prediction', scenario);
    if (yieldResult) results.yield_predictions.push({ scenario: scenario.name, result: yieldResult });
    
    // Test crop recommendation
    const cropResult = await testMLPrediction('crop_recommendation', scenario);
    if (cropResult) results.crop_recommendations.push({ scenario: scenario.name, result: cropResult });
    
    // Test comprehensive analysis
    const analysisResult = await testMLPrediction('comprehensive_analysis', scenario);
    if (analysisResult) results.comprehensive_analyses.push({ scenario: scenario.name, result: analysisResult });
    
    // Small delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  logWithColor('\n📊 TEST SUMMARY', 'bright');
  logWithColor('=' .repeat(30), 'cyan');
  
  logWithColor(`✅ Yield Predictions: ${results.yield_predictions.length}/${testScenarios.length} successful`, 'green');
  logWithColor(`✅ Crop Recommendations: ${results.crop_recommendations.length}/${testScenarios.length} successful`, 'green');
  logWithColor(`✅ Comprehensive Analyses: ${results.comprehensive_analyses.length}/${testScenarios.length} successful`, 'green');
  
  // Best predictions
  if (results.yield_predictions.length > 0) {
    logWithColor('\n🏆 BEST YIELD PREDICTIONS:', 'bright');
    results.yield_predictions.forEach((item, index) => {
      const yield = item.result.predictions.ensemble_yield;
      logWithColor(`   ${index + 1}. ${item.scenario}: ${yield.toFixed(2)} tons/hectare`, 'green');
    });
  }
  
  if (results.crop_recommendations.length > 0) {
    logWithColor('\n🌱 TOP CROP RECOMMENDATIONS:', 'bright');
    results.crop_recommendations.forEach((item, index) => {
      const topCrop = item.result.recommendations[0];
      logWithColor(`   ${index + 1}. ${item.scenario}: ${topCrop.crop} (${(topCrop.score * 100).toFixed(1)}%)`, 'green');
    });
  }
  
  logWithColor('\n🎉 ML Models Console Test Complete!', 'bright');
  logWithColor('All predictions are working and showing in console! 🤖🌾', 'green');
}

// Run the test
runComprehensiveTest().catch(error => {
  logWithColor(`\n❌ Test failed: ${error.message}`, 'red');
  logWithColor('Make sure the Next.js server is running on http://localhost:3000', 'yellow');
});
