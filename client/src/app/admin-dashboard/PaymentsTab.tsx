"use client";
import { getApiOrigin } from "@/lib/apiBase";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEye, FaEnvelope, FaDownload } from "react-icons/fa";

const API = getApiOrigin();

interface Payment {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  course: {
    _id: string;
    title: string;
    price: number;
  };
  amount: number;
  status: "pending" | "verified" | "rejected";
  transactionId: string;
  paymentScreenshot: string;
  paymentMethod: string;
  upiDetails: {
    name: string;
    upiHandle: string;
  };
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedAt?: string;
  invoiceSent: boolean;
  invoiceSentAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationData, setVerificationData] = useState({
    status: "pending",
    transactionId: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        toast.error("Admin authentication required");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API}/api/v1/payments/all`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      setPayments(response.data.payments);
    } catch (error: unknown) {
      console.error("Error fetching payments:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.status === 401
      ) {
        toast.error("Admin authentication required. Please login as admin.");
      } else {
        toast.error("Failed to fetch payments");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        toast.error("Admin authentication required");
        return;
      }

      await axios.put(
        `${API}/api/v1/payments/update/${paymentId}`,
        verificationData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      toast.success("Payment status updated successfully");
      setShowModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment status");
    }
  };

  const handleSendInvoice = async (paymentId: string) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        toast.error("Admin authentication required");
        return;
      }

      await axios.post(
        `${API}/api/v1/payments/send-invoice/${paymentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      toast.success("Invoice email sent successfully");
      fetchPayments();
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice email");
    }
  };

  const openVerificationModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setVerificationData({
      status: payment.status,
      transactionId: payment.transactionId,
      notes: payment.notes,
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <div className="text-sm text-gray-500">
          Total Payments: {payments.length}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No payments found</div>
            <div className="text-gray-400 text-sm">
              Payment records will appear here once students make payments
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.student.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.student.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.course.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openVerificationModal(payment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Verify Payment"
                      >
                        <FaEye />
                      </button>
                      {payment.status === "verified" &&
                        !payment.invoiceSent && (
                          <button
                            onClick={() => handleSendInvoice(payment._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Send Invoice"
                          >
                            <FaEnvelope />
                          </button>
                        )}
                      {payment.paymentScreenshot && (
                        <a
                          href={`${API}${payment.paymentScreenshot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-900"
                          title="View Screenshot"
                        >
                          <FaDownload />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Verify Payment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <p className="text-sm text-gray-900">
                  {selectedPayment.student.name} (
                  {selectedPayment.student.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <p className="text-sm text-gray-900">
                  {selectedPayment.course.title} - ₹{selectedPayment.amount}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={verificationData.status}
                  onChange={(e) =>
                    setVerificationData({
                      ...verificationData,
                      status: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={verificationData.transactionId}
                  onChange={(e) =>
                    setVerificationData({
                      ...verificationData,
                      transactionId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={verificationData.notes}
                  onChange={(e) =>
                    setVerificationData({
                      ...verificationData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedPayment._id)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
