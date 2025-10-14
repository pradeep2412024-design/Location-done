"""
Crop Recommendation System
Uses classification and ranking algorithms to recommend optimal crops
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import lightgbm as lgb
import joblib
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

class CropRecommender:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.crop_rankings = {}
        self.is_trained = False
        
    def initialize_models(self):
        """Initialize various classification models"""
        self.models = {
            'random_forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            ),
            'xgboost': xgb.XGBClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            ),
            'lightgbm': lgb.LGBMClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            ),
            'logistic_regression': LogisticRegression(
                random_state=42,
                max_iter=1000
            ),
            'svm': SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                random_state=42,
                probability=True
            )
        }
    
    def train_models(self, X_train: pd.DataFrame, y_train: pd.Series,
                     X_val: pd.DataFrame = None, y_val: pd.Series = None) -> Dict:
        """Train all models and return performance metrics"""
        if not self.models:
            self.initialize_models()
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns, index=X_train.index)
        
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            X_val_scaled = pd.DataFrame(X_val_scaled, columns=X_val.columns, index=X_val.index)
        else:
            X_val_scaled = None
        
        model_scores = {}
        
        for name, model in self.models.items():
            print(f"Training {name}...")
            
            try:
                # Train the model
                model.fit(X_train_scaled, y_train)
                
                # Calculate training score
                train_pred = model.predict(X_train_scaled)
                train_accuracy = accuracy_score(y_train, train_pred)
                
                # Calculate validation score if validation data provided
                if X_val_scaled is not None and y_val is not None:
                    val_pred = model.predict(X_val_scaled)
                    val_accuracy = accuracy_score(y_val, val_pred)
                else:
                    val_accuracy = None
                
                # Cross-validation score
                cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
                cv_mean = cv_scores.mean()
                cv_std = cv_scores.std()
                
                model_scores[name] = {
                    'train_accuracy': train_accuracy,
                    'val_accuracy': val_accuracy,
                    'cv_mean': cv_mean,
                    'cv_std': cv_std
                }
                
                print(f"{name} - Train Accuracy: {train_accuracy:.4f}, CV Accuracy: {cv_mean:.4f} ± {cv_std:.4f}")
                
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
                        scoring='accuracy',
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
    
    def create_crop_rankings(self, X: pd.DataFrame, y: pd.Series) -> Dict:
        """Create crop suitability rankings based on multiple factors"""
        if not self.is_trained:
            raise ValueError("Models must be trained before creating rankings")
        
        # Get probability predictions from all models
        X_scaled = self.scaler.transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
        
        crop_probabilities = {}
        
        for name, model in self.models.items():
            try:
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba(X_scaled)
                    classes = model.classes_
                    
                    for i, crop in enumerate(classes):
                        if crop not in crop_probabilities:
                            crop_probabilities[crop] = []
                        crop_probabilities[crop].extend(proba[:, i])
                        
            except Exception as e:
                print(f"Error getting probabilities from {name}: {e}")
        
        # Calculate average probabilities and rankings
        crop_rankings = {}
        for crop, probs in crop_probabilities.items():
            if probs:
                avg_prob = np.mean(probs)
                crop_rankings[crop] = avg_prob
        
        # Sort by probability
        sorted_crops = sorted(crop_rankings.items(), key=lambda x: x[1], reverse=True)
        self.crop_rankings = dict(sorted_crops)
        
        return self.crop_rankings
    
    def recommend_crops(self, X: pd.DataFrame, top_k: int = 5) -> List[Dict]:
        """Recommend top-k crops for given conditions"""
        if not self.is_trained:
            raise ValueError("Models must be trained before making recommendations")
        
        # Get probability predictions from all models
        X_scaled = self.scaler.transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
        
        all_predictions = {}
        
        for name, model in self.models.items():
            try:
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba(X_scaled)
                    classes = model.classes_
                    
                    for i, crop in enumerate(classes):
                        if crop not in all_predictions:
                            all_predictions[crop] = []
                        all_predictions[crop].extend(proba[:, i])
                        
            except Exception as e:
                print(f"Error getting predictions from {name}: {e}")
        
        # Calculate average probabilities
        crop_scores = {}
        for crop, probs in all_predictions.items():
            if probs:
                avg_score = np.mean(probs)
                crop_scores[crop] = avg_score
        
        # Sort by score and return top-k
        sorted_crops = sorted(crop_scores.items(), key=lambda x: x[1], reverse=True)
        
        recommendations = []
        for i, (crop, score) in enumerate(sorted_crops[:top_k]):
            recommendations.append({
                'crop': crop,
                'score': score,
                'rank': i + 1,
                'confidence': 'High' if score > 0.7 else 'Medium' if score > 0.4 else 'Low'
            })
        
        return recommendations
    
    def get_crop_suitability_factors(self, X: pd.DataFrame, crop: str) -> Dict:
        """Analyze factors that make a crop suitable for given conditions"""
        if not self.is_trained:
            raise ValueError("Models must be trained before analyzing factors")
        
        # Get feature importance from tree-based models
        feature_importance = {}
        
        for name, model in self.models.items():
            if hasattr(model, 'feature_importances_'):
                importance = dict(zip(X.columns, model.feature_importances_))
                for feature, imp in importance.items():
                    if feature not in feature_importance:
                        feature_importance[feature] = []
                    feature_importance[feature].append(imp)
        
        # Calculate average importance
        avg_importance = {}
        for feature, importances in feature_importance.items():
            avg_importance[feature] = np.mean(importances)
        
        # Sort by importance
        sorted_features = sorted(avg_importance.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'crop': crop,
            'top_factors': dict(sorted_features[:10]),
            'analysis': self._analyze_crop_factors(crop, sorted_features[:5])
        }
    
    def _analyze_crop_factors(self, crop: str, top_factors: List[Tuple]) -> str:
        """Generate human-readable analysis of crop suitability factors"""
        analysis_parts = []
        
        for factor, importance in top_factors:
            if 'soil' in factor.lower():
                analysis_parts.append(f"Soil {factor.split('_')[1]} is crucial for {crop}")
            elif 'temp' in factor.lower():
                analysis_parts.append(f"Temperature conditions significantly affect {crop} suitability")
            elif 'moisture' in factor.lower():
                analysis_parts.append(f"Moisture levels are important for {crop} growth")
            elif 'climate' in factor.lower():
                analysis_parts.append(f"Climate zone compatibility is key for {crop}")
        
        return ". ".join(analysis_parts) + "."
    
    def evaluate_model(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict:
        """Evaluate model performance on test set"""
        if not self.is_trained:
            raise ValueError("Models must be trained before evaluation")
        
        X_test_scaled = self.scaler.transform(X_test)
        X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns, index=X_test.index)
        
        evaluation_results = {}
        
        for name, model in self.models.items():
            try:
                pred = model.predict(X_test_scaled)
                accuracy = accuracy_score(y_test, pred)
                
                # Get classification report
                report = classification_report(y_test, pred, output_dict=True)
                
                evaluation_results[name] = {
                    'accuracy': accuracy,
                    'classification_report': report
                }
                
            except Exception as e:
                print(f"Error evaluating {name}: {e}")
                evaluation_results[name] = None
        
        return evaluation_results
    
    def get_crop_recommendations_with_reasons(self, X: pd.DataFrame, top_k: int = 5) -> List[Dict]:
        """Get crop recommendations with detailed reasoning"""
        recommendations = self.recommend_crops(X, top_k)
        
        for rec in recommendations:
            crop = rec['crop']
            factors = self.get_crop_suitability_factors(X, crop)
            
            rec['suitability_factors'] = factors['top_factors']
            rec['analysis'] = factors['analysis']
            rec['recommendation_reasons'] = self._generate_recommendation_reasons(crop, factors['top_factors'])
        
        return recommendations
    
    def _generate_recommendation_reasons(self, crop: str, factors: Dict) -> List[str]:
        """Generate human-readable reasons for crop recommendation"""
        reasons = []
        
        # Analyze top factors
        for factor, importance in list(factors.items())[:3]:
            if 'soil_ph' in factor and importance > 0.1:
                reasons.append(f"Optimal soil pH conditions for {crop}")
            elif 'soil_moisture' in factor and importance > 0.1:
                reasons.append(f"Good soil moisture levels for {crop} cultivation")
            elif 'avg_temperature' in factor and importance > 0.1:
                reasons.append(f"Favorable temperature conditions for {crop}")
            elif 'climate_factor' in factor and importance > 0.1:
                reasons.append(f"Climate zone is well-suited for {crop}")
            elif 'district_factor' in factor and importance > 0.1:
                reasons.append(f"Location provides good growing conditions for {crop}")
        
        # Add general reasons based on crop type
        if crop in ['Rice', 'Wheat', 'Maize']:
            reasons.append(f"{crop} is a staple crop with good market demand")
        elif crop in ['Sugarcane', 'Cotton']:
            reasons.append(f"{crop} is a high-value cash crop")
        elif crop in ['Chickpea', 'Lentil', 'Black Gram']:
            reasons.append(f"{crop} improves soil fertility through nitrogen fixation")
        
        return reasons[:5]  # Limit to 5 reasons
    
    def save_model(self, filepath: str):
        """Save trained models and scaler"""
        model_data = {
            'models': self.models,
            'scaler': self.scaler,
            'crop_rankings': self.crop_rankings,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained models and scaler"""
        model_data = joblib.load(filepath)
        self.models = model_data['models']
        self.scaler = model_data['scaler']
        self.crop_rankings = model_data['crop_rankings']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")
