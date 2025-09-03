// src/hooks/useHospiceEvaluation.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processHospiceEvidence, type HospiceEvidence } from '../utils/hospiceEvidenceExtractor';

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

  // Define measurement period (2026 for MADiE test cases)
  const measurementPeriod = {
    start: '2026-01-01',
    end: '2026-12-31'
  };

  useEffect(() => {
    if (!patientId) {
      setHospiceResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.evaluateLibrary(
      'Hospice', // Library ID
      patientId,
      measurementPeriod.start,
      measurementPeriod.end
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
  }, [patientId]);

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