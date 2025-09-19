// src/hooks/usePatientAge.ts
import { useState, useEffect } from 'react';
import { calculateCurrentAge, calculateAgeAtDate } from '../utils/ageCalculation';
import { useMeasurementPeriod, getCurrentYearPeriod } from '../contexts/MeasurementPeriodContext';

export interface PatientAgeResult {
  currentAge: number | null;
  mpStartAge: number | null;
  measurementPeriod: {
    start: string;
    end: string;
  };
}

export const usePatientAge = (patientId: string | undefined, birthDate: string | undefined) => {
  const [ageResult, setAgeResult] = useState<PatientAgeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId || !birthDate) {
      setAgeResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Calculate ages directly using utility functions
    // We could also use Library/$evaluate, but for simple age calculations,
    // client-side computation is more efficient
    try {
      const currentAge = calculateCurrentAge(birthDate);
      
      // For Real Time mode, use current year period for age calculation
      // but keep measurementPeriod as-is for CQL Real Time Mode detection
      const ageCalcPeriod = measurementPeriod.isRealTime 
        ? getCurrentYearPeriod()
        : { start: measurementPeriod.start, end: measurementPeriod.end };
        
      const mpStartAge = calculateAgeAtDate(birthDate, ageCalcPeriod.start);
      
      setAgeResult({
        currentAge,
        mpStartAge,
        measurementPeriod: {
          start: measurementPeriod.start,
          end: measurementPeriod.end
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error calculating age'));
    } finally {
      setLoading(false);
    }
  }, [patientId, birthDate, measurementPeriod]);

  return { 
    ageResult,
    measurementPeriod,
    loading, 
    error
  };
};