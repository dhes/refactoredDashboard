// src/hooks/usePatient.ts
import { useState, useEffect } from 'react';
import type { Patient } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const usePatient = (patientId: string | undefined) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getPatient(patientId)
      .then(setPatient)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { patient, loading, error };
};