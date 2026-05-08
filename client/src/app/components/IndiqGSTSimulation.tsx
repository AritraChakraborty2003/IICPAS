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
  FaTimes,
  FaBuilding,
  FaUser,
  FaShoppingCart,
  FaReceipt,
} from "react-icons/fa";
import ExperimentLaunchScreen from "./ExperimentLaunchScreen";

const IndiqGSTSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "INDIQ_USER",
    password: "Indiq@2024",
    captcha: "",
  });

  const handleLogin = () => {
    console.log("Indiq Login attempt:", loginData);
    setShowLoginModal(false);
    setCurrentStep(2);
  };

  if (showLaunchScreen) {
    return (
      <ExperimentLaunchScreen
        title="Indiq GST Simulation"
        subtitle="A hazy fullscreen launch screen for the Indiq portal, with a centered start button and responsive layout."
        onStart={() => setShowLaunchScreen(false)}
        buttonLabel="START INDIQ EXPERIMENT"
        accent="cyan"
      />
    );
  }

  const renderStep1 = () => (
    <div className="min-h-screen bg-transparent">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">
              Indiq GST Invoice preparation
            </span>
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
              <span className="text-sm font-bold">200</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-16 bg-gray-800 h-screen flex flex-col items-center py-4 space-y-6">
          {/* Indiq Logo */}
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">IN</span>
          </div>

          {/* Navigation Icons */}
          <FaBars className="text-white text-xl cursor-pointer hover:text-indigo-400 transition-colors" />
          <FaRedo className="text-white text-xl cursor-pointer hover:text-indigo-400 transition-colors" />
          <FaCube className="text-white text-xl cursor-pointer hover:text-indigo-400 transition-colors" />
          <FaMoon className="text-white text-xl cursor-pointer hover:text-indigo-400 transition-colors" />

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Bottom Icons */}
          <FaInfoCircle className="text-white text-lg cursor-pointer hover:text-indigo-400 transition-colors" />
          <FaExclamationTriangle className="text-white text-lg cursor-pointer hover:text-indigo-400 transition-colors" />
          <FaArrowLeft className="text-white text-lg cursor-pointer hover:text-indigo-400 transition-colors" />
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-transparent p-8">
          <div className="max-w-7xl mx-auto">
            {/* Instructions */}
            <div className="mb-8">
              <h2 className="text-white text-2xl font-bold mb-4">
                Indiq GST E-Invoice Portal
              </h2>
              <h3 className="text-white text-xl mb-2">
                Step 1 - Login to the Indiq IRP (e-invoicing) portal.
              </h3>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h4 className="text-indigo-400 text-lg font-semibold mb-4">
                  Indiq Experiment 1:
                </h4>
                <p className="text-white mb-4">
                  Input user name, password and Captcha for Indiq GST Portal
                </p>
                <p className="text-white mb-4">
                  Go to Login under Menu and Use the following Indiq Credentials
                  to login:
                </p>

                <div className="bg-gray-700 p-4 rounded border border-gray-600">
                  <p className="text-white mb-2">
                    User name:{" "}
                    <span className="text-indigo-400 font-mono bg-gray-800 px-2 py-1 rounded">
                      INDIQ_USER
                    </span>
                  </p>
                  <p className="text-white">
                    Password:{" "}
                    <span className="text-indigo-400 font-mono bg-gray-800 px-2 py-1 rounded">
                      Indiq@2024
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Indiq e-Invoice Portal Interface */}
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              {/* Portal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Indiq Emblem */}
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">IN</span>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">
                        Indiq e-Invoice Portal
                      </h1>
                      <p className="text-indigo-100 text-sm">सत्यमेव जयते</p>
                    </div>
                  </div>

                  {/* Right side logos */}
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold">INDIQ TAX MARKET</p>
                      <p className="text-xs text-indigo-200">GST</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">एनआईसी NIC</p>
                      <p className="text-xs text-indigo-200">
                        National Informatics Centre
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-gray-100 border-b border-gray-200">
                <div className="flex">
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
                      className={`px-6 py-3 text-sm font-medium transition-colors ${
                        tab === "Home"
                          ? "bg-indigo-500 text-white border-b-2 border-indigo-500"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="ml-auto px-6 py-3 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50 transition-colors"
                  >
                    LOGIN
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-8">
                {/* Banner Text */}
                <div className="mb-6">
                  <p className="text-indigo-600 font-semibold text-lg">
                    Indiq taxpayers with AATO between Rs.5 Crore to Rs.10 Crore
                    are enabled for einvoicing
                  </p>
                  <p className="text-gray-600 text-sm">
                    Indiq taxpayers who are above Rs.5 Crore but not enabled
                  </p>
                </div>

                <div className="flex gap-8">
                  {/* Central Graphics */}
                  <div className="flex-1 relative">
                    <div className="bg-indigo-50 rounded-lg p-8 relative overflow-hidden min-h-96">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="grid grid-cols-12 gap-2 h-full">
                          {Array.from({ length: 144 }).map((_, i) => (
                            <div
                              key={i}
                              className="border border-indigo-300 rounded-sm"
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Central Circle with Monitor */}
                      <div className="relative z-10 flex items-center justify-center h-80">
                        <div className="relative">
                          {/* Main Circle */}
                          <div className="w-64 h-64 bg-indigo-600 rounded-full flex items-center justify-center relative shadow-lg">
                            {/* Monitor */}
                            <div className="bg-black rounded-lg p-4 w-32 h-24 flex items-center justify-center shadow-inner">
                              <span className="text-white font-bold text-sm">
                                Indiq E-Invoice
                              </span>
                            </div>

                            {/* Keyboard */}
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-800 rounded shadow-lg"></div>

                            {/* Hands typing */}
                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4">
                              <div className="w-8 h-8 bg-indigo-300 rounded-full shadow-md"></div>
                              <div className="w-8 h-8 bg-indigo-300 rounded-full shadow-md"></div>
                            </div>
                          </div>

                          {/* START EXPERIMENT Button */}
                          <button
                            onClick={() => setShowLoginModal(true)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors z-20"
                          >
                            START INDIQ EXPERIMENT
                          </button>
                        </div>
                      </div>

                      {/* Scattered Elements */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-white rounded-lg p-3 shadow-md flex items-center space-x-2 border border-gray-200">
                          <FaCalculator className="text-indigo-600" />
                          <span className="text-sm font-medium">
                            Indiq Calculator
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4">
                        <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                          <div className="text-sm font-medium mb-1 text-gray-800">
                            INDIQ INVOICE
                          </div>
                          <div className="text-xs text-gray-600">Document</div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4">
                        <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                          <div className="text-sm font-medium mb-1 text-gray-800">
                            CREDIT NOTE
                          </div>
                          <div className="text-xs text-gray-600">Document</div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white rounded-lg p-3 shadow-md border border-gray-200">
                          <div className="text-sm font-medium mb-1 text-gray-800">
                            DEBIT NOTE
                          </div>
                          <div className="text-xs text-gray-600">Document</div>
                        </div>
                      </div>

                      <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
                        <div className="bg-indigo-400 rounded-full p-3 shadow-md">
                          <FaEdit className="text-indigo-800 text-lg" />
                        </div>
                      </div>

                      <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
                        <div className="bg-white rounded-lg p-3 shadow-md flex items-center space-x-2 border border-gray-200">
                          <FaFileInvoice className="text-indigo-600" />
                          <span className="text-sm font-medium">Invoice</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Latest Updates Sidebar */}
                  <div className="w-80">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        INDIQ LATEST UPDATES
                      </h3>

                      <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 pl-4">
                          <div className="text-sm font-semibold text-indigo-600 mb-1">
                            01 DEC 2024
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            Indiq implementation of atleast 6 digit HSN in
                            e-Invoices and e-Waybills has been deferred.
                          </p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="text-sm font-semibold text-green-600 mb-1">
                            19 NOV 2024
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            The Indiq tax payers, notified for generation of
                            e-invoices and supplying to government departments /
                            agencies, need to generate B2B e-Invoices with the
                            GSTIN of the Government department / agency.
                          </p>
                        </div>

                        <div className="border-l-4 border-orange-500 pl-4">
                          <div className="text-sm font-semibold text-orange-600 mb-1">
                            11 NOV 2024
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            2-Factor Authentication for all Indiq taxpayers with
                            AATO above Rs 20 Cr is mandatory from 1st December
                            2024.
                          </p>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4">
                          <div className="text-sm font-semibold text-red-600 mb-1">
                            11 NOV 2024
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            As per directions by Indiq GST Authority, a time
                            limit of 30 days for reporting of invoices from date
                            of invoice is imposed on e-invoice portals, and is
                            applicable for Indiq taxpayers with AATO greater
                            than or equal to 100 crores from 1st December 2024.
                          </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-4">
                          <div className="text-sm font-semibold text-purple-600 mb-1">
                            09 NOV 2024
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            Indiq sub users can access e-invoice portal with
                            enhanced security features.
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
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Indiq e-Invoice Portal
              </h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Indiq Emblem */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">IN</span>
              </div>
              <h3 className="text-xl font-bold text-indigo-600">
                INDIQ E-INVOICE SYSTEM LOGIN
              </h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter Indiq username"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter Indiq password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ENTER ABOVE CAPTCHA
                </label>
                <div className="flex space-x-2">
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded p-2 flex-1 text-center">
                    <span className="text-lg font-mono text-gray-800">
                      IN9Q7M
                    </span>
                  </div>
                  <input
                    type="text"
                    value={loginData.captcha}
                    onChange={(e) =>
                      setLoginData({ ...loginData, captcha: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter captcha"
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors font-semibold"
              >
                LOGIN TO INDIQ
              </button>

              <div className="text-center pt-4 space-y-2">
                <a
                  href="#"
                  className="text-sm text-indigo-600 hover:underline block"
                >
                  Forgot Password ?
                </a>
                <a
                  href="#"
                  className="text-sm text-indigo-600 hover:underline block"
                >
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
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaPlay className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Indiq Login Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            You have successfully logged into the Indiq e-Invoice portal. You
            can now proceed with the Indiq GST simulation.
          </p>
          <button
            onClick={() => (window.location.href = "/gst-simulation")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Continue to Indiq GST Simulation
          </button>
        </div>
      </div>
    </div>
  );

  return currentStep === 1 ? renderStep1() : renderStep2();
};

export default IndiqGSTSimulation;
