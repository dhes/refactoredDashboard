// src/hooks/useCMS69Evaluation.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processCMS69Response, type CMS69Result } from '../utils/cms69Parser';
import { useMeasurementPeriod } from '../contexts/MeasurementPeriodContext';
import { getLibraryEvaluationPeriod } from '../utils/evaluationPeriods';

export const useCMS69Evaluation = (patientId: string | undefined) => {
  const [cms69Result, setCms69Result] = useState<CMS69Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod, isInitialized } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId || !isInitialized) {
      setCms69Result(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const evaluationPeriod = getLibraryEvaluationPeriod(measurementPeriod);
    
    fhirClient.evaluateLibrary(
      'CMS69FHIRPCSBMIScreenAndFollowUp', // Library ID
      patientId,
      evaluationPeriod.start,
      evaluationPeriod.end
    )
      .then(response => {
        const processed = processCMS69Response(response);
        setCms69Result(processed);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod, isInitialized]);

  return { 
    cms69Result,
    loading, 
    error
  };
};