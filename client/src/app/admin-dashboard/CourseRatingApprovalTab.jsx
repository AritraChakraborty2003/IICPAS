import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaStar,
  FaCheck,
  FaTimes,
  FaEye,
  FaUser,
  FaBook,
  FaCalendar,
} from "react-icons/fa";

const API_BASE = getApiBase();

const extractRatings = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export default function CourseRatingApprovalTab() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all
  const [selectedRating, setSelectedRating] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchRatings();
  }, [filter]);

  const fetchRatings = async () => {
    try {
      setLoading(true);

      let endpoint;

      if (filter === "all") {
        endpoint = `/v1/course-ratings/admin/all`;
      } else if (filter === "approved") {
        endpoint = `/v1/course-ratings/admin/all?status=approved`;
      } else if (filter === "rejected") {
        endpoint = `/v1/course-ratings/admin/all?status=rejected`;
      } else {
        endpoint = `/v1/course-ratings/admin/pending`;
      }

      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setRatings(extractRatings(response.data));
    } catch (error) {
      console.error("Error fetching ratings:", error);
      toast.error("Failed to fetch ratings");
      // Set empty array on error
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ratingId) => {
    try {
      const adminId = "admin"; // Default admin ID since no authentication

      await axios.patch(
        `${API_BASE}/v1/course-ratings/admin/approve/${ratingId}`,
        { adminId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Rating approved successfully!");
      fetchRatings();
    } catch (error) {
      console.error("Error approving rating:", error);
      toast.error("Failed to approve rating");
    }
  };

  const handleReject = async (ratingId) => {
    try {
      const adminId = "admin"; // Default admin ID since no authentication

      await axios.patch(
        `${API_BASE}/v1/course-ratings/admin/reject/${ratingId}`,
        {
          adminId,
          rejectedReason: rejectReason || "Rating rejected by admin",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Rating rejected successfully!");
      setShowModal(false);
      setRejectReason("");
      fetchRatings();
    } catch (error) {
      console.error("Error rejecting rating:", error);
      toast.error("Failed to reject rating");
    }
  };

  const openRejectModal = (rating) => {
    setSelectedRating(rating);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading ratings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Course Rating Approval
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Pending ({ratings.filter((r) => r.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg ${
              filter === "approved"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Approved ({ratings.filter((r) => r.status === "approved").length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg ${
              filter === "rejected"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Rejected ({ratings.filter((r) => r.status === "rejected").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All ({ratings.length})
          </button>
        </div>
      </div>

      {/* Ratings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
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
              {ratings.map((rating) => (
                <tr key={rating._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUser className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rating.studentId?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rating.studentId?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaBook className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rating.courseId?.title || "Unknown Course"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rating.courseId?.category || "No category"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStars(rating.rating)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {rating.review || "No review provided"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(rating.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaCalendar className="h-4 w-4 mr-2" />
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {rating.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(rating._id)}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                            title="Approve Rating"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => openRejectModal(rating)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                            title="Reject Rating"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRating(rating);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ratings.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No ratings found</div>
          </div>
        )}
      </div>

      {/* Rating Details Modal */}
      {showModal && selectedRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Rating Details
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRating(null);
                  setRejectReason("");
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRating.studentId?.name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedRating.studentId?.email || "No email"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedRating.courseId?.title || "Unknown Course"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedRating.courseId?.category || "No category"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  {renderStars(selectedRating.rating)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedRating.review || "No review provided"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {getStatusBadge(selectedRating.status)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submitted Date
                  </label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedRating.createdAt).toLocaleString()}
                  </div>
                </div>

                {selectedRating.status === "rejected" &&
                  selectedRating.rejectedReason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                        {selectedRating.rejectedReason}
                      </div>
                    </div>
                  )}

                {selectedRating.status === "approved" &&
                  selectedRating.approvedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approved Date
                      </label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedRating.approvedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                {selectedRating.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedRating(null);
                        setRejectReason("");
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRating._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <FaCheck />
                      Approve Rating
                    </button>
                    <button
                      onClick={() => handleReject(selectedRating._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                    >
                      <FaTimes />
                      Reject Rating
                    </button>
                  </>
                )}

                {selectedRating.status !== "pending" && (
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRating(null);
                      setRejectReason("");
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
