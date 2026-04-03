"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Marquee from "react-fast-marquee";

const getApiBase = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api";

  const trimmed = configuredBase.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const extractAlerts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.alerts)) return payload.alerts;
  if (Array.isArray(payload?.data?.alerts)) return payload.data.alerts;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const AlertMarquee = ({ showMarquee = true }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const API_BASE = getApiBase();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        console.log("Fetching alerts from:", `${API_BASE}/alerts`);
        const response = await axios.get(`${API_BASE}/alerts`);
        const alertList = extractAlerts(response.data);

        // Filter only active alerts
        const activeAlerts = alertList.filter(
          (alert) => alert.status === "active"
        );

        console.log("Active alerts found:", activeAlerts.length);
        setAlerts(activeAlerts);
        setError(false);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setError(true);

        // Fallback: Use sample alerts if API fails
        const fallbackAlerts = [
          {
            _id: "fallback-1",
            title: "Welcome",
            message:
              "Welcome to IICPA Institute - Your gateway to professional excellence!",
            status: "active",
          },
          {
            _id: "fallback-2",
            title: "New Courses",
            message:
              "Check out our latest courses in Accounting, Finance, and HR!",
            status: "active",
          },
        ];
        setAlerts(fallbackAlerts);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [API_BASE]);

  // Don't show marquee if showMarquee is explicitly false
  if (showMarquee === false) {
    return null;
  }

  // Show loading state briefly, then show content
  if (loading) {
    return (
      <div className="bg-green-600 text-white font-bold border-b border-yellow-200 fixed top-0 left-0 w-full z-50 h-10 flex items-center justify-center">
        <span className="text-white font-medium text-xs">
          Loading announcements...
        </span>
      </div>
    );
  }

  // Always show marquee with content (either from API or fallback)
  return (
    <div
      className="bg-green-600 text-white font-bold border-b border-green-500 fixed top-0 left-0 w-full z-50"
      style={{ "--marquee-height": "40px" }}
    >
      <Marquee speed={80} gradient={false} className="py-2 overflow-hidden">
        {alerts.map((alert, index) => (
          <div key={alert._id} className="inline-block mx-8">
            <span className="text-white font-medium text-xs">
              📢 {alert.title}: {alert.message}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
};

export default AlertMarquee;
