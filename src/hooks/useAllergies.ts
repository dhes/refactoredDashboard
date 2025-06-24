// src/hooks/useAllergies.ts
import { useState, useEffect } from 'react';
import type { AllergyIntolerance } from 'fhir/r4';
import { fhirClient } from '../services/fhirClient';

export const useAllergies = (patientId: string | undefined) => {
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setAllergies([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getAllergies(patientId) // You'd need to add this method to fhirClient
      .then(setAllergies)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { allergies, loading, error };
};