// 1. src/hooks/useMedications.ts
import { useState, useEffect } from 'react';
import type { MedicationStatement } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useMedications = (patientId: string | undefined) => {
  const [medications, setMedications] = useState<MedicationStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setMedications([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getMedications(patientId)
      .then(setMedications)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { medications, loading, error };
};