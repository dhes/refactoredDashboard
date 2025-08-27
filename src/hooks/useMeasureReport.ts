// src/hooks/useMeasureReport.ts
import { useState, useEffect } from 'react';
import type { MeasureReport } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useMeasureReport = (patientId: string | undefined, measureId: string) => {
  const [measureReport, setMeasureReport] = useState<MeasureReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (!patientId) {
      setMeasureReport(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const currentYear = new Date().getFullYear();
    // const periodStart = `${currentYear}-01-01`;
    // const periodEnd = `${currentYear}-12-31`;
    const periodStart = '2026-01-01';
    const periodEnd = '2026-12-31';
    
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
  }, [patientId, measureId, refreshTrigger]); // Add refreshTrigger to dependencies
  
  const refresh = () => setRefreshTrigger(prev => prev + 1);
  
  return { measureReport, loading, error, refresh };
};