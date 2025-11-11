import { useState, useEffect, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const useSupabaseAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const socketManager = useContext(SocketContext);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state change:', event, session);
        
        if (session?.access_token) {
          // Set token in API headers
          api.defaults.headers.Authorization = `Bearer ${session.access_token}`;
          
          // Store tokens
          localStorage.setItem("supabase_token", session.access_token);
          localStorage.setItem("supabase_refresh_token", session.refresh_token);
          
          setUser(session.user);
          setIsAuth(true);
          
          // Connect socket with new token
          if (socketManager) {
            socketManager.disconnect();
            socketManager.connect();
          }
        } else {
          // Clear auth state
          api.defaults.headers.Authorization = undefined;
          localStorage.removeItem("supabase_token");
          localStorage.removeItem("supabase_refresh_token");
          
          setUser(null);
          setIsAuth(false);
          
          // Disconnect socket
          if (socketManager) {
            socketManager.disconnect();
          }
        }
        setLoading(false);
      }
    );

    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.access_token && !error) {
        // Session exists, set auth state
        api.defaults.headers.Authorization = `Bearer ${session.access_token}`;
        localStorage.setItem("supabase_token", session.access_token);
        localStorage.setItem("supabase_refresh_token", session.refresh_token);
        setUser(session.user);
        setIsAuth(true);
      }
      setLoading(false);
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [socketManager]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuth) return;

    const refreshToken = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("Token refresh failed:", error);
          handleLogout();
        } else if (session?.access_token) {
          api.defaults.headers.Authorization = `Bearer ${session.access_token}`;
          localStorage.setItem("supabase_token", session.access_token);
          localStorage.setItem("supabase_refresh_token", session.refresh_token);
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        handleLogout();
      }
    };

    // Refresh token every 50 minutes (tokens expire in 1 hour)
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuth]);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast.success("Login realizado com sucesso!");
      history.push("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem("supabase_token");
      localStorage.removeItem("supabase_refresh_token");
      
      // Clear API headers
      api.defaults.headers.Authorization = undefined;
      
      // Disconnect socket
      if (socketManager) {
        socketManager.disconnect();
      }
      
      history.push("/login");
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Erro ao fazer logout");
    } finally {
      setLoading(false);
    }
  };

  const updateUserMetadata = async (metadata) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) {
        throw error;
      }

      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Update user metadata error:", error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      toast.success("Email de redefinição de senha enviado!");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Erro ao enviar email de redefinição");
      throw error;
    }
  };

  return {
    user,
    isAuth,
    loading,
    handleLogin,
    handleLogout,
    updateUserMetadata,
    resetPassword,
    supabase
  };
};

export default useSupabaseAuth;