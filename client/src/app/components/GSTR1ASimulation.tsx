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
  FaFileAlt,
  FaDownload,
  FaSearch,
  FaQuestionCircle,
  FaGlobe,
} from "react-icons/fa";

interface RecordDetail {
  id: string;
  title: string;
  description: string;
  count: number;
  isCompleted: boolean;
}

const GSTR1ASimulation: React.FC = () => {
  const [currentExperiment, setCurrentExperiment] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState({
    financialYear: "2024-25",
    quarter: "Quarter 1 (Apr - Jun)",
    period: "April",
  });

  const recordDetails: RecordDetail[] = [
    {
      id: "4a-4b-6b-6c",
      title: "4A, 4B, 6B, 6C - B2B, SEZ, DE Invoices",
      description:
        "Business to Business, Special Economic Zone, and Deemed Export invoices",
      count: 0,
      isCompleted: false,
    },
    {
      id: "5-b2c-large",
      title: "5 - B2C (Large) Invoices",
      description: "Business to Consumer large invoices",
      count: 0,
      isCompleted: false,
    },
    {
      id: "6a-exports",
      title: "6A - Exports Invoices",
      description: "Export of goods and services invoices",
      count: 0,
      isCompleted: false,
    },
    {
      id: "7-b2c-others",
      title: "7 - B2C (Others)",
      description: "Other Business to Consumer transactions",
      count: 0,
      isCompleted: false,
    },
    {
      id: "8a-8b-8c-8d",
      title: "8A, 8B, 8C, 8D - Nil Rated Supplies",
      description: "Nil rated, exempted, and non-GST supplies",
      count: 0,
      isCompleted: false,
    },
    {
      id: "9b-registered",
      title: "9B - Credit / Debit Notes (Registered)",
      description: "Credit and debit notes for registered taxpayers",
      count: 0,
      isCompleted: false,
    },
    {
      id: "9b-unregistered",
      title: "9B - Credit / Debit Notes (Unregistered)",
      description: "Credit and debit notes for unregistered taxpayers",
      count: 0,
      isCompleted: false,
    },
    {
      id: "11a-tax-liability",
      title: "11A(1), 11A(2) - Tax Liability (Advances Received)",
      description: "Tax liability on advances received",
      count: 0,
      isCompleted: false,
    },
    {
      id: "11b-adjustment",
      title: "11B(1), 11B(2) - Adjustment of Advances",
      description: "Adjustment of advances against supplies",
      count: 0,
      isCompleted: false,
    },
    {
      id: "12-hsn-summary",
      title: "12 - HSN-wise summary of outward supplies",
      description: "Harmonized System of Nomenclature summary",
      count: 0,
      isCompleted: false,
    },
    {
      id: "13-documents",
      title: "13 - Documents Issued",
      description: "Summary of documents issued during the period",
      count: 0,
      isCompleted: false,
    },
    {
      id: "14-eco",
      title: "14 - Supplies made through ECO",
      description: "Supplies made through Electronic Commerce Operator",
      count: 0,
      isCompleted: false,
    },
  ];

  const handleStartExperiment = () => {
    setCurrentExperiment(2);
  };

  const handleRecordClick = (recordId: string) => {
    // Navigate to specific record detail page
    console.log(`Opening record: ${recordId}`);
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
                <span className="text-sm">Progress: 88%</span>
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
                <span className="text-blue-600 font-bold text-lg">GST</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Goods and Services Tax
                </h2>
                <p className="text-sm text-gray-600">GSTR-1A Return</p>
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
              Services
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              GST Law
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Downloads
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Search Taxpayer
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Help and Taxpayer Facilities
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              e-Invoice
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
              <span>Returns</span>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-800 font-medium">GSTR-1A</span>
            </nav>
          </div>

          {/* Experiment Instructions */}
          {currentExperiment === 1 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-teal-800 mb-2">
                    GSTR-1A - Amendment of outward supplies of goods or services
                    for current tax period
                  </h3>
                  <p className="text-teal-700 mb-4">
                    Submit & File GSTR-1A before filing GSTR-3B.
                  </p>
                  <p className="text-teal-600 font-medium">
                    Experiment 1 - Select GSTR-1A option after logging in.
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
          )}

          {/* File Returns Section */}
          {currentExperiment === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                File Returns
              </h3>
              <p className="text-gray-600 mb-6">
                now be downloaded in excel/CSV format for your reference and
                further use. Nil return for GSTR-3B & GSTR-1 can now be filed
                through SMS.
              </p>

              <div className="mb-4">
                <span className="text-sm text-gray-600">
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

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-medium">1.</span>
                  <span className="text-gray-700">
                    Report ITC Reversal Opening Balance
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-medium">2.</span>
                  <span className="text-gray-700">
                    Report RCM ITC Opening Balance
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ADD RECORD DETAILS Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              ADD RECORD DETAILS
            </h3>

            {/* Start Experiment Button */}
            {currentExperiment === 1 && (
              <div className="text-center mb-8">
                <button
                  onClick={handleStartExperiment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center mx-auto"
                >
                  <FaPlay className="mr-2" />
                  Start Experiment
                </button>
              </div>
            )}

            {/* Record Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recordDetails.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleRecordClick(record.id)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="mb-3">
                      <FaCheckCircle className="text-green-500 text-2xl mx-auto" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      {record.count}
                    </div>
                    <h4 className="text-sm font-medium text-gray-800 mb-2 group-hover:text-blue-600">
                      {record.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {record.description}
                    </p>
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

export default GSTR1ASimulation;
