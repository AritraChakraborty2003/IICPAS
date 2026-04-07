"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthHeartbeat } from "../lib/useAuthHeartbeat";
import { getApiBase } from "../lib/apiBase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});

  const API_BASE = getApiBase();

  const getHeartbeatHeaders = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  const isPrivilegedAdmin = useCallback(
    (currentUser) =>
      currentUser?.role === "Admin" || currentUser?.role === "superadmin",
    []
  );

  useAuthHeartbeat({
    enabled: !!user,
    heartbeatUrl: `${API_BASE}/auth/heartbeat`,
    getHeaders: getHeartbeatHeaders,
  });

  // Check if user has permission for specific module and action
  const hasPermission = (module, action) => {
    if (!user) return false;
    // Admin and superadmin users have all permissions
    if (isPrivilegedAdmin(user)) return true;
    if (!user.permissions) return false;
    return user.permissions[module]?.[action] || false;
  };

  // Check if user can access a module (has read permission)
  const canAccess = (module) => {
    if (!user) return false;
    // Admin and superadmin users can access all modules
    if (isPrivilegedAdmin(user)) return true;
    return hasPermission(module, "read");
  };

  // Get all accessible modules
  const getAccessibleModules = () => {
    if (!user || !user.permissions) return [];
    return Object.keys(user.permissions).filter(
      (module) => user.permissions[module]?.read
    );
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/employees/login`, {
        email,
        password,
      });

      const userData = response.data;
      setUser(userData);
      setPermissions(userData.permissions);

      // Store token in localStorage
      localStorage.setItem("adminToken", userData.token);
      localStorage.setItem("adminUser", JSON.stringify(userData));

      // Route both admin and team users into the same admin dashboard shell.
      // Module visibility is controlled by permissions from Staff Management.
      const redirectUrl = "/admin-dashboard";

      return { success: true, redirectUrl };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if needed
      await axios.post(
        `${API_BASE}/employees/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state
      setUser(null);
      setPermissions({});
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      const userData = localStorage.getItem("adminUser");

      if (token && userData) {
        try {
          // Verify token with backend
          const response = await axios.get(`${API_BASE}/employees/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const user = response.data;
          setUser(user);
          setPermissions(user.permissions);
        } catch (error) {
          console.error("Auth check error:", error);
          // Token is invalid, clear storage
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Function to refresh user data
  const refreshUser = async () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const response = await axios.get(`${API_BASE}/employees/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data;
        setUser(user);
        setPermissions(user.permissions);
        localStorage.setItem("adminUser", JSON.stringify(user));
      } catch (error) {
        console.error("Refresh user error:", error);
      }
    }
  };

  const value = {
    user,
    loading,
    permissions,
    login,
    logout,
    refreshUser,
    hasPermission,
    canAccess,
    getAccessibleModules,
    isPrivilegedAdmin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
