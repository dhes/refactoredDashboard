// src/hooks/useObservations.ts
import { useState, useEffect } from 'react';
import type { Observation } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useObservations = (patientId: string | undefined, code?: string) => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setObservations([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getObservations(patientId, code)
      .then(setObservations)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, code]);

  // Utility method to get smoking status
  const smokingStatus = observations.find(obs => 
    obs.code?.coding?.some(c => 
      c.code === '72166-2' && c.system === 'http://loinc.org'
    )
  );

  return { observations, smokingStatus, loading, error };
};