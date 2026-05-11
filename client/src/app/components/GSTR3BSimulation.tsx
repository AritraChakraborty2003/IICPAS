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
  FaReceipt,
  FaDownload,
  FaSearch,
  FaQuestionCircle,
  FaGlobe,
  FaCalculator,
  FaFileAlt,
} from "react-icons/fa";

interface TaxLiability {
  id: string;
  description: string;
  amount: number;
  isCompleted: boolean;
}

interface ITCReversal {
  id: string;
  description: string;
  amount: number;
  isCompleted: boolean;
}

const GSTR3BSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState("summary");
  const [selectedPeriod, setSelectedPeriod] = useState({
    financialYear: "2024-25",
    quarter: "Quarter 1 (Apr - Jun)",
    period: "April",
  });

  const [taxLiabilities] = useState<TaxLiability[]>([
    {
      id: "outward-supplies",
      description:
        "Outward taxable supplies (other than zero-rated, nil-rated and exempted)",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "zero-rated-supplies",
      description: "Zero-rated supplies",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "nil-rated-supplies",
      description: "Nil-rated supplies",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "exempted-supplies",
      description: "Exempted supplies",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "non-gst-supplies",
      description: "Non-GST supplies",
      amount: 0,
      isCompleted: false,
    },
  ]);

  const [itcReversals] = useState<ITCReversal[]>([
    {
      id: "cgst-reversal",
      description: "CGST reversal",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "sgst-reversal",
      description: "SGST reversal",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "igst-reversal",
      description: "IGST reversal",
      amount: 0,
      isCompleted: false,
    },
    {
      id: "cess-reversal",
      description: "CESS reversal",
      amount: 0,
      isCompleted: false,
    },
  ]);

  const handleStartSimulation = () => {
    setCurrentStep("tax-liability");
  };

  const handleTaxLiabilityClick = (id: string) => {
    console.log(`Opening tax liability: ${id}`);
  };

  const handleITCReversalClick = (id: string) => {
    console.log(`Opening ITC reversal: ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header Bar */}
      <div className="bg-blue-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-900 font-bold text-sm">GST</span>
              </div>
              <h1 className="text-lg font-semibold">
                GST Return Filing (Online)
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">88%</span>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: "88%" }}
                  ></div>
                </div>
              </div>
              <select className="bg-blue-800 text-white border-none rounded px-2 py-1 text-sm">
                <option>Language</option>
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-sm">GSTR - 3B Return</span>
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 font-bold text-sm">150</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <img
                  src="/images/logo.jpg"
                  alt="Indian Emblem"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Goods and Services Tax
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  ABC XYZ Private Limited
                </p>
                <p className="text-xs text-blue-200">GSTIN: 09ABCDE1234F1Z5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-6 py-3">
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Dashboard
            </a>
            <a
              href="#"
              className="hover:text-blue-200 text-sm font-medium flex items-center"
            >
              Services
              <span className="ml-1">▼</span>
            </a>
            <a
              href="#"
              className="hover:text-blue-200 text-sm font-medium flex items-center"
            >
              GST Law
              <span className="ml-1">▼</span>
            </a>
            <a
              href="#"
              className="hover:text-blue-200 text-sm font-medium flex items-center"
            >
              Downloads
              <span className="ml-1">▼</span>
            </a>
            <a
              href="#"
              className="hover:text-blue-200 text-sm font-medium flex items-center"
            >
              Search Taxpayer
              <span className="ml-1">▼</span>
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Help and Taxpayer Facilities
            </a>
          </nav>
          <div className="flex justify-end pb-2">
            <a href="#" className="text-xs text-blue-200 hover:text-white mr-4">
              Skip to Main Content
            </a>
            <div className="flex items-center space-x-2">
              <button className="text-xs font-bold text-white hover:text-blue-200">
                A+
              </button>
              <button className="text-xs font-bold text-white hover:text-blue-200">
                A-
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 bg-gray-700 text-white z-10">
        <div className="flex flex-col items-center py-4 space-y-6">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-gray-700 font-bold text-xs">GST</span>
          </div>
          <FaBars className="text-xl hover:text-blue-400 cursor-pointer" />
          <FaSync className="text-xl hover:text-blue-400 cursor-pointer" />
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <span className="text-xs">⚙</span>
          </div>
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
              <span>Returns</span>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-800 font-medium">GSTR-3B</span>
            </nav>
          </div>

          {/* Experiment Instructions */}
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800 font-medium">
              Experiment 1: Select June month&gt;Prepare Online under GSTR-3B
              tile to start with GSTR-3B Filing process.
            </p>
          </div>

          {/* File Returns Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">File Returns</h3>
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option>English</option>
              </select>
            </div>

            {/* Yellow notification bar */}
            <div className="bg-yellow-100 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                GSTR-2A can now be downloaded in excel/CSV f
              </p>
            </div>

            <div className="mb-4">
              <span className="text-sm text-red-600">
                • Indicates Mandatory Fields
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Year *
                </label>
                <select
                  value={selectedPeriod.financialYear}
                  onChange={(e) =>
                    setSelectedPeriod((prev) => ({
                      ...prev,
                      financialYear: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter *
                </label>
                <select
                  value={selectedPeriod.quarter}
                  onChange={(e) =>
                    setSelectedPeriod((prev) => ({
                      ...prev,
                      quarter: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Quarter 1 (Apr - Jun)">
                    Quarter 1 (Apr - Jun)
                  </option>
                  <option value="Quarter 2 (Jul - Sep)">
                    Quarter 2 (Jul - Sep)
                  </option>
                  <option value="Quarter 3 (Oct - Dec)">
                    Quarter 3 (Oct - Dec)
                  </option>
                  <option value="Quarter 4 (Jan - Mar)">
                    Quarter 4 (Jan - Mar)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period *
                </label>
                <select
                  value={selectedPeriod.period}
                  onChange={(e) =>
                    setSelectedPeriod((prev) => ({
                      ...prev,
                      period: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="select">select</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                </select>
              </div>

              <div className="flex items-end">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                  SEARCH
                </button>
              </div>
            </div>

            {/* ITC Options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  1.
                </span>
                <span className="text-sm text-gray-700">
                  Report ITC Reversal Opening Balance
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  2.
                </span>
                <span className="text-sm text-gray-700">
                  Report RCM ITC Opening Balance
                </span>
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
              Start GSTR-3B Simulation
            </button>
          </div>

          {/* Tax Liability Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaCalculator className="mr-2 text-blue-600" />
              Tax Liability
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxLiabilities.map((liability) => (
                <div
                  key={liability.id}
                  onClick={() => handleTaxLiabilityClick(liability.id)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="mb-3">
                      <FaCheckCircle className="text-green-500 text-2xl mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      ₹{liability.amount.toFixed(2)}
                    </div>
                    <h4 className="text-sm font-medium text-gray-800 mb-2 group-hover:text-blue-600">
                      {liability.description}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ITC Reversal Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaFileAlt className="mr-2 text-green-600" />
              Input Tax Credit Reversal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {itcReversals.map((reversal) => (
                <div
                  key={reversal.id}
                  onClick={() => handleITCReversalClick(reversal.id)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="mb-3">
                      <FaCheckCircle className="text-green-500 text-2xl mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      ₹{reversal.amount.toFixed(2)}
                    </div>
                    <h4 className="text-sm font-medium text-gray-800 mb-2 group-hover:text-green-600">
                      {reversal.description}
                    </h4>
                  </div>
                </div>
              ))}
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

export default GSTR3BSimulation;
