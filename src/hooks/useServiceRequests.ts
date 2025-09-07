// src/hooks/useServiceRequests.ts
import { useState, useEffect } from 'react';
import type { ServiceRequest } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';
import { useMeasurementPeriod } from '../contexts/MeasurementPeriodContext';

// Enhanced service request type for display
export interface EnhancedServiceRequest extends ServiceRequest {
  displayDate: string;
  serviceDisplay: string;
  statusDisplay: string;
  inMeasurementPeriod: boolean;
}

export const useServiceRequests = (patientId: string | undefined) => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [enhancedServiceRequests, setEnhancedServiceRequests] = useState<EnhancedServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get measurement period from context
  const { measurementPeriod } = useMeasurementPeriod();

  useEffect(() => {
    if (!patientId) {
      setServiceRequests([]);
      setEnhancedServiceRequests([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getServiceRequests(patientId)
      .then(rawServiceRequests => {
        // Sort by authored date (most recent first)
        const sortedRequests = rawServiceRequests.sort((a, b) => {
          const dateA = a.authoredOn || a.meta?.lastUpdated || '';
          const dateB = b.authoredOn || b.meta?.lastUpdated || '';
          return dateB.localeCompare(dateA);
        });

        // Enhance service requests with display information
        const enhanced = sortedRequests.map(request => {
          const requestDate = request.authoredOn || request.meta?.lastUpdated || '';
          
          // Get service display from code
          let serviceDisplay = 'Unknown service';
          if (request.code?.text) {
            serviceDisplay = request.code.text;
          } else if (request.code?.coding?.[0]?.display) {
            serviceDisplay = request.code.coding[0].display;
          } else if (request.code?.coding?.[0]?.code) {
            serviceDisplay = `Code: ${request.code.coding[0].code}`;
          }

          // Format status
          const statusDisplay = request.status 
            ? request.status.charAt(0).toUpperCase() + request.status.slice(1)
            : 'Unknown';

          return {
            ...request,
            displayDate: requestDate ? new Date(requestDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown',
            serviceDisplay,
            statusDisplay,
            inMeasurementPeriod: requestDate >= measurementPeriod.start && requestDate <= measurementPeriod.end
          } as EnhancedServiceRequest;
        });

        setServiceRequests(sortedRequests);
        setEnhancedServiceRequests(enhanced);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId, measurementPeriod]);

  // Count service requests in measurement period
  const serviceRequestsInMP = enhancedServiceRequests.filter(sr => sr.inMeasurementPeriod).length;

  // Utility: Check if patient has recent service requests
  const hasRecentServiceRequests = serviceRequests.some(sr => {
    const requestDate = new Date(sr.authoredOn || sr.meta?.lastUpdated || '');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return requestDate > oneYearAgo;
  });

  return { 
    serviceRequests, 
    enhancedServiceRequests, 
    hasRecentServiceRequests,
    serviceRequestsInMP,
    measurementPeriod,
    loading, 
    error 
  };
};