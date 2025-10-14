"""
Model Training Script
Trains and evaluates ML models for agricultural predictions
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
from data_preprocessor import AgriculturalDataPreprocessor
from yield_predictor import CropYieldPredictor
from crop_recommender import CropRecommender
import warnings
warnings.filterwarnings('ignore')

class ModelTrainer:
    def __init__(self, database_path: str = "../complete_agricultural_database.json"):
        self.database_path = database_path
        self.preprocessor = AgriculturalDataPreprocessor()
        self.yield_predictor = CropYieldPredictor()
        self.crop_recommender = CropRecommender()
        self.training_results = {}
        
    def load_and_prepare_data(self):
        """Load and prepare data for training"""
        print("Loading agricultural database...")
        
        # Load raw data
        df = self.preprocessor.load_agricultural_data(self.database_path)
        print(f"Loaded {len(df)} records from database")
        
        if df.empty:
            raise ValueError("No data loaded from database")
        
        # Create synthetic soil and weather data
        print("Generating synthetic soil and weather data...")
        df = self.preprocessor.create_synthetic_soil_weather_data(df)
        print(f"Enhanced dataset with {len(df)} records")
        
        # Prepare features
        print("Preparing features...")
        X, feature_columns = self.preprocessor.prepare_features(df)
        y_yield = self.preprocessor.prepare_yield_target(df)
        y_crop = self.preprocessor.prepare_crop_target(df)
        
        print(f"Features: {len(feature_columns)}")
        print(f"Yield target range: {y_yield.min():.2f} - {y_yield.max():.2f}")
        print(f"Crop classes: {len(y_crop.unique())}")
        
        return X, y_yield, y_crop, feature_columns
    
    def train_yield_prediction_model(self, X: pd.DataFrame, y: pd.Series):
        """Train yield prediction model"""
        print("\n" + "="*50)
        print("TRAINING YIELD PREDICTION MODEL")
        print("="*50)
        
        # Split data
        X_train, X_test, y_train, y_test = self.preprocessor.split_data(X, y, test_size=0.2)
        
        # Scale features
        X_train_scaled, X_test_scaled = self.preprocessor.scale_features(X_train, X_test)
        
        # Train models
        print("Training individual models...")
        model_scores = self.yield_predictor.train_models(X_train_scaled, y_train, X_test_scaled, y_test)
        
        # Optimize hyperparameters
        print("\nOptimizing hyperparameters...")
        optimization_results = self.yield_predictor.optimize_hyperparameters(X_train_scaled, y_train)
        
        # Create ensemble
        print("\nCreating ensemble model...")
        ensemble_results = self.yield_predictor.create_ensemble(X_test_scaled, y_test)
        
        # Evaluate on test set
        print("\nEvaluating on test set...")
        test_results = self.yield_predictor.evaluate_model(X_test_scaled, y_test)
        
        # Get feature importance
        feature_importance = self.yield_predictor.get_feature_importance()
        
        self.training_results['yield_prediction'] = {
            'model_scores': model_scores,
            'optimization_results': optimization_results,
            'ensemble_results': ensemble_results,
            'test_results': test_results,
            'feature_importance': feature_importance
        }
        
        print(f"\nYield Prediction Results:")
        print(f"Best ensemble R²: {ensemble_results['ensemble_r2']:.4f}")
        print(f"Best ensemble RMSE: {ensemble_results['ensemble_rmse']:.4f}")
        
        return self.training_results['yield_prediction']
    
    def train_crop_recommendation_model(self, X: pd.DataFrame, y: pd.Series):
        """Train crop recommendation model"""
        print("\n" + "="*50)
        print("TRAINING CROP RECOMMENDATION MODEL")
        print("="*50)
        
        # Split data
        X_train, X_test, y_train, y_test = self.preprocessor.split_data(X, y, test_size=0.2)
        
        # Train models
        print("Training individual models...")
        model_scores = self.crop_recommender.train_models(X_train, y_train, X_test, y_test)
        
        # Optimize hyperparameters
        print("\nOptimizing hyperparameters...")
        optimization_results = self.crop_recommender.optimize_hyperparameters(X_train, y_train)
        
        # Create crop rankings
        print("\nCreating crop rankings...")
        crop_rankings = self.crop_recommender.create_crop_rankings(X_test, y_test)
        
        # Evaluate on test set
        print("\nEvaluating on test set...")
        test_results = self.crop_recommender.evaluate_model(X_test, y_test)
        
        self.training_results['crop_recommendation'] = {
            'model_scores': model_scores,
            'optimization_results': optimization_results,
            'crop_rankings': crop_rankings,
            'test_results': test_results
        }
        
        print(f"\nCrop Recommendation Results:")
        best_accuracy = max([score['val_accuracy'] for score in model_scores.values() if score and score['val_accuracy']])
        print(f"Best validation accuracy: {best_accuracy:.4f}")
        
        return self.training_results['crop_recommendation']
    
    def save_models(self, output_dir: str = "trained_models"):
        """Save all trained models"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save preprocessor
        preprocessor_path = os.path.join(output_dir, "preprocessor.pkl")
        self.preprocessor.save_preprocessor(preprocessor_path)
        
        # Save yield predictor
        yield_model_path = os.path.join(output_dir, "yield_predictor.pkl")
        self.yield_predictor.save_model(yield_model_path)
        
        # Save crop recommender
        crop_model_path = os.path.join(output_dir, "crop_recommender.pkl")
        self.crop_recommender.save_model(crop_model_path)
        
        # Save training results
        results_path = os.path.join(output_dir, "training_results.json")
        with open(results_path, 'w') as f:
            # Convert numpy types to Python types for JSON serialization
            serializable_results = self._make_serializable(self.training_results)
            json.dump(serializable_results, f, indent=2)
        
        print(f"\nModels saved to {output_dir}/")
        print(f"- Preprocessor: {preprocessor_path}")
        print(f"- Yield Predictor: {yield_model_path}")
        print(f"- Crop Recommender: {crop_model_path}")
        print(f"- Training Results: {results_path}")
    
    def _make_serializable(self, obj):
        """Convert numpy types to Python types for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self._make_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        else:
            return obj
    
    def create_visualizations(self, output_dir: str = "trained_models"):
        """Create visualization plots for model performance"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Yield prediction visualizations
        if 'yield_prediction' in self.training_results:
            self._plot_yield_results(output_dir)
        
        # Crop recommendation visualizations
        if 'crop_recommendation' in self.training_results:
            self._plot_crop_results(output_dir)
    
    def _plot_yield_results(self, output_dir: str):
        """Create visualizations for yield prediction results"""
        results = self.training_results['yield_prediction']
        
        # Model comparison plot
        plt.figure(figsize=(12, 8))
        
        models = []
        r2_scores = []
        rmse_scores = []
        
        for model_name, scores in results['test_results'].items():
            if scores:
                models.append(model_name)
                r2_scores.append(scores['r2'])
                rmse_scores.append(scores['rmse'])
        
        # R² scores
        plt.subplot(2, 2, 1)
        plt.bar(models, r2_scores)
        plt.title('Model R² Scores')
        plt.ylabel('R² Score')
        plt.xticks(rotation=45)
        
        # RMSE scores
        plt.subplot(2, 2, 2)
        plt.bar(models, rmse_scores)
        plt.title('Model RMSE Scores')
        plt.ylabel('RMSE')
        plt.xticks(rotation=45)
        
        # Feature importance
        if 'feature_importance' in results:
            plt.subplot(2, 2, 3)
            features = list(results['feature_importance'].keys())[:10]
            importances = list(results['feature_importance'].values())[:10]
            plt.barh(features, importances)
            plt.title('Top 10 Feature Importance')
            plt.xlabel('Importance')
        
        # Ensemble weights
        if 'ensemble_results' in results and 'model_weights' in results['ensemble_results']:
            plt.subplot(2, 2, 4)
            weights = results['ensemble_results']['model_weights']
            plt.pie(weights.values(), labels=weights.keys(), autopct='%1.1f%%')
            plt.title('Ensemble Model Weights')
        
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'yield_prediction_results.png'), dpi=300, bbox_inches='tight')
        plt.close()
    
    def _plot_crop_results(self, output_dir: str):
        """Create visualizations for crop recommendation results"""
        results = self.training_results['crop_recommendation']
        
        # Model accuracy comparison
        plt.figure(figsize=(12, 6))
        
        models = []
        accuracies = []
        
        for model_name, scores in results['test_results'].items():
            if scores:
                models.append(model_name)
                accuracies.append(scores['accuracy'])
        
        plt.subplot(1, 2, 1)
        plt.bar(models, accuracies)
        plt.title('Model Accuracy Scores')
        plt.ylabel('Accuracy')
        plt.xticks(rotation=45)
        
        # Crop rankings
        if 'crop_rankings' in results:
            plt.subplot(1, 2, 2)
            crops = list(results['crop_rankings'].keys())[:10]
            scores = list(results['crop_rankings'].values())[:10]
            plt.barh(crops, scores)
            plt.title('Top 10 Crop Rankings')
            plt.xlabel('Suitability Score')
        
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'crop_recommendation_results.png'), dpi=300, bbox_inches='tight')
        plt.close()
    
    def run_full_training(self):
        """Run complete training pipeline"""
        print("Starting ML Model Training Pipeline")
        print("="*60)
        
        try:
            # Load and prepare data
            X, y_yield, y_crop, feature_columns = self.load_and_prepare_data()
            
            # Train yield prediction model
            yield_results = self.train_yield_prediction_model(X, y_yield)
            
            # Train crop recommendation model
            crop_results = self.train_crop_recommendation_model(X, y_crop)
            
            # Save models
            self.save_models()
            
            # Create visualizations
            self.create_visualizations()
            
            print("\n" + "="*60)
            print("TRAINING COMPLETED SUCCESSFULLY!")
            print("="*60)
            
            return True
            
        except Exception as e:
            print(f"\nTraining failed with error: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Main training function"""
    # Check if database file exists
    database_path = "../complete_agricultural_database.json"
    if not os.path.exists(database_path):
        print(f"Database file not found: {database_path}")
        print("Please ensure the agricultural database is in the correct location.")
        return False
    
    # Initialize trainer
    trainer = ModelTrainer(database_path)
    
    # Run training
    success = trainer.run_full_training()
    
    if success:
        print("\n✅ All models trained and saved successfully!")
        print("You can now use the trained models for predictions.")
    else:
        print("\n❌ Training failed. Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    main()
