// src/hooks/useImmunizations.ts
import { useState, useEffect } from 'react';
import type { Immunization } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useImmunizations = (patientId: string | undefined) => {
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setImmunizations([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getImmunizations(patientId)
      .then(setImmunizations)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { immunizations, loading, error };
};