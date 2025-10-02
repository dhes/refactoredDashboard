// src/hooks/usePalliativeCareEvaluation.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processPalliativeCareEvidence, type PalliativeCareEvidence } from '../utils/palliativeCareEvidenceExtractor';
import { useMeasurementPeriod } from '../contexts/MeasurementPeriodContext';
import { getLibraryEvaluationPeriod } from '../utils/evaluationPeriods';

export interface PalliativeCareEvaluationResult {
  hasPalliativeCare: boolean;
  evidenceList: PalliativeCareEvidence[];
  evidenceByCategory: Record<string, PalliativeCareEvidence[]>;
  totalEvidenceCount: number;
}

export const usePalliativeCareEvaluation = (patientId: string | undefined) => {
  const [palliativeCareResult, setPalliativeCareResult] = useState<PalliativeCareEvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId) {
      setPalliativeCareResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const evaluationPeriod = getLibraryEvaluationPeriod(measurementPeriod);
    
    fhirClient.evaluateLibrary(
      'PalliativeCare', // Library ID
      patientId,
      evaluationPeriod.start,
      evaluationPeriod.end
    )
      .then(response => {
        const processed = processPalliativeCareEvidence(response);
        setPalliativeCareResult({
          ...processed,
          totalEvidenceCount: processed.evidenceList.length
        });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod]);

  // Utility functions
  const getEvidenceCountByType = (category: string): number => {
    return palliativeCareResult?.evidenceByCategory[category]?.length || 0;
  };

  const hasEvidenceOfType = (category: string): boolean => {
    return getEvidenceCountByType(category) > 0;
  };

  const getEvidenceSummary = (): string => {
    if (!palliativeCareResult) return '';
    
    const counts = Object.entries(palliativeCareResult.evidenceByCategory)
      .filter(([_, evidence]) => evidence.length > 0)
      .map(([category, evidence]) => {
        const categoryName = category.replace('Palliative Care ', '').trim();
        return `${evidence.length} ${categoryName}`;
      });
    
    return counts.length > 0 ? counts.join(', ') : 'No evidence found';
  };

  return { 
    palliativeCareResult,
    measurementPeriod,
    loading, 
    error,
    // Utility functions
    getEvidenceCountByType,
    hasEvidenceOfType,
    getEvidenceSummary
  };
};