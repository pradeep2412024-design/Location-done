// Test ML Integration
const testMLIntegration = async () => {
  console.log('🧪 Testing ML Integration...\n');

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

  try {
    // Test 1: Yield Prediction
    console.log('📊 Testing Yield Prediction...');
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
      console.log(`   Confidence: ${yieldData.result.predictions.confidence_interval?.lower} - ${yieldData.result.predictions.confidence_interval?.upper} tons/hectare\n`);
    } else {
      console.log('❌ Yield Prediction Failed:', yieldResponse.status);
    }

    // Test 2: Crop Recommendation
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
        console.log(`   ${index + 1}. ${rec.crop} (${(rec.score * 100).toFixed(1)}% - ${rec.confidence})`);
      });
      console.log('');
    } else {
      console.log('❌ Crop Recommendation Failed:', cropResponse.status);
    }

    // Test 3: Comprehensive Analysis
    console.log('🔍 Testing Comprehensive Analysis...');
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
      console.log(`   Summary: ${analysisData.result.analysis_summary}\n`);
    } else {
      console.log('❌ Comprehensive Analysis Failed:', analysisResponse.status);
    }

    console.log('🎉 All ML API tests completed successfully!');
    console.log('\n📋 Integration Examples:');
    console.log('1. Use the MLPredictionCard component in your dashboard');
    console.log('2. Use the useMLPredictions hook for custom implementations');
    console.log('3. Call the API directly: POST /api/ml-predict');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the Next.js server is running (npm run dev)');
    console.log('2. Check that the ML API endpoint is accessible');
    console.log('3. Verify the input data format is correct');
  }
};

// Run the test
testMLIntegration();
