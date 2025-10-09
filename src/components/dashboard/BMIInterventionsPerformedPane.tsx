// src/components/dashboard/BMIInterventionsPerformedPane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useCMS69Evaluation } from '../../hooks/useCMS69Evaluation';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

interface BMIInterventionsPerformedPaneProps {
  patientId: string;
}

export const BMIInterventionsPerformedPane: React.FC<BMIInterventionsPerformedPaneProps> = ({ patientId }) => {
  const [showInterventions, setShowInterventions] = useState(false); // Start closed by default
  const { cms69Result, loading, error } = useCMS69Evaluation(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  // Combine high and low BMI interventions performed
  const allBMIInterventions = [
    ...(cms69Result?.highBMIInterventionsPerformed || []),
    ...(cms69Result?.lowBMIInterventionsPerformed || [])
  ];

  // Sort by performed date (most recent first)
  const sortedInterventions = allBMIInterventions.sort((a, b) => {
    const dateA = a.performedDateTime || a.performedPeriod?.start || '';
    const dateB = b.performedDateTime || b.performedPeriod?.start || '';
    return dateB.localeCompare(dateA);
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowInterventions(!showInterventions)}
          >
            <h3 className="text-lg font-semibold">🏥 BMI Interventions Performed</h3>
            <button className="text-xl font-bold">
              {showInterventions ? "▲" : "▼"}
            </button>
          </div>
          {showInterventions && (
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
            onClick={() => setShowInterventions(!showInterventions)}
          >
            <h3 className="text-lg font-semibold">🏥 BMI Interventions Performed</h3>
            <button className="text-xl font-bold">
              {showInterventions ? "▲" : "▼"}
            </button>
          </div>
          {showInterventions && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading BMI interventions: {error.message}
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
          onClick={() => setShowInterventions(!showInterventions)}
        >
          <h3 className="text-lg font-semibold">🏥 BMI Interventions Performed</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {sortedInterventions.length} interventions
            </div>
            <button className="text-xl font-bold">
              {showInterventions ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showInterventions && (
          <div className="mt-4">
            {sortedInterventions.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No BMI interventions performed found for this patient
              </div>
            ) : (
              <div className="space-y-3">
                {sortedInterventions.map((intervention, index) => (
                  <BMIInterventionRow key={intervention.id || index} intervention={intervention} measurementPeriod={measurementPeriod} />
                ))}
              </div>
            )}

            {!measurementPeriod.isRealTime && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Source: CQL evaluation (MP {measurementPeriod.year})
                  <br />
                  Includes procedures from High BMI Interventions Performed and Low BMI Interventions Performed
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface BMIInterventionRowProps {
  intervention: any;
  measurementPeriod: any;
}

const BMIInterventionRow: React.FC<BMIInterventionRowProps> = ({ intervention, measurementPeriod }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'stopped':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'preparation':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the performed date
  const performedDate = intervention.performedDateTime || intervention.performedPeriod?.start || '';
  const displayDate = performedDate ? new Date(performedDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown';

  // Get procedure display
  let procedureDisplay = 'Unknown procedure';
  if (intervention.code?.text) {
    procedureDisplay = intervention.code.text;
  } else if (intervention.code?.coding?.[0]?.display) {
    procedureDisplay = intervention.code.coding[0].display;
  } else if (intervention.code?.coding?.[0]?.code) {
    procedureDisplay = `Code: ${intervention.code.coding[0].code}`;
  }

  // Format status
  const statusDisplay = intervention.status 
    ? intervention.status.charAt(0).toUpperCase() + intervention.status.slice(1)
    : 'Unknown';

  return (
    <div className="p-3 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">{displayDate}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(intervention.status)}`}>
              {statusDisplay}
            </span>
            {!measurementPeriod.isRealTime && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                ✓ CQL Matched
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">
            {procedureDisplay}
          </div>
          {/* Show code if it's different from display */}
          {intervention.code?.coding?.[0]?.code && 
           intervention.code.coding[0].code !== procedureDisplay && (
            <div className="text-xs text-gray-500 mt-1">
              Code: {intervention.code.coding[0].system ? 
                `${intervention.code.coding[0].system}|${intervention.code.coding[0].code}` :
                intervention.code.coding[0].code}
            </div>
          )}
          {/* Show reason codes if available */}
          {intervention.reasonCode?.[0]?.coding?.[0] && (
            <div className="text-xs text-gray-500 mt-1">
              Reason: {intervention.reasonCode[0].coding[0].display || intervention.reasonCode[0].coding[0].code}
            </div>
          )}
          {/* Show performer if available */}
          {intervention.performer?.[0]?.display && (
            <div className="text-xs text-gray-500 mt-1">
              Performed by: {intervention.performer[0].display}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMIInterventionsPerformedPane;