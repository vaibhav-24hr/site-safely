import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Add a request interceptor to attach Supabase JWT token
api.interceptors.request.use(
  (config) => {
    let projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId && import.meta.env.VITE_SUPABASE_URL) {
      try {
        projectId = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(
          ".",
        )[0];
      } catch {}
    }

    let sessionStr = projectId
      ? localStorage.getItem(`sb-${projectId}-auth-token`)
      : null;
    if (!sessionStr) {
      const sbKey = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      if (sbKey) {
        sessionStr = localStorage.getItem(sbKey);
      }
    }

    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (e) {
        console.error("Error parsing session token", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
