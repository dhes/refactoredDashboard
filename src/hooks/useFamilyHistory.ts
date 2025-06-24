import { useState, useEffect } from 'react';
import type { FamilyMemberHistory } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useFamilyHistory = (patientId: string | undefined) => {
  const [familyHistories, setFamilyHistories] = useState<FamilyMemberHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setFamilyHistories([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getFamilyHistory(patientId)
      .then(setFamilyHistories)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { familyHistories, loading, error };
};