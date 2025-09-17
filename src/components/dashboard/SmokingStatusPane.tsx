// src/components/dashboard/SmokingStatusPane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useSmokingStatus } from '../../hooks/useSmokingStatus';

interface SmokingStatusPaneProps {
  patientId: string;
  onUpdateClick: () => void;
}

export const SmokingStatusPane: React.FC<SmokingStatusPaneProps> = ({ 
  patientId, 
  onUpdateClick 
}) => {
  const [showSmokingStatus, setShowSmokingStatus] = useState(false);
  const { smokingStatus } = useSmokingStatus(patientId);

  return (
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
                onClick={onUpdateClick}
                className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Smoking Status
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmokingStatusPane;