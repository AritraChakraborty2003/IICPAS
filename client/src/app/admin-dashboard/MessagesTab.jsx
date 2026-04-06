import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaEnvelope, FaPhone, FaUser, FaClock, FaReply, FaCheck, FaTimes, FaEye, FaTrash } from "react-icons/fa";

const API_BASE = getApiBase();

const extractMessages = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(payload?.data?.messages)) return payload.data.messages;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function MessagesTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, replied

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/contact/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setMessages(extractMessages(response.data));
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setReplying(true);
      const response = await axios.put(
        `${API_BASE}/contact/messages/${messageId}/reply`,
        {
          adminReply: replyText,
          adminRepliedBy: "Admin" // You can get this from user context
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      // Update the message in the list
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, ...response.data }
            : msg
        )
      );

      setReplyText("");
      setSelectedMessage(null);
      toast.success("Reply sent successfully!");
    } catch (error) {
      console.error("Error replying to message:", error);
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = messages.filter(message => {
    if (filter === "pending") return message.status === "pending";
    if (filter === "replied") return message.status === "replied";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Messages</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
            </select>
          </div>
          <button
            onClick={fetchMessages}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaEnvelope />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FaEnvelope className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(m => m.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Replied</p>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(m => m.status === "replied").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Messages ({filteredMessages.length})
          </h3>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all" 
                ? "No messages have been received yet."
                : `No ${filter} messages found.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div key={message._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {message.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaPhone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {message.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        message.status === "pending" 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {message.status === "pending" ? "Pending" : "Replied"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-900">{message.message}</p>
                    </div>

                    {message.adminReply && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FaReply className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Admin Reply
                          </span>
                          <span className="text-xs text-green-600">
                            by {message.adminRepliedBy} on {formatDate(message.adminRepliedAt)}
                          </span>
                        </div>
                        <p className="text-green-900">{message.adminReply}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedMessage(message)}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    {message.status === "pending" && (
                      <button
                        onClick={() => setSelectedMessage(message)}
                        className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                        title="Reply"
                      >
                        <FaReply />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Message Details</h3>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setReplyText("");
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedMessage.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {selectedMessage.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(selectedMessage.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-900">{selectedMessage.message}</p>
                </div>

                {selectedMessage.adminReply && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaReply className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Previous Reply
                      </span>
                      <span className="text-xs text-green-600">
                        by {selectedMessage.adminRepliedBy} on {formatDate(selectedMessage.adminRepliedAt)}
                      </span>
                    </div>
                    <p className="text-green-900">{selectedMessage.adminReply}</p>
                  </div>
                )}

                {selectedMessage.status === "pending" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply Message
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Type your reply here..."
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedMessage.status === "pending" && (
                  <button
                    onClick={() => handleReply(selectedMessage._id)}
                    disabled={replying || !replyText.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaReply />
                    {replying ? "Sending..." : "Send Reply"}
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
