// src/components/dashboard/TobaccoCessationMedicationsCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import type { CMS138Result } from '../../utils/cms138Parser';

interface TobaccoCessationMedicationsCardProps {
  patientId: string;
  cms138Result: CMS138Result | null;
  loading: boolean;
  error: Error | null;
}

export const TobaccoCessationMedicationsCard: React.FC<TobaccoCessationMedicationsCardProps> = ({ 
  patientId, 
  cms138Result, 
  loading, 
  error 
}) => {
  const [showMedications, setShowMedications] = useState(false);
  const { measurementPeriod } = useMeasurementPeriod();

  // Combine ordered and active medications
  const allMedications = [
    ...(cms138Result?.tobaccoCessationOrdered || []).map(med => ({ ...med, type: 'Ordered' })),
    ...(cms138Result?.tobaccoCessationActive || []).map(med => ({ ...med, type: 'Active' }))
  ];

  // Sort by authored date (most recent first)
  const sortedMedications = allMedications.sort((a, b) => {
    const dateA = a.authoredOn || '';
    const dateB = b.authoredOn || '';
    return dateB.localeCompare(dateA);
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowMedications(!showMedications)}
          >
            <h3 className="text-lg font-semibold">🚭 Tobacco Cessation Medications</h3>
            <button className="text-xl font-bold">
              {showMedications ? "▲" : "▼"}
            </button>
          </div>
          {showMedications && (
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
            onClick={() => setShowMedications(!showMedications)}
          >
            <h3 className="text-lg font-semibold">🚭 Tobacco Cessation Medications</h3>
            <button className="text-xl font-bold">
              {showMedications ? "▲" : "▼"}
            </button>
          </div>
          {showMedications && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading tobacco cessation medications: {error.message}
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
          onClick={() => setShowMedications(!showMedications)}
        >
          <h3 className="text-lg font-semibold">🚭 Tobacco Cessation Medications</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {sortedMedications.length} medications
            </div>
            <button className="text-xl font-bold">
              {showMedications ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showMedications && (
          <div className="mt-4">
            {sortedMedications.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No tobacco cessation medications found for this period
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMedications.map((medication, index) => (
                  <TobaccoCessationMedicationRow key={medication.id || index} medication={medication} />
                ))}
              </div>
            )}

            {!measurementPeriod.isRealTime && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
                  <br />
                  <span className="italic">Includes medications from 6 months before MP start</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TobaccoCessationMedicationRowProps {
  medication: any;
}

const TobaccoCessationMedicationRow: React.FC<TobaccoCessationMedicationRowProps> = ({ medication }) => {
  const medicationDate = medication.authoredOn || '';
  const displayDate = medicationDate ? new Date(medicationDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown';
  
  // Get primary medication coding
  const primaryCoding = medication.medicationCodeableConcept?.coding?.[0];
  const primaryCode = primaryCoding?.code || 'No code';
  const primaryDisplay = primaryCoding?.display || medication.medicationCodeableConcept?.text || 'Unknown medication';

  // Determine if this is ordered or active
  const medicationType = medication.type || 'Ordered';
  const categoryColor = medicationType === 'Active' ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500 bg-blue-50';

  // Get status information
  const status = medication.status || 'unknown';
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${categoryColor}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">{displayDate}</span>
            <span className="text-sm font-mono text-gray-600">{primaryCode}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              medicationType === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {medicationType}
            </span>
            {status !== 'unknown' && (
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                {status}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">
            {primaryDisplay}
          </div>
          {/* Show dosage instruction if available */}
          {medication.dosageInstruction?.[0]?.text && (
            <div className="text-xs text-gray-600 mt-1">
              Dosage: {medication.dosageInstruction[0].text}
            </div>
          )}
          {/* Show intent if available */}
          {medication.intent && (
            <div className="text-xs text-gray-500 mt-1">
              Intent: {medication.intent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TobaccoCessationMedicationsCard;