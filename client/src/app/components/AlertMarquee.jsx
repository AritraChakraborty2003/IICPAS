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

const FALLBACK_ALERTS = [
  {
    _id: "fallback-1",
    title: "Welcome",
    message: "Welcome to IICPA Institute - Your gateway to professional excellence!",
    status: "active",
  },
  {
    _id: "fallback-2",
    title: "New Courses",
    message: "Check out our latest courses in Accounting, Finance, and HR!",
    status: "active",
  },
];

const AlertMarquee = ({ showMarquee = true }) => {
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS);

  const API_BASE = getApiBase();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get(`${API_BASE}/alerts`);
        const alertList = extractAlerts(response.data);
        const activeAlerts = alertList.filter(
          (alert) => alert.status === "active"
        );
        if (activeAlerts.length > 0) {
          setAlerts(activeAlerts);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
  }, [API_BASE]);

  if (showMarquee === false) {
    return null;
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
