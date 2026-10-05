import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = async (session) => {
    try {
      // The session user only contains basic auth info. Fetch profile and role from backend API
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      setRole(response.data.user.role);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to user metadata if backend is unreachable
      setUser(session.user);
      setRole(session.user?.user_metadata?.role || "framer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial session
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await handleSession(session);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await handleSession(session);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    role,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
