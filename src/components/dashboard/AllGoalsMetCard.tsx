// src/components/dashboard/AllGoalsMetCard.tsx
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import type { CMS138Result } from '../../utils/cms138Parser';

interface AllGoalsMetCardProps {
  patientId: string;
  cms138Result: CMS138Result | null;
  loading: boolean;
  error: Error | null;
}

export const AllGoalsMetCard: React.FC<AllGoalsMetCardProps> = ({ 
  patientId, 
  cms138Result, 
  loading, 
  error 
}) => {
  const { measurementPeriod } = useMeasurementPeriod();

  // Only show this card when all goals are actually met
  const allGoalsMet = cms138Result?.allGoalsMet;
  
  // Don't render anything if goals aren't met or if there's an error/loading
  if (!allGoalsMet || loading || error) {
    return null;
  }

  const formatMeasurementPeriod = () => 
    measurementPeriod.isRealTime ? 'Real Time' : measurementPeriod.year.toString();

  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-green-800">
            🎉 Tobacco Screening Complete
          </h3>
          <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-600">
            {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-green-100 p-3 rounded border-l-4 border-l-green-500">
            <div className="font-medium text-green-800 mb-1">✅ Success</div>
            <div className="text-sm text-green-700">
              {allGoalsMet}
            </div>
          </div>

          <div className="text-xs text-green-600">
            <div className="font-medium mb-1">Quality Measure Status:</div>
            <div>• Patient was appropriately screened for tobacco use</div>
            <div>• All required interventions completed (if applicable)</div>
            <div>• Patient Score 3 = 1 (maximum score achieved)</div>
          </div>

          {!measurementPeriod.isRealTime && (
            <div className="pt-3 border-t border-green-200">
              <div className="text-xs text-green-600">
                Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
                <br />
                <span className="font-medium">This patient will contribute positively to your quality scores</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AllGoalsMetCard;