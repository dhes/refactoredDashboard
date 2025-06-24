import { useState, useEffect } from 'react';
import type { Condition } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useConditions = (patientId: string | undefined) => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setConditions([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getConditions(patientId)
      .then(setConditions)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { conditions, loading, error };
};