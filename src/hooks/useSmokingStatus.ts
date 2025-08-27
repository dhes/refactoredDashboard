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
    
    // Use the enhanced smoking status method that searches all LOINC codes
    fhirClient.getSmokingStatus(patientId)
      .then(({latest, all}) => {
        setSmokingStatus(latest);
        setAllSmokingObs(all);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);
  
  return { smokingStatus, allSmokingObs, loading, error };
};