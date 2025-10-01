// src/components/dashboard/BMIStatusCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import { useCMS69Evaluation } from '../../hooks/useCMS69Evaluation';
import { getBMICategory, type BMIObservation } from '../../utils/cms69Parser';

interface BMIStatusCardProps {
  patientId: string;
}

export const BMIStatusCard: React.FC<BMIStatusCardProps> = ({ patientId }) => {
  const [showBMIStatus, setShowBMIStatus] = useState(false);
  const { measurementPeriod } = useMeasurementPeriod();
  const { cms69Result, loading, error } = useCMS69Evaluation(patientId);

  // Get the most recent BMI observation
  const mostRecentBMI = cms69Result?.bmiObservations?.[0] || null;

  // Determine BMI interpretation based on CQL results
  const getBMIInterpretation = () => {
    if (cms69Result?.hasNormalBMI) {
      return { category: 'Normal', color: 'bg-green-100 text-green-800', source: 'CQL: Has Normal BMI' };
    }
    if (cms69Result?.documentedHighBMI && cms69Result.documentedHighBMI.length > 0) {
      return { category: 'High (≥25)', color: 'bg-red-100 text-red-800', source: 'CQL: High BMI' };
    }
    if (cms69Result?.documentedLowBMI && cms69Result.documentedLowBMI.length > 0) {
      return { category: 'Low (<18.5)', color: 'bg-blue-100 text-blue-800', source: 'CQL: Low BMI' };
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowBMIStatus(!showBMIStatus)}
          >
            <h3 className="font-semibold text-lg">⚖️ BMI Status</h3>
            <button className="text-xl font-bold">
              {showBMIStatus ? "▲" : "▼"}
            </button>
          </div>
          {showBMIStatus && (
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
            onClick={() => setShowBMIStatus(!showBMIStatus)}
          >
            <h3 className="font-semibold text-lg">⚖️ BMI Status</h3>
            <button className="text-xl font-bold">
              {showBMIStatus ? "▲" : "▼"}
            </button>
          </div>
          {showBMIStatus && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading BMI status: {error.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const bmiInterpretation = getBMIInterpretation();

  return (
    <Card>
      <CardContent>
        {/* Pregnancy Exclusion Banner */}
        {cms69Result?.isPregnant && (
          <div className="mb-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤰</span>
              <div>
                <div className="font-medium text-pink-800">
                  Excluded from BMI Quality Measure: Active Pregnancy
                </div>
                <div className="text-sm text-pink-700">
                  Your BMI quality score is not affected by this patient.
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowBMIStatus(!showBMIStatus)}
        >
          <h3 className="font-semibold text-lg">⚖️ BMI Status</h3>
          <div className="flex items-center gap-2">
            {mostRecentBMI && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                {measurementPeriod.isRealTime ? 'Real Time' : `MP ${measurementPeriod.year}`}:
                <span className="font-medium">
                  {mostRecentBMI.value.toFixed(1)} {mostRecentBMI.unit}
                </span>
                {bmiInterpretation && (
                  <span className={`text-xs px-2 py-1 rounded-full ${bmiInterpretation.color}`}>
                    {bmiInterpretation.category}
                  </span>
                )}
              </div>
            )}
            {!mostRecentBMI && (
              <div className="text-sm text-gray-600">
                {measurementPeriod.isRealTime ? 'Real Time' : `MP ${measurementPeriod.year}`}: No BMI found
              </div>
            )}
            <button className="text-xl font-bold">
              {showBMIStatus ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showBMIStatus && (
          <div className="mt-4">
            {mostRecentBMI ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl font-bold text-gray-800">
                    {mostRecentBMI.value.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {mostRecentBMI.unit}
                  </div>
                  {bmiInterpretation && (
                    <div className={`text-sm px-3 py-1 rounded-full font-medium ${bmiInterpretation.color}`}>
                      {bmiInterpretation.category}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{mostRecentBMI.displayDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{mostRecentBMI.status}</span>
                  </div>
                  {bmiInterpretation && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Interpretation:</span>
                      <span className="font-medium text-xs">{bmiInterpretation.source}</span>
                    </div>
                  )}
                </div>

                {/* Additional BMI readings if available */}
                {cms69Result && cms69Result.bmiObservations.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Additional BMI Readings ({cms69Result.bmiObservations.length - 1} more)
                    </div>
                    <div className="space-y-1">
                      {cms69Result.bmiObservations.slice(1, 4).map((bmi, index) => {
                        const category = getBMICategory(bmi.value);
                        return (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span>{bmi.displayDate}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{bmi.value.toFixed(1)} {bmi.unit}</span>
                              <span className={`px-2 py-1 rounded ${category.color} text-xs`}>
                                {category.category}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {cms69Result.bmiObservations.length > 4 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          ... and {cms69Result.bmiObservations.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!measurementPeriod.isRealTime && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Source: CQL evaluation ({measurementPeriod.isRealTime ? 'Real Time' : `MP ${measurementPeriod.year}`})
                      <br />
                      BMI categories: Underweight (&lt;18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (≥30)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-500 italic mb-4">No BMI measurements found</p>
                {!measurementPeriod.isRealTime && (
                  <div className="text-xs text-gray-500">
                    Source: CQL evaluation (MP {measurementPeriod.year})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BMIStatusCard;