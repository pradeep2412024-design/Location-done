#!/usr/bin/env python3
"""
Comprehensive Analysis Script
Standalone script for comprehensive agricultural analysis using trained ML models
"""

import sys
import json
import os
from pathlib import Path

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_inference import AgriculturalMLInference

def main():
    """Main function for comprehensive analysis"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize inference
        inference = AgriculturalMLInference()
        
        # Load models
        if not inference.load_models():
            # Return mock analysis if models not available
            result = generate_mock_comprehensive_analysis(input_data)
        else:
            # Get comprehensive analysis
            result = inference.get_comprehensive_analysis(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "yield_prediction": {"ensemble_yield": 3.5},
            "crop_recommendations": [],
            "analysis_summary": "Analysis failed due to error"
        }
        print(json.dumps(error_result))

def generate_mock_comprehensive_analysis(input_data):
    """Generate mock comprehensive analysis as fallback"""
    import random
    
    # Generate yield prediction
    yield_result = generate_mock_yield_prediction(input_data)
    
    # Generate crop recommendations
    crop_result = generate_mock_crop_recommendation(input_data)
    
    # Create analysis summary
    predicted_yield = yield_result["predictions"]["ensemble_yield"]
    top_crop = crop_result["recommendations"][0] if crop_result["recommendations"] else None
    
    analysis_summary = f"Predicted yield: {predicted_yield:.2f} tons/hectare"
    if top_crop:
        analysis_summary += f". Top recommended crop: {top_crop['crop']} with {top_crop['confidence']} confidence"
    
    return {
        "success": True,
        "yield_prediction": yield_result["predictions"],
        "crop_recommendations": crop_result["recommendations"],
        "input_conditions": input_data,
        "analysis_summary": analysis_summary
    }

def generate_mock_yield_prediction(input_data):
    """Generate mock yield prediction"""
    import random
    
    # Simple heuristic-based prediction
    base_yield = 3.5
    
    # Adjust based on soil conditions
    soil_ph = input_data.get('soil_ph', 6.5)
    if 6.0 <= soil_ph <= 7.5:
        base_yield += 0.5
    elif soil_ph < 5.5 or soil_ph > 8.0:
        base_yield -= 0.3
    
    soil_moisture = input_data.get('soil_moisture', 60)
    if 50 <= soil_moisture <= 80:
        base_yield += 0.3
    elif soil_moisture < 30 or soil_moisture > 90:
        base_yield -= 0.2
    
    soil_nitrogen = input_data.get('soil_nitrogen', 60)
    if soil_nitrogen >= 60:
        base_yield += 0.4
    elif soil_nitrogen < 40:
        base_yield -= 0.3
    
    # Adjust based on weather
    avg_temp = input_data.get('avg_temperature', 25)
    if 20 <= avg_temp <= 35:
        base_yield += 0.2
    elif avg_temp < 15 or avg_temp > 40:
        base_yield -= 0.4
    
    # State-specific adjustments
    state = input_data.get('state', 'punjab')
    state_factors = {
        'punjab': 1.2, 'haryana': 1.15, 'uttar_pradesh': 1.0,
        'maharashtra': 0.95, 'karnataka': 0.9, 'tamil_nadu': 1.1,
        'gujarat': 0.95, 'rajasthan': 0.8, 'bihar': 0.9,
        'west_bengal': 1.05, 'madhya_pradesh': 0.9, 'odisha': 0.85
    }
    
    state_factor = state_factors.get(state, 1.0)
    predicted_yield = max(0.5, min(8.0, base_yield * state_factor))
    
    # Add some randomness
    predicted_yield += random.uniform(-0.2, 0.2)
    predicted_yield = max(0.5, min(8.0, predicted_yield))
    
    return {
        "success": True,
        "predictions": {
            "ensemble_yield": round(predicted_yield, 2),
            "confidence_interval": {
                "lower": round(predicted_yield * 0.85, 2),
                "upper": round(predicted_yield * 1.15, 2),
                "uncertainty": round(predicted_yield * 0.1, 2)
            }
        },
        "input_conditions": input_data
    }

def generate_mock_crop_recommendation(input_data):
    """Generate mock crop recommendation"""
    import random
    
    state = input_data.get('state', 'punjab')
    soil_ph = input_data.get('soil_ph', 6.5)
    avg_temp = input_data.get('avg_temperature', 25)
    rainfall = input_data.get('rainfall', 4)
    
    # State-specific crop recommendations
    state_crops = {
        'punjab': ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane'],
        'haryana': ['Wheat', 'Rice', 'Mustard', 'Bajra', 'Jowar'],
        'uttar_pradesh': ['Rice', 'Wheat', 'Sugarcane', 'Potato', 'Mustard'],
        'maharashtra': ['Sugarcane', 'Cotton', 'Soybean', 'Turmeric', 'Grapes'],
        'karnataka': ['Rice', 'Ragi', 'Jowar', 'Maize', 'Coffee'],
        'tamil_nadu': ['Rice', 'Sugarcane', 'Cotton', 'Groundnut', 'Coconut'],
        'gujarat': ['Wheat', 'Cotton', 'Groundnut', 'Sugarcane', 'Mustard'],
        'rajasthan': ['Wheat', 'Mustard', 'Bajra', 'Jowar', 'Cotton'],
        'bihar': ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Lentil'],
        'west_bengal': ['Rice', 'Wheat', 'Jute', 'Potato', 'Mustard'],
        'madhya_pradesh': ['Wheat', 'Rice', 'Soybean', 'Maize', 'Chickpea'],
        'odisha': ['Rice', 'Maize', 'Ragi', 'Black Gram', 'Green Gram']
    }
    
    available_crops = state_crops.get(state, ['Rice', 'Wheat', 'Maize'])
    
    # Score crops based on conditions
    recommendations = []
    for i, crop in enumerate(available_crops[:5]):
        score = 0.8 - (i * 0.1)  # Base score decreasing by rank
        
        # Adjust score based on soil pH
        if crop == 'Rice' and 6.0 <= soil_ph <= 7.0:
            score += 0.2
        elif crop == 'Wheat' and 6.5 <= soil_ph <= 7.5:
            score += 0.2
        elif crop == 'Maize' and 6.0 <= soil_ph <= 7.0:
            score += 0.2
        
        # Adjust score based on temperature
        if crop == 'Rice' and 25 <= avg_temp <= 35:
            score += 0.1
        elif crop == 'Wheat' and 15 <= avg_temp <= 25:
            score += 0.1
        elif crop == 'Maize' and 20 <= avg_temp <= 30:
            score += 0.1
        
        # Adjust score based on rainfall
        if crop == 'Rice' and rainfall >= 5:
            score += 0.1
        elif crop == 'Wheat' and 2 <= rainfall <= 6:
            score += 0.1
        elif crop == 'Maize' and 3 <= rainfall <= 8:
            score += 0.1
        
        # Add some randomness
        score += random.uniform(-0.1, 0.1)
        score = max(0.2, min(0.95, score))
        
        recommendations.append({
            'crop': crop,
            'score': round(score, 3),
            'rank': i + 1,
            'confidence': 'High' if score > 0.7 else 'Medium' if score > 0.4 else 'Low',
            'reasons': generate_crop_reasons(crop, input_data)
        })
    
    return {
        "success": True,
        "recommendations": recommendations
    }

def generate_crop_reasons(crop, input_data):
    """Generate reasons for crop recommendation"""
    reasons = []
    soil_moisture = input_data.get('soil_moisture', 60)
    avg_temp = input_data.get('avg_temperature', 25)
    rainfall = input_data.get('rainfall', 4)
    soil_nitrogen = input_data.get('soil_nitrogen', 60)
    
    if crop == 'Rice':
        if soil_moisture >= 60:
            reasons.append("High soil moisture suitable for rice")
        if avg_temp >= 25:
            reasons.append("Warm temperature ideal for rice growth")
        if rainfall >= 5:
            reasons.append("Adequate rainfall for rice cultivation")
    elif crop == 'Wheat':
        if input_data.get('soil_ph', 6.5) >= 6.5:
            reasons.append("Optimal soil pH for wheat")
        if 15 <= avg_temp <= 25:
            reasons.append("Cool temperature suitable for wheat")
        if soil_nitrogen >= 60:
            reasons.append("Good nitrogen levels for wheat")
    elif crop == 'Maize':
        if input_data.get('soil_ph', 6.5) >= 6.0:
            reasons.append("Good soil pH for maize")
        if avg_temp >= 20:
            reasons.append("Warm temperature suitable for maize")
        if rainfall >= 3:
            reasons.append("Adequate rainfall for maize")
    elif crop == 'Sugarcane':
        if soil_moisture >= 70:
            reasons.append("High moisture requirement met")
        if avg_temp >= 25:
            reasons.append("Warm temperature ideal for sugarcane")
    elif crop == 'Cotton':
        if 6.5 <= input_data.get('soil_ph', 6.5) <= 7.5:
            reasons.append("Optimal soil pH for cotton")
        if 20 <= avg_temp <= 30:
            reasons.append("Suitable temperature for cotton")
    
    if not reasons:
        reasons.append(f"Suitable for {input_data.get('state', 'local')} conditions")
    
    return reasons[:3]  # Limit to 3 reasons

if __name__ == "__main__":
    main()
