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
  FaChartLine,
  FaFileAlt,
  FaReceipt,
  FaSearch,
} from "react-icons/fa";

export default function GSTSimulationsPage() {
  const simulations = [
    {
      id: "gstr-1a",
      title: "GSTR-1A Return Filing",
      description:
        "Amendment of outward supplies of goods or services for current tax period",
      icon: <FaFileAlt className="text-4xl text-blue-600" />,
      route: "/gst-simulations/gstr-1a",
      features: [
        "B2B Invoices",
        "B2C Transactions",
        "Export Invoices",
        "Nil Rated Supplies",
        "Credit/Debit Notes",
        "HSN Summary",
      ],
      difficulty: "Intermediate",
      duration: "45 mins",
    },
    {
      id: "gstr-3b",
      title: "GSTR-3B Return Filing",
      description: "Monthly summary return with payment of tax",
      icon: <FaReceipt className="text-4xl text-green-600" />,
      route: "/gst-simulations/gstr-3b",
      features: [
        "Tax Liability",
        "Input Tax Credit",
        "Tax Payment",
        "Interest & Penalty",
        "Late Fee",
        "Refund Claims",
      ],
      difficulty: "Advanced",
      duration: "60 mins",
    },
    {
      id: "einvoice-portal",
      title: "E-Invoice Portal",
      description: "Generate and manage GST e-invoices with IRN",
      icon: <FaFileInvoice className="text-4xl text-purple-600" />,
      route: "/simulations/gst/e-invoicing-1",
      features: [
        "Invoice Generation",
        "IRN Creation",
        "QR Code",
        "Validation",
        "Cancellation",
        "Bulk Upload",
      ],
      difficulty: "Beginner",
      duration: "30 mins",
    },
    {
      id: "einvoice-portal-3",
      title: "E-Invoice Portal 3",
      description: "A route-isolated clone of the e-invoicing dashboard flow",
      icon: <FaFileInvoice className="text-4xl text-cyan-600" />,
      route: "/simulations/gst/e-invoicing-3",
      features: [
        "Dashboard Clone",
        "Route Marker",
        "Login Simulation",
        "Latest Updates",
        "Portal Replica",
        "Separate Path",
      ],
      difficulty: "Beginner",
      duration: "30 mins",
    },
    {
      id: "einvoice-portal-4",
      title: "E-Invoice Cancel Flow",
      description:
        "Cancellation workflow replica with Ack No. / IRN switching and submit flow.",
      icon: <FaFileInvoice className="text-4xl text-red-600" />,
      route: "/simulations/gst/e-invoicing-4",
      features: [
        "Cancel Flow",
        "Ack / IRN Switch",
        "Submit Result",
        "Cancelled Stamp",
        "Route Isolation",
        "Experiment Mode",
      ],
      difficulty: "Beginner",
      duration: "30 mins",
    },
    {
      id: "eway-bill",
      title: "E-Way Bill",
      description: "Generate e-way bills for goods transportation",
      icon: <FaChartLine className="text-4xl text-orange-600" />,
      route: "/gst-simulations/eway-bill",
      features: [
        "Bill Generation",
        "Distance Calculation",
        "Vehicle Details",
        "Transporter Info",
        "Validity Check",
        "Update/Cancel",
      ],
      difficulty: "Intermediate",
      duration: "40 mins",
    },
    {
      id: "gst-registration",
      title: "GST Registration",
      description: "Complete GST registration process simulation",
      icon: <FaBuilding className="text-4xl text-indigo-600" />,
      route: "/gst-simulations/registration",
      features: [
        "Business Details",
        "Document Upload",
        "Verification",
        "GSTIN Generation",
        "Certificate Download",
        "Amendment Process",
      ],
      difficulty: "Beginner",
      duration: "50 mins",
    },
    {
      id: "gst-search",
      title: "GST Search Portal",
      description: "Search taxpayer details and GSTIN validation",
      icon: <FaSearch className="text-4xl text-teal-600" />,
      route: "/gst-simulations/search",
      features: [
        "GSTIN Search",
        "Taxpayer Details",
        "Return Status",
        "Payment History",
        "Compliance Status",
        "Certificate Verification",
      ],
      difficulty: "Beginner",
      duration: "20 mins",
    },
  ];

  const learningPaths = [
    {
      title: "Beginner Path",
      description: "Start with basic GST concepts and simple transactions",
      simulations: ["gst-registration", "gst-search", "einvoice-portal", "einvoice-portal-3"],
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
    },
    {
      title: "Intermediate Path",
      description: "Learn return filing and compliance procedures",
      simulations: ["gstr-1a", "eway-bill"],
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      title: "Advanced Path",
      description: "Master complex return filing and tax calculations",
      simulations: ["gstr-3b"],
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
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
                GST Simulations Portal
              </h1>
              <p className="text-blue-100 text-lg">
                Comprehensive learning platform for GST compliance and return
                filing
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
            Master GST Compliance Through Interactive Simulations
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Our GST simulation platform replicates the official GST portal
            experience, helping you learn return filing, e-invoice generation,
            and compliance procedures through hands-on practice with realistic
            scenarios.
          </p>
        </div>

        {/* Learning Paths */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Choose Your Learning Path
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map((path, index) => (
              <div
                key={index}
                className={`${path.color} rounded-lg p-6 border-2`}
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${path.iconColor} bg-white`}
                  >
                    <span className="font-bold text-lg">{index + 1}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 ml-3">
                    {path.title}
                  </h4>
                </div>
                <p className="text-gray-600 mb-4">{path.description}</p>
                <div className="space-y-2">
                  {path.simulations.map((simId) => {
                    const sim = simulations.find((s) => s.id === simId);
                    return sim ? (
                      <div key={simId} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-gray-700">{sim.title}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

                <p className="text-gray-600 text-center mb-4 text-sm">
                  {sim.description}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sim.difficulty === "Beginner"
                        ? "bg-green-100 text-green-800"
                        : sim.difficulty === "Intermediate"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {sim.difficulty}
                  </span>
                  <span className="text-gray-500 text-sm">{sim.duration}</span>
                </div>

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              Return Filing
            </h4>
            <p className="text-gray-600">Complete GSTR filing process</p>
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

          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
            <FaGraduationCap className="text-3xl text-orange-600 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Learning Progress
            </h4>
            <p className="text-gray-600">Track your progress and performance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
