// Test script for ML API
const testMLAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // Test data
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

  console.log('🧪 Testing ML API...');
  console.log('Test data:', testData);

  try {
    // Test yield prediction
    console.log('\n📊 Testing yield prediction...');
    const yieldResponse = await fetch(`${baseUrl}/api/ml-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'yield_prediction',
        inputData: testData
      })
    });

    if (yieldResponse.ok) {
      const yieldData = await yieldResponse.json();
      console.log('✅ Yield prediction successful!');
      console.log('Predicted yield:', yieldData.result.predictions.ensemble_yield, 'tons/hectare');
      console.log('Confidence interval:', yieldData.result.predictions.confidence_interval);
    } else {
      console.log('❌ Yield prediction failed:', yieldResponse.status);
    }

    // Test crop recommendation
    console.log('\n🌱 Testing crop recommendation...');
    const cropResponse = await fetch(`${baseUrl}/api/ml-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'crop_recommendation',
        inputData: testData
      })
    });

    if (cropResponse.ok) {
      const cropData = await cropResponse.json();
      console.log('✅ Crop recommendation successful!');
      console.log('Top recommendations:');
      cropData.result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.crop} (Score: ${rec.score}, Confidence: ${rec.confidence})`);
      });
    } else {
      console.log('❌ Crop recommendation failed:', cropResponse.status);
    }

    // Test comprehensive analysis
    console.log('\n🔍 Testing comprehensive analysis...');
    const analysisResponse = await fetch(`${baseUrl}/api/ml-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'comprehensive_analysis',
        inputData: testData
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Comprehensive analysis successful!');
      console.log('Analysis summary:', analysisData.result.analysis_summary);
    } else {
      console.log('❌ Comprehensive analysis failed:', analysisResponse.status);
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

// Run the test
testMLAPI();
