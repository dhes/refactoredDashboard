// src/App.tsx
import React from "react";
import Dashboard from "./components/dashboard/Dashboard";

const App: React.FC = () => {
  console.log("🏠 App rendered");
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <h1 className="text-3xl font-bold mb-4">📋 Personal Health Dashboard</h1>
      <Dashboard />
    </main>
  );
};

export default App;