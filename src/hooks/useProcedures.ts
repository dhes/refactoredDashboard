import { useState, useEffect } from 'react';
import type { Procedure } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useProcedures = (patientId: string | undefined) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setProcedures([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getProcedures(patientId)
      .then(setProcedures)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { procedures, loading, error };
};