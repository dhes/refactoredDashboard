// src/hooks/useQualityAnalytics.ts

import { useState, useEffect } from 'react';
import { 
  qualityAnalyticsClient, 
  type MeasureEvaluationOptions,
  type MeasureEvaluationResult,
  type PopulationAnalysisResult
} from '../services';

export function useQualityAnalytics(measureId: string, patientIds: string[], options?: MeasureEvaluationOptions) {
  const [data, setData] = useState<MeasureEvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!measureId || !patientIds.length) return;

    setLoading(true);
    setError(null);

    qualityAnalyticsClient.evaluateMeasure(measureId, patientIds, options)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [measureId, JSON.stringify(patientIds), JSON.stringify(options)]);

  return { data, loading, error };
}

export function usePopulationAnalysis(measureId: string, patientId: string) {
  const [analysis, setAnalysis] = useState<PopulationAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!measureId || !patientId) return;

    setLoading(true);
    setError(null);

    // Check if the method exists on the client before calling
    if (typeof qualityAnalyticsClient.analyzePopulationExclusion === 'function') {
      qualityAnalyticsClient.analyzePopulationExclusion(measureId, patientId)
        .then(setAnalysis)
        .catch(setError)
        .finally(() => setLoading(false));
    } else {
      // Fallback: create mock analysis or call alternative method
      console.warn('analyzePopulationExclusion method not implemented, using fallback');
      
      // You could implement a fallback here or just set an error
      setError(new Error('Population analysis not yet implemented'));
      setLoading(false);
    }
  }, [measureId, patientId]);

  return { analysis, loading, error };
}

// Additional hook for clinical guidance (your enhanced approach)
export function useClinicalGuidance(measureId: string, patientId: string, clauseResults?: any[]) {
  const [guidance, setGuidance] = useState<PopulationAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!measureId || !patientId) return;

    setLoading(true);
    setError(null);

    // This would call your enhanced analysis service
    if (typeof qualityAnalyticsClient.generateClinicalGuidance === 'function') {
      qualityAnalyticsClient.generateClinicalGuidance(measureId, patientId, clauseResults)
        .then(setGuidance)
        .catch(setError)
        .finally(() => setLoading(false));
    } else {
      // Fallback for development
      const mockGuidance: PopulationAnalysisResult = {
        excluded: true,
        reasons: [
          {
            statement: 'Initial Population',
            reason: 'Patient needs qualifying encounters',
            priority: 'high',
            category: 'visits',
            action: 'Document office visit or preventive care visit'
          }
        ],
        patientStatus: {
          eligibleForMeasure: false,
          ageQualified: true,
          visitQualified: false,
          hasScreening: false,
          currentMeasureStatus: 'not_eligible'
        },
        recommendations: [
          {
            priority: 'high',
            category: 'visits',
            message: 'Patient needs either 2+ qualifying visits OR 1+ preventive visit during the measurement period.',
            action: 'Document qualifying office visits or preventive care visits.'
          }
        ],
        nextSteps: [
          {
            step: 1,
            priority: 'immediate',
            action: 'Document qualifying office visits or preventive care visits.',
            category: 'visits'
          }
        ]
      };
      
      setTimeout(() => {
        setGuidance(mockGuidance);
        setLoading(false);
      }, 500); // Simulate API delay
    }
  }, [measureId, patientId, JSON.stringify(clauseResults)]);

  return { guidance, loading, error };
}