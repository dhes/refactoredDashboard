import { useState, useEffect } from 'react';
import { enhancedGuidanceService, type EnhancedGuidanceResult } from '../services/enhancedGuidanceService';
import { useMeasureReport } from './useMeasureReport';
import { usePatient } from './usePatient';

export function useEnhancedGuidance(measureId: string, patientId: string | null) {
  const [guidance, setGuidance] = useState<EnhancedGuidanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { 
    measureReport, 
    loading: measureLoading, 
    error: measureError 
  } = useMeasureReport(patientId || '', measureId);
  
  const { 
    patient, 
    loading: patientLoading, 
    error: patientError 
  } = usePatient(patientId || '');

  useEffect(() => {
    async function generateGuidance() {
      console.log('🔧 useEnhancedGuidance - Starting:', { measureId, patientId, measureLoading, patientLoading });
      
      // Early return if no patient is selected
      if (!patientId) {
        console.log('🔧 No patient selected');
        setGuidance(null);
        setLoading(false);
        setError(null);
        return;
      }
      
      if (measureLoading || patientLoading) {
        console.log('🔧 Still loading data...');
        setLoading(true);
        return;
      }

      if (measureError || patientError) {
        console.log('🔧 Data loading errors:', { measureError, patientError });
        setError(measureError || patientError || new Error('Unknown error'));
        setLoading(false);
        return;
      }

      if (!measureReport || !patient) {
        console.log('🔧 Missing data:', { hasMeasureReport: !!measureReport, hasPatient: !!patient });
        setError(new Error('Missing measure report or patient data'));
        setLoading(false);
        return;
      }

      try {
        console.log('🔧 Calling enhancedGuidanceService...');
        setLoading(true);
        setError(null);
        
        const result = await enhancedGuidanceService.generateGuidance(
          measureId,
          patientId, // We know it's not null due to the check above
          measureReport,
          patient
        );
        
        console.log('🔧 Enhanced guidance result:', result);
        setGuidance(result);
      } catch (err) {
        console.log('🔧 Enhanced guidance error:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate guidance'));
      } finally {
        setLoading(false);
      }
    }

    generateGuidance();
  }, [measureId, patientId, measureReport, patient, measureLoading, patientLoading, measureError, patientError]);

  return {
    guidance,
    loading,
    error
  };
}