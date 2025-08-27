// src/hooks/useCDSHooks.ts

import { useState, useEffect } from 'react';
import { cdsHooksService } from '../services/cdsHooksService';
import type { CDSHookCard } from '../services/cdsHooksService';

export const useCDSHooks = (patientId: string | null) => {
  const [cards, setCards] = useState<CDSHookCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    if (!patientId) {
      setCards([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await cdsHooksService.getTobaccoRecommendations(patientId);
      setCards(response.cards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CDS recommendations');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [patientId]);

  return {
    cards,
    loading,
    error,
    refresh: fetchCards
  };
};