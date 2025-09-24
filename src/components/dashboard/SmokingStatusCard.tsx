// src/components/dashboard/SmokingStatusCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { useSmokingStatus } from '../../hooks/useSmokingStatus';
import { fhirClient } from '../../services/fhirClient';
import SmokingStatusForm from '../forms/SmokingStatusForm';

interface SmokingStatusCardProps {
  patientId: string;
}

export const SmokingStatusCard: React.FC<SmokingStatusCardProps> = ({ patientId }) => {
  const [showSmokingStatus, setShowSmokingStatus] = useState(false);
  const [showSmokingStatusPrompt, setShowSmokingStatusPrompt] = useState(false);
  const [showSmokingForm, setShowSmokingForm] = useState(false);
  
  const { smokingStatus, allSmokingObs } = useSmokingStatus(patientId);

  // Get the latest smoking observation
  const latestSmokingObservation = smokingStatus;

  // Debug logging
  console.log("Smoking status data:", {
    smokingStatus,
    allSmokingObs,
    patientId,
    latestSmokingObservation,
  });

  // Check if smoking status needs updating (>1 year old)
  useEffect(() => {
    console.log("Smoking status check:", {
      hasSmokingStatus: !!latestSmokingObservation,
      effectiveDateTime: latestSmokingObservation?.effectiveDateTime,
      showPrompt: showSmokingStatusPrompt,
    });

    if (latestSmokingObservation && latestSmokingObservation.effectiveDateTime) {
      const lastRecordedDate = new Date(latestSmokingObservation.effectiveDateTime);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      console.log("Date comparison:", {
        lastRecorded: lastRecordedDate.toISOString(),
        oneYearAgo: oneYearAgo.toISOString(),
        shouldShowPrompt: lastRecordedDate < oneYearAgo,
      });

      if (lastRecordedDate < oneYearAgo) {
        setShowSmokingStatusPrompt(true);
      }
    } else {
      console.log("No smoking observation or no effectiveDateTime");
    }
  }, [latestSmokingObservation]);

  // Handle "No Change" button - create new observation with same value
  const handleNoChangeSmokingStatus = async (previousObservation: any) => {
    try {
      // Create a new observation with today's date but same value
      const newObservation = {
        resourceType: "Observation" as const,
        status: "final" as const,
        code: previousObservation.code,
        subject: {
          reference: `Patient/${patientId}`,
        },
        effectiveDateTime: new Date().toISOString(),
        valueCodeableConcept: previousObservation.valueCodeableConcept,
      };

      await fhirClient.createObservation(newObservation);

      // Close the prompt
      setShowSmokingStatusPrompt(false);

      // TODO: Refresh observations to show the new one
    } catch (error) {
      console.error("Error updating smoking status:", error);
    }
  };

  // Handle update button click
  const handleUpdateClick = () => {
    setShowSmokingForm(true);
    setShowSmokingStatusPrompt(false);
  };

  return (
    <>
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowSmokingStatus(!showSmokingStatus)}
          >
            <h3 className="font-semibold text-lg">🚭 Smoking Status</h3>
            <button className="text-xl font-bold">
              {showSmokingStatus ? "▲" : "▼"}
            </button>
          </div>

          {showSmokingStatus && (
            <div className="mt-4">
              {smokingStatus ? (
                <div>
                  <p className="text-lg">
                    {smokingStatus.valueCodeableConcept?.coding?.[0]?.display ||
                      smokingStatus.valueCodeableConcept?.text ||
                      "Unknown status"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {smokingStatus.effectiveDateTime?.slice(0, 10) || "Date unknown"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No smoking history on file</p>
              )}

              {(!smokingStatus ||
                (smokingStatus.effectiveDateTime &&
                  new Date(smokingStatus.effectiveDateTime) <
                    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))) && (
                <button
                  onClick={handleUpdateClick}
                  className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Smoking Status
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smoking Status Update Prompt */}
      {showSmokingStatusPrompt && latestSmokingObservation && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-semibold">🔔 Smoking Status Update Needed</p>
          <p className="mt-1">
            The patient's smoking status was last recorded on{" "}
            {latestSmokingObservation.effectiveDateTime?.slice(0, 10)}. 
            Current status: {latestSmokingObservation.valueCodeableConcept?.coding?.[0]?.display}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleNoChangeSmokingStatus(latestSmokingObservation)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              No Change
            </button>
            <button
              onClick={handleUpdateClick}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update Status
            </button>
            <button
              onClick={() => setShowSmokingStatusPrompt(false)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Smoking Status Form */}
      {showSmokingForm && (
        <SmokingStatusForm
          patientId={patientId}
          onClose={() => setShowSmokingForm(false)}
          onSuccess={() => {
            setShowSmokingForm(false);
            setShowSmokingStatusPrompt(false);
          }}
        />
      )}
    </>
  );
};

export default SmokingStatusCard;