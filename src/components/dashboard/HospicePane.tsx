// src/components/dashboard/HospicePane.tsx
import React from 'react';
import { Card } from '../ui/card';
import { useHospiceObservations, type EnhancedHospiceObservation } from '../../hooks/useHospiceObservations';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

interface HospicePaneProps {
  patientId: string;
}

export const HospicePane: React.FC<HospicePaneProps> = ({ patientId }) => {
  const { 
    enhancedHospiceObservations, 
    qualifyingHospiceObs,
    hasQualifyingHospiceStatus,
    measurementPeriod: hookMeasurementPeriod, 
    loading, 
    error 
  } = useHospiceObservations(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🏠 Hospice Status</h3>
        <div className="animate-pulse">
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🏠 Hospice Status</h3>
        <div className="text-red-600">
          Error loading hospice observations: {error.message}
        </div>
      </Card>
    );
  }

  const formatMeasurementPeriod = () => measurementPeriod.year.toString();

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🏠 Hospice Status</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            MP {formatMeasurementPeriod()}: {qualifyingHospiceObs} assessments
          </div>
          {hasQualifyingHospiceStatus && (
            <div className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
              HOSPICE EXCLUSION
            </div>
          )}
        </div>
      </div>

      {enhancedHospiceObservations.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          <div className="mb-2">No hospice assessments found</div>
          <div className="text-xs">
            Searched for LOINC 45755-6 "Hospice care [Minimum Data Set]"
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {enhancedHospiceObservations.map((observation, index) => (
            <HospiceObservationRow key={observation.id || index} observation={observation} />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div>Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}</div>
          <div className="mt-1">
            Searching for: LOINC 45755-6 "Hospice care [Minimum Data Set]"
          </div>
        </div>
      </div>
    </Card>
  );
};

interface HospiceObservationRowProps {
  observation: EnhancedHospiceObservation;
}

const HospiceObservationRow: React.FC<HospiceObservationRowProps> = ({ observation }) => {
  const getValueColor = (valueCode: string, valueDisplay: string) => {
    // "Yes" values typically indicate hospice care is active
    if (valueCode === '373066001' || valueDisplay.toLowerCase().includes('yes')) {
      return 'bg-orange-100 text-orange-800';
    }
    // "No" or other values
    return 'bg-green-100 text-green-800';
  };

  const isQualifying = observation.overlapsMP || observation.inMeasurementPeriod;

  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      isQualifying 
        ? 'border-l-orange-500 bg-orange-50' 
        : 'border-l-gray-300 bg-gray-50'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">{observation.displayDate}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getValueColor(observation.valueCode, observation.valueDisplay)}`}>
              {observation.valueDisplay}
            </span>
            {observation.valueCode && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-mono">
                {observation.valueCode}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              isQualifying 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {observation.overlapsMP ? '✓ Overlaps MP' : 
               observation.inMeasurementPeriod ? '✓ In MP' : 
               '✗ Outside MP'}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            Hospice care [Minimum Data Set]
          </div>
          <div className="text-xs text-gray-500 mt-1">
            LOINC: 45755-6
          </div>
          {/* Show effective period if available */}
          {observation.effectivePeriod && (
            <div className="text-xs text-gray-500 mt-1">
              Period: {observation.effectivePeriod.start ? new Date(observation.effectivePeriod.start).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Start unknown'} - {observation.effectivePeriod.end ? new Date(observation.effectivePeriod.end).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Ongoing'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospicePane;