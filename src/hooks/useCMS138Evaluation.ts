// src/hooks/useCMS138Evaluation.ts
import { useState, useEffect } from 'react';
import { fhirClient } from '../services/fhirClient';
import { processCMS138Response, type CMS138Result } from '../utils/cms138Parser';
import { useMeasurementPeriod } from '../contexts/MeasurementPeriodContext';
import { getLibraryEvaluationPeriod } from '../utils/evaluationPeriods';

export const useCMS138Evaluation = (patientId: string | undefined) => {
  const [cms138Result, setCMS138Result] = useState<CMS138Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId) {
      setCMS138Result(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const evaluationPeriod = getLibraryEvaluationPeriod(measurementPeriod);
    
    fhirClient.evaluateLibrary(
      'CMS138FHIRPreventiveTobaccoCessation', // Main library ID
      patientId,
      evaluationPeriod.start,
      evaluationPeriod.end
    )
      .then(response => {
        const processed = processCMS138Response(response);
        setCMS138Result(processed);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod]);

  // Utility functions for easy access
  const hasPractitionerAlert = cms138Result?.practitionerAlert || false;
  
  const getPatientScoreSummary = (): string => {
    if (!cms138Result) return '';
    
    const scores = Object.entries(cms138Result.patientScores);
    if (scores.length === 0) return 'No patient scores';
    
    const summary = scores.map(([name, value]) => {
      const scoreNumber = name.replace('Patient Score ', '');
      if (value === null) {
        return `Score ${scoreNumber}: Null`;
      } else if (typeof value === 'number') {
        return `Score ${scoreNumber}: ${value} ${value === 0 ? '(No Intervention)' : '(Intervention)'}`;
      } else {
        return `Score ${scoreNumber}: ${value}`;
      }
    });
    
    return summary.join(', ');
  };

  const getMeasureStepSummary = (): string => {
    if (!cms138Result) return '';
    
    const steps = [];
    
    if (cms138Result.initialPopulation !== null) {
      steps.push(`IP: ${cms138Result.initialPopulation ? 'True' : 'False'}`);
    }
    
    Object.entries(cms138Result.denominators).forEach(([name, value]) => {
      if (value !== null) {
        const shortName = name.replace('Denominator', 'D').replace(' ', '');
        steps.push(`${shortName}: ${value ? 'True' : 'False'}`);
      }
    });
    
    Object.entries(cms138Result.numerators).forEach(([name, value]) => {
      if (value !== null) {
        const shortName = name.replace('Numerator', 'N').replace(' ', '');
        steps.push(`${shortName}: ${value ? 'True' : 'False'}`);
      }
    });
    
    return steps.join(', ');
  };

  return { 
    cms138Result,
    measurementPeriod,
    loading, 
    error,
    // Utility functions
    hasPractitionerAlert,
    getPatientScoreSummary,
    getMeasureStepSummary
  };
};