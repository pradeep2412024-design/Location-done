#!/usr/bin/env python3
"""
ML Models Setup Script
Complete setup and training pipeline for agricultural ML models
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    
    print(f"✅ Python version: {sys.version}")
    return True

def check_database():
    """Check if agricultural database exists"""
    database_path = Path("complete_agricultural_database.json")
    
    if not database_path.exists():
        print(f"❌ Database file not found: {database_path}")
        print("Please ensure the agricultural database is in the current directory.")
        return False
    
    print(f"✅ Database found: {database_path}")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    
    try:
        # Change to ml_models directory
        os.chdir("ml_models")
        
        # Install requirements
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
            return True
        else:
            print(f"❌ Failed to install dependencies: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False
    finally:
        # Change back to parent directory
        os.chdir("..")

def train_models():
    """Train ML models"""
    print("🤖 Training ML models...")
    
    try:
        # Change to ml_models directory
        os.chdir("ml_models")
        
        # Run training
        result = subprocess.run([
            sys.executable, "run_training.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Models trained successfully")
            return True
        else:
            print(f"❌ Training failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error training models: {e}")
        return False
    finally:
        # Change back to parent directory
        os.chdir("..")

def test_models():
    """Test trained models"""
    print("🧪 Testing trained models...")
    
    try:
        # Change to ml_models directory
        os.chdir("ml_models")
        
        # Test with sample data
        test_input = {
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
        
        # Test yield prediction
        print("Testing yield prediction...")
        yield_result = subprocess.run([
            sys.executable, "predict_yield.py"
        ], input=json.dumps(test_input), text=True, capture_output=True)
        
        if yield_result.returncode == 0:
            print("✅ Yield prediction test passed")
        else:
            print("❌ Yield prediction test failed")
            return False
        
        # Test crop recommendation
        print("Testing crop recommendation...")
        crop_result = subprocess.run([
            sys.executable, "predict_crops.py"
        ], input=json.dumps(test_input), text=True, capture_output=True)
        
        if crop_result.returncode == 0:
            print("✅ Crop recommendation test passed")
        else:
            print("❌ Crop recommendation test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing models: {e}")
        return False
    finally:
        # Change back to parent directory
        os.chdir("..")

def evaluate_models():
    """Evaluate model performance"""
    print("📊 Evaluating model performance...")
    
    try:
        # Change to ml_models directory
        os.chdir("ml_models")
        
        # Run evaluation
        result = subprocess.run([
            sys.executable, "evaluate_models.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Model evaluation completed")
            return True
        else:
            print(f"❌ Evaluation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error evaluating models: {e}")
        return False
    finally:
        # Change back to parent directory
        os.chdir("..")

def create_directories():
    """Create necessary directories"""
    directories = [
        "ml_models/trained_models",
        "ml_models/evaluation_results"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def main():
    """Main setup function"""
    print("🌾 Agricultural ML Models Setup")
    print("="*50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check database
    if not check_database():
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed at dependency installation")
        sys.exit(1)
    
    # Train models
    if not train_models():
        print("❌ Setup failed at model training")
        sys.exit(1)
    
    # Test models
    if not test_models():
        print("❌ Setup failed at model testing")
        sys.exit(1)
    
    # Evaluate models
    if not evaluate_models():
        print("⚠️ Model evaluation failed, but setup completed")
    
    print("\n🎉 ML Models setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Your trained models are in: ml_models/trained_models/")
    print("2. Evaluation results are in: ml_models/evaluation_results/")
    print("3. You can now use the ML API endpoints in your Next.js app")
    print("4. Test the API with: POST /api/ml-predict")
    
    print("\n🔧 Usage examples:")
    print("```javascript")
    print("// Yield prediction")
    print("const response = await fetch('/api/ml-predict', {")
    print("  method: 'POST',")
    print("  headers: { 'Content-Type': 'application/json' },")
    print("  body: JSON.stringify({")
    print("    type: 'yield_prediction',")
    print("    inputData: {")
    print("      state: 'punjab',")
    print("      soil_ph: 6.8,")
    print("      soil_moisture: 60,")
    print("      soil_nitrogen: 70,")
    print("      soil_phosphorus: 50,")
    print("      soil_potassium: 180,")
    print("      avg_temperature: 28,")
    print("      humidity: 60,")
    print("      rainfall: 4")
    print("    }")
    print("  })")
    print("});")
    print("```")

if __name__ == "__main__":
    main()
