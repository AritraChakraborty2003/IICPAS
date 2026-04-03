"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import { 
  FaEnvelope, 
  FaSearch, 
  FaDownload, 
  FaTrash, 
  FaCheck, 
  FaTimes, 
  FaUser,
  FaPhone,
  FaCalendar,
  FaEye,
  FaFilter,
  FaSyncAlt,
  FaPaperPlane,
  FaChartLine
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import BulkEmailPage from "./BulkEmailPage";

const API_BASE = getApiBase();

export default function NewsletterSubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [showBulkEmailPage, setShowBulkEmailPage] = useState(false);
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [showCampaigns, setShowCampaigns] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
    if (showCampaigns) {
      fetchEmailCampaigns();
    }
  }, [currentPage, searchTerm, statusFilter, showCampaigns]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter })
      });

      const response = await fetch(`${API_BASE}/newsletter-subscriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          throw new Error("Failed to fetch subscriptions");
        }
        return;
      }

      const data = await response.json();
      setSubscriptions(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        console.error("Authentication token not found for stats");
        return;
      }

      const response = await fetch(`${API_BASE}/newsletter-subscriptions/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed for stats");
        } else if (response.status === 403) {
          console.error("Access denied for stats");
        } else {
          throw new Error("Failed to fetch stats");
        }
        return;
      }

      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/newsletter-subscriptions/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          throw new Error("Failed to update status");
        }
        return;
      }

      toast.success("Status updated successfully");
      fetchSubscriptions();
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/newsletter-subscriptions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          throw new Error("Failed to delete subscription");
        }
        return;
      }

      toast.success("Subscription deleted successfully");
      fetchSubscriptions();
      fetchStats();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubscriptions.length === 0) {
      toast.error("Please select subscriptions to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedSubscriptions.length} subscriptions?`)) return;

    try {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const deletePromises = selectedSubscriptions.map(id =>
        fetch(`${API_BASE}/newsletter-subscriptions/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include"
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if any requests failed
      const failedRequests = responses.filter(response => !response.ok);
      if (failedRequests.length > 0) {
        const firstFailed = failedRequests[0];
        if (firstFailed.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (firstFailed.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          throw new Error("Some deletions failed");
        }
        return;
      }

      toast.success(`${selectedSubscriptions.length} subscriptions deleted successfully`);
      setSelectedSubscriptions([]);
      fetchSubscriptions();
      fetchStats();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Failed to delete subscriptions");
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Email", "Name", "Phone", "Status", "Subscribed At", "Source"],
      ...subscriptions.map(sub => [
        sub.email,
        sub.name || "",
        sub.phone || "",
        sub.status,
        new Date(sub.subscribedAt).toLocaleDateString(),
        sub.source
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscriptions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "unsubscribed": return "bg-red-100 text-red-800";
      case "bounced": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSubscriptions(subscriptions.map(sub => sub._id));
    } else {
      setSelectedSubscriptions([]);
    }
  };

  const handleSelectSubscription = (id) => {
    setSelectedSubscriptions(prev =>
      prev.includes(id)
        ? prev.filter(subId => subId !== id)
        : [...prev, id]
    );
  };

  const fetchEmailCampaigns = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_BASE}/newsletter-subscriptions/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmailCampaigns(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      toast.error("Failed to fetch email campaigns");
    }
  };

  const handleBulkEmailSuccess = (campaign) => {
    toast.success(`Email campaign "${campaign.title}" sent successfully!`);
    if (showCampaigns) {
      fetchEmailCampaigns();
    }
  };

  const handleBackFromBulkEmail = () => {
    setShowBulkEmailPage(false);
    // Refresh campaigns when coming back
    if (showCampaigns) {
      fetchEmailCampaigns();
    }
  };

  const getCampaignStatusColor = (status) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800";
      case "sending": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Show bulk email page if requested
  if (showBulkEmailPage) {
    return <BulkEmailPage onBack={handleBackFromBulkEmail} />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Newsletter Subscriptions</h1>
        <p className="text-gray-600">Manage newsletter subscribers and their details</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaEnvelope className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheck className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <FaTimes className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unsubscribed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unsubscribed || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FaCalendar className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent (30 days)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recent || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkEmailPage(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPaperPlane />
              Send Bulk Email
            </button>
            <button
              onClick={() => setShowCampaigns(!showCampaigns)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaChartLine />
              {showCampaigns ? "Hide Campaigns" : "View Campaigns"}
            </button>
            <button
              onClick={fetchSubscriptions}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaSyncAlt />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              Export CSV
            </button>
            {selectedSubscriptions.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash />
                Delete Selected ({selectedSubscriptions.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSubscriptions.length === subscriptions.length && subscriptions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedSubscriptions.includes(subscription._id)}
                          onChange={() => handleSelectSubscription(subscription._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaEnvelope className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {subscription.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {subscription.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaPhone className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {subscription.phone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(subscription.subscribedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {subscription.status === "active" ? (
                            <button
                              onClick={() => handleStatusUpdate(subscription._id, "unsubscribed")}
                              className="text-red-600 hover:text-red-900"
                              title="Unsubscribe"
                            >
                              <FaTimes />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(subscription._id, "active")}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivate"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(subscription._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      {/* Email Campaigns Section */}
      {showCampaigns && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Email Campaigns</h3>
            <p className="text-sm text-gray-600">View and manage your email campaigns</p>
          </div>
          
          {emailCampaigns.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FaPaperPlane size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No email campaigns found. Send your first bulk email to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opened
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.subject}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.stats?.totalRecipients || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.stats?.sent || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.stats?.opened || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.sentAt 
                          ? new Date(campaign.sentAt).toLocaleDateString()
                          : campaign.scheduledAt 
                            ? new Date(campaign.scheduledAt).toLocaleDateString()
                            : new Date(campaign.createdAt).toLocaleDateString()
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
