// src/App.tsx
import React from "react";
import Dashboard from "./components/dashboard/Dashboard";
import { MeasurementPeriodProvider } from "./contexts/MeasurementPeriodContext";
import { MeasurementPeriodSelector } from "./components/ui/MeasurementPeriodSelector";

const App: React.FC = () => {
  console.log("🏠 App rendered");
  return (
    <MeasurementPeriodProvider>
      <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">📋 Personal Health Dashboard</h1>
          <MeasurementPeriodSelector />
        </div>
        <Dashboard />
      </main>
    </MeasurementPeriodProvider>
  );
};

export default App;