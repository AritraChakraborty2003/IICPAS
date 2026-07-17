import axios from "axios";

// Attaches the logged-in admin's JWT (adminToken) to outgoing requests so
// backend routes protected by requireAuth (course/chapter/topic/blog
// edit & delete) accept them. Runs once; safe to import from multiple places.
let installed = false;

export function installAdminAuthInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  axios.interceptors.request.use((config) => {
    const token = window.localStorage.getItem("adminToken");
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
