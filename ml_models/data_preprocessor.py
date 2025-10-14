"""
Agricultural Data Preprocessor for ML Models
Handles data cleaning, feature engineering, and preparation for training
"""

import pandas as pd
import numpy as np
import json
from typing import Dict, List, Tuple, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class AgriculturalDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.target_columns = []
        
    def load_agricultural_data(self, database_path: str) -> pd.DataFrame:
        """Load and process agricultural database"""
        try:
            with open(database_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract yield data and create structured dataset
            yield_data = []
            
            for state, crops in data.get('yieldData', {}).items():
                for crop, crop_info in crops.items():
                    # Get state metadata
                    state_info = self._get_state_metadata(state, data)
                    
                    # Create feature vector for each crop-state combination
                    for district, district_factor in data.get('districtFactors', {}).get(state, {}).items():
                        if district == 'default':
                            continue
                            
                        feature_vector = {
                            'state': state,
                            'crop': crop,
                            'district': district,
                            'average_yield': crop_info.get('averageYield', 0),
                            'trend': crop_info.get('trend', 'stable'),
                            'variability': crop_info.get('variability', 0.1),
                            'district_factor': district_factor,
                            'soil_type': state_info.get('soilType', 'alluvial'),
                            'climate_zone': state_info.get('climateZone', 'north-western-plains'),
                            'climate_factor': state_info.get('climateFactor', 1.0),
                            'soil_health_factor': state_info.get('soilHealthFactor', 1.0),
                            'ph_optimal': self._get_crop_optimal_ph(crop),
                            'moisture_optimal': self._get_crop_optimal_moisture(crop),
                            'temp_optimal': self._get_crop_optimal_temp(crop),
                            'water_requirement': self._get_crop_water_requirement(crop),
                            'season': self._get_crop_season(crop),
                            'duration_days': self._get_crop_duration_days(crop)
                        }
                        
                        # Add seasonal factors
                        for season, seasonal_crops in data.get('seasonalFactors', {}).items():
                            feature_vector[f'seasonal_factor_{season}'] = seasonal_crops.get(crop, 1.0)
                        
                        yield_data.append(feature_vector)
            
            return pd.DataFrame(yield_data)
            
        except Exception as e:
            print(f"Error loading agricultural data: {e}")
            return pd.DataFrame()
    
    def _get_state_metadata(self, state: str, data: Dict) -> Dict:
        """Extract state metadata"""
        # Map states to their metadata
        state_metadata = {
            'punjab': {'soilType': 'alluvial', 'climateZone': 'north-western-plains', 
                      'climateFactor': 1.2, 'soilHealthFactor': 1.1},
            'haryana': {'soilType': 'alluvial', 'climateZone': 'north-western-plains', 
                       'climateFactor': 1.2, 'soilHealthFactor': 1.1},
            'uttar_pradesh': {'soilType': 'alluvial', 'climateZone': 'north-central-plains', 
                             'climateFactor': 1.1, 'soilHealthFactor': 1.1},
            'maharashtra': {'soilType': 'black', 'climateZone': 'west-central', 
                           'climateFactor': 1.08, 'soilHealthFactor': 1.05},
            'karnataka': {'soilType': 'red', 'climateZone': 'south-central', 
                         'climateFactor': 1.05, 'soilHealthFactor': 1.0},
            'tamil_nadu': {'soilType': 'alluvial', 'climateZone': 'south-coastal', 
                          'climateFactor': 1.18, 'soilHealthFactor': 1.15},
            'gujarat': {'soilType': 'alluvial', 'climateZone': 'west-coastal', 
                       'climateFactor': 1.12, 'soilHealthFactor': 1.08},
            'rajasthan': {'soilType': 'desert', 'climateZone': 'arid-western', 
                         'climateFactor': 0.85, 'soilHealthFactor': 0.8},
            'bihar': {'soilType': 'alluvial', 'climateZone': 'east-central-plains', 
                      'climateFactor': 1.0, 'soilHealthFactor': 1.0},
            'west_bengal': {'soilType': 'alluvial', 'climateZone': 'east-coastal', 
                           'climateFactor': 1.15, 'soilHealthFactor': 1.12},
            'madhya_pradesh': {'soilType': 'black', 'climateZone': 'central-plateau', 
                              'climateFactor': 1.0, 'soilHealthFactor': 1.0},
            'andhra_pradesh': {'soilType': 'alluvial', 'climateZone': 'south-coastal', 
                              'climateFactor': 1.15, 'soilHealthFactor': 1.12},
            'telangana': {'soilType': 'red', 'climateZone': 'south-central', 
                         'climateFactor': 1.05, 'soilHealthFactor': 1.0},
            'odisha': {'soilType': 'lateritic', 'climateZone': 'east-coastal', 
                      'climateFactor': 1.15, 'soilHealthFactor': 1.0}
        }
        
        return state_metadata.get(state, {
            'soilType': 'alluvial', 'climateZone': 'north-western-plains', 
            'climateFactor': 1.0, 'soilHealthFactor': 1.0
        })
    
    def _get_crop_optimal_ph(self, crop: str) -> float:
        """Get optimal pH for crop"""
        ph_values = {
            'Rice': 6.0, 'Wheat': 6.5, 'Maize': 6.2, 'Chickpea': 6.5,
            'Sugarcane': 6.8, 'Cotton': 6.8, 'Mustard': 6.5, 'Potato': 5.5,
            'Tomato': 6.0, 'Onion': 6.0, 'Ragi': 6.0, 'Bajra': 6.5,
            'Jowar': 6.5, 'Groundnut': 6.5, 'Soybean': 6.5, 'Sunflower': 6.5
        }
        return ph_values.get(crop, 6.5)
    
    def _get_crop_optimal_moisture(self, crop: str) -> float:
        """Get optimal moisture for crop"""
        moisture_values = {
            'Rice': 80, 'Wheat': 65, 'Maize': 75, 'Chickpea': 70,
            'Sugarcane': 85, 'Cotton': 55, 'Mustard': 60, 'Potato': 70,
            'Tomato': 65, 'Onion': 60, 'Ragi': 60, 'Bajra': 50,
            'Jowar': 55, 'Groundnut': 60, 'Soybean': 65, 'Sunflower': 60
        }
        return moisture_values.get(crop, 65)
    
    def _get_crop_optimal_temp(self, crop: str) -> float:
        """Get optimal temperature for crop"""
        temp_values = {
            'Rice': 28, 'Wheat': 22, 'Maize': 25, 'Chickpea': 25,
            'Sugarcane': 30, 'Cotton': 28, 'Mustard': 20, 'Potato': 20,
            'Tomato': 25, 'Onion': 22, 'Ragi': 25, 'Bajra': 28,
            'Jowar': 26, 'Groundnut': 25, 'Soybean': 25, 'Sunflower': 25
        }
        return temp_values.get(crop, 25)
    
    def _get_crop_water_requirement(self, crop: str) -> str:
        """Get water requirement for crop"""
        water_reqs = {
            'Rice': 'High', 'Wheat': 'Medium', 'Maize': 'Medium', 'Chickpea': 'Low',
            'Sugarcane': 'High', 'Cotton': 'Medium', 'Mustard': 'Low', 'Potato': 'Medium',
            'Tomato': 'Medium', 'Onion': 'Low', 'Ragi': 'Low', 'Bajra': 'Low',
            'Jowar': 'Low', 'Groundnut': 'Medium', 'Soybean': 'Medium', 'Sunflower': 'Medium'
        }
        return water_reqs.get(crop, 'Medium')
    
    def _get_crop_season(self, crop: str) -> str:
        """Get optimal season for crop"""
        seasons = {
            'Rice': 'kharif', 'Wheat': 'rabi', 'Maize': 'kharif', 'Chickpea': 'rabi',
            'Sugarcane': 'all', 'Cotton': 'kharif', 'Mustard': 'rabi', 'Potato': 'rabi',
            'Tomato': 'all', 'Onion': 'rabi', 'Ragi': 'kharif', 'Bajra': 'kharif',
            'Jowar': 'kharif', 'Groundnut': 'kharif', 'Soybean': 'kharif', 'Sunflower': 'rabi'
        }
        return seasons.get(crop, 'kharif')
    
    def _get_crop_duration_days(self, crop: str) -> int:
        """Get crop duration in days"""
        durations = {
            'Rice': 135, 'Wheat': 135, 'Maize': 105, 'Chickpea': 105,
            'Sugarcane': 450, 'Cotton': 165, 'Mustard': 110, 'Potato': 105,
            'Tomato': 105, 'Onion': 135, 'Ragi': 110, 'Bajra': 90,
            'Jowar': 110, 'Groundnut': 120, 'Soybean': 120, 'Sunflower': 120
        }
        return durations.get(crop, 120)
    
    def create_synthetic_soil_weather_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create synthetic soil and weather data for training"""
        np.random.seed(42)
        
        # Generate synthetic soil data based on soil type and location
        soil_data = []
        weather_data = []
        
        for _, row in df.iterrows():
            # Generate soil data based on soil type
            soil_props = self._generate_soil_properties(row['soil_type'])
            soil_data.append(soil_props)
            
            # Generate weather data based on climate zone and season
            weather_props = self._generate_weather_properties(row['climate_zone'], row['season'])
            weather_data.append(weather_props)
        
        # Add soil and weather features to dataframe
        soil_df = pd.DataFrame(soil_data)
        weather_df = pd.DataFrame(weather_data)
        
        # Combine with original data
        result_df = pd.concat([df.reset_index(drop=True), soil_df, weather_df], axis=1)
        
        return result_df
    
    def _generate_soil_properties(self, soil_type: str) -> Dict:
        """Generate soil properties based on soil type"""
        soil_profiles = {
            'alluvial': {'ph': 6.8, 'moisture': 60, 'nitrogen': 70, 'phosphorus': 50, 'potassium': 180, 'organic_matter': 3.0},
            'black': {'ph': 7.2, 'moisture': 55, 'nitrogen': 65, 'phosphorus': 45, 'potassium': 160, 'organic_matter': 2.8},
            'red': {'ph': 6.2, 'moisture': 50, 'nitrogen': 60, 'phosphorus': 40, 'potassium': 150, 'organic_matter': 2.5},
            'lateritic': {'ph': 5.8, 'moisture': 45, 'nitrogen': 55, 'phosphorus': 35, 'potassium': 140, 'organic_matter': 2.2},
            'desert': {'ph': 7.5, 'moisture': 30, 'nitrogen': 40, 'phosphorus': 25, 'potassium': 120, 'organic_matter': 1.5}
        }
        
        base_props = soil_profiles.get(soil_type, soil_profiles['alluvial'])
        
        # Add some randomness
        return {
            'soil_ph': max(5.0, min(8.5, base_props['ph'] + np.random.normal(0, 0.3))),
            'soil_moisture': max(20, min(90, base_props['moisture'] + np.random.normal(0, 8))),
            'soil_nitrogen': max(20, min(100, base_props['nitrogen'] + np.random.normal(0, 10))),
            'soil_phosphorus': max(15, min(80, base_props['phosphorus'] + np.random.normal(0, 8))),
            'soil_potassium': max(50, min(250, base_props['potassium'] + np.random.normal(0, 20))),
            'soil_organic_matter': max(1.0, min(5.0, base_props['organic_matter'] + np.random.normal(0, 0.3)))
        }
    
    def _generate_weather_properties(self, climate_zone: str, season: str) -> Dict:
        """Generate weather properties based on climate zone and season"""
        climate_profiles = {
            'north-western-plains': {'temp': 25, 'humidity': 60, 'rainfall': 4, 'wind_speed': 8},
            'north-central-plains': {'temp': 26, 'humidity': 65, 'rainfall': 5, 'wind_speed': 7},
            'east-central-plains': {'temp': 27, 'humidity': 70, 'rainfall': 6, 'wind_speed': 6},
            'east-coastal': {'temp': 28, 'humidity': 75, 'rainfall': 8, 'wind_speed': 9},
            'south-coastal': {'temp': 29, 'humidity': 80, 'rainfall': 10, 'wind_speed': 10},
            'west-coastal': {'temp': 28, 'humidity': 70, 'rainfall': 7, 'wind_speed': 8},
            'west-central': {'temp': 27, 'humidity': 65, 'rainfall': 5, 'wind_speed': 7},
            'south-central': {'temp': 26, 'humidity': 60, 'rainfall': 4, 'wind_speed': 6},
            'arid-western': {'temp': 30, 'humidity': 40, 'rainfall': 2, 'wind_speed': 12},
            'central-plateau': {'temp': 28, 'humidity': 55, 'rainfall': 4, 'wind_speed': 8}
        }
        
        base_weather = climate_profiles.get(climate_zone, climate_profiles['north-western-plains'])
        
        # Adjust for season
        seasonal_adjustments = {
            'kharif': {'temp': 3, 'humidity': 15, 'rainfall': 8},
            'rabi': {'temp': -5, 'humidity': -10, 'rainfall': -2},
            'summer': {'temp': 8, 'humidity': -20, 'rainfall': -1},
            'all': {'temp': 0, 'humidity': 0, 'rainfall': 0}
        }
        
        adjustment = seasonal_adjustments.get(season, seasonal_adjustments['kharif'])
        
        return {
            'avg_temperature': max(15, min(45, base_weather['temp'] + adjustment['temp'] + np.random.normal(0, 2))),
            'humidity': max(30, min(95, base_weather['humidity'] + adjustment['humidity'] + np.random.normal(0, 5))),
            'rainfall': max(0, min(20, base_weather['rainfall'] + adjustment['rainfall'] + np.random.normal(0, 2))),
            'wind_speed': max(2, min(20, base_weather['wind_speed'] + np.random.normal(0, 2)))
        }
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Prepare features for ML models"""
        # Encode categorical variables
        categorical_columns = ['state', 'crop', 'district', 'soil_type', 'climate_zone', 
                             'water_requirement', 'season', 'trend']
        
        for col in categorical_columns:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].astype(str))
        
        # Select numerical features
        numerical_features = [
            'average_yield', 'variability', 'district_factor', 'climate_factor', 
            'soil_health_factor', 'ph_optimal', 'moisture_optimal', 'temp_optimal',
            'duration_days', 'seasonal_factor_kharif', 'seasonal_factor_rabi', 'seasonal_factor_zaid',
            'soil_ph', 'soil_moisture', 'soil_nitrogen', 'soil_phosphorus', 'soil_potassium',
            'soil_organic_matter', 'avg_temperature', 'humidity', 'rainfall', 'wind_speed'
        ]
        
        # Add encoded categorical features
        encoded_features = [f'{col}_encoded' for col in categorical_columns if col in df.columns]
        
        self.feature_columns = numerical_features + encoded_features
        
        # Create feature matrix
        feature_df = df[self.feature_columns].copy()
        
        # Handle missing values
        feature_df = feature_df.fillna(feature_df.median())
        
        return feature_df, self.feature_columns
    
    def prepare_yield_target(self, df: pd.DataFrame) -> pd.Series:
        """Prepare yield target for regression"""
        return df['average_yield']
    
    def prepare_crop_target(self, df: pd.DataFrame) -> pd.Series:
        """Prepare crop target for classification"""
        return df['crop']
    
    def split_data(self, X: pd.DataFrame, y: pd.Series, test_size: float = 0.2) -> Tuple:
        """Split data into train and test sets"""
        return train_test_split(X, y, test_size=test_size, random_state=42)
    
    def scale_features(self, X_train: pd.DataFrame, X_test: pd.DataFrame = None) -> Tuple:
        """Scale features using StandardScaler"""
        X_train_scaled = pd.DataFrame(
            self.scaler.fit_transform(X_train),
            columns=X_train.columns,
            index=X_train.index
        )
        
        if X_test is not None:
            X_test_scaled = pd.DataFrame(
                self.scaler.transform(X_test),
                columns=X_test.columns,
                index=X_test.index
            )
            return X_train_scaled, X_test_scaled
        
        return X_train_scaled, None
    
    def save_preprocessor(self, filepath: str):
        """Save preprocessor state"""
        import joblib
        preprocessor_state = {
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_columns': self.feature_columns
        }
        joblib.dump(preprocessor_state, filepath)
    
    def load_preprocessor(self, filepath: str):
        """Load preprocessor state"""
        import joblib
        preprocessor_state = joblib.load(filepath)
        self.scaler = preprocessor_state['scaler']
        self.label_encoders = preprocessor_state['label_encoders']
        self.feature_columns = preprocessor_state['feature_columns']
