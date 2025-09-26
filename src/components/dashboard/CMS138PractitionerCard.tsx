// src/components/dashboard/CMS138PractitionerCard.tsx
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import type { CMS138Result } from '../../utils/cms138Parser';

interface CMS138PractitionerCardProps {
  patientId: string;
  cms138Result: CMS138Result | null;
  loading: boolean;
  error: Error | null;
}

export const CMS138PractitionerCard: React.FC<CMS138PractitionerCardProps> = ({ 
  patientId, 
  cms138Result, 
  loading, 
  error 
}) => {
  const { measurementPeriod } = useMeasurementPeriod();

  // Calculate practitioner alert status
  const hasPractitionerAlert = cms138Result?.practitionerAlert || false;

  // Show card if:
  // - Real Time mode: only when action needed (Patient Score = 0)
  // - Retrospective mode: always (for quality measure feedback)
  if (measurementPeriod.isRealTime && !hasPractitionerAlert) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-l-4 border-l-amber-500 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
            <h3 className="text-lg font-semibold text-amber-800">
              🚨 Evaluating Tobacco Cessation Requirements...
            </h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            🚨 Tobacco Cessation Evaluation Error
          </h3>
          <div className="text-red-600 text-sm">
            Error evaluating CMS138: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract specific patient scores that are 0 (eligible but no intervention)
  const failedScores = cms138Result ? Object.entries(cms138Result.patientScores)
    .filter(([_, value]) => value === 0)
    .map(([name, _]) => name) : [];

  const formatMeasurementPeriod = () => 
    measurementPeriod.isRealTime ? 'Real Time' : measurementPeriod.year.toString();

  // Determine card styling based on mode and alert status
  const isAlert = measurementPeriod.isRealTime ? hasPractitionerAlert : cms138Result?.ecqmExclusionReason;
  const cardStyle = isAlert ? "border-l-4 border-l-red-500 bg-red-50" : "border-l-4 border-l-green-500 bg-green-50";
  const headerStyle = isAlert ? "text-red-800" : "text-green-800";
  const badgeStyle = isAlert ? "text-red-600 bg-red-100" : "text-green-600 bg-green-100";

  return (
    <Card className={cardStyle}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className={`text-lg font-semibold ${headerStyle}`}>
            {isAlert ? '🚨' : '✅'} Tobacco Screening
          </h3>
          <div className={`text-xs px-2 py-1 rounded ${badgeStyle}`}>
            {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}
          </div>
        </div>

        <div className="space-y-3">
          {/* Real Time Mode: Clinical guidance */}
          {measurementPeriod.isRealTime && (
            <>
              {/* Show specific CQL actions directly */}
              <div className="bg-red-100 p-3 rounded">
                <div className="font-medium text-red-800 mb-2">Action Required:</div>
                {cms138Result?.specificActions && cms138Result.specificActions.length > 0 ? (
                  <ul className="text-sm text-red-700 space-y-1">
                    {cms138Result.specificActions.map((action, index) => {
                      // Determine appropriate documentation message based on the action
                      const isScreeningAction = action.includes('Assess current tobacco');
                      const documentationMessage = isScreeningAction 
                        ? '• Document tobacco status in patient record'
                        : '• Document intervention in patient record';
                      
                      return (
                        <React.Fragment key={index}>
                          <li>• {action}</li>
                          {index === cms138Result.specificActions.length - 1 && (
                            <li>{documentationMessage}</li>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Assess current tobacco use status</li>
                    <li>• Document tobacco status in patient record</li>
                  </ul>
                )}
              </div>
            </>
          )}

          {/* Retrospective Mode: Quality measure feedback */}
          {!measurementPeriod.isRealTime && (
            <div>
              {cms138Result?.ecqmExclusionReason ? (
                <div className="bg-yellow-100 p-3 rounded border-l-4 border-l-yellow-500">
                  <div className="font-medium text-yellow-800">Quality Measure Status</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    {cms138Result.ecqmExclusionReason}
                  </div>
                </div>
              ) : (
                <div className="bg-green-100 p-3 rounded border-l-4 border-l-green-500">
                  <div className="font-medium text-green-800">Quality Measure Status</div>
                  <div className="text-sm text-green-700 mt-1">
                    Patient will appear in quality measure score
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CMS138PractitionerCard;