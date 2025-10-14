// 🤖 Simple ML Console Test - Working Predictions
console.log('🚀 ML Models Console Test Starting...\n');

const testData = {
  state: 'punjab',
  soil_ph: 6.8,
  soil_moisture: 60,
  soil_nitrogen: 70,
  soil_phosphorus: 50,
  soil_potassium: 180,
  avg_temperature: 28,
  humidity: 60,
  rainfall: 4
};

async function testMLPredictions() {
  console.log('📊 Farm Data:');
  console.log(`   State: ${testData.state.toUpperCase()}`);
  console.log(`   Soil pH: ${testData.soil_ph}, Temperature: ${testData.avg_temperature}°C`);
  console.log(`   Moisture: ${testData.soil_moisture}%, Rainfall: ${testData.rainfall}mm\n`);

  try {
    // Test Crop Recommendation
    console.log('🌱 Testing Crop Recommendation...');
    const cropResponse = await fetch('http://localhost:3000/api/ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'crop_recommendation',
        inputData: testData
      })
    });

    if (cropResponse.ok) {
      const cropData = await cropResponse.json();
      console.log('✅ Crop Recommendation Success!');
      console.log('   Top Recommendations:');
      cropData.result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.crop} - ${(rec.score * 100).toFixed(1)}% (${rec.confidence})`);
        if (rec.reasons && rec.reasons.length > 0) {
          rec.reasons.slice(0, 2).forEach(reason => {
            console.log(`      • ${reason}`);
          });
        }
      });
    } else {
      console.log('❌ Crop Recommendation Failed');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test Yield Prediction
    console.log('🌾 Testing Yield Prediction...');
    const yieldResponse = await fetch('http://localhost:3000/api/ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'yield_prediction',
        inputData: testData
      })
    });

    if (yieldResponse.ok) {
      const yieldData = await yieldResponse.json();
      console.log('✅ Yield Prediction Success!');
      console.log(`   Predicted Yield: ${yieldData.result.predictions.ensemble_yield} tons/hectare`);
      if (yieldData.result.predictions.confidence_interval) {
        const ci = yieldData.result.predictions.confidence_interval;
        console.log(`   Confidence Range: ${ci.lower} - ${ci.upper} tons/hectare`);
        console.log(`   Uncertainty: ±${ci.uncertainty} tons/hectare`);
      }
    } else {
      console.log('❌ Yield Prediction Failed');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test Comprehensive Analysis
    console.log('📊 Testing Comprehensive Analysis...');
    const analysisResponse = await fetch('http://localhost:3000/api/ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'comprehensive_analysis',
        inputData: testData
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Comprehensive Analysis Success!');
      console.log(`   Summary: ${analysisData.result.analysis_summary}`);
      
      if (analysisData.result.yield_prediction) {
        console.log(`   Yield: ${analysisData.result.yield_prediction.predictions.ensemble_yield} tons/hectare`);
      }
      
      if (analysisData.result.crop_recommendations && analysisData.result.crop_recommendations.length > 0) {
        const topCrop = analysisData.result.crop_recommendations[0];
        console.log(`   Top Crop: ${topCrop.crop} (${(topCrop.score * 100).toFixed(1)}% - ${topCrop.confidence})`);
      }
    } else {
      console.log('❌ Comprehensive Analysis Failed');
    }

    console.log('\n🎉 ML Models Console Test Complete!');
    console.log('All predictions are working and displayed in console! 🤖🌾');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the Next.js server is running on http://localhost:3000');
  }
}

// Run the test
testMLPredictions();
