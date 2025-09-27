// Performance testing script for API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'POST', body = null) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        responseTime,
        status: response.status,
        dataSize: JSON.stringify(data).length,
        cached: data.cached || false
      };
    } else {
      return {
        success: false,
        responseTime,
        status: response.status,
        error: await response.text()
      };
    }
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      responseTime: endTime - startTime,
      error: error.message
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting API Performance Tests...\n');
  
  const tests = [
    {
      name: 'Predict API',
      endpoint: '/api/predict',
      body: { location: 'Odisha', month: 'October' }
    },
    {
      name: 'Crop Recommendations API',
      endpoint: '/api/crop-recommendations',
      body: { location: 'Odisha', month: 'October', category: 'Cereals & Grains' }
    },
    {
      name: 'Weather API',
      endpoint: '/api/weather',
      body: { location: 'Odisha', month: 'October' }
    },
    {
      name: 'Soil API',
      endpoint: '/api/soil',
      body: { location: 'Odisha', month: 'October' }
    },
    {
      name: 'Market Analysis API',
      endpoint: '/api/market-analysis',
      body: { crop: 'Rice', location: 'Odisha', state: 'odisha', month: 'October' }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    
    // Run test 3 times to get average
    const testResults = [];
    for (let i = 0; i < 3; i++) {
      const result = await testEndpoint(test.endpoint, 'POST', test.body);
      testResults.push(result);
      console.log(`  Attempt ${i + 1}: ${result.responseTime}ms ${result.success ? '✅' : '❌'}`);
      
      // Wait 1 second between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const avgResponseTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length;
    const successRate = testResults.filter(r => r.success).length / testResults.length;
    
    results.push({
      name: test.name,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100),
      cached: testResults[0].cached || false
    });
    
    console.log(`  Average: ${Math.round(avgResponseTime)}ms, Success Rate: ${Math.round(successRate * 100)}%\n`);
  }

  // Summary
  console.log('📊 Performance Summary:');
  console.log('======================');
  results.forEach(result => {
    const status = result.successRate === 100 ? '✅' : '⚠️';
    const cacheStatus = result.cached ? ' (cached)' : '';
    console.log(`${status} ${result.name}: ${result.avgResponseTime}ms${cacheStatus}`);
  });

  const totalAvg = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
  console.log(`\n🎯 Overall Average Response Time: ${Math.round(totalAvg)}ms`);
  
  // Performance recommendations
  console.log('\n💡 Performance Analysis:');
  if (totalAvg < 1000) {
    console.log('✅ Excellent performance! All APIs are responding quickly.');
  } else if (totalAvg < 3000) {
    console.log('⚠️  Good performance, but some APIs could be faster.');
  } else {
    console.log('❌ Performance needs improvement. Consider more optimizations.');
  }
}

// Run the tests
runPerformanceTests().catch(console.error);
