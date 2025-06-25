// src/hooks/useMeasureReport.ts
import { useState, useEffect } from 'react';
import type { MeasureReport } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useMeasureReport = (patientId: string | undefined, measureId: string) => {
  const [measureReport, setMeasureReport] = useState<MeasureReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setMeasureReport(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Define measurement period - current year
    const currentYear = new Date().getFullYear();
    const periodStart = `${currentYear}-01-01T00:00:00`;
    const periodEnd = `${currentYear}-12-31T23:59:59`;
    
    fhirClient.evaluateMeasure(measureId, patientId, periodStart, periodEnd)
      .then(report => {
        console.log('Measure evaluated:', report);
        setMeasureReport(report);
      })
      .catch(err => {
        console.error('Failed to evaluate measure:', err);
        setError(err);
        setMeasureReport(null);
      })
      .finally(() => setLoading(false));
  }, [patientId, measureId]);

  return { measureReport, loading, error };
};