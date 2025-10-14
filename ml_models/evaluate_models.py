#!/usr/bin/env python3
"""
Model Evaluation Script
Evaluates trained ML models and generates performance reports
"""

import os
import sys
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, classification_report
from pathlib import Path

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_preprocessor import AgriculturalDataPreprocessor
from yield_predictor import CropYieldPredictor
from crop_recommender import CropRecommender

class ModelEvaluator:
    def __init__(self, models_dir: str = "trained_models"):
        self.models_dir = models_dir
        self.preprocessor = None
        self.yield_predictor = None
        self.crop_recommender = None
        self.evaluation_results = {}
        
    def load_models(self):
        """Load trained models"""
        try:
            # Load preprocessor
            preprocessor_path = os.path.join(self.models_dir, "preprocessor.pkl")
            if os.path.exists(preprocessor_path):
                self.preprocessor = AgriculturalDataPreprocessor()
                self.preprocessor.load_preprocessor(preprocessor_path)
                print("✅ Preprocessor loaded")
            else:
                print("❌ Preprocessor not found")
                return False
            
            # Load yield predictor
            yield_model_path = os.path.join(self.models_dir, "yield_predictor.pkl")
            if os.path.exists(yield_model_path):
                self.yield_predictor = CropYieldPredictor()
                self.yield_predictor.load_model(yield_model_path)
                print("✅ Yield predictor loaded")
            else:
                print("❌ Yield predictor not found")
                return False
            
            # Load crop recommender
            crop_model_path = os.path.join(self.models_dir, "crop_recommender.pkl")
            if os.path.exists(crop_model_path):
                self.crop_recommender = CropRecommender()
                self.crop_recommender.load_model(crop_model_path)
                print("✅ Crop recommender loaded")
            else:
                print("❌ Crop recommender not found")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False
    
    def load_test_data(self, database_path: str = "../complete_agricultural_database.json"):
        """Load and prepare test data"""
        try:
            # Load preprocessor
            preprocessor = AgriculturalDataPreprocessor()
            
            # Load raw data
            df = preprocessor.load_agricultural_data(database_path)
            if df.empty:
                raise ValueError("No data loaded from database")
            
            # Create synthetic data
            df = preprocessor.create_synthetic_soil_weather_data(df)
            
            # Prepare features
            X, feature_columns = preprocessor.prepare_features(df)
            y_yield = preprocessor.prepare_yield_target(df)
            y_crop = preprocessor.prepare_crop_target(df)
            
            # Split data
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train_yield, y_test_yield = train_test_split(
                X, y_yield, test_size=0.2, random_state=42
            )
            _, _, y_train_crop, y_test_crop = train_test_split(
                X, y_crop, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled, X_test_scaled = preprocessor.scale_features(X_train, X_test)
            
            return {
                'X_train': X_train_scaled,
                'X_test': X_test_scaled,
                'y_train_yield': y_train_yield,
                'y_test_yield': y_test_yield,
                'y_train_crop': y_train_crop,
                'y_test_crop': y_test_crop,
                'feature_columns': feature_columns
            }
            
        except Exception as e:
            print(f"❌ Error loading test data: {e}")
            return None
    
    def evaluate_yield_prediction(self, test_data):
        """Evaluate yield prediction models"""
        print("\n" + "="*50)
        print("EVALUATING YIELD PREDICTION MODELS")
        print("="*50)
        
        X_test = test_data['X_test']
        y_test = test_data['y_test_yield']
        
        # Get predictions from all models
        predictions = self.yield_predictor.predict_yield(X_test)
        
        # Evaluate each model
        model_results = {}
        for model_name, pred in predictions.items():
            if model_name == 'ensemble':
                continue
                
            try:
                r2 = r2_score(y_test, pred)
                rmse = np.sqrt(mean_squared_error(y_test, pred))
                mae = mean_absolute_error(y_test, pred)
                
                model_results[model_name] = {
                    'r2': r2,
                    'rmse': rmse,
                    'mae': mae,
                    'predictions': pred.tolist()
                }
                
                print(f"{model_name}: R² = {r2:.4f}, RMSE = {rmse:.4f}, MAE = {mae:.4f}")
                
            except Exception as e:
                print(f"Error evaluating {model_name}: {e}")
                model_results[model_name] = None
        
        # Evaluate ensemble
        if 'ensemble' in predictions:
            ensemble_pred = predictions['ensemble']
            ensemble_r2 = r2_score(y_test, ensemble_pred)
            ensemble_rmse = np.sqrt(mean_squared_error(y_test, ensemble_pred))
            ensemble_mae = mean_absolute_error(y_test, ensemble_pred)
            
            model_results['ensemble'] = {
                'r2': ensemble_r2,
                'rmse': ensemble_rmse,
                'mae': ensemble_mae,
                'predictions': ensemble_pred.tolist()
            }
            
            print(f"Ensemble: R² = {ensemble_r2:.4f}, RMSE = {ensemble_rmse:.4f}, MAE = {ensemble_mae:.4f}")
        
        self.evaluation_results['yield_prediction'] = {
            'model_results': model_results,
            'test_data': {
                'y_true': y_test.tolist(),
                'n_samples': len(y_test)
            }
        }
        
        return model_results
    
    def evaluate_crop_recommendation(self, test_data):
        """Evaluate crop recommendation models"""
        print("\n" + "="*50)
        print("EVALUATING CROP RECOMMENDATION MODELS")
        print("="*50)
        
        X_test = test_data['X_test']
        y_test = test_data['y_test_crop']
        
        # Get predictions from all models
        model_results = {}
        
        for model_name, model in self.crop_recommender.models.items():
            try:
                # Scale features
                X_test_scaled = self.crop_recommender.scaler.transform(X_test)
                X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns, index=X_test.index)
                
                # Get predictions
                pred = model.predict(X_test_scaled)
                pred_proba = model.predict_proba(X_test_scaled) if hasattr(model, 'predict_proba') else None
                
                # Calculate metrics
                accuracy = accuracy_score(y_test, pred)
                
                # Get classification report
                report = classification_report(y_test, pred, output_dict=True)
                
                model_results[model_name] = {
                    'accuracy': accuracy,
                    'classification_report': report,
                    'predictions': pred.tolist(),
                    'probabilities': pred_proba.tolist() if pred_proba is not None else None
                }
                
                print(f"{model_name}: Accuracy = {accuracy:.4f}")
                
            except Exception as e:
                print(f"Error evaluating {model_name}: {e}")
                model_results[model_name] = None
        
        self.evaluation_results['crop_recommendation'] = {
            'model_results': model_results,
            'test_data': {
                'y_true': y_test.tolist(),
                'n_samples': len(y_test)
            }
        }
        
        return model_results
    
    def create_evaluation_plots(self, output_dir: str = "evaluation_results"):
        """Create evaluation plots"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Yield prediction plots
        if 'yield_prediction' in self.evaluation_results:
            self._plot_yield_evaluation(output_dir)
        
        # Crop recommendation plots
        if 'crop_recommendation' in self.evaluation_results:
            self._plot_crop_evaluation(output_dir)
    
    def _plot_yield_evaluation(self, output_dir: str):
        """Create yield prediction evaluation plots"""
        results = self.evaluation_results['yield_prediction']
        model_results = results['model_results']
        y_true = results['test_data']['y_true']
        
        # Model comparison plot
        plt.figure(figsize=(15, 10))
        
        # R² scores
        plt.subplot(2, 3, 1)
        models = [name for name, result in model_results.items() if result is not None]
        r2_scores = [result['r2'] for result in model_results.values() if result is not None]
        plt.bar(models, r2_scores)
        plt.title('Model R² Scores')
        plt.ylabel('R² Score')
        plt.xticks(rotation=45)
        
        # RMSE scores
        plt.subplot(2, 3, 2)
        rmse_scores = [result['rmse'] for result in model_results.values() if result is not None]
        plt.bar(models, rmse_scores)
        plt.title('Model RMSE Scores')
        plt.ylabel('RMSE')
        plt.xticks(rotation=45)
        
        # MAE scores
        plt.subplot(2, 3, 3)
        mae_scores = [result['mae'] for result in model_results.values() if result is not None]
        plt.bar(models, mae_scores)
        plt.title('Model MAE Scores')
        plt.ylabel('MAE')
        plt.xticks(rotation=45)
        
        # Actual vs Predicted (Ensemble)
        if 'ensemble' in model_results and model_results['ensemble'] is not None:
            plt.subplot(2, 3, 4)
            ensemble_pred = model_results['ensemble']['predictions']
            plt.scatter(y_true, ensemble_pred, alpha=0.6)
            plt.plot([min(y_true), max(y_true)], [min(y_true), max(y_true)], 'r--', lw=2)
            plt.xlabel('Actual Yield')
            plt.ylabel('Predicted Yield')
            plt.title('Actual vs Predicted (Ensemble)')
            
            # Residuals plot
            plt.subplot(2, 3, 5)
            residuals = np.array(y_true) - np.array(ensemble_pred)
            plt.scatter(ensemble_pred, residuals, alpha=0.6)
            plt.axhline(y=0, color='r', linestyle='--')
            plt.xlabel('Predicted Yield')
            plt.ylabel('Residuals')
            plt.title('Residuals Plot (Ensemble)')
        
        # Feature importance (if available)
        plt.subplot(2, 3, 6)
        if hasattr(self.yield_predictor, 'feature_importance') and self.yield_predictor.feature_importance:
            importance = self.yield_predictor.get_feature_importance()
            features = list(importance.keys())[:10]
            importances = list(importance.values())[:10]
            plt.barh(features, importances)
            plt.title('Top 10 Feature Importance')
            plt.xlabel('Importance')
        else:
            plt.text(0.5, 0.5, 'Feature importance\nnot available', 
                    ha='center', va='center', transform=plt.gca().transAxes)
            plt.title('Feature Importance')
        
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'yield_evaluation.png'), dpi=300, bbox_inches='tight')
        plt.close()
    
    def _plot_crop_evaluation(self, output_dir: str):
        """Create crop recommendation evaluation plots"""
        results = self.evaluation_results['crop_recommendation']
        model_results = results['model_results']
        y_true = results['test_data']['y_true']
        
        # Model accuracy comparison
        plt.figure(figsize=(12, 8))
        
        # Accuracy scores
        plt.subplot(2, 2, 1)
        models = [name for name, result in model_results.items() if result is not None]
        accuracies = [result['accuracy'] for result in model_results.values() if result is not None]
        plt.bar(models, accuracies)
        plt.title('Model Accuracy Scores')
        plt.ylabel('Accuracy')
        plt.xticks(rotation=45)
        
        # Confusion matrix for best model
        if models:
            best_model = models[np.argmax(accuracies)]
            best_result = model_results[best_model]
            
            plt.subplot(2, 2, 2)
            from sklearn.metrics import confusion_matrix
            cm = confusion_matrix(y_true, best_result['predictions'])
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
            plt.title(f'Confusion Matrix ({best_model})')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
        
        # Class distribution
        plt.subplot(2, 2, 3)
        unique, counts = np.unique(y_true, return_counts=True)
        plt.bar(unique, counts)
        plt.title('Class Distribution (True Labels)')
        plt.ylabel('Count')
        plt.xlabel('Crop')
        plt.xticks(rotation=45)
        
        # Model comparison table
        plt.subplot(2, 2, 4)
        plt.axis('off')
        table_data = []
        for model, result in model_results.items():
            if result is not None:
                table_data.append([model, f"{result['accuracy']:.4f}"])
        
        if table_data:
            table = plt.table(cellText=table_data, 
                            colLabels=['Model', 'Accuracy'],
                            cellLoc='center', loc='center')
            table.auto_set_font_size(False)
            table.set_fontsize(10)
            table.scale(1, 1.5)
            plt.title('Model Performance Summary')
        
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'crop_evaluation.png'), dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_evaluation_report(self, output_dir: str = "evaluation_results"):
        """Generate comprehensive evaluation report"""
        os.makedirs(output_dir, exist_ok=True)
        
        report = {
            "evaluation_summary": {
                "timestamp": pd.Timestamp.now().isoformat(),
                "models_evaluated": len(self.evaluation_results),
                "evaluation_results": self.evaluation_results
            }
        }
        
        # Add summary statistics
        if 'yield_prediction' in self.evaluation_results:
            yield_results = self.evaluation_results['yield_prediction']['model_results']
            best_yield_model = max(
                [(name, result) for name, result in yield_results.items() if result is not None],
                key=lambda x: x[1]['r2']
            )
            report["yield_prediction_summary"] = {
                "best_model": best_yield_model[0],
                "best_r2": best_yield_model[1]['r2'],
                "best_rmse": best_yield_model[1]['rmse'],
                "best_mae": best_yield_model[1]['mae']
            }
        
        if 'crop_recommendation' in self.evaluation_results:
            crop_results = self.evaluation_results['crop_recommendation']['model_results']
            best_crop_model = max(
                [(name, result) for name, result in crop_results.items() if result is not None],
                key=lambda x: x[1]['accuracy']
            )
            report["crop_recommendation_summary"] = {
                "best_model": best_crop_model[0],
                "best_accuracy": best_crop_model[1]['accuracy']
            }
        
        # Save report
        report_path = os.path.join(output_dir, 'evaluation_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 Evaluation report saved to: {report_path}")
        
        return report
    
    def run_evaluation(self, database_path: str = "../complete_agricultural_database.json"):
        """Run complete evaluation pipeline"""
        print("🔍 Starting Model Evaluation Pipeline")
        print("="*60)
        
        # Load models
        if not self.load_models():
            print("❌ Failed to load models")
            return False
        
        # Load test data
        print("📊 Loading test data...")
        test_data = self.load_test_data(database_path)
        if test_data is None:
            print("❌ Failed to load test data")
            return False
        
        # Evaluate yield prediction
        print("🌾 Evaluating yield prediction models...")
        yield_results = self.evaluate_yield_prediction(test_data)
        
        # Evaluate crop recommendation
        print("🌱 Evaluating crop recommendation models...")
        crop_results = self.evaluate_crop_recommendation(test_data)
        
        # Create plots
        print("📈 Creating evaluation plots...")
        self.create_evaluation_plots()
        
        # Generate report
        print("📋 Generating evaluation report...")
        report = self.generate_evaluation_report()
        
        print("\n✅ Evaluation completed successfully!")
        print("Results saved in 'evaluation_results' directory")
        
        return True

def main():
    """Main evaluation function"""
    evaluator = ModelEvaluator()
    success = evaluator.run_evaluation()
    
    if success:
        print("\n🎉 Model evaluation completed successfully!")
    else:
        print("\n❌ Model evaluation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
