// src/contexts/CMS69EvaluationContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processCMS69Response, type CMS69Result } from '../utils/cms69Parser';
import { useMeasurementPeriod } from './MeasurementPeriodContext';
import { getLibraryEvaluationPeriod } from '../utils/evaluationPeriods';

interface CMS69EvaluationContextType {
  cms69Result: CMS69Result | null;
  loading: boolean;
  error: Error | null;
  currentPatientId: string | undefined;
}

const CMS69EvaluationContext = createContext<CMS69EvaluationContextType | undefined>(undefined);

interface CMS69EvaluationProviderProps {
  children: ReactNode;
  patientId: string | undefined;
}

export const CMS69EvaluationProvider: React.FC<CMS69EvaluationProviderProps> = ({ 
  children, 
  patientId 
}) => {
  const [cms69Result, setCms69Result] = useState<CMS69Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string | undefined>(undefined);

  // Get measurement period from context
  const { measurementPeriod, isInitialized } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId || !isInitialized) {
      setCms69Result(null);
      setCurrentPatientId(undefined);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPatientId(patientId);
    
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

  return (
    <CMS69EvaluationContext.Provider
      value={{
        cms69Result,
        loading,
        error,
        currentPatientId
      }}
    >
      {children}
    </CMS69EvaluationContext.Provider>
  );
};

export const useCMS69EvaluationContext = (): CMS69EvaluationContextType => {
  const context = useContext(CMS69EvaluationContext);
  if (context === undefined) {
    throw new Error('useCMS69EvaluationContext must be used within a CMS69EvaluationProvider');
  }
  return context;
};