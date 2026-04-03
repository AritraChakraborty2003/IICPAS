"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaEnvelope,
  FaTrash,
} from "react-icons/fa";

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE = getApiBase();

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await axios.get(
        `${API_BASE}/v1/transactions/admin/all?${params}`
      );

      if (response.data.success) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.totalPages);
        setTotalTransactions(response.data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch transactions",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        const response = await axios.delete(
          `${API_BASE}/v1/transactions/admin/${transactionId}`
        );

        if (response.data.success) {
          Swal.fire("Deleted!", "Transaction has been deleted.", "success");
          fetchTransactions(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting transaction:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete transaction",
          icon: "error",
        });
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (transactionId, newStatus, notes = "") => {
    try {
      setActionLoading(true);
      const response = await axios.put(
        `${API_BASE}/v1/transactions/admin/update-status/${transactionId}`,
        { status: newStatus, adminNotes: notes, adminId: "admin-user-001" }
      );

      if (response.data.success) {
        Swal.fire({
          title: "Success",
          text: `Transaction ${newStatus} successfully`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // Refresh transactions
        fetchTransactions();
        setShowModal(false);
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update transaction status",
        icon: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReceipt = async (transactionId) => {
    try {
      setActionLoading(true);
      const response = await axios.post(
        `${API_BASE}/v1/transactions/admin/send-receipt/${transactionId}`,
        {}
      );

      if (response.data.success) {
        const emailResult = response.data.emailResult;
        Swal.fire({
          title: "Receipt Sent! 📧",
          html: `
            <div class="text-left">
              <p><strong>PDF Receipt sent successfully!</strong></p>
              <p>📨 Sent to: <span class="text-blue-600">${
                emailResult?.email || "Student email"
              }</span></p>
              ${
                emailResult?.messageId
                  ? `<p class="text-sm text-gray-500">Message ID: ${emailResult.messageId.slice(
                      0,
                      8
                    )}...</p>`
                  : ""
              }
            </div>
          `,
          icon: "success",
          timer: 3000,
          timerProgressBar: true,
          confirmButtonText: "Great!",
        });
        fetchTransactions(); // Refresh the list
        setShowModal(false);
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error("Error sending receipt:", error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to send receipt",
        icon: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Transaction Management
          </h1>
          <p className="text-gray-600">Manage and verify student payments</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {totalTransactions} transactions
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-4 items-end"
        >
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by UTR number or notes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaFilter className="inline mr-2" />
            Apply Filters
          </button>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
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
                      UTR Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.studentId?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.studentId?.email || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.courseId?.title || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ₹{transaction.amount?.toLocaleString() || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {transaction.utrNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {transaction.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    transaction._id,
                                    "approved"
                                  )
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Verify Payment"
                                disabled={actionLoading}
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    transaction._id,
                                    "rejected"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                                title="Reject Payment"
                                disabled={actionLoading}
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          {transaction.status === "approved" && (
                            <>
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: transaction.receiptSent
                                      ? "Send Receipt Again by Email?"
                                      : "Send Receipt by Email?",
                                    html: `
                                      <div class="text-left">
                                        <p><strong>This will send a PDF receipt to:</strong></p>
                                        <p class="text-blue-600 font-medium">${
                                          transaction.studentId?.email ||
                                          "Student email"
                                        }</p>
                                        ${
                                          transaction.receiptSent
                                            ? `<p class="text-yellow-600 text-sm mb-2">⚠️ Receipt was previously sent</p>`
                                            : ""
                                        }
                                        <p class="text-sm text-gray-500 mt-2">The email will include:</p>
                                        <ul class="text-sm text-gray-500 ml-4">
                                          <li>• Professional PDF receipt attachment</li>
                                          <li>• Transaction details & UTR number</li>
                                          <li>• Course information & payment summary</li>
                                        </ul>
                                      </div>
                                    `,
                                    icon: "question",
                                    showCancelButton: true,
                                    confirmButtonText: transaction.receiptSent
                                      ? "Yes, Send Again 📧"
                                      : "Yes, Send Receipt 📧",
                                    cancelButtonText: "Cancel",
                                    confirmButtonColor: "#10b981",
                                    cancelButtonColor: "#6b7280",
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      handleSendReceipt(transaction._id);
                                    }
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Send Receipt by Email"
                                disabled={actionLoading}
                              >
                                <FaEnvelope />
                              </button>
                              {transaction.receiptSent && (
                                <span
                                  className="text-green-600 ml-1"
                                  title="Receipt Previously Sent"
                                >
                                  ✓
                                </span>
                              )}
                            </>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteTransaction(transaction._id)
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Delete Transaction"
                            disabled={actionLoading}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page{" "}
                      <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowModal(false);
            setSelectedTransaction(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          onSendReceipt={handleSendReceipt}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Transaction Details Modal Component
const TransactionDetailsModal = ({
  transaction,
  onClose,
  onStatusUpdate,
  onSendReceipt,
  actionLoading,
}) => {
  const [notes, setNotes] = useState("");

  const handleStatusUpdate = (status) => {
    onStatusUpdate(transaction._id, status, notes);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <p className="text-gray-900">
                {transaction.studentId?.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Email
              </label>
              <p className="text-gray-900">
                {transaction.studentId?.email || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <p className="text-gray-900">
                {transaction.courseId?.title || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <p className="font-semibold text-green-600">
                ₹{transaction.amount?.toLocaleString() || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UTR Number
              </label>
              <p className="text-gray-900 font-mono">
                {transaction.utrNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : transaction.status === "verified"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {transaction.status?.charAt(0).toUpperCase() +
                  transaction.status?.slice(1) || "N/A"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created At
              </label>
              <p className="text-gray-900">
                {new Date(transaction.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
            {transaction.approvedBy && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approved By
                </label>
                <p className="text-gray-900">
                  {transaction.approvedBy?.name || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this transaction..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          {transaction.status === "pending" && (
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => handleStatusUpdate("approved")}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Approve Payment"}
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Reject Payment"}
              </button>
            </div>
          )}

          {/* Send Receipt for Approved Transactions */}
          {transaction.status === "approved" && (
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => onSendReceipt(transaction._id)}
                disabled={actionLoading || transaction.receiptSent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {transaction.receiptSent
                  ? "Receipt Sent ✓"
                  : actionLoading
                  ? "Sending..."
                  : "Send Receipt"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsTab;
