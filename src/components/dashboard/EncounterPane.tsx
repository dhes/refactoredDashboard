// src/components/dashboard/EncounterPane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useEncounters, type EnhancedEncounter } from '../../hooks/useEncounters';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

interface EncounterPaneProps {
  patientId: string;
}

export const EncounterPane: React.FC<EncounterPaneProps> = ({ patientId }) => {
  const [showEncounters, setShowEncounters] = useState(false); // Start closed by default
  const { enhancedEncounters, encountersInMP, measurementPeriod: hookMeasurementPeriod, loading, error } = useEncounters(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowEncounters(!showEncounters)}
          >
            <h3 className="text-lg font-semibold">Recent Encounters</h3>
            <button className="text-xl font-bold">
              {showEncounters ? "▲" : "▼"}
            </button>
          </div>
          {showEncounters && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowEncounters(!showEncounters)}
          >
            <h3 className="text-lg font-semibold">Recent Encounters</h3>
            <button className="text-xl font-bold">
              {showEncounters ? "▲" : "▼"}
            </button>
          </div>
          {showEncounters && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading encounters: {error.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const formatMeasurementPeriod = () => 
    measurementPeriod.isRealTime ? 'Real Time' : measurementPeriod.year.toString();

  return (
    <Card>
      <CardContent>
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowEncounters(!showEncounters)}
        >
          <h3 className="text-lg font-semibold">Recent Encounters</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {encountersInMP} encounters
            </div>
            <button className="text-xl font-bold">
              {showEncounters ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showEncounters && (
          <div className="mt-4">
            {enhancedEncounters.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No encounters found for this patient
              </div>
            ) : (
              <div className="space-y-3">
                {enhancedEncounters.map((encounter, index) => (
                  <EncounterRow key={encounter.id || index} encounter={encounter} />
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface EncounterRowProps {
  encounter: EnhancedEncounter;
}

const EncounterRow: React.FC<EncounterRowProps> = ({ encounter }) => {
  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      encounter.inMeasurementPeriod 
        ? 'border-l-green-500 bg-green-50' 
        : 'border-l-gray-300 bg-gray-50'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-medium">{encounter.displayDate}</span>
            <span className="text-sm font-mono text-gray-600">{encounter.primaryCode}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              encounter.inMeasurementPeriod 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {encounter.inMeasurementPeriod ? '✓ In MP' : '✗ Outside MP'}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {encounter.primaryDisplay}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncounterPane;