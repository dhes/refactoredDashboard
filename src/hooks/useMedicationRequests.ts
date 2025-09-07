// src/hooks/useMedicationRequests.ts
import { useState, useEffect } from 'react';
import type { MedicationRequest } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';
import { useMeasurementPeriod } from '../contexts/MeasurementPeriodContext';

// Enhanced medication request type for display
export interface EnhancedMedicationRequest extends MedicationRequest {
  displayDate: string;
  medicationDisplay: string;
  statusDisplay: string;
  inMeasurementPeriod: boolean;
}

export const useMedicationRequests = (patientId: string | undefined) => {
  const [medicationRequests, setMedicationRequests] = useState<MedicationRequest[]>([]);
  const [enhancedMedicationRequests, setEnhancedMedicationRequests] = useState<EnhancedMedicationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId) {
      setMedicationRequests([]);
      setEnhancedMedicationRequests([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getMedicationRequests(patientId)
      .then(rawMedicationRequests => {
        // Sort by authored date (most recent first)
        const sortedRequests = rawMedicationRequests.sort((a, b) => {
          const dateA = a.authoredOn || a.meta?.lastUpdated || '';
          const dateB = b.authoredOn || b.meta?.lastUpdated || '';
          return dateB.localeCompare(dateA);
        });

        // Enhance medication requests with display information
        const enhanced = sortedRequests.map(request => {
          const requestDate = request.authoredOn || request.meta?.lastUpdated || '';
          
          // Get medication display (could be CodeableConcept or Reference)
          let medicationDisplay = 'Unknown medication';
          if (request.medicationCodeableConcept?.text) {
            medicationDisplay = request.medicationCodeableConcept.text;
          } else if (request.medicationCodeableConcept?.coding?.[0]?.display) {
            medicationDisplay = request.medicationCodeableConcept.coding[0].display;
          } else if (request.medicationReference?.display) {
            medicationDisplay = request.medicationReference.display;
          }

          // Format status
          const statusDisplay = request.status 
            ? request.status.charAt(0).toUpperCase() + request.status.slice(1)
            : 'Unknown';

          return {
            ...request,
            displayDate: requestDate ? new Date(requestDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown',
            medicationDisplay,
            statusDisplay,
            inMeasurementPeriod: requestDate >= measurementPeriod.start && requestDate <= measurementPeriod.end
          } as EnhancedMedicationRequest;
        });

        setMedicationRequests(sortedRequests);
        setEnhancedMedicationRequests(enhanced);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod]);

  // Count medication requests in measurement period
  const medicationRequestsInMP = enhancedMedicationRequests.filter(mr => mr.inMeasurementPeriod).length;

  // Utility: Check if patient has recent medication requests
  const hasRecentMedicationRequests = medicationRequests.some(mr => {
    const requestDate = new Date(mr.authoredOn || mr.meta?.lastUpdated || '');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return requestDate > oneYearAgo;
  });

  return { 
    medicationRequests, 
    enhancedMedicationRequests, 
    hasRecentMedicationRequests,
    medicationRequestsInMP,
    measurementPeriod,
    loading, 
    error 
  };
};