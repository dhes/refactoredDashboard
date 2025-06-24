// src/hooks/useEncounters.ts
import { useState, useEffect } from 'react';
import type { Encounter } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useEncounters = (patientId: string | undefined) => {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setEncounters([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getEncounters(patientId)
      .then(setEncounters)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  // Utility: Check if patient has recent encounter
  const hasRecentEncounter = encounters.some(e => {
    const encounterDate = new Date(e.period?.start || '');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return encounterDate > oneYearAgo;
  });

  return { encounters, hasRecentEncounter, loading, error };
};