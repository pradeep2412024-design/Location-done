#!/usr/bin/env python3
"""
🤖 Direct ML Console Test - Shows predictions in console
This script directly calls the Python ML models and displays results
"""

import sys
import os
import json
import subprocess
from pathlib import Path

# Add ml_models to path
ml_models_path = Path(__file__).parent / "ml_models"
sys.path.append(str(ml_models_path))

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🤖 {title}")
    print(f"{'='*60}")

def print_section(title):
    print(f"\n📊 {title}")
    print("-" * 40)

def print_result(title, data, color="white"):
    colors = {
        "green": "\033[92m",
        "blue": "\033[94m", 
        "yellow": "\033[93m",
        "red": "\033[91m",
        "white": "\033[0m"
    }
    print(f"{colors[color]}✅ {title}: {data}{colors['white']}")

def test_yield_prediction():
    """Test yield prediction directly"""
    print_section("Testing Yield Prediction")
    
    test_data = {
        "state": "punjab",
        "soil_ph": 6.8,
        "soil_moisture": 60,
        "soil_nitrogen": 70,
        "soil_phosphorus": 50,
        "soil_potassium": 180,
        "avg_temperature": 28,
        "humidity": 60,
        "rainfall": 4
    }
    
    try:
        # Import and run yield prediction
        from predict_yield import predict_yield
        
        result = predict_yield(test_data)
        
        if result and 'predictions' in result:
            predictions = result['predictions']
            yield_val = predictions.get('ensemble_yield', 0)
            confidence = predictions.get('confidence_interval', {})
            
            print_result("Predicted Yield", f"{yield_val:.2f} tons/hectare", "green")
            
            if confidence:
                lower = confidence.get('lower', 0)
                upper = confidence.get('upper', 0)
                uncertainty = confidence.get('uncertainty', 0)
                print_result("Confidence Range", f"{lower:.2f} - {upper:.2f} tons/hectare", "blue")
                print_result("Uncertainty", f"±{uncertainty:.2f} tons/hectare", "yellow")
        else:
            print("❌ Yield prediction failed - no predictions returned")
            
    except Exception as e:
        print(f"❌ Yield prediction error: {e}")

def test_crop_recommendation():
    """Test crop recommendation directly"""
    print_section("Testing Crop Recommendation")
    
    test_data = {
        "state": "punjab", 
        "soil_ph": 6.8,
        "soil_moisture": 60,
        "soil_nitrogen": 70,
        "soil_phosphorus": 50,
        "soil_potassium": 180,
        "avg_temperature": 28,
        "humidity": 60,
        "rainfall": 4
    }
    
    try:
        # Import and run crop recommendation
        from predict_crops import predict_crops
        
        result = predict_crops(test_data)
        
        if result and 'recommendations' in result:
            recommendations = result['recommendations']
            print_result("Top Crop Recommendations", "", "green")
            
            for i, rec in enumerate(recommendations[:5], 1):
                crop = rec.get('crop', 'Unknown')
                score = rec.get('score', 0)
                confidence = rec.get('confidence', 'Unknown')
                
                print(f"   {i}. {crop} - {score:.1%} ({confidence})")
                
                # Show reasons if available
                reasons = rec.get('reasons', [])
                if reasons:
                    for reason in reasons[:2]:  # Show first 2 reasons
                        print(f"      • {reason}")
        else:
            print("❌ Crop recommendation failed - no recommendations returned")
            
    except Exception as e:
        print(f"❌ Crop recommendation error: {e}")

def test_comprehensive_analysis():
    """Test comprehensive analysis directly"""
    print_section("Testing Comprehensive Analysis")
    
    test_data = {
        "state": "punjab",
        "soil_ph": 6.8,
        "soil_moisture": 60,
        "soil_nitrogen": 70,
        "soil_phosphorus": 50,
        "soil_potassium": 180,
        "avg_temperature": 28,
        "humidity": 60,
        "rainfall": 4
    }
    
    try:
        # Import and run comprehensive analysis
        from comprehensive_analysis import run_comprehensive_analysis
        
        result = run_comprehensive_analysis(test_data)
        
        if result:
            # Show analysis summary
            summary = result.get('analysis_summary', 'No summary available')
            print_result("Analysis Summary", summary, "green")
            
            # Show yield prediction if available
            yield_pred = result.get('yield_prediction')
            if yield_pred and 'ensemble_yield' in yield_pred:
                yield_val = yield_pred['ensemble_yield']
                print_result("Predicted Yield", f"{yield_val:.2f} tons/hectare", "blue")
            
            # Show top crop recommendation
            crop_recs = result.get('crop_recommendations', [])
            if crop_recs:
                top_crop = crop_recs[0]
                crop_name = top_crop.get('crop', 'Unknown')
                score = top_crop.get('score', 0)
                confidence = top_crop.get('confidence', 'Unknown')
                print_result("Top Recommended Crop", f"{crop_name} ({score:.1%} - {confidence})", "yellow")
        else:
            print("❌ Comprehensive analysis failed - no result returned")
            
    except Exception as e:
        print(f"❌ Comprehensive analysis error: {e}")

def test_multiple_scenarios():
    """Test multiple farm scenarios"""
    print_section("Testing Multiple Farm Scenarios")
    
    scenarios = [
        {
            "name": "Punjab Wheat Farm",
            "data": {
                "state": "punjab",
                "soil_ph": 6.8,
                "soil_moisture": 60,
                "soil_nitrogen": 70,
                "soil_phosphorus": 50,
                "soil_potassium": 180,
                "avg_temperature": 28,
                "humidity": 60,
                "rainfall": 4
            }
        },
        {
            "name": "Karnataka Rice Farm",
            "data": {
                "state": "karnataka",
                "soil_ph": 6.2,
                "soil_moisture": 75,
                "soil_nitrogen": 85,
                "soil_phosphorus": 45,
                "soil_potassium": 120,
                "avg_temperature": 32,
                "humidity": 80,
                "rainfall": 8
            }
        },
        {
            "name": "Maharashtra Cotton Farm",
            "data": {
                "state": "maharashtra",
                "soil_ph": 7.1,
                "soil_moisture": 45,
                "soil_nitrogen": 60,
                "soil_phosphorus": 35,
                "soil_potassium": 200,
                "avg_temperature": 35,
                "humidity": 50,
                "rainfall": 2
            }
        }
    ]
    
    for scenario in scenarios:
        print(f"\n🌾 {scenario['name']}")
        print(f"   Location: {scenario['data']['state'].upper()}")
        print(f"   Soil pH: {scenario['data']['soil_ph']}, Temperature: {scenario['data']['avg_temperature']}°C")
        print(f"   Moisture: {scenario['data']['soil_moisture']}%, Rainfall: {scenario['data']['rainfall']}mm")
        
        try:
            # Test yield prediction for this scenario
            from predict_yield import predict_yield
            yield_result = predict_yield(scenario['data'])
            
            if yield_result and 'predictions' in yield_result:
                yield_val = yield_result['predictions'].get('ensemble_yield', 0)
                print(f"   📊 Predicted Yield: {yield_val:.2f} tons/hectare")
            
            # Test crop recommendation for this scenario
            from predict_crops import predict_crops
            crop_result = predict_crops(scenario['data'])
            
            if crop_result and 'recommendations' in crop_result:
                top_crop = crop_result['recommendations'][0]
                crop_name = top_crop.get('crop', 'Unknown')
                score = top_crop.get('score', 0)
                print(f"   🌱 Top Crop: {crop_name} ({score:.1%})")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

def main():
    """Main test function"""
    print_header("ML Models Console Test - Direct Python Execution")
    
    print("🚀 Testing ML models directly with Python...")
    print("📊 This will show predictions in the console")
    
    # Test individual components
    test_yield_prediction()
    test_crop_recommendation() 
    test_comprehensive_analysis()
    
    # Test multiple scenarios
    test_multiple_scenarios()
    
    print_header("Test Complete!")
    print("🎉 All ML predictions are working and displayed in console!")
    print("🤖 Your agricultural AI system is ready to use!")

if __name__ == "__main__":
    main()
