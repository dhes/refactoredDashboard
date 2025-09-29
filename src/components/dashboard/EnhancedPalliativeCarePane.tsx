// src/components/dashboard/EnhancedPalliativeCarePane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { usePalliativeCareEvaluation } from '../../hooks/usePalliativeCareEvaluation';
import { PALLIATIVE_CARE_CATEGORIES, type PalliativeCareEvidence } from '../../utils/palliativeCareEvidenceExtractor';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

interface EnhancedPalliativeCarePaneProps {
  patientId: string;
}

export const EnhancedPalliativeCarePane: React.FC<EnhancedPalliativeCarePaneProps> = ({ patientId }) => {
  const [showPalliativeCare, setShowPalliativeCare] = useState(false); // Start closed by default
  const { 
    palliativeCareResult, 
    measurementPeriod: hookMeasurementPeriod, 
    loading, 
    error,
    getEvidenceSummary 
  } = usePalliativeCareEvaluation(patientId);
  
  const { measurementPeriod } = useMeasurementPeriod();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowPalliativeCare(!showPalliativeCare)}
          >
            <h3 className="text-lg font-semibold">🕊️ Palliative Care Status</h3>
            <button className="text-xl font-bold">
              {showPalliativeCare ? "▲" : "▼"}
            </button>
          </div>
          {showPalliativeCare && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="space-y-3">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
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
            onClick={() => setShowPalliativeCare(!showPalliativeCare)}
          >
            <h3 className="text-lg font-semibold">🕊️ Palliative Care Status</h3>
            <button className="text-xl font-bold">
              {showPalliativeCare ? "▲" : "▼"}
            </button>
          </div>
          {showPalliativeCare && (
            <div className="mt-4">
              <div className="text-red-600">
                Error evaluating palliative care library: {error.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!palliativeCareResult) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowPalliativeCare(!showPalliativeCare)}
          >
            <h3 className="text-lg font-semibold">🕊️ Palliative Care Status</h3>
            <button className="text-xl font-bold">
              {showPalliativeCare ? "▲" : "▼"}
            </button>
          </div>
          {showPalliativeCare && (
            <div className="mt-4">
              <div className="text-gray-500">No palliative care evaluation available</div>
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
          onClick={() => setShowPalliativeCare(!showPalliativeCare)}
        >
          <h3 className="text-lg font-semibold">🕊️ Palliative Care Status</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {palliativeCareResult.totalEvidenceCount} evidence
            </div>
            {palliativeCareResult.hasPalliativeCare && (
              <div className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                PALLIATIVE CARE EXCLUSION
              </div>
            )}
            <button className="text-xl font-bold">
              {showPalliativeCare ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showPalliativeCare && (
          <div className="mt-4">
            {/* Overall Status */}
            <div className={`p-3 rounded-lg mb-4 ${
              palliativeCareResult.hasPalliativeCare 
                ? 'bg-purple-50 border border-purple-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {palliativeCareResult.hasPalliativeCare ? '⚠️' : '✅'}
                </span>
                <div>
                  <div className="font-medium">
                    {palliativeCareResult.hasPalliativeCare 
                      ? 'Patient has qualifying palliative care services' 
                      : 'No qualifying palliative care services found'}
                  </div>
                  {palliativeCareResult.totalEvidenceCount > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Evidence: {getEvidenceSummary()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Categories */}
            <div className="space-y-2">
              {Object.entries(PALLIATIVE_CARE_CATEGORIES).map(([categoryKey, categoryInfo]) => {
                const evidenceForCategory = palliativeCareResult.evidenceByCategory[categoryKey] || [];
                const hasEvidence = evidenceForCategory.length > 0;
                const isExpanded = expandedCategories.has(categoryKey);

                return (
                  <div key={categoryKey} className="border rounded-lg">
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className={`w-full p-3 text-left transition-colors ${
                        hasEvidence 
                          ? 'hover:bg-purple-50 bg-purple-25' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryInfo.icon}</span>
                          <div>
                            <div className="font-medium text-sm">
                              {categoryInfo.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {categoryInfo.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            hasEvidence 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {evidenceForCategory.length} found
                          </span>
                          <span className="text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && evidenceForCategory.length > 0 && (
                      <div className="border-t bg-gray-50 p-3">
                        <div className="space-y-2">
                          {evidenceForCategory.map((evidence, index) => (
                            <PalliativeCareEvidenceRow key={`${evidence.resourceId}-${index}`} evidence={evidence} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {!measurementPeriod.isRealTime && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <div>Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}</div>
                  <div className="mt-1">
                    Evaluated using Library/PalliativeCare/$evaluate (CQL-driven)
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

interface PalliativeCareEvidenceRowProps {
  evidence: PalliativeCareEvidence;
}

const PalliativeCareEvidenceRow: React.FC<PalliativeCareEvidenceRowProps> = ({ evidence }) => {
  return (
    <div className="p-2 bg-white rounded border">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm">{evidence.displayDate}</span>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
              {evidence.resourceType}
            </span>
            {evidence.systemAbbrev && evidence.code && (
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-mono">
                {evidence.systemAbbrev}:{evidence.code}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700 font-medium">
            {evidence.display}
          </div>
          {evidence.specialDetails && (
            <div className="text-xs text-gray-500 mt-1">
              {evidence.specialDetails}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPalliativeCarePane;