// src/components/dashboard/CDSCard.tsx

import React from 'react';
import type { CDSHookCard as CDSCardType } from '../../services/cdsHooksService';

interface CDSCardProps {
  card: CDSCardType;
  onActionClick?: (action: any) => void;
}

export const CDSCard: React.FC<CDSCardProps> = ({ card, onActionClick }) => {
  const getCardIcon = (summary: string) => {
    if (summary.toLowerCase().includes('tobacco')) return '🚭';
    if (summary.toLowerCase().includes('screening')) return '🔍';
    if (summary.toLowerCase().includes('mips')) return '📊';
    if (summary.toLowerCase().includes('encounter')) return '🏥';
    return '💡';
  };

  const getCardStyle = (summary: string) => {
    if (summary.toLowerCase().includes('needs') || summary.toLowerCase().includes('candidate')) {
      return 'bg-amber-50 border-amber-200 text-amber-900';
    }
    return 'bg-blue-50 border-blue-200 text-blue-900';
  };

  const handleActionClick = (actionType: string) => {
    if (onActionClick) {
      onActionClick({ type: actionType, card });
    }
  };

  return (
    <div className={`mb-3 p-3 rounded-lg border ${getCardStyle(card.summary)}`}>
      <div className="flex items-start">
        <span className="text-lg mr-2">{getCardIcon(card.summary)}</span>
        <div className="flex-1">
          <p className="font-medium">{card.summary}</p>
          {card.detail && (
            <p className="text-sm mt-1">{card.detail}</p>
          )}
          
          {/* Action buttons based on card content */}
          {card.detail?.toLowerCase().includes('encounter') && (
            <div className="mt-2">
              <button
                onClick={() => handleActionClick('create-encounter')}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Encounter
              </button>
            </div>
          )}
          
          {card.source && (
            <div className="mt-2">
              {card.source.url ? (
                <a 
                  href={card.source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  📖 {card.source.label}
                </a>
              ) : (
                <span className="text-xs text-gray-600">
                  📖 {card.source.label}
                </span>
              )}
            </div>
          )}
          
          {card.links && card.links.length > 0 && (
            <div className="mt-2 space-x-2">
              {card.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-2 py-1 bg-white border rounded hover:bg-gray-50"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          
          {card.suggestions && card.suggestions.length > 0 && (
            <div className="mt-2 space-x-2">
              {card.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onActionClick?.(suggestion)}
                  className="text-sm px-2 py-1 bg-white border rounded hover:bg-gray-50"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};