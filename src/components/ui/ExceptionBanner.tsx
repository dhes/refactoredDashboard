// src/components/ui/ExceptionBanner.tsx
import React from 'react';
import type { NotDoneException } from '../../utils/cms69Parser';

interface ExceptionBannerProps {
  exception: NotDoneException;
  className?: string;
}

export const ExceptionBanner: React.FC<ExceptionBannerProps> = ({ 
  exception, 
  className = '' 
}) => {
  // Determine banner color based on category
  const getBannerColor = (category: string) => {
    switch (category) {
      case 'Medical Reason':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'Patient Reason':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  // Determine icon based on category
  const getIcon = (category: string) => {
    switch (category) {
      case 'Medical Reason':
        return '⚠️';
      case 'Patient Reason':
        return '👤';
      default:
        return '❓';
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg border ${getBannerColor(exception.category)} ${className}`}
      title={exception.bannerCode} // Hover shows the code for power users
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {getIcon(exception.category)}
        </span>
        <div>
          <div className="font-medium">
            {exception.bannerText}
          </div>
          <div className="text-sm mt-1 opacity-80">
            Quality measure requirements do not apply to this patient.
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExceptionBannersProps {
  exceptions: NotDoneException[];
  className?: string;
}

export const ExceptionBanners: React.FC<ExceptionBannersProps> = ({ 
  exceptions, 
  className = '' 
}) => {
  if (!exceptions || exceptions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {exceptions.map((exception, index) => (
        <ExceptionBanner 
          key={`${exception.bannerCode}-${index}`} 
          exception={exception} 
        />
      ))}
    </div>
  );
};

export default ExceptionBanner;