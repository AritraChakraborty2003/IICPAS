"use client";

import React, { useState } from "react";
import {
  FaHome,
  FaBars,
  FaSync,
  FaCog,
  FaMoon,
  FaInfoCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaCheckCircle,
  FaPlay,
  FaTruck,
  FaDownload,
  FaSearch,
  FaQuestionCircle,
  FaGlobe,
  FaMapMarkerAlt,
  FaRoute,
} from "react-icons/fa";

interface EWayBillAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
}

const EWayBillSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState({
    financialYear: "2024-25",
    quarter: "Quarter 1 (Apr - Jun)",
    period: "April",
  });

  const eWayBillActions: EWayBillAction[] = [
    {
      id: "generate-bill",
      title: "Generate E-Way Bill",
      description: "Create new e-way bill for transportation",
      icon: <FaTruck className="text-2xl text-blue-600" />,
      isCompleted: false,
    },
    {
      id: "update-bill",
      title: "Update E-Way Bill",
      description: "Update existing e-way bill details",
      icon: <FaSync className="text-2xl text-green-600" />,
      isCompleted: false,
    },
    {
      id: "cancel-bill",
      title: "Cancel E-Way Bill",
      description: "Cancel generated e-way bill",
      icon: <FaExclamationTriangle className="text-2xl text-red-600" />,
      isCompleted: false,
    },
    {
      id: "search-bill",
      title: "Search E-Way Bill",
      description: "Search and view e-way bill details",
      icon: <FaSearch className="text-2xl text-purple-600" />,
      isCompleted: false,
    },
    {
      id: "print-bill",
      title: "Print E-Way Bill",
      description: "Print e-way bill for physical copy",
      icon: <FaDownload className="text-2xl text-orange-600" />,
      isCompleted: false,
    },
    {
      id: "distance-calc",
      title: "Distance Calculator",
      description: "Calculate distance between locations",
      icon: <FaRoute className="text-2xl text-teal-600" />,
      isCompleted: false,
    },
  ];

  const handleStartSimulation = () => {
    setCurrentStep("actions");
  };

  const handleActionClick = (actionId: string) => {
    console.log(`Opening action: ${actionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header Bar */}
      <div className="bg-blue-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-900 font-bold text-sm">EWB</span>
              </div>
              <h1 className="text-lg font-semibold">E-Way Bill Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Progress: 70%</span>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
              <select className="bg-blue-800 text-white border-none rounded px-2 py-1 text-sm">
                <option>Language</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold text-lg">EWB</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  E-Way Bill Portal
                </h2>
                <p className="text-sm text-gray-600">
                  Generate and manage e-way bills
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  ABC XYZ Private Limited
                </p>
                <p className="text-xs text-gray-600">GSTIN: 09ABCDE1234F1Z5</p>
              </div>
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-800 font-bold text-sm">150</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-6 py-3">
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Dashboard
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Generate
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Search
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Reports
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Settings
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Help
            </a>
          </nav>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 bg-gray-800 text-white z-10">
        <div className="flex flex-col items-center py-4 space-y-6">
          <FaHome className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaBars className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaSync className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaCog className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaMoon className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaInfoCircle className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaExclamationTriangle className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaArrowRight className="text-xl hover:text-blue-400 cursor-pointer" />
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <nav className="text-sm text-gray-600">
              <span>Dashboard</span>
              <span className="mx-2">&gt;</span>
              <span>E-Way Bill</span>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-800 font-medium">Generate</span>
            </nav>
          </div>

          {/* Experiment Instructions */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-teal-800 mb-2">
                  E-Way Bill Generation Portal
                </h3>
                <p className="text-teal-700 mb-4">
                  Generate e-way bills for goods transportation.
                </p>
                <p className="text-teal-600 font-medium">
                  Experiment 4 - Learn e-way bill generation process.
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center">
                  <FaQuestionCircle className="mr-2" />
                  HELP
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
                  <FaSync />
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              E-Way Bill Dashboard
            </h3>
            <p className="text-gray-600 mb-6">
              Manage your e-way bills efficiently for goods transportation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Total E-Way Bills
                </h4>
                <div className="text-3xl font-bold text-blue-600">0</div>
                <p className="text-sm text-blue-600">Generated this month</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  Active Bills
                </h4>
                <div className="text-3xl font-bold text-green-600">0</div>
                <p className="text-sm text-green-600">Currently active</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">
                  Distance Covered
                </h4>
                <div className="text-3xl font-bold text-purple-600">0 KM</div>
                <p className="text-sm text-purple-600">Total distance</p>
              </div>
            </div>
          </div>

          {/* Start Simulation Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleStartSimulation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center mx-auto"
            >
              <FaPlay className="mr-2" />
              Start E-Way Bill Simulation
            </button>
          </div>

          {/* E-Way Bill Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaTruck className="mr-2 text-blue-600" />
              E-Way Bill Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eWayBillActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="mb-4">{action.icon}</div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-center">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Ready</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaTruck className="text-3xl text-blue-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Bill Generation
              </h4>
              <p className="text-gray-600">Create e-way bills for transport</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaMapMarkerAlt className="text-3xl text-green-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Location Tracking
              </h4>
              <p className="text-gray-600">Track goods location</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaRoute className="text-3xl text-purple-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Distance Calculation
              </h4>
              <p className="text-gray-600">Calculate transport distance</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaSearch className="text-3xl text-orange-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Search & Track
              </h4>
              <p className="text-gray-600">Search and track bills</p>
            </div>
          </div>

          {/* Accessibility Options */}
          <div className="fixed top-4 right-4 flex items-center space-x-2 bg-white rounded-lg shadow-md p-2">
            <a
              href="#main-content"
              className="text-sm text-blue-600 hover:underline"
            >
              Skip to Main Content
            </a>
            <div className="flex items-center space-x-1">
              <button className="text-sm font-bold text-gray-600 hover:text-gray-800">
                A+
              </button>
              <button className="text-sm font-bold text-gray-600 hover:text-gray-800">
                A-
              </button>
            </div>
            <select className="text-sm border-none bg-transparent">
              <option>English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EWayBillSimulation;
