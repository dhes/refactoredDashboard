// src/components/dashboard/MedicationRequestPane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useMedicationRequests, type EnhancedMedicationRequest } from '../../hooks/useMedicationRequests';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

interface MedicationRequestPaneProps {
  patientId: string;
}

export const MedicationRequestPane: React.FC<MedicationRequestPaneProps> = ({ patientId }) => {
  const [showMedicationRequests, setShowMedicationRequests] = useState(false); // Start closed by default
  const { 
    enhancedMedicationRequests, 
    medicationRequestsInMP, 
    measurementPeriod: hookMeasurementPeriod, 
    loading, 
    error 
  } = useMedicationRequests(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowMedicationRequests(!showMedicationRequests)}
          >
            <h3 className="text-lg font-semibold">💊 Medication Requests</h3>
            <button className="text-xl font-bold">
              {showMedicationRequests ? "▲" : "▼"}
            </button>
          </div>
          {showMedicationRequests && (
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
            onClick={() => setShowMedicationRequests(!showMedicationRequests)}
          >
            <h3 className="text-lg font-semibold">💊 Medication Requests</h3>
            <button className="text-xl font-bold">
              {showMedicationRequests ? "▲" : "▼"}
            </button>
          </div>
          {showMedicationRequests && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading medication requests: {error.message}
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
          onClick={() => setShowMedicationRequests(!showMedicationRequests)}
        >
          <h3 className="text-lg font-semibold">💊 Medication Requests</h3>
          <button className="text-xl font-bold">
            {showMedicationRequests ? "▲" : "▼"}
          </button>
        </div>

        {showMedicationRequests && (
          <div className="mt-4">
            {enhancedMedicationRequests.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No medication requests found for this patient
              </div>
            ) : (
              <div className="space-y-3">
                {enhancedMedicationRequests.map((request, index) => (
                  <MedicationRequestRow key={request.id || index} medicationRequest={request} measurementPeriod={measurementPeriod} />
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

interface MedicationRequestRowProps {
  medicationRequest: EnhancedMedicationRequest;
  measurementPeriod: any;
}

const MedicationRequestRow: React.FC<MedicationRequestRowProps> = ({ medicationRequest, measurementPeriod }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      medicationRequest.inMeasurementPeriod 
        ? 'border-l-green-500 bg-green-50' 
        : 'border-l-gray-300 bg-gray-50'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">{medicationRequest.displayDate}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(medicationRequest.statusDisplay)}`}>
              {medicationRequest.statusDisplay}
            </span>
            {!measurementPeriod.isRealTime && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                medicationRequest.inMeasurementPeriod 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {medicationRequest.inMeasurementPeriod ? '✓ In MP' : '✗ Outside MP'}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">
            {medicationRequest.medicationDisplay}
          </div>
          {/* Optional: Show dosage instruction if available */}
          {medicationRequest.dosageInstruction?.[0]?.text && (
            <div className="text-xs text-gray-600 mt-1">
              {medicationRequest.dosageInstruction[0].text}
            </div>
          )}
          {/* Show intent if relevant for tobacco cessation */}
          {medicationRequest.intent && (
            <div className="text-xs text-gray-500 mt-1">
              Intent: {medicationRequest.intent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationRequestPane;