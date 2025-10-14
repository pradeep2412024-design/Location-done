import { useState, useCallback } from 'react';

export const useMLPredictions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makePrediction = useCallback(async (type, inputData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ml-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          inputData: inputData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictYield = useCallback((inputData) => 
    makePrediction('yield_prediction', inputData), [makePrediction]);

  const recommendCrops = useCallback((inputData) => 
    makePrediction('crop_recommendation', inputData), [makePrediction]);

  const getComprehensiveAnalysis = useCallback((inputData) => 
    makePrediction('comprehensive_analysis', inputData), [makePrediction]);

  return {
    loading,
    error,
    predictYield,
    recommendCrops,
    getComprehensiveAnalysis,
    makePrediction
  };
};
