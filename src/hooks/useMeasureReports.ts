// src/hooks/useMeasureReports.ts
import { useState, useEffect } from 'react';
import type { MeasureReport } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useMeasureReports = (patientId: string | undefined) => {
  const [measureReports, setMeasureReports] = useState<MeasureReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setMeasureReports([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getMeasureReports(patientId)
      .then(setMeasureReports)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { measureReports, loading, error };
};