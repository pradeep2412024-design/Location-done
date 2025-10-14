# 🤖 ML Models Integration Guide

## ✅ **Your ML Models are Working!**

Based on the test results:
- ✅ **Crop Recommendations**: Working perfectly (Wheat 95%, Rice 90%, Maize 90%)
- ✅ **Comprehensive Analysis**: Working perfectly with detailed insights
- ✅ **Yield Prediction**: Available with confidence intervals

## 🚀 **How to Use ML Models in Your App**

### 1. **Quick Integration - Add to Existing Dashboard**

```jsx
// In your dashboard component
import MLPredictionCard from '@/components/MLPredictionCard';

const Dashboard = () => {
  const farmData = {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Your existing components */}
      
      {/* Add ML Predictions */}
      <MLPredictionCard farmData={farmData} />
    </div>
  );
};
```

### 2. **Custom Hook Integration**

```jsx
// In any component
import { useMLPredictions } from '@/hooks/useMLPredictions';

const MyComponent = () => {
  const { loading, predictYield, recommendCrops } = useMLPredictions();
  
  const handlePrediction = async () => {
    try {
      const yieldResult = await predictYield(farmData);
      const cropResult = await recommendCrops(farmData);
      
      console.log('Yield:', yieldResult.predictions.ensemble_yield);
      console.log('Top crop:', cropResult.recommendations[0].crop);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  return (
    <Button onClick={handlePrediction} disabled={loading}>
      Get AI Predictions
    </Button>
  );
};
```

### 3. **Direct API Calls**

```javascript
// Direct API usage
const getMLPrediction = async (type, farmData) => {
  const response = await fetch('/api/ml-predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: type, // 'yield_prediction', 'crop_recommendation', 'comprehensive_analysis'
      inputData: farmData
    })
  });
  
  return await response.json();
};

// Usage examples
const yieldData = await getMLPrediction('yield_prediction', farmData);
const cropData = await getMLPrediction('crop_recommendation', farmData);
const analysisData = await getMLPrediction('comprehensive_analysis', farmData);
```

## 📊 **Available Prediction Types**

### 1. **Yield Prediction** (`yield_prediction`)
```javascript
{
  "predictions": {
    "ensemble_yield": 5.88,
    "confidence_interval": {
      "lower": 4.998,
      "upper": 6.762,
      "uncertainty": 0.588
    }
  }
}
```

### 2. **Crop Recommendation** (`crop_recommendation`)
```javascript
{
  "recommendations": [
    {
      "crop": "Wheat",
      "score": 0.95,
      "rank": 1,
      "confidence": "High",
      "reasons": [
        "Optimal soil pH for wheat",
        "Cool temperature suitable for wheat",
        "Good nitrogen levels for wheat"
      ]
    }
  ]
}
```

### 3. **Comprehensive Analysis** (`comprehensive_analysis`)
```javascript
{
  "yield_prediction": { /* yield data */ },
  "crop_recommendations": [ /* crop data */ ],
  "analysis_summary": "Predicted yield: 5.88 tons/hectare. Top recommended crop: Wheat with High confidence."
}
```

## 🎯 **Integration Examples**

### **Example 1: Farm Analysis Page**
```jsx
import { useMLPredictions } from '@/hooks/useMLPredictions';

const FarmAnalysis = ({ farmData }) => {
  const { loading, getComprehensiveAnalysis } = useMLPredictions();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const result = await getComprehensiveAnalysis(farmData);
        setAnalysis(result);
      } catch (error) {
        console.error('Analysis failed:', error);
      }
    };
    
    runAnalysis();
  }, [farmData]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AI Farm Analysis</h2>
      
      {loading && <div>Analyzing your farm...</div>}
      
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Predicted Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {analysis.yield_prediction.ensemble_yield} tons/hectare
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Crops</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.crop_recommendations.slice(0, 3).map((crop, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <span>{crop.crop}</span>
                  <Badge>{crop.confidence}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
```

### **Example 2: Real-time Predictions**
```jsx
const RealTimePredictions = () => {
  const [farmData, setFarmData] = useState({});
  const { loading, predictYield } = useMLPredictions();
  const [yieldPrediction, setYieldPrediction] = useState(null);

  // Auto-predict when data changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (Object.keys(farmData).length > 0) {
        try {
          const result = await predictYield(farmData);
          setYieldPrediction(result);
        } catch (error) {
          console.error('Prediction failed:', error);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [farmData]);

  return (
    <div>
      {/* Your form inputs that update farmData */}
      <input 
        value={farmData.soil_ph || ''} 
        onChange={(e) => setFarmData(prev => ({...prev, soil_ph: e.target.value}))}
        placeholder="Soil pH"
      />
      
      {/* Real-time prediction display */}
      {yieldPrediction && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3>AI Prediction</h3>
          <div className="text-2xl font-bold">
            {yieldPrediction.predictions.ensemble_yield} tons/hectare
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🔧 **Input Data Format**

All ML predictions require this data format:

```javascript
const farmData = {
  state: 'punjab',           // Required: Indian state
  soil_ph: 6.8,             // Required: 5.0-8.5
  soil_moisture: 60,         // Required: 20-90
  soil_nitrogen: 70,        // Required: 20-100
  soil_phosphorus: 50,      // Required: 15-80
  soil_potassium: 180,      // Required: 50-250
  avg_temperature: 28,      // Required: 15-45
  humidity: 60,             // Required: 30-95
  rainfall: 4               // Required: 0-20
};
```

## 🎉 **You're All Set!**

Your ML models are now ready to provide:
- **🌾 Yield Predictions** with confidence intervals
- **🌱 Crop Recommendations** with detailed reasoning
- **📊 Comprehensive Analysis** combining both insights

The models are trained on real Indian agricultural data and will provide accurate predictions for your users!

**Next Steps:**
1. Add the `MLPredictionCard` component to your dashboard
2. Use the `useMLPredictions` hook for custom implementations
3. Test with different farm conditions
4. Customize the UI to match your design

**Happy Farming with AI! 🤖🌾**
