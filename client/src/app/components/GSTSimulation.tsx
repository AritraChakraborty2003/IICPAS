/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  FaCalculator,
  FaFileInvoice,
  FaQrcode,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

interface GSTItem {
  itemName: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
}

interface GSTSimulationData {
  invoiceNumber: string;
  invoiceDate: string;
  supplier: {
    name: string;
    gstin: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    contact: {
      phone: string;
      email: string;
    };
  };
  recipient: {
    name: string;
    gstin: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    contact: {
      phone: string;
      email: string;
    };
  };
  items: GSTItem[];
  taxSummary: {
    totalTaxableAmount: number;
    totalCgstAmount: number;
    totalSgstAmount: number;
    totalIgstAmount: number;
    totalCessAmount: number;
    totalTaxAmount: number;
    grandTotal: number;
  };
  einvoiceDetails?: {
    irn: string;
    qrCode: string;
    ackNo: string;
    ackDate: string;
    status: string;
  };
}

const GSTSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState("supplier");
  const [simulationData, setSimulationData] = useState<GSTSimulationData>({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    supplier: {
      name: "",
      gstin: "",
      address: { street: "", city: "", state: "", pincode: "" },
      contact: { phone: "", email: "" },
    },
    recipient: {
      name: "",
      gstin: "",
      address: { street: "", city: "", state: "", pincode: "" },
      contact: { phone: "", email: "" },
    },
    items: [],
    taxSummary: {
      totalTaxableAmount: 0,
      totalCgstAmount: 0,
      totalSgstAmount: 0,
      totalIgstAmount: 0,
      totalCessAmount: 0,
      totalTaxAmount: 0,
      grandTotal: 0,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const taxRates = [0, 5, 12, 18, 28];

  const validateGSTIN = (gstin: string) => {
    if (!gstin) return true;
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const calculateTaxes = () => {
    const isInterstate =
      simulationData.supplier.address.state !==
      simulationData.recipient.address.state;

    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;
    let totalIgstAmount = 0;
    let totalCessAmount = 0;

    const updatedItems = simulationData.items.map((item) => {
      const taxableAmount = item.quantity * item.unitPrice;
      totalTaxableAmount += taxableAmount;

      let cgstAmount = 0,
        sgstAmount = 0,
        igstAmount = 0;

      if (isInterstate) {
        igstAmount = (taxableAmount * item.igstRate) / 100;
        totalIgstAmount += igstAmount;
      } else {
        cgstAmount = (taxableAmount * item.cgstRate) / 100;
        sgstAmount = (taxableAmount * item.sgstRate) / 100;
        totalCgstAmount += cgstAmount;
        totalSgstAmount += sgstAmount;
      }

      const cessAmount = (taxableAmount * item.cessRate) / 100;
      totalCessAmount += cessAmount;

      const totalAmount =
        taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;

      return {
        ...item,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        cessAmount,
        totalAmount,
      };
    });

    const totalTaxAmount =
      totalCgstAmount + totalSgstAmount + totalIgstAmount + totalCessAmount;
    const grandTotal = totalTaxableAmount + totalTaxAmount;

    setSimulationData((prev) => ({
      ...prev,
      items: updatedItems,
      taxSummary: {
        totalTaxableAmount,
        totalCgstAmount,
        totalSgstAmount,
        totalIgstAmount,
        totalCessAmount,
        totalTaxAmount,
        grandTotal,
      },
    }));
  };

  useEffect(() => {
    if (simulationData.items.length > 0) {
      calculateTaxes();
    }
  }, [
    simulationData.items,
    simulationData.supplier.address.state,
    simulationData.recipient.address.state,
  ]);

  const addItem = () => {
    setSimulationData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemName: "",
          description: "",
          hsnCode: "",
          quantity: 1,
          unit: "NOS",
          unitPrice: 0,
          taxableAmount: 0,
          cgstRate: 18,
          sgstRate: 18,
          igstRate: 18,
          cessRate: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0,
          totalAmount: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setSimulationData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setSimulationData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const generateEInvoice = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const irn = `IRN${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;
      const ackNo = `ACK${Date.now()}`;

      setSimulationData((prev) => ({
        ...prev,
        einvoiceDetails: {
          irn,
          qrCode: JSON.stringify({
            irn,
            ackNo,
            ackDate: new Date().toISOString(),
            invoiceNumber: prev.invoiceNumber,
            totalAmount: prev.taxSummary.grandTotal,
          }),
          ackNo,
          ackDate: new Date().toISOString(),
          status: "GENERATED",
        },
      }));

      setShowQRCode(true);
    } catch (error) {
      console.error("Error generating e-invoice:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSupplierForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FaFileInvoice className="mr-2 text-blue-600" />
        Supplier Details (Seller)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name *
          </label>
          <input
            type="text"
            value={simulationData.supplier.name}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                supplier: { ...prev.supplier, name: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GSTIN *
          </label>
          <input
            type="text"
            value={simulationData.supplier.gstin}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                supplier: {
                  ...prev.supplier,
                  gstin: e.target.value.toUpperCase(),
                },
              }))
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              simulationData.supplier.gstin &&
              !validateGSTIN(simulationData.supplier.gstin)
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="09ABCDE1234F1Z5"
            maxLength={15}
          />
          {simulationData.supplier.gstin &&
            !validateGSTIN(simulationData.supplier.gstin) && (
              <p className="text-red-500 text-xs mt-1">Invalid GSTIN format</p>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            value={simulationData.supplier.address.state}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                supplier: {
                  ...prev.supplier,
                  address: { ...prev.supplier.address, state: e.target.value },
                },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <input
            type="text"
            value={simulationData.supplier.address.pincode}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                supplier: {
                  ...prev.supplier,
                  address: {
                    ...prev.supplier.address,
                    pincode: e.target.value,
                  },
                },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123456"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );

  const renderRecipientForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FaFileInvoice className="mr-2 text-green-600" />
        Recipient Details (Buyer)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name *
          </label>
          <input
            type="text"
            value={simulationData.recipient.name}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                recipient: { ...prev.recipient, name: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GSTIN (Optional for B2C)
          </label>
          <input
            type="text"
            value={simulationData.recipient.gstin}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                recipient: {
                  ...prev.recipient,
                  gstin: e.target.value.toUpperCase(),
                },
              }))
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              simulationData.recipient.gstin &&
              !validateGSTIN(simulationData.recipient.gstin)
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="09ABCDE1234F1Z5"
            maxLength={15}
          />
          {simulationData.recipient.gstin &&
            !validateGSTIN(simulationData.recipient.gstin) && (
              <p className="text-red-500 text-xs mt-1">Invalid GSTIN format</p>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            value={simulationData.recipient.address.state}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                recipient: {
                  ...prev.recipient,
                  address: { ...prev.recipient.address, state: e.target.value },
                },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <input
            type="text"
            value={simulationData.recipient.address.pincode}
            onChange={(e) =>
              setSimulationData((prev) => ({
                ...prev,
                recipient: {
                  ...prev.recipient,
                  address: {
                    ...prev.recipient.address,
                    pincode: e.target.value,
                  },
                },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123456"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );

  const renderItemsForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <FaCalculator className="mr-2 text-purple-600" />
          Invoice Items
        </h3>
        <button
          onClick={addItem}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Add Item
        </button>
      </div>

      {simulationData.items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Item {index + 1}</h4>
            <button
              onClick={() => removeItem(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={item.itemName}
                onChange={(e) => updateItem(index, "itemName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HSN Code *
              </label>
              <input
                type="text"
                value={item.hsnCode}
                onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234"
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.01"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price *
              </label>
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(
                    index,
                    "unitPrice",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <select
                value={item.cgstRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  updateItem(index, "cgstRate", rate);
                  updateItem(index, "sgstRate", rate);
                  updateItem(index, "igstRate", rate);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {taxRates.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Taxable Amount:</span>
              <div className="font-medium">
                ₹{item.taxableAmount.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">CGST ({item.cgstRate}%):</span>
              <div className="font-medium">₹{item.cgstAmount.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">SGST ({item.sgstRate}%):</span>
              <div className="font-medium">₹{item.sgstAmount.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Total:</span>
              <div className="font-medium">₹{item.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSummary = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FaCheckCircle className="mr-2 text-green-600" />
        Invoice Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Transaction Type</h4>
          <div
            className={`p-3 rounded-lg ${
              simulationData.supplier.address.state ===
              simulationData.recipient.address.state
                ? "bg-blue-50 border border-blue-200"
                : "bg-orange-50 border border-orange-200"
            }`}
          >
            <div className="flex items-center">
              {simulationData.supplier.address.state ===
              simulationData.recipient.address.state ? (
                <>
                  <FaInfoCircle className="text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">
                    Intrastate Transaction
                  </span>
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="text-orange-600 mr-2" />
                  <span className="text-orange-800 font-medium">
                    Interstate Transaction
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {simulationData.supplier.address.state ===
              simulationData.recipient.address.state
                ? "CGST + SGST will be applied"
                : "IGST will be applied"}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Tax Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Taxable Amount:</span>
              <span>
                ₹{simulationData.taxSummary.totalTaxableAmount.toFixed(2)}
              </span>
            </div>
            {simulationData.supplier.address.state ===
            simulationData.recipient.address.state ? (
              <>
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>
                    ₹{simulationData.taxSummary.totalCgstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>
                    ₹{simulationData.taxSummary.totalSgstAmount.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>
                  ₹{simulationData.taxSummary.totalIgstAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>CESS:</span>
              <span>
                ₹{simulationData.taxSummary.totalCessAmount.toFixed(2)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span>₹{simulationData.taxSummary.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={generateEInvoice}
          disabled={isGenerating || simulationData.items.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating E-Invoice...
            </>
          ) : (
            <>
              <FaQrcode className="mr-2" />
              Generate E-Invoice
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderEInvoiceResult = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center text-green-600">
        <FaCheckCircle className="mr-2" />
        E-Invoice Generated Successfully!
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">E-Invoice Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">IRN:</span>
              <span className="font-mono text-sm">
                {simulationData.einvoiceDetails?.irn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ack No:</span>
              <span className="font-mono text-sm">
                {simulationData.einvoiceDetails?.ackNo}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">
                {simulationData.einvoiceDetails?.status}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">QR Code</h4>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center">
              <FaQrcode className="text-4xl text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mt-2">QR Code for E-Invoice</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header similar to e-Invoice portal */}
      <div className="bg-blue-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-900 font-bold text-sm">GST</span>
              </div>
              <h1 className="text-2xl font-bold">
                GST E-Invoice Simulation Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Progress: 100%</span>
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {["supplier", "recipient", "items", "summary"].map(
              (step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep === step ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                  {index < 3 && (
                    <div className="w-8 h-0.5 bg-gray-300 ml-4"></div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {currentStep === "supplier" && renderSupplierForm()}
          {currentStep === "recipient" && renderRecipientForm()}
          {currentStep === "items" && renderItemsForm()}
          {currentStep === "summary" && renderSummary()}
          {showQRCode && renderEInvoiceResult()}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => {
              const steps = ["supplier", "recipient", "items", "summary"];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1]);
              }
            }}
            disabled={currentStep === "supplier"}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={() => {
              const steps = ["supplier", "recipient", "items", "summary"];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}
            disabled={currentStep === "summary" || showQRCode}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTSimulation;
