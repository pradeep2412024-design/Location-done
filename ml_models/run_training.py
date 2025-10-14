#!/usr/bin/env python3
"""
Training Script Runner
Executes the complete ML model training pipeline
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'scikit-learn', 'pandas', 'numpy', 'xgboost', 
        'lightgbm', 'matplotlib', 'seaborn', 'joblib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    
    print("✅ All required packages are installed")
    return True

def check_database():
    """Check if agricultural database exists"""
    database_path = Path("../complete_agricultural_database.json")
    
    if not database_path.exists():
        print(f"❌ Database file not found: {database_path}")
        print("Please ensure the agricultural database is in the correct location.")
        return False
    
    print(f"✅ Database found: {database_path}")
    return True

def run_training():
    """Run the training pipeline"""
    print("🚀 Starting ML Model Training Pipeline")
    print("="*60)
    
    # Check dependencies
    if not check_dependencies():
        return False
    
    # Check database
    if not check_database():
        return False
    
    # Run training
    try:
        from train_models import ModelTrainer
        
        trainer = ModelTrainer()
        success = trainer.run_full_training()
        
        if success:
            print("\n🎉 Training completed successfully!")
            print("Trained models are saved in the 'trained_models' directory")
            return True
        else:
            print("\n❌ Training failed")
            return False
            
    except Exception as e:
        print(f"\n❌ Training failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_models():
    """Test the trained models"""
    print("\n🧪 Testing trained models...")
    
    try:
        from model_inference import AgriculturalMLInference
        
        # Initialize inference
        inference = AgriculturalMLInference()
        
        # Load models
        if not inference.load_models():
            print("❌ Failed to load models")
            return False
        
        # Test with sample data
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
        
        # Test yield prediction
        yield_result = inference.predict_yield(test_input)
        if yield_result.get("success"):
            print("✅ Yield prediction test passed")
        else:
            print("❌ Yield prediction test failed")
            return False
        
        # Test crop recommendation
        crop_result = inference.recommend_crops(test_input)
        if crop_result.get("success"):
            print("✅ Crop recommendation test passed")
        else:
            print("❌ Crop recommendation test failed")
            return False
        
        print("🎉 All model tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Model testing failed: {e}")
        return False

def main():
    """Main function"""
    print("🌾 Agricultural ML Model Training Pipeline")
    print("="*60)
    
    # Run training
    if not run_training():
        print("\n❌ Training pipeline failed")
        sys.exit(1)
    
    # Test models
    if not test_models():
        print("\n❌ Model testing failed")
        sys.exit(1)
    
    print("\n🎉 Complete pipeline executed successfully!")
    print("Your ML models are ready for use!")

if __name__ == "__main__":
    main()
