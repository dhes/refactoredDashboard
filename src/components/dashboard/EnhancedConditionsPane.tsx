// src/components/dashboard/EnhancedConditionsPane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useConditions } from '../../hooks/useConditions';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import { getDisplayText, getCodingDisplay } from '../../utils/fhirFormatters';
import type { Condition } from '../../types/fhir';

interface EnhancedConditionsPaneProps {
  patientId: string;
}

export const EnhancedConditionsPane: React.FC<EnhancedConditionsPaneProps> = ({ patientId }) => {
  const [showConditions, setShowConditions] = useState(false); // Start closed by default
  const { conditions, loading, error } = useConditions(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  // Enhanced conditions with display information
  const enhancedConditions = conditions.map(condition => {
    // Get onset information
    let onsetDisplay = '';
    if (condition.onsetDateTime) {
      onsetDisplay = new Date(condition.onsetDateTime).toLocaleDateString('en-US', { timeZone: 'UTC' });
    } else if (condition.onsetPeriod?.start) {
      const startDate = new Date(condition.onsetPeriod.start).toLocaleDateString('en-US', { timeZone: 'UTC' });
      const endDate = condition.onsetPeriod.end 
        ? new Date(condition.onsetPeriod.end).toLocaleDateString('en-US', { timeZone: 'UTC' })
        : 'ongoing';
      onsetDisplay = endDate === 'ongoing' ? `${startDate} - ongoing` : `${startDate} - ${endDate}`;
    } else if (condition.onsetString) {
      onsetDisplay = condition.onsetString;
    }

    // Get abatement information
    let abatementDisplay = '';
    if (condition.abatementDateTime) {
      abatementDisplay = new Date(condition.abatementDateTime).toLocaleDateString('en-US', { timeZone: 'UTC' });
    } else if (condition.abatementPeriod?.start) {
      const startDate = new Date(condition.abatementPeriod.start).toLocaleDateString('en-US', { timeZone: 'UTC' });
      const endDate = condition.abatementPeriod.end 
        ? new Date(condition.abatementPeriod.end).toLocaleDateString('en-US', { timeZone: 'UTC' })
        : 'ongoing';
      abatementDisplay = `${startDate} - ${endDate}`;
    } else if (condition.abatementString) {
      abatementDisplay = condition.abatementString;
    }

    // Get clinical status
    const clinicalStatus = getCodingDisplay(condition.clinicalStatus?.coding) || 'Unknown';
    
    // Get category
    const category = condition.category?.[0]?.coding?.find(c => 
      c.system === 'http://terminology.hl7.org/CodeSystem/condition-category'
    )?.display || 'Unknown category';

    // Check if condition is in measurement period (for filtering/highlighting)
    const isInMeasurementPeriod = measurementPeriod.isRealTime 
      ? true // In real time, show all conditions
      : (condition.onsetDateTime && 
         condition.onsetDateTime >= measurementPeriod.start && 
         condition.onsetDateTime <= measurementPeriod.end);

    return {
      ...condition,
      onsetDisplay,
      abatementDisplay,
      clinicalStatus,
      category,
      isInMeasurementPeriod,
      conditionDisplay: getDisplayText(condition.code)
    };
  });

  // Sort by most recent onset/activity
  const sortedConditions = enhancedConditions.sort((a, b) => {
    const dateA = a.onsetDateTime || a.meta?.lastUpdated || '';
    const dateB = b.onsetDateTime || b.meta?.lastUpdated || '';
    return dateB.localeCompare(dateA);
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowConditions(!showConditions)}
          >
            <h3 className="text-lg font-semibold">🩺 Conditions</h3>
            <button className="text-xl font-bold">
              {showConditions ? "▲" : "▼"}
            </button>
          </div>
          {showConditions && (
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
            onClick={() => setShowConditions(!showConditions)}
          >
            <h3 className="text-lg font-semibold">🩺 Conditions</h3>
            <button className="text-xl font-bold">
              {showConditions ? "▲" : "▼"}
            </button>
          </div>
          {showConditions && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading conditions: {error.message}
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
          onClick={() => setShowConditions(!showConditions)}
        >
          <h3 className="text-lg font-semibold">🩺 Conditions</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {sortedConditions.length} conditions
            </div>
            <button className="text-xl font-bold">
              {showConditions ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showConditions && (
          <div className="mt-4">
            {sortedConditions.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No conditions found for this patient
              </div>
            ) : (
              <div className="space-y-3">
                {sortedConditions.map((condition, index) => (
                  <ConditionRow key={condition.id || index} condition={condition} measurementPeriod={measurementPeriod} />
                ))}
              </div>
            )}

            {!measurementPeriod.isRealTime && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
                  <br />
                  Shows all documented conditions for clinical context
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ConditionRowProps {
  condition: any; // Enhanced condition with additional display properties
  measurementPeriod: any;
}

const ConditionRow: React.FC<ConditionRowProps> = ({ condition, measurementPeriod }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'resolved':
        return 'bg-gray-100 text-gray-800';
      case 'recurrence':
        return 'bg-yellow-100 text-yellow-800';
      case 'relapse':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'problem list item':
        return 'bg-blue-100 text-blue-800';
      case 'encounter diagnosis':
        return 'bg-purple-100 text-purple-800';
      case 'health concern':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-3 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {condition.onsetDisplay && (
              <span className="font-medium">{condition.onsetDisplay}</span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(condition.clinicalStatus)}`}>
              {condition.clinicalStatus}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(condition.category)}`}>
              {condition.category}
            </span>
          </div>
          
          <div className="text-sm text-gray-700 mt-1 font-medium">
            {condition.conditionDisplay}
          </div>

          {/* Timeline information */}
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            {condition.onsetDisplay && (
              <div className="flex items-center gap-2">
                <span className="text-green-600">📅 Onset:</span>
                <span>{condition.onsetDisplay}</span>
              </div>
            )}
            {condition.abatementDisplay && (
              <div className="flex items-center gap-2">
                <span className="text-red-600">🏁 Abated:</span>
                <span>{condition.abatementDisplay}</span>
                <span className="text-xs text-red-600">(resolved)</span>
              </div>
            )}
            {!condition.onsetDisplay && !condition.abatementDisplay && (
              <div className="text-gray-500 italic">Timeline not documented</div>
            )}
          </div>

          {/* Show condition ID for reference */}
          {condition.id && (
            <div className="text-xs text-gray-400 mt-1">
              ID: {condition.id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedConditionsPane;