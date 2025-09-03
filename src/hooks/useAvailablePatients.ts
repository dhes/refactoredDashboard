// src/hooks/useAvailablePatients.ts
import { useState, useEffect } from 'react';
import type { Patient } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useAvailablePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fhirClient.searchPatients("_count=100")
      .then(setPatients)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { patients, loading, error };
};