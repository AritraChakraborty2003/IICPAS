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

// CSS for shining wave effect
const waveStyles = `
  @keyframes wave {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .wave-effect {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200% 100%;
    animation: wave 12s ease-in-out 2;
    animation-delay: 3s;
  }
  
  .thin-navbar {
    position: sticky;
    top: 0;
    left: 0;
    width: 100vw;
    z-index: 50;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    overflow: hidden;
  }
`;

const ThinNavbar = ({ showNavbar = true }) => {
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
            title: "Summer Sale",
            message: "Summer Sale",
            status: "active",
          },
          {
            _id: "fallback-2",
            title: "50% Discount on Courses",
            message: "50% Discount on Courses",
            status: "active",
          },
          {
            _id: "fallback-3",
            title: "Best CA School",
            message: "Best CA School",
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

  // Don't show navbar if showNavbar is explicitly false
  if (showNavbar === false) {
    return null;
  }

  // Show loading state briefly, then show content
  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: waveStyles }} />
        <div className="thin-navbar bg-green-600 text-white font-bold h-10 flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            Loading announcements...
          </span>
        </div>
      </>
    );
  }

  // Always show navbar with content (either from API or fallback)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: waveStyles }} />
      <div
        className="thin-navbar bg-green-600 text-white font-bold"
        style={{ height: "40px" }}
      >
        {/* Shining wave overlay */}
        <div className="wave-effect absolute inset-0 pointer-events-none"></div>

        <Marquee
          speed={80}
          gradient={false}
          className="py-2 overflow-hidden h-full"
        >
          {alerts.map((alert, index) => (
            <div key={alert._id} className="inline-block mx-8">
              <span className="text-white font-medium text-sm">
                📢 {alert.title}: {alert.message}
              </span>
            </div>
          ))}
        </Marquee>
      </div>
    </>
  );
};

export default ThinNavbar;
