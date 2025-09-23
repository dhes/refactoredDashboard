// src/components/dashboard/CMS138DeveloperCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useCMS138Evaluation } from '../../hooks/useCMS138Evaluation';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import { formatParameterValue, getParameterValueColor } from '../../utils/cms138Parser';

interface CMS138DeveloperCardProps {
  patientId: string;
}

export const CMS138DeveloperCard: React.FC<CMS138DeveloperCardProps> = ({ patientId }) => {
  const [showDeveloper, setShowDeveloper] = useState(false);
  const { cms138Result, getMeasureStepSummary, loading, error } = useCMS138Evaluation(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowDeveloper(!showDeveloper)}
          >
            <h3 className="text-lg font-semibold">🔬 Tobacco Screening Detail</h3>
            <button className="text-xl font-bold">
              {showDeveloper ? "▲" : "▼"}
            </button>
          </div>
          {showDeveloper && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
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
            onClick={() => setShowDeveloper(!showDeveloper)}
          >
            <h3 className="text-lg font-semibold">🔬 Tobacco Screening Detail</h3>
            <button className="text-xl font-bold">
              {showDeveloper ? "▲" : "▼"}
            </button>
          </div>
          {showDeveloper && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading CMS138 evaluation: {error.message}
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
          onClick={() => setShowDeveloper(!showDeveloper)}
        >
          <h3 className="text-lg font-semibold">🔬 Tobacco Screening Detail</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}
            </div>
            <button className="text-xl font-bold">
              {showDeveloper ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showDeveloper && cms138Result && (
          <div className="mt-4 space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-800 mb-2">Measure Logic Summary</div>
              <div className="text-sm font-mono text-gray-700">{getMeasureStepSummary()}</div>
            </div>

            {/* Initial Population */}
            {cms138Result.initialPopulation !== null && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Initial Population</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getParameterValueColor(cms138Result.initialPopulation)}`}>
                    {formatParameterValue(cms138Result.initialPopulation)}
                  </span>
                </div>
              </div>
            )}

            {/* Denominators */}
            {Object.keys(cms138Result.denominators).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Denominators</h4>
                <div className="space-y-2">
                  {Object.entries(cms138Result.denominators).map(([name, value]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm">{name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getParameterValueColor(value)}`}>
                        {formatParameterValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {Object.keys(cms138Result.exclusions).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Exclusions</h4>
                <div className="space-y-2">
                  {Object.entries(cms138Result.exclusions).map(([name, value]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm">{name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getParameterValueColor(value)}`}>
                        {formatParameterValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Numerators */}
            {Object.keys(cms138Result.numerators).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Numerators</h4>
                <div className="space-y-2">
                  {Object.entries(cms138Result.numerators).map(([name, value]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm">{name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getParameterValueColor(value)}`}>
                        {formatParameterValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Scores */}
            {Object.keys(cms138Result.patientScores).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Patient Scores</h4>
                <div className="space-y-2">
                  {Object.entries(cms138Result.patientScores).map(([name, value]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{name}</span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getParameterValueColor(value)}`}>
                        {formatParameterValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Parameters */}
            {cms138Result.otherParameters.filter(param => 
              !(measurementPeriod.isRealTime && param.name.includes('Age In Years At Start Of Measurement Period'))
            ).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Other Parameters</h4>
                <div className="space-y-2">
                  {cms138Result.otherParameters
                    .filter(param => 
                      !(measurementPeriod.isRealTime && param.name.includes('Age In Years At Start Of Measurement Period'))
                    )
                    .map((param, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{param.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getParameterValueColor(param.value)}`}>
                        {formatParameterValue(param.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with measurement period details */}
            {!measurementPeriod.isRealTime && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <div className="font-medium">Measurement Period:</div>
                  <div className="font-mono mt-1">
                    {measurementPeriod.start} to {measurementPeriod.end}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CMS138DeveloperCard;