"""
Crop Yield Prediction Model
Uses ensemble methods to predict crop yields based on soil, weather, and location data
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import cross_val_score, GridSearchCV
import xgboost as xgb
import lightgbm as lgb
import joblib
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

class CropYieldPredictor:
    def __init__(self):
        self.models = {}
        self.ensemble_weights = {}
        self.feature_importance = {}
        self.is_trained = False
        
    def initialize_models(self):
        """Initialize various regression models"""
        self.models = {
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            ),
            'xgboost': xgb.XGBRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            ),
            'lightgbm': lgb.LGBMRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            ),
            'linear_regression': LinearRegression(),
            'ridge': Ridge(alpha=1.0),
            'lasso': Lasso(alpha=0.1),
            'svr': SVR(kernel='rbf', C=1.0, gamma='scale')
        }
    
    def train_models(self, X_train: pd.DataFrame, y_train: pd.Series, 
                     X_val: pd.DataFrame = None, y_val: pd.Series = None) -> Dict:
        """Train all models and return performance metrics"""
        if not self.models:
            self.initialize_models()
        
        model_scores = {}
        
        for name, model in self.models.items():
            print(f"Training {name}...")
            
            try:
                # Train the model
                model.fit(X_train, y_train)
                
                # Calculate training score
                train_pred = model.predict(X_train)
                train_r2 = r2_score(y_train, train_pred)
                train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
                train_mae = mean_absolute_error(y_train, train_pred)
                
                # Calculate validation score if validation data provided
                if X_val is not None and y_val is not None:
                    val_pred = model.predict(X_val)
                    val_r2 = r2_score(y_val, val_pred)
                    val_rmse = np.sqrt(mean_squared_error(y_val, val_pred))
                    val_mae = mean_absolute_error(y_val, val_pred)
                else:
                    val_r2 = val_rmse = val_mae = None
                
                # Cross-validation score
                cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
                cv_mean = cv_scores.mean()
                cv_std = cv_scores.std()
                
                model_scores[name] = {
                    'train_r2': train_r2,
                    'train_rmse': train_rmse,
                    'train_mae': train_mae,
                    'val_r2': val_r2,
                    'val_rmse': val_rmse,
                    'val_mae': val_mae,
                    'cv_mean': cv_mean,
                    'cv_std': cv_std
                }
                
                # Store feature importance for tree-based models
                if hasattr(model, 'feature_importances_'):
                    self.feature_importance[name] = dict(zip(X_train.columns, model.feature_importances_))
                
                print(f"{name} - Train R²: {train_r2:.4f}, CV R²: {cv_mean:.4f} ± {cv_std:.4f}")
                
            except Exception as e:
                print(f"Error training {name}: {e}")
                model_scores[name] = None
        
        self.is_trained = True
        return model_scores
    
    def optimize_hyperparameters(self, X_train: pd.DataFrame, y_train: pd.Series) -> Dict:
        """Optimize hyperparameters for key models"""
        param_grids = {
            'random_forest': {
                'n_estimators': [50, 100, 200],
                'max_depth': [5, 10, 15],
                'min_samples_split': [2, 5, 10]
            },
            'xgboost': {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.05, 0.1, 0.2],
                'max_depth': [3, 6, 9]
            },
            'lightgbm': {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.05, 0.1, 0.2],
                'max_depth': [3, 6, 9]
            }
        }
        
        optimized_models = {}
        
        for name, param_grid in param_grids.items():
            if name in self.models:
                print(f"Optimizing {name}...")
                
                try:
                    grid_search = GridSearchCV(
                        self.models[name],
                        param_grid,
                        cv=3,
                        scoring='r2',
                        n_jobs=-1,
                        verbose=0
                    )
                    
                    grid_search.fit(X_train, y_train)
                    
                    # Update model with best parameters
                    self.models[name] = grid_search.best_estimator_
                    optimized_models[name] = {
                        'best_params': grid_search.best_params_,
                        'best_score': grid_search.best_score_
                    }
                    
                    print(f"{name} best params: {grid_search.best_params_}")
                    print(f"{name} best score: {grid_search.best_score_:.4f}")
                    
                except Exception as e:
                    print(f"Error optimizing {name}: {e}")
                    optimized_models[name] = None
        
        return optimized_models
    
    def create_ensemble(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict:
        """Create weighted ensemble of best performing models"""
        if not self.is_trained:
            raise ValueError("Models must be trained before creating ensemble")
        
        # Get validation predictions from all models
        predictions = {}
        model_weights = {}
        
        for name, model in self.models.items():
            try:
                pred = model.predict(X_val)
                r2 = r2_score(y_val, pred)
                
                # Only include models with positive R²
                if r2 > 0:
                    predictions[name] = pred
                    model_weights[name] = r2
                
            except Exception as e:
                print(f"Error getting predictions from {name}: {e}")
        
        if not predictions:
            raise ValueError("No valid model predictions available")
        
        # Normalize weights
        total_weight = sum(model_weights.values())
        self.ensemble_weights = {name: weight/total_weight for name, weight in model_weights.items()}
        
        # Create ensemble prediction
        ensemble_pred = np.zeros(len(y_val))
        for name, weight in self.ensemble_weights.items():
            ensemble_pred += weight * predictions[name]
        
        # Calculate ensemble performance
        ensemble_r2 = r2_score(y_val, ensemble_pred)
        ensemble_rmse = np.sqrt(mean_squared_error(y_val, ensemble_pred))
        ensemble_mae = mean_absolute_error(y_val, ensemble_pred)
        
        print(f"Ensemble R²: {ensemble_r2:.4f}")
        print(f"Ensemble RMSE: {ensemble_rmse:.4f}")
        print(f"Ensemble MAE: {ensemble_mae:.4f}")
        
        return {
            'ensemble_r2': ensemble_r2,
            'ensemble_rmse': ensemble_rmse,
            'ensemble_mae': ensemble_mae,
            'model_weights': self.ensemble_weights
        }
    
    def predict_yield(self, X: pd.DataFrame) -> Dict:
        """Predict yield using ensemble of models"""
        if not self.is_trained:
            raise ValueError("Models must be trained before making predictions")
        
        predictions = {}
        
        # Get predictions from individual models
        for name, model in self.models.items():
            try:
                pred = model.predict(X)
                predictions[name] = pred
            except Exception as e:
                print(f"Error getting prediction from {name}: {e}")
        
        # Create ensemble prediction
        if self.ensemble_weights:
            ensemble_pred = np.zeros(len(X))
            for name, weight in self.ensemble_weights.items():
                if name in predictions:
                    ensemble_pred += weight * predictions[name]
            
            predictions['ensemble'] = ensemble_pred
        
        return predictions
    
    def get_feature_importance(self, top_n: int = 20) -> Dict:
        """Get feature importance from tree-based models"""
        if not self.feature_importance:
            return {}
        
        # Average feature importance across models
        all_features = set()
        for model_importance in self.feature_importance.values():
            all_features.update(model_importance.keys())
        
        avg_importance = {}
        for feature in all_features:
            importances = []
            for model_importance in self.feature_importance.values():
                if feature in model_importance:
                    importances.append(model_importance[feature])
            
            if importances:
                avg_importance[feature] = np.mean(importances)
        
        # Sort by importance
        sorted_features = sorted(avg_importance.items(), key=lambda x: x[1], reverse=True)
        
        return dict(sorted_features[:top_n])
    
    def evaluate_model(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict:
        """Evaluate model performance on test set"""
        if not self.is_trained:
            raise ValueError("Models must be trained before evaluation")
        
        predictions = self.predict_yield(X_test)
        
        evaluation_results = {}
        
        for name, pred in predictions.items():
            r2 = r2_score(y_test, pred)
            rmse = np.sqrt(mean_squared_error(y_test, pred))
            mae = mean_absolute_error(y_test, pred)
            
            evaluation_results[name] = {
                'r2': r2,
                'rmse': rmse,
                'mae': mae
            }
        
        return evaluation_results
    
    def save_model(self, filepath: str):
        """Save trained models and ensemble weights"""
        model_data = {
            'models': self.models,
            'ensemble_weights': self.ensemble_weights,
            'feature_importance': self.feature_importance,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained models and ensemble weights"""
        model_data = joblib.load(filepath)
        self.models = model_data['models']
        self.ensemble_weights = model_data['ensemble_weights']
        self.feature_importance = model_data['feature_importance']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")
    
    def predict_with_confidence(self, X: pd.DataFrame) -> Dict:
        """Predict yield with confidence intervals"""
        predictions = self.predict_yield(X)
        
        if 'ensemble' in predictions:
            ensemble_pred = predictions['ensemble']
            
            # Calculate confidence interval based on individual model variance
            individual_preds = []
            for name, pred in predictions.items():
                if name != 'ensemble' and name in self.ensemble_weights:
                    individual_preds.append(pred)
            
            if individual_preds:
                pred_array = np.array(individual_preds)
                std_dev = np.std(pred_array, axis=0)
                confidence_interval = 1.96 * std_dev  # 95% confidence interval
                
                return {
                    'prediction': ensemble_pred,
                    'confidence_lower': ensemble_pred - confidence_interval,
                    'confidence_upper': ensemble_pred + confidence_interval,
                    'uncertainty': std_dev
                }
        
        return {
            'prediction': predictions.get('ensemble', predictions.get('random_forest', [0] * len(X))),
            'confidence_lower': None,
            'confidence_upper': None,
            'uncertainty': None
        }
