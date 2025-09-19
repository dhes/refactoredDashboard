// src/components/dashboard/ServiceRequestPane.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useServiceRequests, type EnhancedServiceRequest } from '../../hooks/useServiceRequests';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';

interface ServiceRequestPaneProps {
  patientId: string;
}

export const ServiceRequestPane: React.FC<ServiceRequestPaneProps> = ({ patientId }) => {
  const [showServiceRequests, setShowServiceRequests] = useState(false); // Start closed by default
  const { 
    enhancedServiceRequests, 
    serviceRequestsInMP, 
    measurementPeriod: hookMeasurementPeriod, 
    loading, 
    error 
  } = useServiceRequests(patientId);
  const { measurementPeriod } = useMeasurementPeriod();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowServiceRequests(!showServiceRequests)}
          >
            <h3 className="text-lg font-semibold">🩺 Service Requests</h3>
            <button className="text-xl font-bold">
              {showServiceRequests ? "▲" : "▼"}
            </button>
          </div>
          {showServiceRequests && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            onClick={() => setShowServiceRequests(!showServiceRequests)}
          >
            <h3 className="text-lg font-semibold">🩺 Service Requests</h3>
            <button className="text-xl font-bold">
              {showServiceRequests ? "▲" : "▼"}
            </button>
          </div>
          {showServiceRequests && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading service requests: {error.message}
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
          onClick={() => setShowServiceRequests(!showServiceRequests)}
        >
          <h3 className="text-lg font-semibold">🩺 Service Requests</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {serviceRequestsInMP} requests
            </div>
            <button className="text-xl font-bold">
              {showServiceRequests ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showServiceRequests && (
          <div className="mt-4">
            {enhancedServiceRequests.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No service requests found for this patient
              </div>
            ) : (
              <div className="space-y-3">
                {enhancedServiceRequests.map((request, index) => (
                  <ServiceRequestRow key={request.id || index} serviceRequest={request} />
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ServiceRequestRowProps {
  serviceRequest: EnhancedServiceRequest;
}

const ServiceRequestRow: React.FC<ServiceRequestRowProps> = ({ serviceRequest }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'routine':
        return 'bg-blue-100 text-blue-800';
      default:
        return null;
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      serviceRequest.inMeasurementPeriod 
        ? 'border-l-green-500 bg-green-50' 
        : 'border-l-gray-300 bg-gray-50'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">{serviceRequest.displayDate}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(serviceRequest.statusDisplay)}`}>
              {serviceRequest.statusDisplay}
            </span>
            {serviceRequest.priority && getPriorityColor(serviceRequest.priority) && (
              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(serviceRequest.priority)}`}>
                {serviceRequest.priority.charAt(0).toUpperCase() + serviceRequest.priority.slice(1)}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              serviceRequest.inMeasurementPeriod 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {serviceRequest.inMeasurementPeriod ? '✓ In MP' : '✗ Outside MP'}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">
            {serviceRequest.serviceDisplay}
          </div>
          {/* Show code if it's different from display */}
          {serviceRequest.code?.coding?.[0]?.code && 
           serviceRequest.code.coding[0].code !== serviceRequest.serviceDisplay && (
            <div className="text-xs text-gray-500 mt-1">
              Code: {serviceRequest.code.coding[0].system ? 
                `${serviceRequest.code.coding[0].system}|${serviceRequest.code.coding[0].code}` :
                serviceRequest.code.coding[0].code}
            </div>
          )}
          {/* Show intent if available */}
          {serviceRequest.intent && (
            <div className="text-xs text-gray-500 mt-1">
              Intent: {serviceRequest.intent}
            </div>
          )}
          {/* Show category if available (e.g., counseling, procedure, etc.) */}
          {serviceRequest.category?.[0]?.text && (
            <div className="text-xs text-gray-500 mt-1">
              Category: {serviceRequest.category[0].text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestPane;