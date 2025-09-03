// src/hooks/usePatientAge.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { calculateCurrentAge, calculateAgeAtDate } from '../utils/ageCalculation';

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

  // Define measurement period (2026 for MADiE test cases)
  const measurementPeriod = {
    start: '2026-01-01',
    end: '2026-12-31'
  };

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
      const mpStartAge = calculateAgeAtDate(birthDate, measurementPeriod.start);
      
      setAgeResult({
        currentAge,
        mpStartAge,
        measurementPeriod
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error calculating age'));
    } finally {
      setLoading(false);
    }
  }, [patientId, birthDate]);

  return { 
    ageResult,
    measurementPeriod,
    loading, 
    error
  };
};