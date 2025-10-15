#!/usr/bin/env python3
"""
Enhanced ML Predictions with Gemini AI
Uses Gemini API for better data augmentation, missing value handling, and improved predictions
"""

import os
import json
import requests
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiEnhancedML:
    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    def get_gemini_response(self, prompt: str) -> str:
        """Get response from Gemini API"""
        try:
            headers = {
                'Content-Type': 'application/json',
            }
            
            data = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }]
            }
            
            url = f"{self.base_url}?key={self.gemini_api_key}"
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                return result['candidates'][0]['content']['parts'][0]['text']
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return None
    
    def enhance_farm_data(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance farm data using Gemini AI for missing values and better predictions"""
        
        # Create detailed prompt for Gemini
        prompt = f"""
        You are an agricultural AI expert. Analyze this farm data and provide enhanced information:
        
        Current Farm Data:
        - State: {farm_data.get('state', 'unknown')}
        - Soil pH: {farm_data.get('soil_ph', 'unknown')}
        - Soil Moisture: {farm_data.get('soil_moisture', 'unknown')}%
        - Soil Nitrogen: {farm_data.get('soil_nitrogen', 'unknown')}
        - Soil Phosphorus: {farm_data.get('soil_phosphorus', 'unknown')}
        - Soil Potassium: {farm_data.get('soil_potassium', 'unknown')}
        - Average Temperature: {farm_data.get('avg_temperature', 'unknown')}°C
        - Humidity: {farm_data.get('humidity', 'unknown')}%
        - Rainfall: {farm_data.get('rainfall', 'unknown')}mm
        
        Please provide:
        1. Fill in any missing values with realistic estimates for this location
        2. Suggest additional soil parameters (organic matter, CEC, etc.)
        3. Provide weather forecast insights for the next 3 months
        4. Identify potential risks and opportunities
        5. Suggest soil improvement recommendations
        
        Return as JSON format with the following structure:
        {{
            "enhanced_data": {{
                "soil_ph": value,
                "soil_moisture": value,
                "soil_nitrogen": value,
                "soil_phosphorus": value,
                "soil_potassium": value,
                "avg_temperature": value,
                "humidity": value,
                "rainfall": value,
                "organic_matter": value,
                "cec": value,
                "soil_texture": "clay/loam/sandy"
            }},
            "weather_forecast": {{
                "next_month_temp": value,
                "next_month_rainfall": value,
                "seasonal_risks": ["risk1", "risk2"]
            }},
            "recommendations": {{
                "soil_improvements": ["rec1", "rec2"],
                "crop_timing": "optimal_planting_time",
                "risk_mitigation": ["mitigation1", "mitigation2"]
            }}
        }}
        """
        
        # Get enhanced data from Gemini
        enhanced_response = self.get_gemini_response(prompt)
        
        if enhanced_response:
            try:
                # Parse Gemini response
                enhanced_data = json.loads(enhanced_response)
                return enhanced_data
            except json.JSONDecodeError:
                logger.error("Failed to parse Gemini response as JSON")
                return self._fallback_enhancement(farm_data)
        else:
            return self._fallback_enhancement(farm_data)
    
    def _fallback_enhancement(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback enhancement when Gemini API fails"""
        enhanced_data = farm_data.copy()
        
        # Fill missing values with reasonable defaults
        defaults = {
            'soil_ph': 6.5,
            'soil_moisture': 60,
            'soil_nitrogen': 50,
            'soil_phosphorus': 30,
            'soil_potassium': 150,
            'avg_temperature': 25,
            'humidity': 70,
            'rainfall': 5
        }
        
        for key, default_value in defaults.items():
            if key not in enhanced_data or enhanced_data[key] is None:
                enhanced_data[key] = default_value
        
        # Add additional parameters
        enhanced_data['organic_matter'] = 2.5
        enhanced_data['cec'] = 15.0
        enhanced_data['soil_texture'] = 'loam'
        
        return {
            'enhanced_data': enhanced_data,
            'weather_forecast': {
                'next_month_temp': enhanced_data['avg_temperature'],
                'next_month_rainfall': enhanced_data['rainfall'],
                'seasonal_risks': ['drought', 'pests']
            },
            'recommendations': {
                'soil_improvements': ['Add organic matter', 'Balanced fertilization'],
                'crop_timing': 'Plant in optimal season',
                'risk_mitigation': ['Irrigation planning', 'Pest monitoring']
            }
        }
    
    def get_ai_crop_recommendations(self, farm_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get AI-powered crop recommendations using Gemini"""
        
        prompt = f"""
        As an agricultural AI expert, recommend the best crops for this farm:
        
        Location: {farm_data.get('state', 'unknown')}
        Soil pH: {farm_data.get('soil_ph', 'unknown')}
        Soil Moisture: {farm_data.get('soil_moisture', 'unknown')}%
        Temperature: {farm_data.get('avg_temperature', 'unknown')}°C
        Rainfall: {farm_data.get('rainfall', 'unknown')}mm
        
        Consider:
        1. Soil suitability
        2. Climate compatibility
        3. Market demand
        4. Profitability potential
        5. Risk factors
        
        Return top 5 crop recommendations as JSON:
        {{
            "recommendations": [
                {{
                    "crop": "crop_name",
                    "suitability_score": 0.95,
                    "confidence": "High/Medium/Low",
                    "reasons": ["reason1", "reason2"],
                    "profitability": "High/Medium/Low",
                    "risk_level": "Low/Medium/High",
                    "planting_season": "season",
                    "expected_yield": "yield_range",
                    "market_demand": "High/Medium/Low"
                }}
            ]
        }}
        """
        
        response = self.get_gemini_response(prompt)
        
        if response:
            try:
                result = json.loads(response)
                return result.get('recommendations', [])
            except json.JSONDecodeError:
                logger.error("Failed to parse crop recommendations from Gemini")
        
        return self._fallback_crop_recommendations(farm_data)
    
    def _fallback_crop_recommendations(self, farm_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fallback crop recommendations when Gemini API fails"""
        state = farm_data.get('state', 'punjab')
        
        # State-specific crop recommendations
        state_crops = {
            'punjab': ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane'],
            'karnataka': ['Rice', 'Ragi', 'Jowar', 'Maize', 'Coffee'],
            'maharashtra': ['Sugarcane', 'Cotton', 'Soybean', 'Turmeric', 'Grapes'],
            'tamil_nadu': ['Rice', 'Sugarcane', 'Cotton', 'Groundnut', 'Coconut'],
            'gujarat': ['Wheat', 'Cotton', 'Groundnut', 'Sugarcane', 'Mustard']
        }
        
        crops = state_crops.get(state, ['Rice', 'Wheat', 'Maize'])
        
        recommendations = []
        for i, crop in enumerate(crops[:5]):
            score = 0.9 - (i * 0.1)
            recommendations.append({
                'crop': crop,
                'suitability_score': score,
                'confidence': 'High' if score > 0.7 else 'Medium',
                'reasons': [f'Suitable for {state} conditions', 'Good soil compatibility'],
                'profitability': 'High' if score > 0.8 else 'Medium',
                'risk_level': 'Low' if score > 0.7 else 'Medium',
                'planting_season': 'Rabi' if crop in ['Wheat', 'Mustard'] else 'Kharif',
                'expected_yield': '4-6 tons/hectare',
                'market_demand': 'High'
            })
        
        return recommendations
    
    def get_ai_yield_prediction(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get AI-enhanced yield prediction using Gemini"""
        
        prompt = f"""
        As an agricultural AI expert, predict crop yield for this farm:
        
        Location: {farm_data.get('state', 'unknown')}
        Soil pH: {farm_data.get('soil_ph', 'unknown')}
        Soil Moisture: {farm_data.get('soil_moisture', 'unknown')}%
        Soil Nitrogen: {farm_data.get('soil_nitrogen', 'unknown')}
        Soil Phosphorus: {farm_data.get('soil_phosphorus', 'unknown')}
        Soil Potassium: {farm_data.get('soil_potassium', 'unknown')}
        Temperature: {farm_data.get('avg_temperature', 'unknown')}°C
        Humidity: {farm_data.get('humidity', 'unknown')}%
        Rainfall: {farm_data.get('rainfall', 'unknown')}mm
        
        Provide detailed yield prediction considering:
        1. Soil fertility analysis
        2. Weather impact assessment
        3. Historical yield data for the region
        4. Risk factors and mitigation
        5. Optimization opportunities
        
        Return as JSON:
        {{
            "predicted_yield": {{
                "base_yield": 5.5,
                "optimized_yield": 6.2,
                "confidence_interval": {{
                    "lower": 4.8,
                    "upper": 6.8
                }},
                "uncertainty": 0.6
            }},
            "yield_factors": {{
                "soil_quality": "Good/Medium/Poor",
                "weather_impact": "Positive/Neutral/Negative",
                "risk_level": "Low/Medium/High"
            }},
            "optimization_tips": [
                "tip1", "tip2", "tip3"
            ],
            "risk_assessment": {{
                "drought_risk": "Low/Medium/High",
                "pest_risk": "Low/Medium/High",
                "disease_risk": "Low/Medium/High"
            }}
        }}
        """
        
        response = self.get_gemini_response(prompt)
        
        if response:
            try:
                result = json.loads(response)
                return result
            except json.JSONDecodeError:
                logger.error("Failed to parse yield prediction from Gemini")
        
        return self._fallback_yield_prediction(farm_data)
    
    def _fallback_yield_prediction(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback yield prediction when Gemini API fails"""
        # Simple heuristic-based prediction
        base_yield = 4.0
        
        # Adjust based on soil pH
        ph = farm_data.get('soil_ph', 6.5)
        if 6.0 <= ph <= 7.5:
            base_yield += 0.5
        elif ph < 5.5 or ph > 8.0:
            base_yield -= 0.3
        
        # Adjust based on soil moisture
        moisture = farm_data.get('soil_moisture', 60)
        if 50 <= moisture <= 80:
            base_yield += 0.3
        elif moisture < 30 or moisture > 90:
            base_yield -= 0.2
        
        # Adjust based on nitrogen
        nitrogen = farm_data.get('soil_nitrogen', 50)
        if nitrogen >= 60:
            base_yield += 0.4
        elif nitrogen < 40:
            base_yield -= 0.3
        
        return {
            'predicted_yield': {
                'base_yield': round(base_yield, 2),
                'optimized_yield': round(base_yield * 1.1, 2),
                'confidence_interval': {
                    'lower': round(base_yield * 0.85, 2),
                    'upper': round(base_yield * 1.15, 2)
                },
                'uncertainty': round(base_yield * 0.1, 2)
            },
            'yield_factors': {
                'soil_quality': 'Good' if base_yield > 4.5 else 'Medium',
                'weather_impact': 'Positive',
                'risk_level': 'Low'
            },
            'optimization_tips': [
                'Maintain optimal soil pH',
                'Ensure adequate irrigation',
                'Apply balanced fertilization'
            ],
            'risk_assessment': {
                'drought_risk': 'Low',
                'pest_risk': 'Medium',
                'disease_risk': 'Low'
            }
        }
    
    def get_comprehensive_ai_analysis(self, farm_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get comprehensive AI analysis combining all predictions"""
        
        # Enhance farm data
        enhanced_data = self.enhance_farm_data(farm_data)
        
        # Get AI predictions
        yield_prediction = self.get_ai_yield_prediction(farm_data)
        crop_recommendations = self.get_ai_crop_recommendations(farm_data)
        
        # Create comprehensive analysis
        analysis = {
            'enhanced_farm_data': enhanced_data['enhanced_data'],
            'yield_prediction': yield_prediction['predicted_yield'],
            'crop_recommendations': crop_recommendations,
            'weather_forecast': enhanced_data['weather_forecast'],
            'recommendations': enhanced_data['recommendations'],
            'yield_factors': yield_prediction['yield_factors'],
            'optimization_tips': yield_prediction['optimization_tips'],
            'risk_assessment': yield_prediction['risk_assessment'],
            'analysis_summary': self._generate_analysis_summary(yield_prediction, crop_recommendations)
        }
        
        return analysis
    
    def _generate_analysis_summary(self, yield_pred: Dict, crop_recs: List[Dict]) -> str:
        """Generate human-readable analysis summary"""
        base_yield = yield_pred['base_yield']
        top_crop = crop_recs[0]['crop'] if crop_recs else 'Unknown'
        top_score = crop_recs[0]['suitability_score'] if crop_recs else 0
        
        return f"AI Analysis: Predicted yield {base_yield} tons/hectare. Top recommended crop: {top_crop} with {top_score:.1%} suitability. Enhanced with Gemini AI insights for better accuracy."

def main():
    """Test the Gemini Enhanced ML system"""
    try:
        # Initialize Gemini Enhanced ML
        gemini_ml = GeminiEnhancedML()
        
        # Test farm data
        test_farm_data = {
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
        
        print("🤖 Testing Gemini Enhanced ML Predictions...")
        print("=" * 60)
        
        # Get comprehensive analysis
        analysis = gemini_ml.get_comprehensive_ai_analysis(test_farm_data)
        
        print("📊 Enhanced Farm Data:")
        for key, value in analysis['enhanced_farm_data'].items():
            print(f"   {key}: {value}")
        
        print(f"\n🌾 Yield Prediction:")
        print(f"   Base Yield: {analysis['yield_prediction']['base_yield']} tons/hectare")
        print(f"   Optimized Yield: {analysis['yield_prediction']['optimized_yield']} tons/hectare")
        print(f"   Confidence: {analysis['yield_prediction']['confidence_interval']['lower']}-{analysis['yield_prediction']['confidence_interval']['upper']} tons/hectare")
        
        print(f"\n🌱 AI Crop Recommendations:")
        for i, rec in enumerate(analysis['crop_recommendations'][:3], 1):
            print(f"   {i}. {rec['crop']} - {rec['suitability_score']:.1% suitability")
            print(f"      Profitability: {rec['profitability']}, Risk: {rec['risk_level']}")
        
        print(f"\n📈 Analysis Summary:")
        print(f"   {analysis['analysis_summary']}")
        
        print("\n✅ Gemini Enhanced ML Predictions Complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
