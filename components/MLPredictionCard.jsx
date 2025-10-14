import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Leaf } from 'lucide-react';

const MLPredictionCard = ({ farmData }) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const makePrediction = async (type) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          inputData: farmData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(prev => ({ ...prev, [type]: data.result }));
      }
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 AI Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => makePrediction('yield_prediction')}
            disabled={loading}
            size="sm"
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Predict Yield
          </Button>
          <Button 
            onClick={() => makePrediction('crop_recommendation')}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />}
            Recommend Crops
          </Button>
        </div>

        {predictions?.yield_prediction && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-1">🌾 Predicted Yield</h4>
            <div className="text-xl font-bold text-blue-600">
              {predictions.yield_prediction.predictions.ensemble_yield} tons/hectare
            </div>
            {predictions.yield_prediction.predictions.confidence_interval && (
              <div className="text-sm text-blue-700">
                Range: {predictions.yield_prediction.predictions.confidence_interval.lower} - {predictions.yield_prediction.predictions.confidence_interval.upper} tons/hectare
              </div>
            )}
          </div>
        )}

        {predictions?.crop_recommendation && (
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">🌱 Top Crop Recommendations</h4>
            <div className="space-y-1">
              {predictions.crop_recommendation.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{rec.crop}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">({(rec.score * 100).toFixed(0)}%)</span>
                    <Badge variant={rec.confidence === 'High' ? 'default' : 'secondary'}>
                      {rec.confidence}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MLPredictionCard;
