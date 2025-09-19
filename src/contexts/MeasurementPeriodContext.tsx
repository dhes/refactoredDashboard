// src/contexts/MeasurementPeriodContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface MeasurementPeriod {
  year: number;
  start: string; // YYYY-01-01T00:00:00 format
  end: string;   // YYYY-12-31T23:59:59 format
  isRealTime: boolean;
  displayName: string; // "MP 2025", "MP 2026", or "Real Time"
}

interface MeasurementPeriodContextType {
  measurementPeriod: MeasurementPeriod;
  setMeasurementPeriodYear: (year: number) => void;
  setRealTimeMode: () => void;
  availableYears: number[];
  isRealTimeAvailable: boolean;
}

const MeasurementPeriodContext = createContext<MeasurementPeriodContextType | undefined>(undefined);

function createMeasurementPeriod(year: number): MeasurementPeriod {
  return {
    year,
    start: `${year}-01-01T00:00:00`,
    end: `${year}-12-31T23:59:59`,
    isRealTime: false,
    displayName: `MP ${year}`
  };
}

function createRealTimePeriod(): MeasurementPeriod {
  return {
    year: 1900, // Special year to trigger CQL Real Time Mode
    start: "1900-01-01T00:00:00",
    end: "1900-12-31T23:59:59",
    isRealTime: true,
    displayName: "Real Time"
  };
}

// Helper to get the current year period for API calls in Real Time mode
export function getCurrentYearPeriod() {
  const currentYear = new Date().getFullYear();
  return {
    start: `${currentYear}-01-01T00:00:00Z`,
    end: `${currentYear}-12-31T23:59:59Z`
  };
}

interface MeasurementPeriodProviderProps {
  children: ReactNode;
}

export const MeasurementPeriodProvider: React.FC<MeasurementPeriodProviderProps> = ({ children }) => {
  // Get current year and next year
  const currentYear = new Date().getFullYear();
  
  // For MADiE test cases, include 2026. For production, use current and next year
  const baseYears = [currentYear, currentYear + 1];
  const availableYears = baseYears.includes(2026) 
    ? baseYears 
    : [...baseYears, 2026];
  
  // Default to Real Time mode for better UX
  const [measurementPeriod, setMeasurementPeriod] = useState<MeasurementPeriod>(
    createRealTimePeriod()
  );

  const setMeasurementPeriodYear = (year: number) => {
    setMeasurementPeriod(createMeasurementPeriod(year));
  };

  const setRealTimeMode = () => {
    setMeasurementPeriod(createRealTimePeriod());
  };

  return (
    <MeasurementPeriodContext.Provider
      value={{
        measurementPeriod,
        setMeasurementPeriodYear,
        setRealTimeMode,
        availableYears,
        isRealTimeAvailable: true
      }}
    >
      {children}
    </MeasurementPeriodContext.Provider>
  );
};

export const useMeasurementPeriod = (): MeasurementPeriodContextType => {
  const context = useContext(MeasurementPeriodContext);
  if (context === undefined) {
    throw new Error('useMeasurementPeriod must be used within a MeasurementPeriodProvider');
  }
  return context;
};