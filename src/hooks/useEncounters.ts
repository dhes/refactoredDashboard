// src/hooks/useEncounters.ts
import { useState, useEffect } from 'react';
import type { Encounter } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';

// Enhanced encounter type for display
export interface EnhancedEncounter extends Encounter {
  displayDate: string;
  primaryCode: string;
  primaryDisplay: string;
  inMeasurementPeriod: boolean;
}

export const useEncounters = (patientId: string | undefined) => {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [enhancedEncounters, setEnhancedEncounters] = useState<EnhancedEncounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Define measurement period (2026 for now)
  const measurementPeriod = {
    start: '2026-01-01',
    end: '2026-12-31'
  };

  useEffect(() => {
    if (!patientId) {
      setEncounters([]);
      setEnhancedEncounters([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    fhirClient.getEncounters(patientId)
      .then(rawEncounters => {
        // Sort by date (most recent first)
        const sortedEncounters = rawEncounters.sort((a, b) => {
          const dateA = a.period?.start || '';
          const dateB = b.period?.start || '';
          return dateB.localeCompare(dateA);
        });

        // Take only the first 4 encounters
        const recentEncounters = sortedEncounters.slice(0, 4);
        
        // Enhance encounters with display information
        const enhanced = recentEncounters.map(encounter => {
          const encounterDate = encounter.period?.start || '';
          const primaryCoding = encounter.type?.[0]?.coding?.[0];
          
          return {
            ...encounter,
            displayDate: encounterDate ? new Date(encounterDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown',
            primaryCode: primaryCoding?.code || 'No code',
            primaryDisplay: primaryCoding?.display || 'Unknown encounter type',
            inMeasurementPeriod: encounterDate >= measurementPeriod.start && encounterDate <= measurementPeriod.end
          } as EnhancedEncounter;
        });

        setEncounters(sortedEncounters);
        setEnhancedEncounters(enhanced);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [patientId]);

  // Utility: Check if patient has recent encounter
  const hasRecentEncounter = encounters.some(e => {
    const encounterDate = new Date(e.period?.start || '');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return encounterDate > oneYearAgo;
  });

  // Count encounters in measurement period
  const encountersInMP = enhancedEncounters.filter(e => e.inMeasurementPeriod).length;

  return { 
    encounters, 
    enhancedEncounters, 
    hasRecentEncounter, 
    encountersInMP,
    measurementPeriod,
    loading, 
    error 
  };
};