// src/components/dashboard/EnhancedGuidanceBanner.tsx

import React from 'react';
import type { EnhancedGuidanceResult } from '../../services/enhancedGuidanceService';

interface EnhancedGuidanceBannerProps {
  guidance: EnhancedGuidanceResult;
  onCreateEncounter: () => void;
  onDocumentScreening: () => void;
}

export default function EnhancedGuidanceBanner({ 
  guidance, 
  onCreateEncounter, 
  onDocumentScreening 
}: EnhancedGuidanceBannerProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'measure_complete':
        return 'bg-green-50 border border-green-200 text-green-900';
      case 'eligible_needs_screening':
        return 'bg-yellow-50 border border-yellow-200 text-yellow-900';
      case 'not_eligible':
        return 'bg-amber-50 border border-amber-200 text-amber-900';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'measure_complete': return '✅';
      case 'eligible_needs_screening': return '⚠️';
      case 'not_eligible': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'measure_complete': return 'All requirements met';
      case 'eligible_needs_screening': return 'Eligible but needs documentation';
      case 'not_eligible': return 'Not eligible for measure';
      default: return 'Status needs review';
    }
  };

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case 'create_encounter':
        onCreateEncounter();
        break;
      case 'document_screening':
        onDocumentScreening();
        break;
    }
  };

  return (
    <div className={`mb-3 p-4 rounded-lg ${getStatusColor(guidance.status)}`}>
      {/* Header with patient info */}
      <div className="flex items-start mb-3">
        <span className="text-lg mr-2">{getStatusIcon(guidance.status)}</span>
        <div className="flex-1">
          <p className="font-medium text-lg">
            {guidance.patientName} ({guidance.patientAge} years old)
          </p>
          <p className="text-sm opacity-75 mt-1">
            {getStatusMessage(guidance.status)}
          </p>
          {guidance.isEnhanced && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
              ✨ Enhanced Analysis
            </span>
          )}
        </div>
      </div>

      {/* Specific Issues */}
      {guidance.specificIssues.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium mb-2">📋 Current Status:</h4>
          <div className="space-y-2">
            {guidance.specificIssues.map((issue, idx) => (
              <div key={idx} className="text-sm">
                <div className="font-medium">{issue.issue}</div>
                <div className="flex items-center space-x-4 mt-1 text-xs opacity-75">
                  <span>Current: <strong>{issue.currentValue}</strong></span>
                  <span>Required: <strong>{issue.requiredValue}</strong></span>
                  {issue.priority === 'high' && (
                    <span className="bg-red-100 text-red-800 px-1 rounded text-xs">
                      High Priority
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {guidance.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">🎯 Recommended Actions:</h4>
          {guidance.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white bg-opacity-50 p-2 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{rec.reason}</p>
                <p className="text-xs mt-1 opacity-75">{rec.action}</p>
              </div>
              <button
                onClick={() => handleActionClick(rec.actionType)}
                className={`ml-4 px-3 py-1 text-sm rounded font-medium transition-colors ${
                  rec.priority === 'immediate'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {rec.buttonText}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fallback comparison (development only) */}
      {!guidance.isEnhanced && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <p className="text-xs opacity-75">
            ⚡ Standard analysis: {guidance.fallbackGuidance.message}
          </p>
        </div>
      )}
    </div>
  );
}