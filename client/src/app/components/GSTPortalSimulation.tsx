"use client";

import React, { useState } from "react";
import {
  FaBars,
  FaRedo,
  FaCube,
  FaMoon,
  FaInfoCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaPlay,
  FaFileInvoice,
  FaCalculator,
  FaEdit,
  FaDesktop,
} from "react-icons/fa";
import ExperimentLaunchScreen from "./ExperimentLaunchScreen";

const GSTPortalSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "ABC@123",
    captcha: "",
  });

  const handleLogin = () => {
    // Simulate login process
    console.log("Login attempt:", loginData);
    setShowLoginModal(false);
    setCurrentStep(2);
  };

  if (showLaunchScreen) {
    return (
      <ExperimentLaunchScreen
        title="GST Portal Simulation"
        subtitle="Launch the simulation from a hazy fullscreen screen with a single centered start button."
        onStart={() => setShowLaunchScreen(false)}
        buttonLabel="START EXPERIMENT"
        accent="indigo"
      />
    );
  }

  const renderStep1 = () => (
    <div className="min-h-screen bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">GST Invoice preparation</span>
            <div className="w-32 bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
            <span className="text-white text-sm">100%</span>
          </div>
          <div className="flex items-center space-x-4">
            <select className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600">
              <option>Language</option>
            </select>
            <span className="text-white text-sm">e-invoicing</span>
            <div className="flex items-center bg-yellow-500 text-black px-2 py-1 rounded">
              <span className="text-sm font-bold">150</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-16 bg-gray-800 h-screen flex flex-col items-center py-4 space-y-6">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xs">LUD</span>
          </div>
          <FaBars className="text-white text-xl cursor-pointer hover:text-yellow-400" />
          <FaRedo className="text-white text-xl cursor-pointer hover:text-yellow-400" />
          <FaCube className="text-white text-xl cursor-pointer hover:text-yellow-400" />
          <FaMoon className="text-white text-xl cursor-pointer hover:text-yellow-400" />
          <div className="flex-1"></div>
          <FaInfoCircle className="text-white text-lg cursor-pointer hover:text-yellow-400" />
          <FaExclamationTriangle className="text-white text-lg cursor-pointer hover:text-yellow-400" />
          <FaArrowLeft className="text-white text-lg cursor-pointer hover:text-yellow-400" />
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-900 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Instructions */}
            <div className="mb-8">
              <h2 className="text-white text-2xl font-bold mb-4">
                Steps to use the IRP portal
              </h2>
              <h3 className="text-white text-xl mb-2">
                Step 1 - Login to the IRP (e-invoicing) portal.
              </h3>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-yellow-400 text-lg font-semibold mb-4">
                  Experiment 1:
                </h4>
                <p className="text-white mb-4">
                  Input user name, password and Captcha
                </p>
                <p className="text-white mb-4">
                  Go to Login under Menu and Use the following Credentials to
                  login:
                </p>
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-white mb-2">
                    User name:{" "}
                    <span className="text-yellow-400 font-mono">FINAIR</span>
                  </p>
                  <p className="text-white">
                    Password:{" "}
                    <span className="text-yellow-400 font-mono">ABC@123</span>
                  </p>
                </div>
              </div>
            </div>

            {/* e-Invoice Portal Interface */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              {/* Portal Header */}
              <div className="bg-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🇮🇳</span>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">e-Invoice 1 Portal</h1>
                      <p className="text-blue-100 text-sm">सत्यमेव जयते</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">NATION TAX MARKET</p>
                      <p className="text-xs">GST</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">एनआईसी NIC</p>
                      <p className="text-xs">National Informatics Centre</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-gray-100 border-b">
                <div className="flex space-x-0">
                  {[
                    "Home",
                    "Laws",
                    "Help",
                    "Search",
                    "Contact Us",
                    "Registration",
                    "Statistics",
                  ].map((tab) => (
                    <button
                      key={tab}
                      className={`px-6 py-3 text-sm font-medium ${
                        tab === "Home"
                          ? "bg-blue-500 text-white border-b-2 border-blue-500"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                  <button className="ml-auto px-6 py-3 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50">
                    LOGIN
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-8">
                {/* Banner Text */}
                <div className="mb-6">
                  <p className="text-blue-600 font-semibold">
                    Taxpayers with AATO between Rs.5 Crore to Rs.10 Crore are
                    enabled for einvoicing
                  </p>
                  <p className="text-gray-600">
                    Taxpayers who are above Rs.5 Crore but not enabled
                  </p>
                </div>

                <div className="flex">
                  {/* Central Graphics */}
                  <div className="flex-1 relative">
                    <div className="bg-blue-50 rounded-lg p-8 relative overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="grid grid-cols-8 gap-4 h-full">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div
                              key={i}
                              className="border border-blue-200 rounded"
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Central Circle with Monitor */}
                      <div className="relative z-10 flex items-center justify-center">
                        <div className="w-64 h-64 bg-blue-600 rounded-full flex items-center justify-center relative">
                          {/* Monitor */}
                          <div className="bg-black rounded-lg p-4 w-32 h-24 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              E-Invoice
                            </span>
                          </div>

                          {/* Keyboard */}
                          <div className="absolute -bottom-8 w-40 h-6 bg-gray-800 rounded"></div>

                          {/* Hands typing */}
                          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4">
                            <div className="w-8 h-8 bg-yellow-300 rounded-full"></div>
                            <div className="w-8 h-8 bg-yellow-300 rounded-full"></div>
                          </div>
                        </div>

                        {/* START EXPERIMENT Button */}
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
                        >
                          START EXPERIMENT
                        </button>
                      </div>

                      {/* Scattered Elements */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-white rounded-lg p-3 shadow-md flex items-center space-x-2">
                          <FaCalculator className="text-blue-600" />
                          <span className="text-sm font-medium">
                            Calculator
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4">
                        <div className="bg-white rounded-lg p-3 shadow-md">
                          <div className="text-sm font-medium mb-1">
                            INVOICE
                          </div>
                          <div className="text-xs text-gray-600">Document</div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4">
                        <div className="bg-white rounded-lg p-3 shadow-md">
                          <div className="text-sm font-medium mb-1">
                            CREDIT NOTE
                          </div>
                          <div className="text-xs text-gray-600">Document</div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white rounded-lg p-3 shadow-md">
                          <div className="text-sm font-medium mb-1">
                            DEBIT NOTE
                          </div>
                          <div className="text-xs text-gray-600">Document</div>
                        </div>
                      </div>

                      <div className="absolute top-1/2 left-8">
                        <div className="bg-yellow-400 rounded-full p-2">
                          <FaEdit className="text-yellow-800 text-lg" />
                        </div>
                      </div>

                      <div className="absolute top-1/2 right-8">
                        <div className="bg-white rounded-lg p-3 shadow-md flex items-center space-x-2">
                          <FaFileInvoice className="text-blue-600" />
                          <span className="text-sm font-medium">Invoice</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Latest Updates Sidebar */}
                  <div className="w-80 ml-8">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        LATEST UPDATES
                      </h3>

                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <div className="text-sm font-semibold text-blue-600">
                            01 OCT 2023
                          </div>
                          <p className="text-sm text-gray-700">
                            Implementation of atleast 6 digit HSN in e-Invoices
                            and e-Waybills has been deferred.
                          </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="text-sm font-semibold text-green-600">
                            19 SEP 2023
                          </div>
                          <p className="text-sm text-gray-700">
                            The tax payers, notified for generation of
                            e-invoices and supplying to government departments /
                            agencies, need to generate B2B e-Invoices with the
                            GSTIN of the Government department / agency.
                          </p>
                        </div>

                        <div className="border-l-4 border-orange-500 pl-4">
                          <div className="text-sm font-semibold text-orange-600">
                            11 SEP 2023
                          </div>
                          <p className="text-sm text-gray-700">
                            2-Factor Authentication for all taxpayers with AATO
                            above Rs 20 Cr is mandatory from 1st November 2023.
                          </p>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4">
                          <div className="text-sm font-semibold text-red-600">
                            11 SEP 2023
                          </div>
                          <p className="text-sm text-gray-700">
                            As per directions by GST Authority, a time limit of
                            30 days for reporting of invoices from date of
                            invoice is imposed on e-invoice portals, and is
                            applicable for taxpayers with AATO greater than or
                            equal to 100 crores from 1st November 2023.
                          </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-4">
                          <div className="text-sm font-semibold text-purple-600">
                            09 [Date missing]
                          </div>
                          <p className="text-sm text-gray-700">
                            Sub users can access e- (text cut off)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🇮🇳</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                E-INVOICE SYSTEM LOGIN
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User name
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Captcha
                </label>
                <div className="flex space-x-2">
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-2 flex-1 text-center">
                    <span className="text-lg font-mono">P2B7(Y</span>
                  </div>
                  <input
                    type="text"
                    value={loginData.captcha}
                    onChange={(e) =>
                      setLoginData({ ...loginData, captcha: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter captcha"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  LOGIN
                </button>
              </div>

              <div className="text-center pt-4 space-y-2">
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot Password ?
                </a>
                <br />
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot Username ?
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaPlay className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Login Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            You have successfully logged into the e-Invoice portal. You can now
            proceed with the GST simulation.
          </p>
          <button
            onClick={() => (window.location.href = "/gst-simulation")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Continue to GST Simulation
          </button>
        </div>
      </div>
    </div>
  );

  return currentStep === 1 ? renderStep1() : renderStep2();
};

export default GSTPortalSimulation;
