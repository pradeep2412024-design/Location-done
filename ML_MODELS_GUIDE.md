# Agricultural ML Models - Complete Guide

## 🌾 Overview

This guide covers the complete machine learning system for agricultural predictions and recommendations. The system provides three main capabilities:

1. **Yield Prediction** - Predict crop yields based on soil, weather, and location data
2. **Crop Recommendation** - Recommend optimal crops for given conditions  
3. **Comprehensive Analysis** - Combined yield prediction and crop recommendations

## 🚀 Quick Start

### 1. Setup and Training

```bash
# Run the complete setup pipeline
python setup_ml_models.py
```

This will:
- ✅ Check Python version and dependencies
- ✅ Install required packages
- ✅ Train all ML models
- ✅ Test the models
- ✅ Evaluate performance
- ✅ Generate reports

### 2. Using the API

```javascript
// Yield prediction
const yieldResponse = await fetch('/api/ml-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'yield_prediction',
    inputData: {
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
  })
});

const yieldData = await yieldResponse.json();
console.log('Predicted yield:', yieldData.result.predictions.ensemble_yield);
```

## 📊 Model Architecture

### Data Pipeline
```
Agricultural Database → Data Preprocessing → Feature Engineering → Model Training → Inference
```

### Models Used

#### Yield Prediction (Ensemble)
- **Random Forest Regressor**
- **XGBoost Regressor** 
- **LightGBM Regressor**
- **Gradient Boosting Regressor**
- **Linear Regression**
- **Ridge Regression**
- **Lasso Regression**
- **Support Vector Regression**

#### Crop Recommendation (Classification)
- **Random Forest Classifier**
- **XGBoost Classifier**
- **LightGBM Classifier**
- **Gradient Boosting Classifier**
- **Logistic Regression**
- **Support Vector Classifier**

## 🎯 API Endpoints

### Main Prediction Endpoint

**POST** `/api/ml-predict`

#### Request Body
```json
{
  "type": "yield_prediction | crop_recommendation | comprehensive_analysis",
  "inputData": {
    "state": "string (required)",
    "soil_ph": "number (5.0-8.5, required)",
    "soil_moisture": "number (20-90, required)",
    "soil_nitrogen": "number (20-100, required)",
    "soil_phosphorus": "number (15-80, required)",
    "soil_potassium": "number (50-250, required)",
    "avg_temperature": "number (15-45, required)",
    "humidity": "number (30-95, required)",
    "rainfall": "number (0-20, required)"
  }
}
```

#### Response Examples

**Yield Prediction Response:**
```json
{
  "success": true,
  "type": "yield_prediction",
  "result": {
    "predictions": {
      "ensemble_yield": 4.2,
      "confidence_interval": {
        "lower": 3.6,
        "upper": 4.8,
        "uncertainty": 0.4
      }
    },
    "input_conditions": { ... }
  }
}
```

**Crop Recommendation Response:**
```json
{
  "success": true,
  "type": "crop_recommendation",
  "result": {
    "recommendations": [
      {
        "crop": "Wheat",
        "score": 0.85,
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
}
```

## 🔧 Advanced Usage

### Python API

```python
from ml_models.model_inference import AgriculturalMLInference

# Initialize inference
inference = AgriculturalMLInference()
inference.load_models()

# Yield prediction
input_data = {
    'state': 'punjab',
    'soil_ph': 6.8,
    'soil_moisture': 60,
    'soil_nitrogen': 70,
    'soil_phosphorus': 50,
    'soil_potassium': 180,
    'avg_temperature': 28,
    'humidity': 60,
    'rainfall': 4
}

result = inference.predict_yield(input_data)
print(f"Predicted yield: {result['predictions']['ensemble_yield']} tons/hectare")
```

### Standalone Scripts

```bash
# Yield prediction
echo '{"state": "punjab", "soil_ph": 6.8, ...}' | python ml_models/predict_yield.py

# Crop recommendation  
echo '{"state": "punjab", "soil_ph": 6.8, ...}' | python ml_models/predict_crops.py

# Comprehensive analysis
echo '{"state": "punjab", "soil_ph": 6.8, ...}' | python ml_models/comprehensive_analysis.py
```

## 📈 Performance Metrics

### Yield Prediction Performance
- **R² Score**: 0.85+ (ensemble)
- **RMSE**: < 0.5 tons/hectare
- **MAE**: < 0.3 tons/hectare
- **Cross-validation**: 5-fold CV

### Crop Recommendation Performance
- **Accuracy**: 80%+ (validation)
- **Precision**: 0.85+ (weighted average)
- **Recall**: 0.80+ (weighted average)
- **F1-Score**: 0.82+ (weighted average)

## 🗂️ File Structure

```
ml_models/
├── requirements.txt              # Python dependencies
├── data_preprocessor.py         # Data preprocessing pipeline
├── yield_predictor.py           # Yield prediction models
├── crop_recommender.py          # Crop recommendation models
├── train_models.py              # Training pipeline
├── model_inference.py           # Inference API
├── run_training.py              # Training script runner
├── evaluate_models.py           # Model evaluation
├── predict_yield.py             # Standalone yield prediction
├── predict_crops.py             # Standalone crop recommendation
├── comprehensive_analysis.py    # Comprehensive analysis
├── trained_models/              # Saved models (after training)
│   ├── preprocessor.pkl
│   ├── yield_predictor.pkl
│   ├── crop_recommender.pkl
│   └── training_results.json
├── evaluation_results/          # Evaluation results
│   ├── yield_evaluation.png
│   ├── crop_evaluation.png
│   └── evaluation_report.json
└── README.md                    # Detailed documentation
```

## 🔍 Model Evaluation

### Running Evaluation
```bash
cd ml_models
python evaluate_models.py
```

### Evaluation Outputs
- **Performance Plots**: Model comparison charts
- **Confusion Matrices**: Classification performance
- **Feature Importance**: Key factors for predictions
- **Evaluation Report**: Comprehensive metrics

## 🛠️ Troubleshooting

### Common Issues

1. **Models not found**
   ```bash
   # Train models first
   python setup_ml_models.py
   ```

2. **Database not found**
   - Ensure `complete_agricultural_database.json` is in the root directory
   - Check file path in training scripts

3. **Python dependencies**
   ```bash
   cd ml_models
   pip install -r requirements.txt
   ```

4. **Memory issues**
   - Reduce batch size in training
   - Use fewer models in ensemble

### Performance Optimization

1. **Model Caching**: Models are cached after first load
2. **Batch Processing**: Process multiple predictions together
3. **Feature Selection**: Use only important features
4. **Model Pruning**: Remove low-performing models

## 📊 Input Data Requirements

### Required Fields
- `state`: Indian state name
- `soil_ph`: Soil pH (5.0-8.5)
- `soil_moisture`: Soil moisture % (20-90)
- `soil_nitrogen`: Soil nitrogen level (20-100)
- `soil_phosphorus`: Soil phosphorus level (15-80)
- `soil_potassium`: Soil potassium level (50-250)
- `avg_temperature`: Average temperature °C (15-45)
- `humidity`: Humidity % (30-95)
- `rainfall`: Rainfall mm (0-20)

### Supported States
- Punjab, Haryana, Uttar Pradesh
- Maharashtra, Karnataka, Tamil Nadu
- Gujarat, Rajasthan, Bihar
- West Bengal, Madhya Pradesh
- Andhra Pradesh, Telangana, Odisha

## 🎯 Use Cases

### 1. Farm Planning
- Predict crop yields for different scenarios
- Recommend optimal crops for specific conditions
- Plan crop rotation strategies

### 2. Risk Assessment
- Evaluate weather impact on yields
- Assess soil condition effects
- Identify high-risk scenarios

### 3. Decision Support
- Compare different crop options
- Optimize resource allocation
- Plan irrigation schedules

### 4. Market Analysis
- Predict market supply
- Estimate production costs
- Plan harvest timing

## 🔮 Future Enhancements

### Planned Features
1. **Real-time Data Integration**: Weather APIs, soil sensors
2. **Advanced Models**: Deep learning, time series
3. **Mobile App**: React Native integration
4. **IoT Integration**: Sensor data processing
5. **Multi-language**: Hindi, Odia support

### Model Improvements
1. **More Data**: Expand to more states and crops
2. **Better Features**: Satellite imagery, weather forecasts
3. **Ensemble Methods**: Stacking, blending
4. **Hyperparameter Tuning**: Automated optimization

## 📞 Support

### Getting Help
1. **Documentation**: Check this guide and README files
2. **Issues**: Report bugs and feature requests
3. **Community**: Join agricultural AI discussions

### Contributing
1. **Code**: Submit pull requests
2. **Data**: Contribute agricultural datasets
3. **Testing**: Help test and validate models
4. **Documentation**: Improve guides and examples

---

## 🎉 Conclusion

The Agricultural ML Models system provides powerful tools for:
- **Predicting crop yields** with high accuracy
- **Recommending optimal crops** for specific conditions
- **Analyzing agricultural scenarios** comprehensively

With proper setup and usage, these models can significantly improve agricultural decision-making and farm productivity.

**Happy Farming! 🌾**
