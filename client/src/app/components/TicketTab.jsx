"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api\/?$/i, "") ||
  "http://localhost:8080";
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || `${API_ROOT.replace(/\/+$/, "")}/api`;

const extractTickets = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tickets)) return payload.tickets;
  if (Array.isArray(payload?.data?.tickets)) return payload.data.tickets;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractTicket = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.ticket && typeof payload.ticket === "object") return payload.ticket;
  if (payload.data?.ticket && typeof payload.data.ticket === "object") {
    return payload.data.ticket;
  }
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload;
};

export default function TicketTab({ viewerType = "student", authToken }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolveText, setResolveText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isAdminViewer = viewerType === "admin";
  const token =
    authToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("adminToken")
      : null);

  const getRequestOptions = (method = "GET", body = null) => {
    const options = {
      method,
      headers: {},
    };

    if (isAdminViewer && token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (!isAdminViewer) {
      options.credentials = "include";
    }

    if (body !== null) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    return options;
  };

  const handleApiError = (status, fallback) => {
    if (status === 401) {
      setErrorMessage("Unauthorized. Please log in again.");
      return;
    }

    if (status === 403) {
      setErrorMessage("You do not have permission to access support chats.");
      return;
    }

    setErrorMessage(fallback);
  };

  // Fetch tickets on mount
  useEffect(() => {
    const fetchTickets = async () => {
      setErrorMessage("");
      try {
        const res = await fetch(`${BASE_URL}/tickets`, getRequestOptions());
        if (!res.ok) {
          handleApiError(res.status, "Failed to load tickets.");
          return;
        }
        const data = await res.json();
        setTickets(extractTickets(data));
      } catch (error) {
        setErrorMessage("Failed to load tickets.");
      }
    };

    fetchTickets();
  }, [viewerType, token]);

  useEffect(() => {
    setResolveText(selectedTicket?.resolve || "");
  }, [selectedTicket]);

  // Select a ticket and load fresh data
  async function handleSelect(ticket) {
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/tickets/${ticket._id}`,
        getRequestOptions()
      );
      if (!res.ok) {
        handleApiError(res.status, "Failed to load ticket details.");
        return;
      }
      const data = await res.json();
      setSelectedTicket(extractTicket(data));
    } catch (error) {
      setErrorMessage("Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }

  // Update resolve field (admin reply)
  async function handleReply(e) {
    e.preventDefault();

    if (!isAdminViewer) {
      toast.error("Only admin can reply to tickets.");
      return;
    }

    if (!resolveText.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }

    if (!selectedTicket?._id) {
      toast.error("Please select a ticket first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        `${BASE_URL}/tickets/${selectedTicket._id}/resolve`,
        getRequestOptions("PATCH", { resolve: resolveText })
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleApiError(res.status, "Unauthorized action.");
        } else if (res.status === 400) {
          toast.error("Reply must be a non-empty message.");
        } else {
          toast.error("Failed to update reply.");
        }
        return;
      }

      const data = await res.json();
      const updatedTicket = extractTicket(data);
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket?._id ? updatedTicket : t))
      );
      setSelectedTicket(updatedTicket);
      toast.success("Reply saved.");
    } catch (error) {
      toast.error("Failed to update reply.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full h-[80vh] rounded-xl overflow-hidden shadow-2xl bg-gray-100">
      {/* Sidebar */}
      <div className="w-[340px] bg-gray-200 border-r border-gray-300 flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-300 text-lg font-bold tracking-wide text-gray-900">
          Tickets
        </div>
        <div className="flex-1 overflow-y-auto">
          {errorMessage ? (
            <div className="text-red-500 text-center mt-24 px-4">
              {errorMessage}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-gray-400 text-center mt-24">No results found</div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => handleSelect(ticket)}
                className={`cursor-pointer px-6 py-5 border-b border-gray-300 transition 
            ${
              selectedTicket && selectedTicket._id === ticket._id
                ? "bg-gray-300 text-gray-900 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }
          `}
              >
                <div className="text-base truncate font-medium">
                  {ticket.name}
                </div>
                <div className="text-xs text-gray-500">{ticket.email}</div>
                <div className="text-xs text-gray-400">
                  {new Date(ticket.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat/Details */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {selectedTicket ? (
          <>
            <div className="flex-1 px-16 py-8 overflow-y-auto">
              {/* User's message bubble */}
              <div className="max-w-[600px] mb-7">
                <div className="mb-2 text-blue-600 text-sm font-bold">
                  {selectedTicket.name}
                </div>
                <div className="bg-white rounded-tl-3xl rounded-tr-3xl rounded-br-3xl rounded-bl-lg p-5 text-gray-900 text-[16px] shadow">
                  <span className="font-semibold">Message: </span>
                  {selectedTicket.message}
                  <div className="text-xs text-cyan-600 mt-2">
                    Phone: {selectedTicket.phone}
                  </div>
                </div>
              </div>
              {/* Admin's resolve bubble */}
              {selectedTicket.resolve && (
                <div className="max-w-[600px] ml-auto mb-7">
                  <div className="text-right mb-2 text-green-600 text-sm font-semibold">
                    Admin Reply
                  </div>
                  <div className="bg-green-50 text-right rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl rounded-br-lg p-5 text-green-800 text-[16px] shadow">
                    {selectedTicket.resolve}
                  </div>
                </div>
              )}
            </div>

            {isAdminViewer && (
              <form
                onSubmit={handleReply}
                className="flex gap-4 p-8 border-t border-gray-300 bg-gray-200"
              >
                <textarea
                  value={resolveText}
                  onChange={(e) => setResolveText(e.target.value)}
                  placeholder="Type your reply or update here..."
                  rows={2}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-white border border-gray-400 px-4 py-3 text-gray-900 resize-none focus:outline-none focus:border-blue-400 text-[15px]"
                />
                <button
                  type="submit"
                  disabled={loading || !resolveText.trim()}
                  className={`rounded-lg px-7 py-3 text-white font-bold text-lg transition
              ${
                loading || !resolveText.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-cyan-400 hover:opacity-90"
              }
            `}
                >
                  {selectedTicket.resolve ? "Update" : "Reply"}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl font-semibold">
            Select a ticket to chat
          </div>
        )}
      </div>
    </div>
  );
}
