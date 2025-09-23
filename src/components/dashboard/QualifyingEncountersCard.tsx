// src/components/dashboard/QualifyingEncountersCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import type { CMS138Result } from '../../utils/cms138Parser';

interface QualifyingEncountersCardProps {
  patientId: string;
  cms138Result: CMS138Result | null;
  loading: boolean;
  error: Error | null;
}

export const QualifyingEncountersCard: React.FC<QualifyingEncountersCardProps> = ({ 
  patientId, 
  cms138Result, 
  loading, 
  error 
}) => {
  const [showEncounters, setShowEncounters] = useState(false);
  const { measurementPeriod } = useMeasurementPeriod();

  // Combine qualifying and preventive encounters
  const allEncounters = [
    ...(cms138Result?.qualifyingEncounters || []).map(enc => ({ ...enc, type: 'Qualifying' })),
    ...(cms138Result?.preventiveEncounters || []).map(enc => ({ ...enc, type: 'Preventive' }))
  ];

  // Sort by date (most recent first)
  const sortedEncounters = allEncounters.sort((a, b) => {
    const dateA = a.period?.start || '';
    const dateB = b.period?.start || '';
    return dateB.localeCompare(dateA);
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowEncounters(!showEncounters)}
          >
            <h3 className="text-lg font-semibold">🏥 Qualifying Encounters</h3>
            <button className="text-xl font-bold">
              {showEncounters ? "▲" : "▼"}
            </button>
          </div>
          {showEncounters && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
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
            <h3 className="text-lg font-semibold">🏥 Qualifying Encounters</h3>
            <button className="text-xl font-bold">
              {showEncounters ? "▲" : "▼"}
            </button>
          </div>
          {showEncounters && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading qualifying encounters: {error.message}
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
          <h3 className="text-lg font-semibold">🏥 Qualifying Encounters</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {sortedEncounters.length} encounters
            </div>
            <button className="text-xl font-bold">
              {showEncounters ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showEncounters && (
          <div className="mt-4">
            {sortedEncounters.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No qualifying encounters found for this period
              </div>
            ) : (
              <div className="space-y-3">
                {sortedEncounters.map((encounter, index) => (
                  <QualifyingEncounterRow key={encounter.id || index} encounter={encounter} />
                ))}
              </div>
            )}

            {!measurementPeriod.isRealTime && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface QualifyingEncounterRowProps {
  encounter: any;
}

const QualifyingEncounterRow: React.FC<QualifyingEncounterRowProps> = ({ encounter }) => {
  const encounterDate = encounter.period?.start || '';
  const displayDate = encounterDate ? new Date(encounterDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown';
  
  // Get primary encounter type
  const primaryCoding = encounter.type?.[0]?.coding?.[0];
  const primaryCode = primaryCoding?.code || 'No code';
  const primaryDisplay = primaryCoding?.display || 'Unknown encounter type';

  // Determine if this is qualifying or preventive
  const encounterCategory = encounter.type || 'Qualifying';
  const categoryColor = encounterCategory === 'Preventive' ? 'border-l-blue-500 bg-blue-50' : 'border-l-green-500 bg-green-50';

  return (
    <div className={`p-3 rounded-lg border-l-4 ${categoryColor}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-medium">{displayDate}</span>
            <span className="text-sm font-mono text-gray-600">{primaryCode}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              encounterCategory === 'Preventive' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {encounterCategory}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {primaryDisplay}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualifyingEncountersCard;