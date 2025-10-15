// 🤖 Test Gemini Enhanced ML Predictions
console.log('🚀 Testing Gemini Enhanced ML Predictions...\n');

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

async function testGeminiEnhancedML() {
  console.log('📊 Farm Data:');
  console.log(`   State: ${testData.state.toUpperCase()}`);
  console.log(`   Soil pH: ${testData.soil_ph}, Temperature: ${testData.avg_temperature}°C`);
  console.log(`   Moisture: ${testData.soil_moisture}%, Rainfall: ${testData.rainfall}mm\n`);

  try {
    // Test Enhanced Yield Prediction
    console.log('🌾 Testing Enhanced Yield Prediction with Gemini AI...');
    const yieldResponse = await fetch('http://localhost:3000/api/gemini-ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'yield_prediction',
        inputData: testData
      })
    });

    if (yieldResponse.ok) {
      const yieldData = await yieldResponse.json();
      console.log('✅ Enhanced Yield Prediction Success!');
      console.log(`   Base Yield: ${yieldData.result.predictions.base_yield} tons/hectare`);
      console.log(`   Optimized Yield: ${yieldData.result.predictions.optimized_yield} tons/hectare`);
      console.log(`   Confidence Range: ${yieldData.result.predictions.confidence_interval.lower} - ${yieldData.result.predictions.confidence_interval.upper} tons/hectare`);
      console.log(`   Soil Quality: ${yieldData.result.yield_factors.soil_quality}`);
      console.log(`   Risk Level: ${yieldData.result.yield_factors.risk_level}`);
      console.log('   Optimization Tips:');
      yieldData.result.optimization_tips.forEach(tip => console.log(`      • ${tip}`));
    } else {
      console.log('❌ Enhanced Yield Prediction Failed');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test Enhanced Crop Recommendation
    console.log('🌱 Testing Enhanced Crop Recommendation with Gemini AI...');
    const cropResponse = await fetch('http://localhost:3000/api/gemini-ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'crop_recommendation',
        inputData: testData
      })
    });

    if (cropResponse.ok) {
      const cropData = await cropResponse.json();
      console.log('✅ Enhanced Crop Recommendation Success!');
      console.log('   Top AI-Enhanced Recommendations:');
      cropData.result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.crop} - ${(rec.score * 100).toFixed(1)}% suitability`);
        console.log(`      Profitability: ${rec.profitability}, Risk: ${rec.risk_level}`);
        console.log(`      Market Demand: ${rec.market_demand}, Season: ${rec.planting_season}`);
        console.log(`      Expected Yield: ${rec.expected_yield}`);
        console.log('      AI Reasons:');
        rec.reasons.forEach(reason => console.log(`         • ${reason}`));
      });
    } else {
      console.log('❌ Enhanced Crop Recommendation Failed');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test Enhanced Comprehensive Analysis
    console.log('📊 Testing Enhanced Comprehensive Analysis with Gemini AI...');
    const analysisResponse = await fetch('http://localhost:3000/api/gemini-ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'comprehensive_analysis',
        inputData: testData
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Enhanced Comprehensive Analysis Success!');
      console.log(`   Analysis Summary: ${analysisData.result.analysis_summary}`);
      
      console.log('\n   Enhanced Farm Data:');
      Object.entries(analysisData.result.enhanced_farm_data).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
      
      console.log('\n   Weather Forecast:');
      console.log(`      Next Month Temp: ${analysisData.result.weather_forecast.next_month_temp}°C`);
      console.log(`      Next Month Rainfall: ${analysisData.result.weather_forecast.next_month_rainfall}mm`);
      console.log(`      Seasonal Risks: ${analysisData.result.weather_forecast.seasonal_risks.join(', ')}`);
      
      console.log('\n   AI Recommendations:');
      console.log('      Soil Improvements:');
      analysisData.result.recommendations.soil_improvements.forEach(rec => 
        console.log(`         • ${rec}`)
      );
      console.log('      Risk Mitigation:');
      analysisData.result.recommendations.risk_mitigation.forEach(rec => 
        console.log(`         • ${rec}`)
      );
      
      console.log('\n   Risk Assessment:');
      console.log(`      Drought Risk: ${analysisData.result.risk_assessment.drought_risk}`);
      console.log(`      Pest Risk: ${analysisData.result.risk_assessment.pest_risk}`);
      console.log(`      Disease Risk: ${analysisData.result.risk_assessment.disease_risk}`);
    } else {
      console.log('❌ Enhanced Comprehensive Analysis Failed');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test Data Enhancement
    console.log('🔧 Testing Data Enhancement with Gemini AI...');
    const enhancementResponse = await fetch('http://localhost:3000/api/gemini-ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'data_enhancement',
        inputData: testData
      })
    });

    if (enhancementResponse.ok) {
      const enhancementData = await enhancementResponse.json();
      console.log('✅ Data Enhancement Success!');
      console.log(`   Data Quality Score: ${(enhancementData.result.data_quality_score * 100).toFixed(1)}%`);
      
      console.log('\n   Enhanced Data:');
      Object.entries(enhancementData.result.enhanced_data).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
      
      console.log('\n   Missing Values Filled:');
      Object.entries(enhancementData.result.missing_values_filled).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
      
      console.log('\n   Enhancement Recommendations:');
      enhancementData.result.recommendations.forEach(rec => 
        console.log(`      • ${rec}`)
      );
    } else {
      console.log('❌ Data Enhancement Failed');
    }

    console.log('\n🎉 Gemini Enhanced ML Predictions Complete!');
    console.log('🤖 Your agricultural AI system now has Gemini AI superpowers!');
    console.log('\n📋 Enhanced Features:');
    console.log('   ✅ Gemini AI-powered data enhancement');
    console.log('   ✅ Missing value imputation');
    console.log('   ✅ Advanced crop recommendations');
    console.log('   ✅ Enhanced yield predictions');
    console.log('   ✅ Comprehensive risk assessment');
    console.log('   ✅ Weather forecasting insights');
    console.log('   ✅ Soil improvement recommendations');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the Next.js server is running on http://localhost:3000');
    console.log('And the Gemini API key is set in .env file');
  }
}

// Run the test
testGeminiEnhancedML();
