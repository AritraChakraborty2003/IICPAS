import { getApiBase } from "@/lib/apiBase";
import React, { useEffect, useState } from "react";

// Helper to create a consistent randomuser.me avatar per email
function getAvatarUrl(email) {
  if (!email) return "https://randomuser.me/api/portraits/lego/1.jpg";
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash + email.charCodeAt(i)) % 100;
  }
  const gender = hash % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${gender}/${hash}.jpg`;
}

export default function TicketTab() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolveText, setResolveText] = useState("");
  const [loading, setLoading] = useState(false);

  const BASE_URL = getApiBase();
  const extractTicketList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.tickets)) return payload.tickets;
    if (Array.isArray(payload?.data?.tickets)) return payload.data.tickets;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };
  const extractTicketRecord = (payload) =>
    payload?.ticket || payload?.data?.ticket || payload?.data || payload;

  // Fetch tickets on mount
  useEffect(() => {
    fetch(`${BASE_URL}/tickets`)
      .then((res) => res.json())
      .then((data) => setTickets(extractTicketList(data)));
  }, [BASE_URL]);

  useEffect(() => {
    if (selectedTicket) {
      setResolveText(selectedTicket.resolve || "");
    }
  }, [selectedTicket]);

  const handleSelectTicket = async (ticket) => {
    setLoading(true);
    const res = await fetch(`${BASE_URL}/tickets/${ticket._id}`);
    const data = await res.json();
    setSelectedTicket(extractTicketRecord(data));
    setLoading(false);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(
      `${BASE_URL}/tickets/${selectedTicket._id}/resolve`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolve: resolveText }),
      }
    );
    const data = await res.json();
    setTickets((ts) =>
      ts.map((t) =>
        t._id === selectedTicket._id ? { ...t, resolve: resolveText } : t
      )
    );
    setSelectedTicket(data);
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "80vh",
        width: "100vw",
        background: "linear-gradient(90deg,#f5f8fa 50%,#fff 100%)",
        boxShadow: "0 2px 24px #dde3f3cc",
        borderRadius: "24px",
        overflow: "hidden",
      }}
    >
      {/* Left: Tickets list */}
      <div
        style={{
          width: 350,
          background: "#f4f6fb",
          borderRight: "1px solid #ebedf0",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div
          style={{
            padding: "28px 32px 10px",
            fontWeight: 700,
            fontSize: 28,
            color: "#2e3a59",
            letterSpacing: 0.5,
            background: "#f7faff",
          }}
        >
          Tickets
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {tickets.length === 0 ? (
            <div
              style={{
                color: "#b0b7c3",
                textAlign: "center",
                marginTop: "50%",
                fontSize: 18,
              }}
            >
              No tickets
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => handleSelectTicket(ticket)}
                style={{
                  cursor: "pointer",
                  padding: "16px 22px",
                  borderBottom: "1px solid #e4e9f0",
                  background:
                    selectedTicket && selectedTicket._id === ticket._id
                      ? "#e7f0fe"
                      : "transparent",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  boxShadow:
                    selectedTicket && selectedTicket._id === ticket._id
                      ? "0 2px 12px #8da5fc10"
                      : "none",
                }}
              >
                {/* Avatar */}
                <img
                  src={getAvatarUrl(ticket.email)}
                  alt="avatar"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #dde9fa",
                    background: "#e3e7ef",
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://randomuser.me/api/portraits/lego/1.jpg";
                  }}
                />
                {/* Ticket Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: "#244288",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#5b6787",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.email}
                  </div>
                  <div style={{ fontSize: 11, color: "#97a6c2" }}>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Ticket Details / Chat Area */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {selectedTicket ? (
          <>
            <div
              style={{
                flex: 1,
                padding: "42px 64px 0",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              {/* User Message Bubble */}
              <div
                style={{
                  marginBottom: 26,
                  maxWidth: 620,
                  alignSelf: "flex-start",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#2e4b7b",
                    fontSize: 16,
                    marginBottom: 2,
                  }}
                >
                  {selectedTicket.name}{" "}
                  <span
                    style={{ fontWeight: 400, color: "#6d7e9d", fontSize: 13 }}
                  >
                    ({selectedTicket.email})
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    background: "#f3f6fa",
                    borderRadius: "22px 22px 22px 8px",
                    padding: "18px 28px",
                    color: "#2e3a59",
                    boxShadow: "0 1px 7px #b0bcda16",
                    border: "1px solid #e4e9f0",
                  }}
                >
                  <b>Message:</b> {selectedTicket.message}
                  <div style={{ fontSize: 12, marginTop: 7, color: "#9dacce" }}>
                    Phone: {selectedTicket.phone}
                  </div>
                </div>
              </div>
              {/* Admin Resolve Bubble */}
              {selectedTicket.resolve && (
                <div
                  style={{
                    marginBottom: 18,
                    maxWidth: 600,
                    alignSelf: "flex-end",
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#0eae72",
                      marginBottom: 3,
                    }}
                  >
                    Your Response
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      background: "#e7fbee",
                      borderRadius: "22px 22px 8px 22px",
                      padding: "16px 24px",
                      color: "#107c49",
                      boxShadow: "0 1px 7px #b0e5c416",
                      border: "1px solid #b0e5c4",
                    }}
                  >
                    {selectedTicket.resolve}
                  </div>
                </div>
              )}
            </div>
            {/* Text Area to update resolve */}
            <form
              onSubmit={handleResolveSubmit}
              style={{
                padding: "24px 64px 32px",
                borderTop: "1px solid #eff2f7",
                background: "#fafcff",
                display: "flex",
                gap: 14,
                alignItems: "flex-end",
              }}
            >
              <textarea
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
                rows={2}
                style={{
                  flex: 1,
                  border: "1.5px solid #c8d8fa",
                  borderRadius: 14,
                  padding: "14px 16px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  background: "#f8fafd",
                  boxShadow: "0 1px 4px #d6e4fa22",
                  outline: "none",
                  minHeight: 50,
                  resize: "none",
                  color: "#223867",
                }}
                placeholder="Type or update your resolution here..."
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !resolveText.trim()}
                style={{
                  border: "none",
                  background:
                    "linear-gradient(90deg, #4388f8 20%, #6bd6ed 90%)",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: 12,
                  fontSize: 16,
                  padding: "14px 30px",
                  cursor:
                    loading || !resolveText.trim() ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px #a6c5fa18",
                  transition: "background 0.2s, box-shadow 0.2s",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? "Saving..."
                  : selectedTicket.resolve
                  ? "Update"
                  : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b8c5df",
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: 0.5,
              background: "linear-gradient(120deg,#f6faff 60%,#f3f6fb 100%)",
            }}
          >
            Select a ticket to chat & respond
          </div>
        )}
      </div>
    </div>
  );
}
