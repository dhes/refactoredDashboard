// src/hooks/useCMS69EvaluationShared.ts
import { useCMS69EvaluationContext } from '../contexts/CMS69EvaluationContext';

/**
 * Shared CMS69 evaluation hook that consumes the context-based shared state.
 * This ensures only one API call per patient/measurement period combination.
 */
export const useCMS69EvaluationShared = () => {
  const { cms69Result, loading, error } = useCMS69EvaluationContext();
  
  return { 
    cms69Result,
    loading, 
    error
  };
};