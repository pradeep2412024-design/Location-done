import React, { useState, useEffect } from 'react';
import { useMLPredictions } from '../hooks/useMLPredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Leaf, BarChart3, Loader2 } from 'lucide-react';

const DashboardIntegration = () => {
  const { loading, error, predictYield, recommendCrops, getComprehensiveAnalysis } = useMLPredictions();
  const [predictions, setPredictions] = useState({});
  const [farmData, setFarmData] = useState({
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

  // Auto-predict when farm data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleComprehensiveAnalysis();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [farmData]);

  const handleComprehensiveAnalysis = async () => {
    try {
      const result = await getComprehensiveAnalysis(farmData);
      setPredictions(prev => ({ ...prev, comprehensive: result }));
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleYieldPrediction = async () => {
    try {
      const result = await predictYield(farmData);
      setPredictions(prev => ({ ...prev, yield: result }));
    } catch (err) {
      console.error('Yield prediction failed:', err);
    }
  };

  const handleCropRecommendation = async () => {
    try {
      const result = await recommendCrops(farmData);
      setPredictions(prev => ({ ...prev, crops: result }));
    } catch (err) {
      console.error('Crop recommendation failed:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Yield Prediction Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Yield Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.yield ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {predictions.yield.predictions.ensemble_yield} tons/hectare
              </div>
              {predictions.yield.predictions.confidence_interval && (
                <div className="text-sm text-gray-600">
                  Range: {predictions.yield.predictions.confidence_interval.lower} - {predictions.yield.predictions.confidence_interval.upper}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Button 
                onClick={handleYieldPrediction}
                disabled={loading}
                size="sm"
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Predict Yield'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crop Recommendation Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5" />
            Crop Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.crops ? (
            <div className="space-y-2">
              {predictions.crops.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{rec.crop}</span>
                  <Badge variant={rec.confidence === 'High' ? 'default' : 'secondary'}>
                    {(rec.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Button 
                onClick={handleCropRecommendation}
                disabled={loading}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Recommendations'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprehensive Analysis Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.comprehensive ? (
            <div className="space-y-3">
              {predictions.comprehensive.yield_prediction && (
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-sm font-medium text-blue-900">Yield</div>
                  <div className="text-lg font-bold text-blue-600">
                    {predictions.comprehensive.yield_prediction.ensemble_yield} tons/hectare
                  </div>
                </div>
              )}
              
              {predictions.comprehensive.crop_recommendations && (
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-sm font-medium text-green-900">Top Crop</div>
                  <div className="font-bold text-green-600">
                    {predictions.comprehensive.crop_recommendations[0]?.crop}
                  </div>
                  <div className="text-xs text-green-700">
                    {predictions.comprehensive.crop_recommendations[0]?.confidence} confidence
                  </div>
                </div>
              )}

              {predictions.comprehensive.analysis_summary && (
                <div className="text-xs text-gray-600 mt-2">
                  {predictions.comprehensive.analysis_summary}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">
                AI analysis will appear here automatically
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardIntegration;
