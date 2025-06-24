import { useState, useEffect } from 'react';
import type { Observation } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

export const useLabs = (patientId: string | undefined) => {
  const [labs, setLabs] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setLabs([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Get observations with laboratory category
    fhirClient.getObservations(patientId, 'http://terminology.hl7.org/CodeSystem/observation-category|laboratory')
      .then(setLabs)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  return { labs, loading, error };
};