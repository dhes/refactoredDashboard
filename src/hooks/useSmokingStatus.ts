// src/hooks/useSmokingStatus.ts
import { useState, useEffect } from 'react';
import type { Observation } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useSmokingStatus = (patientId: string | undefined) => {
  const [smokingStatus, setSmokingStatus] = useState<Observation | null>(null);
  const [allSmokingObs, setAllSmokingObs] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    // This already filters for smoking status code
    fhirClient.getObservations(patientId, 'http://loinc.org|72166-2')
      .then(observations => {
        setAllSmokingObs(observations);
        // Get the most recent
        const latest = observations.sort((a, b) => {
          const dateA = a.effectiveDateTime || '';
          const dateB = b.effectiveDateTime || '';
          return dateB.localeCompare(dateA);
        })[0] || null;
        setSmokingStatus(latest);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);
  
  return { smokingStatus, allSmokingObs, loading, error };
};