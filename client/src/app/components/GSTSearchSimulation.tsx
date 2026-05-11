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
  FaSearch,
  FaDownload,
  FaQuestionCircle,
  FaGlobe,
  FaFileAlt,
  FaBuilding,
  FaReceipt,
} from "react-icons/fa";

interface SearchOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
}

const GSTSearchSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const searchOptions: SearchOption[] = [
    {
      id: "gstin-search",
      title: "GSTIN Search",
      description: "Search taxpayer by GSTIN number",
      icon: <FaBuilding className="text-2xl text-blue-600" />,
      isCompleted: false,
    },
    {
      id: "pan-search",
      title: "PAN Search",
      description: "Search taxpayer by PAN number",
      icon: <FaFileAlt className="text-2xl text-green-600" />,
      isCompleted: false,
    },
    {
      id: "return-status",
      title: "Return Status",
      description: "Check return filing status",
      icon: <FaReceipt className="text-2xl text-purple-600" />,
      isCompleted: false,
    },
    {
      id: "payment-history",
      title: "Payment History",
      description: "View tax payment history",
      icon: <FaDownload className="text-2xl text-orange-600" />,
      isCompleted: false,
    },
    {
      id: "compliance-status",
      title: "Compliance Status",
      description: "Check compliance status",
      icon: <FaCheckCircle className="text-2xl text-teal-600" />,
      isCompleted: false,
    },
    {
      id: "certificate-verification",
      title: "Certificate Verification",
      description: "Verify GST certificates",
      icon: <FaFileAlt className="text-2xl text-red-600" />,
      isCompleted: false,
    },
  ];

  const handleStartSimulation = () => {
    setCurrentStep("search");
  };

  const handleSearchOptionClick = (optionId: string) => {
    console.log(`Opening search option: ${optionId}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Simulate search results
      setSearchResults([
        {
          gstin: "09ABCDE1234F1Z5",
          name: "ABC XYZ Private Limited",
          status: "Active",
          registrationDate: "2020-04-01",
          lastReturnFiled: "GSTR-3B",
        },
      ]);
    }
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
              <h1 className="text-lg font-semibold">GST Search Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Progress: 40%</span>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: "40%" }}
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
                  GST Search Portal
                </h2>
                <p className="text-sm text-gray-600">
                  Search taxpayer details and verify information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  Public Search Portal
                </p>
                <p className="text-xs text-gray-600">No login required</p>
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
              Search
            </a>
            <a href="#" className="hover:text-blue-200 text-sm font-medium">
              Reports
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
              <span>Search</span>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-800 font-medium">Taxpayer Search</span>
            </nav>
          </div>

          {/* Experiment Instructions */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-teal-800 mb-2">
                  GST Search Portal
                </h3>
                <p className="text-teal-700 mb-4">
                  Search and verify taxpayer information.
                </p>
                <p className="text-teal-600 font-medium">
                  Experiment 6 - Learn GST search functionality.
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

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Search Taxpayer
            </h3>
            <p className="text-gray-600 mb-6">
              Enter GSTIN or PAN to search for taxpayer information.
            </p>

            <div className="flex space-x-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter GSTIN (e.g., 09ABCDE1234F1Z5) or PAN"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
              >
                <FaSearch className="mr-2" />
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Search Results
                </h4>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">GSTIN</p>
                        <p className="font-medium text-gray-800">
                          {result.gstin}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Business Name</p>
                        <p className="font-medium text-gray-800">
                          {result.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium text-green-600">
                          {result.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Registration Date
                        </p>
                        <p className="font-medium text-gray-800">
                          {result.registrationDate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Simulation Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleStartSimulation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center mx-auto"
            >
              <FaPlay className="mr-2" />
              Start Search Simulation
            </button>
          </div>

          {/* Search Options */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaSearch className="mr-2 text-blue-600" />
              Search Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSearchOptionClick(option.id)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="mb-4">{option.icon}</div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                      {option.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {option.description}
                    </p>
                    <div className="flex items-center justify-center">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaBuilding className="text-3xl text-blue-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                GSTIN Search
              </h4>
              <p className="text-gray-600">Search by GSTIN number</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaFileAlt className="text-3xl text-green-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                PAN Search
              </h4>
              <p className="text-gray-600">Search by PAN number</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaReceipt className="text-3xl text-purple-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Return Status
              </h4>
              <p className="text-gray-600">Check return filing status</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
              <FaCheckCircle className="text-3xl text-orange-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Compliance Check
              </h4>
              <p className="text-gray-600">Verify compliance status</p>
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

export default GSTSearchSimulation;
