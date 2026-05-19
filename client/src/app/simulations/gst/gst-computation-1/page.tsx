"use client";

import React from "react";

export default function GSTComputationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">GST Computation Simulation</h1>
        <p className="text-slate-600 mb-6">
          This is an empty screen placeholder for the GST Computation & Challan Creation simulation.
        </p>
        <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
          Start Simulation
        </div>
      </div>
    </div>
  );
}
