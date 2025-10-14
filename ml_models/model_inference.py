"""
Model Inference API
Provides easy-to-use interface for making predictions with trained models
"""

import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from data_preprocessor import AgriculturalDataPreprocessor
from yield_predictor import CropYieldPredictor
from crop_recommender import CropRecommender
import warnings
warnings.filterwarnings('ignore')

class AgriculturalMLInference:
    def __init__(self, models_dir: str = "trained_models"):
        self.models_dir = models_dir
        self.preprocessor = None
        self.yield_predictor = None
        self.crop_recommender = None
        self.is_loaded = False
        
    def load_models(self):
        """Load all trained models"""
        try:
            # Load preprocessor
            preprocessor_path = os.path.join(self.models_dir, "preprocessor.pkl")
            if os.path.exists(preprocessor_path):
                self.preprocessor = AgriculturalDataPreprocessor()
                self.preprocessor.load_preprocessor(preprocessor_path)
                print("✅ Preprocessor loaded successfully")
            else:
                print("❌ Preprocessor not found")
                return False
            
            # Load yield predictor
            yield_model_path = os.path.join(self.models_dir, "yield_predictor.pkl")
            if os.path.exists(yield_model_path):
                self.yield_predictor = CropYieldPredictor()
                self.yield_predictor.load_model(yield_model_path)
                print("✅ Yield predictor loaded successfully")
            else:
                print("❌ Yield predictor not found")
                return False
            
            # Load crop recommender
            crop_model_path = os.path.join(self.models_dir, "crop_recommender.pkl")
            if os.path.exists(crop_model_path):
                self.crop_recommender = CropRecommender()
                self.crop_recommender.load_model(crop_model_path)
                print("✅ Crop recommender loaded successfully")
            else:
                print("❌ Crop recommender not found")
                return False
            
            self.is_loaded = True
            print("🎉 All models loaded successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False
    
    def predict_yield(self, input_data: Dict) -> Dict:
        """Predict crop yield for given conditions"""
        if not self.is_loaded:
            return {"error": "Models not loaded"}
        
        try:
            # Create input DataFrame
            input_df = self._create_input_dataframe(input_data)
            
            # Scale features
            X_scaled = self.preprocessor.scaler.transform(input_df)
            X_scaled = pd.DataFrame(X_scaled, columns=input_df.columns, index=input_df.index)
            
            # Get predictions
            predictions = self.yield_predictor.predict_yield(X_scaled)
            
            # Get confidence intervals
            confidence_pred = self.yield_predictor.predict_with_confidence(input_df)
            
            return {
                "success": True,
                "predictions": {
                    "ensemble_yield": float(predictions.get('ensemble', [0])[0]),
                    "individual_models": {k: float(v[0]) for k, v in predictions.items() if k != 'ensemble'},
                    "confidence_interval": {
                        "lower": float(confidence_pred['confidence_lower'][0]) if confidence_pred['confidence_lower'] is not None else None,
                        "upper": float(confidence_pred['confidence_upper'][0]) if confidence_pred['confidence_upper'] is not None else None,
                        "uncertainty": float(confidence_pred['uncertainty'][0]) if confidence_pred['uncertainty'] is not None else None
                    }
                },
                "input_conditions": input_data
            }
            
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    def recommend_crops(self, input_data: Dict, top_k: int = 5) -> Dict:
        """Recommend crops for given conditions"""
        if not self.is_loaded:
            return {"error": "Models not loaded"}
        
        try:
            # Create input DataFrame
            input_df = self._create_input_dataframe(input_data)
            
            # Get recommendations
            recommendations = self.crop_recommender.get_crop_recommendations_with_reasons(input_df, top_k)
            
            return {
                "success": True,
                "recommendations": recommendations,
                "input_conditions": input_data
            }
            
        except Exception as e:
            return {"error": f"Recommendation failed: {str(e)}"}
    
    def get_comprehensive_analysis(self, input_data: Dict) -> Dict:
        """Get comprehensive agricultural analysis"""
        if not self.is_loaded:
            return {"error": "Models not loaded"}
        
        try:
            # Get yield prediction
            yield_result = self.predict_yield(input_data)
            
            # Get crop recommendations
            crop_result = self.recommend_crops(input_data, top_k=5)
            
            # Combine results
            analysis = {
                "success": True,
                "yield_prediction": yield_result.get("predictions", {}),
                "crop_recommendations": crop_result.get("recommendations", []),
                "input_conditions": input_data,
                "analysis_summary": self._generate_analysis_summary(yield_result, crop_result)
            }
            
            return analysis
            
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}
    
    def _create_input_dataframe(self, input_data: Dict) -> pd.DataFrame:
        """Create input DataFrame from user input"""
        # Default values
        default_values = {
            'state': 'punjab',
            'crop': 'Rice',
            'district': 'ludhiana',
            'average_yield': 4.0,
            'trend': 'stable',
            'variability': 0.08,
            'district_factor': 1.2,
            'soil_type': 'alluvial',
            'climate_zone': 'north-western-plains',
            'climate_factor': 1.2,
            'soil_health_factor': 1.1,
            'ph_optimal': 6.0,
            'moisture_optimal': 80,
            'temp_optimal': 28,
            'water_requirement': 'High',
            'season': 'kharif',
            'duration_days': 135,
            'seasonal_factor_kharif': 1.2,
            'seasonal_factor_rabi': 1.0,
            'seasonal_factor_zaid': 1.0,
            'soil_ph': 6.8,
            'soil_moisture': 60,
            'soil_nitrogen': 70,
            'soil_phosphorus': 50,
            'soil_potassium': 180,
            'soil_organic_matter': 3.0,
            'avg_temperature': 28,
            'humidity': 60,
            'rainfall': 4,
            'wind_speed': 8
        }
        
        # Merge user input with defaults
        merged_data = {**default_values, **input_data}
        
        # Create DataFrame
        df = pd.DataFrame([merged_data])
        
        # Encode categorical variables if encoders are available
        if hasattr(self.preprocessor, 'label_encoders'):
            for col, encoder in self.preprocessor.label_encoders.items():
                if col in df.columns:
                    try:
                        df[f'{col}_encoded'] = encoder.transform(df[col].astype(str))
                    except:
                        # If encoding fails, use a default value
                        df[f'{col}_encoded'] = 0
        
        # Select only the features used in training
        if hasattr(self.preprocessor, 'feature_columns'):
            available_features = [col for col in self.preprocessor.feature_columns if col in df.columns]
            df = df[available_features]
        
        return df
    
    def _generate_analysis_summary(self, yield_result: Dict, crop_result: Dict) -> str:
        """Generate human-readable analysis summary"""
        summary_parts = []
        
        # Yield prediction summary
        if yield_result.get("success"):
            yield_pred = yield_result.get("predictions", {}).get("ensemble_yield", 0)
            summary_parts.append(f"Predicted yield: {yield_pred:.2f} tons/hectare")
        
        # Crop recommendations summary
        if crop_result.get("success"):
            recommendations = crop_result.get("recommendations", [])
            if recommendations:
                top_crop = recommendations[0]
                summary_parts.append(f"Top recommended crop: {top_crop['crop']} (Score: {top_crop['score']:.3f})")
        
        return ". ".join(summary_parts) + "."
    
    def get_feature_importance(self) -> Dict:
        """Get feature importance from trained models"""
        if not self.is_loaded:
            return {"error": "Models not loaded"}
        
        try:
            yield_importance = self.yield_predictor.get_feature_importance()
            
            return {
                "success": True,
                "yield_prediction_importance": yield_importance
            }
            
        except Exception as e:
            return {"error": f"Failed to get feature importance: {str(e)}"}
    
    def validate_input(self, input_data: Dict) -> Dict:
        """Validate input data for predictions"""
        required_fields = [
            'state', 'soil_ph', 'soil_moisture', 'soil_nitrogen', 
            'soil_phosphorus', 'soil_potassium', 'avg_temperature', 
            'humidity', 'rainfall'
        ]
        
        missing_fields = [field for field in required_fields if field not in input_data]
        
        if missing_fields:
            return {
                "valid": False,
                "missing_fields": missing_fields,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }
        
        # Validate ranges
        validations = {
            'soil_ph': (5.0, 8.5),
            'soil_moisture': (20, 90),
            'soil_nitrogen': (20, 100),
            'soil_phosphorus': (15, 80),
            'soil_potassium': (50, 250),
            'avg_temperature': (15, 45),
            'humidity': (30, 95),
            'rainfall': (0, 20)
        }
        
        out_of_range = []
        for field, (min_val, max_val) in validations.items():
            if field in input_data:
                value = input_data[field]
                if not (min_val <= value <= max_val):
                    out_of_range.append(f"{field}: {value} (expected {min_val}-{max_val})")
        
        if out_of_range:
            return {
                "valid": False,
                "out_of_range": out_of_range,
                "message": f"Values out of range: {', '.join(out_of_range)}"
            }
        
        return {"valid": True, "message": "Input data is valid"}

# Example usage and testing
def test_inference():
    """Test the inference API"""
    # Initialize inference
    inference = AgriculturalMLInference()
    
    # Load models
    if not inference.load_models():
        print("Failed to load models")
        return
    
    # Test input data
    test_input = {
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
    
    # Validate input
    validation = inference.validate_input(test_input)
    print("Input validation:", validation)
    
    if validation["valid"]:
        # Get yield prediction
        yield_result = inference.predict_yield(test_input)
        print("Yield prediction:", yield_result)
        
        # Get crop recommendations
        crop_result = inference.recommend_crops(test_input)
        print("Crop recommendations:", crop_result)
        
        # Get comprehensive analysis
        analysis = inference.get_comprehensive_analysis(test_input)
        print("Comprehensive analysis:", analysis)

if __name__ == "__main__":
    test_inference()
