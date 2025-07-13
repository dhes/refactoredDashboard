import { useState, useEffect } from 'react';
import { qualityAnalyticsClient } from '../services';
import type { MeasureLogicHighlighting } from '../types/fqm';

export const useMeasureLogicHighlighting = (
  measureId: string | null, 
  patientId: string | null
) => {
  const [highlighting, setHighlighting] = useState<MeasureLogicHighlighting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!measureId || !patientId) return;

    const fetchHighlighting = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await qualityAnalyticsClient.evaluateMeasureWithHighlighting(
          measureId, 
          [patientId]
        );
        setHighlighting(result.highlighting);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHighlighting();
  }, [measureId, patientId]);

  return { highlighting, loading, error };
};