// Authentication context - manages user login/logout state
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Create context for auth data
const AuthContext = createContext();

// Provider component that wraps the app and provides auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // Stores logged in user
  const [loading, setLoading] = useState(true); // Shows if we're checking auth

  useEffect(() => {
    // Check if user is already logged in when app loads
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Error getting session:", error);
      else setUser(data.session?.user || null);
      setLoading(false);
    };
    getSession();

    // Listen for login/logout events
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // Cleanup: stop listening when component unmounts
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = { user, loading };

  // Only show app after we've checked auth status
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook to use auth data in any component
export const useAuth = () => useContext(AuthContext);
