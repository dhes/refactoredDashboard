// src/components/dashboard/TobaccoStatusCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import type { CMS138Result } from '../../utils/cms138Parser';
import SmokingStatusForm from '../forms/SmokingStatusForm';

interface TobaccoStatusCardProps {
  patientId: string;
  cms138Result: CMS138Result | null;
  loading: boolean;
  error: Error | null;
}

export const TobaccoStatusCard: React.FC<TobaccoStatusCardProps> = ({ 
  patientId, 
  cms138Result, 
  loading, 
  error 
}) => {
  const [showTobaccoStatus, setShowTobaccoStatus] = useState(false);
  const [showSmokingForm, setShowSmokingForm] = useState(false);
  const { measurementPeriod } = useMeasurementPeriod();

  // Get the most recent tobacco observation from CQL evaluation
  // Priority: User > Non-User (since User indicates more recent/relevant clinical finding)
  const tobaccoObservation = cms138Result?.tobaccoUserObservation || cms138Result?.tobaccoNonUserObservation;
  const isUser = !!cms138Result?.tobaccoUserObservation;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowTobaccoStatus(!showTobaccoStatus)}
          >
            <h3 className="font-semibold text-lg">🚭 Tobacco Status (CQL)</h3>
            <button className="text-xl font-bold">
              {showTobaccoStatus ? "▲" : "▼"}
            </button>
          </div>
          {showTobaccoStatus && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
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
            onClick={() => setShowTobaccoStatus(!showTobaccoStatus)}
          >
            <h3 className="font-semibold text-lg">🚭 Tobacco Status (CQL)</h3>
            <button className="text-xl font-bold">
              {showTobaccoStatus ? "▲" : "▼"}
            </button>
          </div>
          {showTobaccoStatus && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading tobacco status: {error.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Format the observation date
  const getObservationDate = (observation: any) => {
    if (!observation) return null;
    
    // Handle different date fields
    const date = observation.effectiveDateTime || 
                observation.effectivePeriod?.start ||
                observation.effectivePeriod?.end;
    
    return date ? new Date(date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Date unknown';
  };

  // Get display text for tobacco status
  const getStatusDisplay = (observation: any) => {
    if (!observation) return 'Unknown status';
    
    return observation.valueCodeableConcept?.coding?.[0]?.display ||
           observation.valueCodeableConcept?.text ||
           'Unknown status';
  };

  // Check if status needs updating (>1 year old)
  const needsUpdate = tobaccoObservation && tobaccoObservation.effectiveDateTime ? 
    new Date(tobaccoObservation.effectiveDateTime) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) :
    !tobaccoObservation; // No observation also needs update

  return (
    <>
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowTobaccoStatus(!showTobaccoStatus)}
          >
            <h3 className="font-semibold text-lg">🚭 Tobacco Status (CQL)</h3>
            <button className="text-xl font-bold">
              {showTobaccoStatus ? "▲" : "▼"}
            </button>
          </div>

          {showTobaccoStatus && (
            <div className="mt-4">
              {tobaccoObservation ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-lg font-medium">
                      {getStatusDisplay(tobaccoObservation)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isUser 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isUser ? 'User' : 'Non-User'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Last updated: {getObservationDate(tobaccoObservation)}
                  </p>
                  {!measurementPeriod.isRealTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Source: CQL evaluation ({measurementPeriod.isRealTime ? 'Real Time' : `MP ${measurementPeriod.year}`})
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No tobacco status found by CQL evaluation</p>
              )}

              {needsUpdate && (
                <button
                  onClick={() => setShowSmokingForm(true)}
                  className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Tobacco Status
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smoking Status Form */}
      {showSmokingForm && (
        <SmokingStatusForm
          patientId={patientId}
          onClose={() => setShowSmokingForm(false)}
          onSuccess={() => setShowSmokingForm(false)}
        />
      )}
    </>
  );
};

export default TobaccoStatusCard;