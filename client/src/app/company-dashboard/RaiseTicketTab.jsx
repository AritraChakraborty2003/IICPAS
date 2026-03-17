"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusCircle,
  MessageSquare,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";
const MOBILE_NUMBER_REGEX = /^[6-9]\d{9}$/;

export default function CompanyTicketRaiseAndList() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    message: "",
  });

  // Fetch company email from profile
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`${API}/companies/iscompany`, {
          withCredentials: true,
        });

        const { email: userEmail, name: companyName } = res.data.company;
        setEmail(userEmail);
        setName(companyName);
        setForm((prev) => ({ ...prev, email: userEmail }));

        // Check if user is admin (you can modify this logic based on your admin check)
        // For now, let's assume admin emails contain 'admin' or specific admin emails
        setIsAdmin(
          userEmail.includes("admin") || userEmail === "admin@example.com"
        );
      } catch {
        toast.error("Unauthorized. Please login.");
        window.location.href = "/placements/hire";
      }
    };
    fetchCompany();
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!email) return;
    fetchMessages();
  }, [email, submitted]);

  const fetchMessages = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API}/messages/by-email/${email}`);
      setMessages(res.data.data || []);
    } catch {
      toast.error("Failed to fetch messages.");
      setMessages([]);
    }
    setListLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, phone, message } = form;
    const normalizedPhone = phone.replace(/\D/g, "").slice(0, 10);

    if (!normalizedPhone || !message.trim()) {
      return toast.error("Phone and Message are required.");
    }

    if (!MOBILE_NUMBER_REGEX.test(normalizedPhone)) {
      return toast.error(
        "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
      );
    }

    setLoading(true);
    try {
      await axios.post(`${API}/messages`, {
        email,
        phone: normalizedPhone,
        message,
      });
      toast.success("Message sent successfully!");
      setForm((prev) => ({ ...prev, phone: "", message: "" }));
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setShowForm(false);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminReply = async () => {
    if (!adminReply.trim() || !selectedMessage) {
      return toast.error("Please enter a reply message.");
    }

    try {
      await axios.put(`${API}/messages/admin-reply/${selectedMessage._id}`, {
        adminReply: adminReply.trim(),
        adminRepliedBy: email,
      });

      toast.success("Admin reply sent successfully!");
      setAdminReply("");
      fetchMessages(); // Refresh messages to get updated data

      // Update selected message with new data
      const updatedMessage = {
        ...selectedMessage,
        adminReply: adminReply.trim(),
        adminRepliedBy: email,
        adminRepliedAt: new Date(),
        status: "replied",
      };
      setSelectedMessage(updatedMessage);
    } catch {
      toast.error("Failed to send admin reply.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        Messages{" "}
        {isAdmin && (
          <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
            Admin Mode
          </span>
        )}
      </h2>

      <div className="text-gray-600 mb-4">
        Logged in as <strong>{name}</strong>{" "}
        <span className="text-sm text-gray-400">({email})</span>
      </div>

      <button
        onClick={() => setShowForm((v) => !v)}
        className={`flex items-center gap-2 px-5 py-2 ${
          showForm
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white font-semibold rounded-lg shadow transition mb-6`}
      >
        <PlusCircle size={20} />
        {showForm ? "Close Form" : "Send Message"}
      </button>

      {submitted && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg flex items-center gap-2">
          <MessageSquare size={20} />
          Your message has been sent successfully!
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-blue-50 p-6 rounded-xl border space-y-4 mb-8"
        >
          <div>
            <label className="block text-xs mb-1 font-semibold">Email</label>
            <input
              className="border px-3 py-2 rounded w-full bg-gray-100"
              value={form.email}
              readOnly
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-semibold">Phone *</label>
            <input
              type="tel"
              className="border px-3 py-2 rounded w-full"
              placeholder="Enter 10-digit mobile number"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-semibold">
              Message *
            </label>
            <textarea
              className="border px-3 py-2 rounded w-full"
              rows={4}
              placeholder="Type your message..."
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              required
            />
          </div>

          <button
            className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}

      {/* Two Column Layout */}
      <div className="flex gap-6 h-[600px]">
        {/* Left Column - Message List */}
        <div className="w-1/3 bg-gray-50 rounded-xl border overflow-hidden">
          <div className="p-4 bg-blue-100 border-b">
            <h3 className="text-lg font-bold text-blue-900">Messages</h3>
          </div>
          <div className="overflow-y-auto h-full">
            {listLoading ? (
              <div className="p-4 text-center text-gray-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No messages found.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition ${
                    selectedMessage?._id === message._id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="font-semibold text-gray-800">
                    {message.email}
                  </div>
                  <div className="text-sm text-gray-600">{message.phone}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-gray-700 truncate">
                    {message.message}
                  </div>

                  {/* Admin Reply Preview */}
                  {message.adminReply && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Admin Reply:
                      </div>
                      <div className="text-xs text-green-600 line-clamp-2">
                        {message.adminReply.length > 80
                          ? `${message.adminReply.substring(0, 80)}...`
                          : message.adminReply}
                      </div>
                      <div className="text-xs text-green-500 mt-1">
                        by {message.adminRepliedBy}
                      </div>
                    </div>
                  )}

                  <div className="mt-2">
                    {message.status === "replied" ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 size={12} />
                        Replied
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Message Details */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">
                    Message Details
                  </h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                {/* Message Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-gray-700 mb-1">
                    Email:{" "}
                    <span className="font-normal">{selectedMessage.email}</span>
                  </div>
                  <div className="font-semibold text-gray-700 mb-1">
                    Phone:{" "}
                    <span className="font-normal">{selectedMessage.phone}</span>
                  </div>
                  <div className="font-semibold text-gray-700 mb-1">
                    Date:{" "}
                    <span className="font-normal">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-700">
                    Status:{" "}
                    <span
                      className={`font-normal ${
                        selectedMessage.status === "replied"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {selectedMessage.status === "replied"
                        ? "Replied"
                        : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Message
                  </div>
                  <div className="text-blue-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Admin Reply */}
                {selectedMessage.adminReply && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Admin Reply
                    </div>
                    <div className="text-green-700 mb-2 whitespace-pre-wrap">
                      {selectedMessage.adminReply}
                    </div>
                    <div className="text-xs text-green-600">
                      Replied by: {selectedMessage.adminRepliedBy} on{" "}
                      {new Date(
                        selectedMessage.adminRepliedAt
                      ).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Admin Reply Form */}
                {isAdmin && !selectedMessage.adminReply && (
                  <div className="mt-auto">
                    <label className="block mb-2 font-medium text-gray-700">
                      Admin Reply
                    </label>
                    <textarea
                      className="w-full border rounded-lg p-3 bg-green-50 border-green-200"
                      rows={4}
                      placeholder="Type your admin reply..."
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAdminReply}
                        className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
                        disabled={!adminReply.trim()}
                      >
                        Send Reply
                      </button>
                      <button
                        onClick={() => setAdminReply("")}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">
                  Select a message to view
                </div>
                <div className="text-sm">
                  Choose a message from the list to view details
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
