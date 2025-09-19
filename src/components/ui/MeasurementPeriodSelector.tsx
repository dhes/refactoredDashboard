// src/components/ui/MeasurementPeriodSelector.tsx
import React, { useState } from 'react';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

export const MeasurementPeriodSelector: React.FC = () => {
  const { measurementPeriod, setMeasurementPeriodYear, setRealTimeMode, availableYears, isRealTimeAvailable } = useMeasurementPeriod();
  const [isOpen, setIsOpen] = useState(false);

  const handleYearSelect = (year: number) => {
    setMeasurementPeriodYear(year);
    setIsOpen(false);
  };

  const handleRealTimeSelect = () => {
    setRealTimeMode();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
        title="Select Measurement Period"
      >
        <span className="text-blue-700 font-medium">
          {measurementPeriod.isRealTime ? '🔴 Real Time' : `📅 ${measurementPeriod.displayName}`}
        </span>
        <span className="text-blue-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[200px]">
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                Measurement Period
              </div>
            </div>
            
            <div className="py-1">
              {/* Real Time Option */}
              {isRealTimeAvailable && (
                <button
                  onClick={handleRealTimeSelect}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                    measurementPeriod.isRealTime ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>🔴 Real Time</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                      Live
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Current clinical view
                  </div>
                  
                  {measurementPeriod.isRealTime && (
                    <span className="text-red-500 ml-2">✓</span>
                  )}
                </button>
              )}
              
              {/* Separator */}
              {isRealTimeAvailable && (
                <div className="border-t border-gray-100 my-1"></div>
              )}
              
              {/* Year Options */}
              {availableYears.map((year) => {
                const isSelected = year === measurementPeriod.year && !measurementPeriod.isRealTime;
                const isCurrentYear = year === new Date().getFullYear();
                
                return (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>📅 MP {year}</span>
                      {isCurrentYear && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Jan 1 - Dec 31
                    </div>
                    
                    {isSelected && (
                      <span className="text-blue-500 ml-2">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Footer with current selection details */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-600">
                <div className="font-medium">Selected Period:</div>
                <div className="font-mono text-xs mt-1">
                  {measurementPeriod.start} to {measurementPeriod.end}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};