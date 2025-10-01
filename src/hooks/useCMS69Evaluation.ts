// src/hooks/useCMS69Evaluation.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processCMS69Response, type CMS69Result } from '../utils/cms69Parser';
import { useMeasurementPeriod, getCurrentYearPeriod } from '../contexts/MeasurementPeriodContext';

export const useCMS69Evaluation = (patientId: string | undefined) => {
  const [cms69Result, setCms69Result] = useState<CMS69Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId) {
      setCms69Result(null);
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
      'CMS69FHIRPCSBMIScreenAndFollowUp', // Library ID
      patientId,
      apiPeriod.start,
      apiPeriod.end
    )
      .then(response => {
        const processed = processCMS69Response(response);
        setCms69Result(processed);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod]);

  return { 
    cms69Result,
    loading, 
    error
  };
};