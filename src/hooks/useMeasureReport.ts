// src/hooks/useMeasureReport.ts
import { useState, useEffect } from 'react';
import type { MeasureReport } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';
import { useMeasurementPeriod } from '../contexts/MeasurementPeriodContext';

export const useMeasureReport = (patientId: string | undefined, measureId: string) => {
  const [measureReport, setMeasureReport] = useState<MeasureReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();
  
  useEffect(() => {
    if (!patientId) {
      setMeasureReport(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const periodStart = measurementPeriod.start;
    const periodEnd = measurementPeriod.end;
    
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
  }, [patientId, measureId, refreshTrigger, measurementPeriod]); // Add refreshTrigger to dependencies
  
  const refresh = () => setRefreshTrigger(prev => prev + 1);
  
  return { measureReport, loading, error, refresh };
};