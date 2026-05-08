"use client";

import React from "react";
import Link from "next/link";
import {
  FaFileInvoice,
  FaPlay,
  FaDesktop,
  FaCalculator,
  FaGraduationCap,
  FaCog,
  FaBuilding,
} from "react-icons/fa";

export default function GSTDashboard() {
  const simulations = [
    {
      id: "portal-exact",
      title: "Exact Portal Replica",
      description:
        "Perfect replica of the official e-Invoice 1 Portal with exact styling and layout",
      icon: <FaDesktop className="text-4xl text-blue-600" />,
      route: "/simulations/gst/e-invoicing-1",
      features: [
        "Exact UI Match",
        "Login Simulation",
        "Portal Interface",
        "Latest Updates",
      ],
    },
    {
      id: "portal-replica-3",
      title: "Portal Replica 3",
      description:
        "Route-isolated clone of the e-Invoice dashboard flow for the next experiment.",
      icon: <FaDesktop className="text-4xl text-cyan-600" />,
      route: "/simulations/gst/e-invoicing-3",
      features: [
        "Dashboard Clone",
        "Login Simulation",
        "Separate Route",
        "Route Marker",
      ],
    },
    {
      id: "portal-cancel",
      title: "Portal Cancel Flow",
      description:
        "Dedicated cancellation simulation with Ack No. / IRN selector and submit result.",
      icon: <FaFileInvoice className="text-4xl text-red-600" />,
      route: "/simulations/gst/e-invoicing-4",
      features: [
        "Cancel Flow",
        "Ack / IRN Switch",
        "Submit Result",
        "Cancelled Stamp",
      ],
    },
    {
      id: "portal-simulation",
      title: "Portal Simulation",
      description: "Interactive portal simulation with step-by-step guidance",
      icon: <FaPlay className="text-4xl text-green-600" />,
      route: "/simulations/gst/e-invoicing-1",
      features: [
        "Interactive Steps",
        "Login Process",
        "Portal Navigation",
        "Experiment Mode",
      ],
    },
    {
      id: "invoice-simulation",
      title: "Invoice Creation",
      description: "Complete GST e-Invoice creation and generation simulation",
      icon: <FaFileInvoice className="text-4xl text-purple-600" />,
      route: "/simulations/gst/e-invoicing-1/invoice",
      features: [
        "Invoice Creation",
        "Tax Calculation",
        "E-Invoice Generation",
        "Validation",
      ],
    },
    {
      id: "indiq-simulation",
      title: "Indiq GST Portal",
      description:
        "Specialized Indiq e-Invoice portal with custom branding and features",
      icon: <FaBuilding className="text-4xl text-indigo-600" />,
      route: "/indiq-gst",
      features: [
        "Indiq Branding",
        "Custom Portal",
        "Specialized Features",
        "Indiq Updates",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                GST E-Invoice Simulations
              </h1>
              <p className="text-blue-100 text-lg">
                Comprehensive learning platform for GST e-invoice preparation
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <FaGraduationCap className="text-4xl mx-auto mb-2" />
                <p className="text-sm">Learning Portal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Choose Your Learning Experience
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Our GST e-invoice simulation platform offers multiple learning modes
            to help you master the e-invoice preparation process, from basic
            portal navigation to complete invoice creation.
          </p>
        </div>

        {/* Simulation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {simulations.map((sim) => (
            <Link key={sim.id} href={sim.route}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200 hover:border-blue-300 group">
                <div className="text-center mb-4">
                  <div className="inline-block p-4 bg-gray-50 rounded-full group-hover:bg-blue-50 transition-colors">
                    {sim.icon}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                  {sim.title}
                </h3>

                <p className="text-gray-600 text-center mb-4">
                  {sim.description}
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm">
                    Features:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sim.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <span className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    Start Simulation
                    <svg
                      className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Learning Path */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Recommended Learning Path
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  Portal Familiarization
                </h4>
                <p className="text-gray-600 text-sm">
                  Start with the exact portal replica
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  Interactive Learning
                </h4>
                <p className="text-gray-600 text-sm">
                  Practice with guided simulations
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  Invoice Creation
                </h4>
                <p className="text-gray-600 text-sm">
                  Master complete invoice workflow
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  Indiq Specialized
                </h4>
                <p className="text-gray-600 text-sm">
                  Explore Indiq-specific features
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
            <FaCalculator className="text-3xl text-blue-600 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Tax Calculations
            </h4>
            <p className="text-gray-600">
              Automatic CGST, SGST, IGST calculations
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
            <FaFileInvoice className="text-3xl text-green-600 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              E-Invoice Generation
            </h4>
            <p className="text-gray-600">Simulated IRN and QR code creation</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
            <FaCog className="text-3xl text-purple-600 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Real-time Validation
            </h4>
            <p className="text-gray-600">
              GSTIN, HSN code, and format validation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
