'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Leaf, BarChart3 } from 'lucide-react';

export default function MLDemoPage() {
  const [formData, setFormData] = useState({
    state: 'punjab',
    soil_ph: 6.8,
    soil_moisture: 60,
    soil_nitrogen: 70,
    soil_phosphorus: 50,
    soil_potassium: 180,
    avg_temperature: 28,
    humidity: 60,
    rainfall: 4
  });

  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const states = [
    'punjab', 'haryana', 'uttar_pradesh', 'maharashtra', 'karnataka',
    'tamil_nadu', 'gujarat', 'rajasthan', 'bihar', 'west_bengal',
    'madhya_pradesh', 'andhra_pradesh', 'telangana', 'odisha'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field.includes('ph') || field.includes('temperature') || field.includes('humidity') || field.includes('rainfall') 
        ? parseFloat(value) 
        : parseInt(value)
    }));
  };

  const makePrediction = async (type) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          inputData: formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(prev => ({ ...prev, [type]: data.result }));
      } else {
        console.error('Prediction failed:', response.status);
      }
    } catch (error) {
      console.error('Error making prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI Agricultural Predictions
        </h1>
        <p className="text-gray-600">
          Get AI-powered yield predictions and crop recommendations based on your farm conditions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Farm Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>
                        {state.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="soil_ph">Soil pH</Label>
                <Input
                  id="soil_ph"
                  type="number"
                  step="0.1"
                  min="5.0"
                  max="8.5"
                  value={formData.soil_ph}
                  onChange={(e) => handleInputChange('soil_ph', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="soil_moisture">Soil Moisture (%)</Label>
                <Input
                  id="soil_moisture"
                  type="number"
                  min="20"
                  max="90"
                  value={formData.soil_moisture}
                  onChange={(e) => handleInputChange('soil_moisture', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="soil_nitrogen">Nitrogen Level</Label>
                <Input
                  id="soil_nitrogen"
                  type="number"
                  min="20"
                  max="100"
                  value={formData.soil_nitrogen}
                  onChange={(e) => handleInputChange('soil_nitrogen', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="soil_phosphorus">Phosphorus Level</Label>
                <Input
                  id="soil_phosphorus"
                  type="number"
                  min="15"
                  max="80"
                  value={formData.soil_phosphorus}
                  onChange={(e) => handleInputChange('soil_phosphorus', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="soil_potassium">Potassium Level</Label>
                <Input
                  id="soil_potassium"
                  type="number"
                  min="50"
                  max="250"
                  value={formData.soil_potassium}
                  onChange={(e) => handleInputChange('soil_potassium', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="avg_temperature">Temperature (°C)</Label>
                <Input
                  id="avg_temperature"
                  type="number"
                  min="15"
                  max="45"
                  value={formData.avg_temperature}
                  onChange={(e) => handleInputChange('avg_temperature', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  min="30"
                  max="95"
                  value={formData.humidity}
                  onChange={(e) => handleInputChange('humidity', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="rainfall">Rainfall (mm)</Label>
                <Input
                  id="rainfall"
                  type="number"
                  min="0"
                  max="20"
                  value={formData.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => makePrediction('yield_prediction')}
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Predict Yield
              </Button>
              <Button 
                onClick={() => makePrediction('crop_recommendation')}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />}
                Recommend Crops
              </Button>
              <Button 
                onClick={() => makePrediction('comprehensive_analysis')}
                disabled={loading}
                variant="secondary"
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Full Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>AI Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Analyzing your farm conditions...</span>
              </div>
            ) : predictions ? (
              <div className="space-y-4">
                {predictions.yield_prediction && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">🌾 Yield Prediction</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {predictions.yield_prediction.predictions.ensemble_yield} tons/hectare
                    </div>
                    {predictions.yield_prediction.predictions.confidence_interval && (
                      <div className="text-sm text-blue-700 mt-1">
                        Confidence: {predictions.yield_prediction.predictions.confidence_interval.lower} - {predictions.yield_prediction.predictions.confidence_interval.upper} tons/hectare
                      </div>
                    )}
                  </div>
                )}

                {predictions.crop_recommendation && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3">🌱 Crop Recommendations</h3>
                    <div className="space-y-2">
                      {predictions.crop_recommendation.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{rec.crop}</span>
                            <span className="text-sm text-gray-600 ml-2">({rec.score.toFixed(2)})</span>
                          </div>
                          <Badge className={getConfidenceColor(rec.confidence)}>
                            {rec.confidence}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {predictions.comprehensive_analysis && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">📊 Analysis Summary</h3>
                    <p className="text-purple-700">{predictions.comprehensive_analysis.analysis_summary}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your farm conditions and click a prediction button to get AI insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
