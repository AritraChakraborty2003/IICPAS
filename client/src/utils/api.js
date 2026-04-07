// API utility functions for authenticated requests
import { getApiBase } from "@/lib/apiBase";

const API_BASE = getApiBase();

// Get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("adminToken");
};

// Create authenticated fetch request
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  return fetch(url, config);
};

// GET request
export const authenticatedGet = async (endpoint) => {
  return authenticatedFetch(`${API_BASE}${endpoint}`, {
    method: "GET",
  });
};

// POST request
export const authenticatedPost = async (endpoint, data, isFormData = false) => {
  const config = {
    method: "POST",
  };
  
  if (isFormData) {
    config.body = data;
    // Don't set Content-Type for FormData, let browser set it with boundary
    config.headers = {
      "Authorization": `Bearer ${getAuthToken()}`,
    };
  } else {
    config.body = JSON.stringify(data);
    config.headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`,
    };
  }
  
  return fetch(`${API_BASE}${endpoint}`, config);
};

// PUT request
export const authenticatedPut = async (endpoint, data, isFormData = false) => {
  const config = {
    method: "PUT",
  };
  
  if (isFormData) {
    config.body = data;
    // Don't set Content-Type for FormData, let browser set it with boundary
    config.headers = {
      "Authorization": `Bearer ${getAuthToken()}`,
    };
  } else {
    config.body = JSON.stringify(data);
    config.headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`,
    };
  }
  
  return fetch(`${API_BASE}${endpoint}`, config);
};

// DELETE request
export const authenticatedDelete = async (endpoint) => {
  return authenticatedFetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
  });
};
