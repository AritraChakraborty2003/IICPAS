"use client";

import React, { useState, useEffect } from "react";
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
  FaFileInvoice,
  FaDownload,
  FaSearch,
  FaQuestionCircle,
  FaGlobe,
  FaQrcode,
  FaUpload,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";

interface InvoiceItem {
  id: string;
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

interface EInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  supplier: {
    name: string;
    gstin: string;
    address: string;
    state: string;
    pincode: string;
  };
  recipient: {
    name: string;
    gstin: string;
    address: string;
    state: string;
    pincode: string;
  };
  items: InvoiceItem[];
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

const EInvoiceSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState("dashboard");
  const [invoiceData, setInvoiceData] = useState<EInvoiceData>({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    supplier: {
      name: "IICPA Private Limited",
      gstin: "07GDLCF7228G1YK",
      address: "123 Business Park, Sector 5",
      state: "Delhi",
      pincode: "110001",
    },
    recipient: {
      name: "",
      gstin: "",
      address: "",
      state: "",
      pincode: "",
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
    "Delhi",
    "Chandigarh",
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
      invoiceData.supplier.state !== invoiceData.recipient.state;

    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;
    let totalIgstAmount = 0;
    let totalCessAmount = 0;

    const updatedItems = invoiceData.items.map((item) => {
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

    setInvoiceData((prev) => ({
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
    if (invoiceData.items.length > 0) {
      calculateTaxes();
    }
  }, [
    invoiceData.items,
    invoiceData.supplier.state,
    invoiceData.recipient.state,
  ]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
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
    };

    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
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

      setInvoiceData((prev) => ({
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

  const handleStartSimulation = () => {
    setCurrentStep("invoice-creation");
  };

  const renderInvoiceCreation = () => (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaFileInvoice className="mr-2 text-blue-600" />
          Invoice Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number *
            </label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  invoiceNumber: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="INV-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              value={invoiceData.invoiceDate}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  invoiceDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Supplier Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaFileInvoice className="mr-2 text-green-600" />
          Supplier Details (Seller)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={invoiceData.supplier.name}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  supplier: { ...prev.supplier, name: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN *
            </label>
            <input
              type="text"
              value={invoiceData.supplier.gstin}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  supplier: {
                    ...prev.supplier,
                    gstin: e.target.value.toUpperCase(),
                  },
                }))
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                invoiceData.supplier.gstin &&
                !validateGSTIN(invoiceData.supplier.gstin)
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="07GDLCF7228G1YK"
              maxLength={15}
            />
            {invoiceData.supplier.gstin &&
              !validateGSTIN(invoiceData.supplier.gstin) && (
                <p className="text-red-500 text-xs mt-1">
                  Invalid GSTIN format
                </p>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <select
              value={invoiceData.supplier.state}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  supplier: { ...prev.supplier, state: e.target.value },
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
              value={invoiceData.supplier.pincode}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  supplier: { ...prev.supplier, pincode: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="110001"
              maxLength={6}
            />
          </div>
        </div>
      </div>

      {/* Recipient Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaFileInvoice className="mr-2 text-purple-600" />
          Recipient Details (Buyer)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={invoiceData.recipient.name}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  recipient: { ...prev.recipient, name: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter recipient name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN (Optional for B2C)
            </label>
            <input
              type="text"
              value={invoiceData.recipient.gstin}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  recipient: {
                    ...prev.recipient,
                    gstin: e.target.value.toUpperCase(),
                  },
                }))
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                invoiceData.recipient.gstin &&
                !validateGSTIN(invoiceData.recipient.gstin)
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
            />
            {invoiceData.recipient.gstin &&
              !validateGSTIN(invoiceData.recipient.gstin) && (
                <p className="text-red-500 text-xs mt-1">
                  Invalid GSTIN format
                </p>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <select
              value={invoiceData.recipient.state}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  recipient: { ...prev.recipient, state: e.target.value },
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
              value={invoiceData.recipient.pincode}
              onChange={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  recipient: { ...prev.recipient, pincode: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
              maxLength={6}
            />
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <FaFileInvoice className="mr-2 text-orange-600" />
            Invoice Items
          </h3>
          <button
            onClick={addItem}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Item
          </button>
        </div>

        {invoiceData.items.map((item, index) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 mb-4"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Item {index + 1}</h4>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 text-sm flex items-center"
              >
                <FaTrash className="mr-1" />
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
                  onChange={(e) =>
                    updateItem(item.id, "itemName", e.target.value)
                  }
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
                  onChange={(e) =>
                    updateItem(item.id, "hsnCode", e.target.value)
                  }
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
                    updateItem(
                      item.id,
                      "quantity",
                      parseFloat(e.target.value) || 0
                    )
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
                      item.id,
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
                    updateItem(item.id, "cgstRate", rate);
                    updateItem(item.id, "sgstRate", rate);
                    updateItem(item.id, "igstRate", rate);
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
                <div className="font-medium">
                  ₹{item.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tax Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaCheckCircle className="mr-2 text-green-600" />
          Tax Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Transaction Type</h4>
            <div
              className={`p-3 rounded-lg ${
                invoiceData.supplier.state === invoiceData.recipient.state
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-orange-50 border border-orange-200"
              }`}
            >
              <div className="flex items-center">
                {invoiceData.supplier.state === invoiceData.recipient.state ? (
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
                {invoiceData.supplier.state === invoiceData.recipient.state
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
                  ₹{invoiceData.taxSummary.totalTaxableAmount.toFixed(2)}
                </span>
              </div>
              {invoiceData.supplier.state === invoiceData.recipient.state ? (
                <>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>
                      ₹{invoiceData.taxSummary.totalCgstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>
                      ₹{invoiceData.taxSummary.totalSgstAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>IGST:</span>
                  <span>
                    ₹{invoiceData.taxSummary.totalIgstAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CESS:</span>
                <span>
                  ₹{invoiceData.taxSummary.totalCessAmount.toFixed(2)}
                </span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total:</span>
                <span>₹{invoiceData.taxSummary.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={generateEInvoice}
            disabled={isGenerating || invoiceData.items.length === 0}
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

      {/* E-Invoice Result */}
      {showQRCode && invoiceData.einvoiceDetails && (
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
                    {invoiceData.einvoiceDetails.irn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ack No:</span>
                  <span className="font-mono text-sm">
                    {invoiceData.einvoiceDetails.ackNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">
                    {invoiceData.einvoiceDetails.status}
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
                <p className="text-sm text-gray-600 mt-2">
                  QR Code for E-Invoice
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header Bar */}
      <div className="bg-blue-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-900 font-bold text-sm">E-INV</span>
              </div>
              <h1 className="text-lg font-semibold">E-Invoice Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Progress: 60%</span>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: "60%" }}
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
                <span className="text-blue-600 font-bold text-lg">E-INV</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  E-Invoice Portal
                </h2>
                <p className="text-sm text-gray-600">
                  Generate and manage GST e-invoices
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  IICPA Private Limited
                </p>
                <p className="text-xs text-gray-600">GSTIN: 07GDLCF7228G1YK</p>
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
              <span>E-Invoice</span>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-800 font-medium">Generate</span>
            </nav>
          </div>

          {/* Experiment Instructions */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-teal-800 mb-2">
                  E-Invoice Generation Portal
                </h3>
                <p className="text-teal-700 mb-4">
                  Generate GST e-invoices with IRN and QR codes.
                </p>
                <p className="text-teal-600 font-medium">
                  Experiment 3 - Learn e-invoice generation process.
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
          {currentStep === "dashboard" && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                E-Invoice Dashboard
              </h3>
              <p className="text-gray-600 mb-6">
                Manage your e-invoices efficiently with our comprehensive
                portal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Total Invoices
                  </h4>
                  <div className="text-3xl font-bold text-blue-600">0</div>
                  <p className="text-sm text-blue-600">Generated this month</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Success Rate
                  </h4>
                  <div className="text-3xl font-bold text-green-600">100%</div>
                  <p className="text-sm text-green-600">
                    Successful generations
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Pending
                  </h4>
                  <div className="text-3xl font-bold text-purple-600">0</div>
                  <p className="text-sm text-purple-600">Awaiting processing</p>
                </div>
              </div>

              {/* Start Simulation Button */}
              <div className="text-center">
                <button
                  onClick={handleStartSimulation}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center mx-auto"
                >
                  <FaPlay className="mr-2" />
                  Start E-Invoice Simulation
                </button>
              </div>
            </div>
          )}

          {/* Invoice Creation */}
          {currentStep === "invoice-creation" && renderInvoiceCreation()}

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

export default EInvoiceSimulation;
