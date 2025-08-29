// src/hooks/useHospiceObservations.ts
import { useState, useEffect } from 'react';
import type { Observation } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

// Enhanced hospice observation type for display
export interface EnhancedHospiceObservation extends Observation {
  displayDate: string;
  valueDisplay: string;
  valueCode: string;
  inMeasurementPeriod: boolean;
  overlapsMP: boolean; // For effective period overlaps
}

export const useHospiceObservations = (patientId: string | undefined) => {
  const [hospiceObservations, setHospiceObservations] = useState<Observation[]>([]);
  const [enhancedHospiceObservations, setEnhancedHospiceObservations] = useState<EnhancedHospiceObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Define measurement period (2026 for now)
  const measurementPeriod = {
    start: '2026-01-01',
    end: '2026-12-31'
  };

  // Hospice care LOINC code
  const HOSPICE_LOINC_CODE = 'http://loinc.org|45755-6';

  useEffect(() => {
    if (!patientId) {
      setHospiceObservations([]);
      setEnhancedHospiceObservations([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Fetch observations with the specific hospice LOINC code
    fhirClient.getObservations(patientId, HOSPICE_LOINC_CODE)
      .then(rawObservations => {
        // Sort by effective date (most recent first)
        const sortedObservations = rawObservations.sort((a, b) => {
          const dateA = a.effectiveDateTime || a.effectivePeriod?.start || '';
          const dateB = b.effectiveDateTime || b.effectivePeriod?.start || '';
          return dateB.localeCompare(dateA);
        });

        // Enhance observations with display information
        const enhanced = sortedObservations.map(obs => {
          const effectiveDate = obs.effectiveDateTime || obs.effectivePeriod?.start || '';
          
          // Get value display from valueCodeableConcept
          let valueDisplay = 'No value';
          let valueCode = '';
          if (obs.valueCodeableConcept?.text) {
            valueDisplay = obs.valueCodeableConcept.text;
          } else if (obs.valueCodeableConcept?.coding?.[0]?.display) {
            valueDisplay = obs.valueCodeableConcept.coding[0].display;
            valueCode = obs.valueCodeableConcept.coding[0].code || '';
          }

          // Check if observation overlaps measurement period
          const overlapsMP = checkOverlapWithMP(obs, measurementPeriod);
          const inMP = effectiveDate >= measurementPeriod.start && effectiveDate <= measurementPeriod.end;

          return {
            ...obs,
            displayDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown',
            valueDisplay,
            valueCode,
            inMeasurementPeriod: inMP,
            overlapsMP
          } as EnhancedHospiceObservation;
        });

        setHospiceObservations(sortedObservations);
        setEnhancedHospiceObservations(enhanced);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  // Helper function to check if effective period overlaps measurement period
  const checkOverlapWithMP = (obs: Observation, mp: { start: string; end: string }): boolean => {
    if (obs.effectivePeriod) {
      const obsStart = obs.effectivePeriod.start || '';
      const obsEnd = obs.effectivePeriod.end || obs.effectivePeriod.start || '';
      
      // Check if periods overlap
      return (obsStart <= mp.end && obsEnd >= mp.start);
    } else if (obs.effectiveDateTime) {
      // Single date - check if it's within MP
      return obs.effectiveDateTime >= mp.start && obs.effectiveDateTime <= mp.end;
    }
    return false;
  };

  // Count hospice observations that qualify (overlap or are in MP)
  const qualifyingHospiceObs = enhancedHospiceObservations.filter(obs => 
    obs.overlapsMP || obs.inMeasurementPeriod
  ).length;

  // Check if patient has qualifying hospice status
  const hasQualifyingHospiceStatus = enhancedHospiceObservations.some(obs => 
    (obs.overlapsMP || obs.inMeasurementPeriod) && 
    obs.valueCode === '373066001' // "Yes (qualifier value)"
  );

  return { 
    hospiceObservations, 
    enhancedHospiceObservations, 
    qualifyingHospiceObs,
    hasQualifyingHospiceStatus,
    measurementPeriod,
    loading, 
    error 
  };
};