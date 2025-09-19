// src/hooks/useHospiceEvaluation.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processHospiceEvidence, type HospiceEvidence } from '../utils/hospiceEvidenceExtractor';
import { useMeasurementPeriod, getCurrentYearPeriod } from '../contexts/MeasurementPeriodContext';

export interface HospiceEvaluationResult {
  hasHospiceServices: boolean;
  evidenceList: HospiceEvidence[];
  evidenceByCategory: Record<string, HospiceEvidence[]>;
  totalEvidenceCount: number;
}

export const useHospiceEvaluation = (patientId: string | undefined) => {
  const [hospiceResult, setHospiceResult] = useState<HospiceEvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId) {
      setHospiceResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    // For Real Time mode, use current year period for API call
    // but keep year 1900 in measurementPeriod for CQL Real Time Mode detection
    const apiPeriod = measurementPeriod.isRealTime 
      ? getCurrentYearPeriod()
      : { start: measurementPeriod.start, end: measurementPeriod.end };
    
    fhirClient.evaluateLibrary(
      'Hospice', // Library ID
      patientId,
      apiPeriod.start,
      apiPeriod.end
    )
      .then(response => {
        const processed = processHospiceEvidence(response);
        setHospiceResult({
          ...processed,
          totalEvidenceCount: processed.evidenceList.length
        });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod]);

  // Utility functions
  const getEvidenceCountByType = (category: string): number => {
    return hospiceResult?.evidenceByCategory[category]?.length || 0;
  };

  const hasEvidenceOfType = (category: string): boolean => {
    return getEvidenceCountByType(category) > 0;
  };

  const getEvidenceSummary = (): string => {
    if (!hospiceResult) return '';
    
    const counts = Object.entries(hospiceResult.evidenceByCategory)
      .filter(([_, evidence]) => evidence.length > 0)
      .map(([category, evidence]) => {
        const categoryName = category.replace('With', '').replace(/([A-Z])/g, ' $1').trim();
        return `${evidence.length} ${categoryName}`;
      });
    
    return counts.length > 0 ? counts.join(', ') : 'No evidence found';
  };

  return { 
    hospiceResult,
    measurementPeriod,
    loading, 
    error,
    // Utility functions
    getEvidenceCountByType,
    hasEvidenceOfType,
    getEvidenceSummary
  };
};