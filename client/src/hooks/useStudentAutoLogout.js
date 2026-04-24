"use client";

import { useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const AUTO_LOGOUT_TIME = 2 * 60 * 60 * 1000; // 2 hours in ms
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

export const useStudentAutoLogout = (studentId, API_BASE) => {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await axios.get(`${API_BASE}/api/v1/students/logout`, { withCredentials: true });
      localStorage.removeItem("student_last_activity");
      // Use window.location to force a full refresh/redirect and clear any state
      window.location.href = "/student-login";
    } catch (error) {
      console.error("Auto logout failed:", error);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (!studentId) return undefined;

    const checkTimeout = () => {
      const lastActivity = localStorage.getItem("student_last_activity");
      if (lastActivity) {
        const diff = Date.now() - parseInt(lastActivity, 10);
        if (diff >= AUTO_LOGOUT_TIME) {
          logout();
        }
      } else {
        localStorage.setItem("student_last_activity", Date.now().toString());
      }
    };

    const updateActivity = () => {
      localStorage.setItem("student_last_activity", Date.now().toString());
    };

    // Initial check
    checkTimeout();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    const interval = setInterval(checkTimeout, 30000); // Check every 30 seconds

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [studentId, logout]);
};
