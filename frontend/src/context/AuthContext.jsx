import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

// Create the context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, _setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ helper that updates both state and localStorage
  const setUser = (newUser) => {
    _setUser(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        _setUser(JSON.parse(storedUser)); // restore from storage
      }
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  // ✅ Verify token and fetch latest user profile
  const checkAuth = async () => {
    try {
      const response = await axios.get("/api/auth/me");
      setUser(response.data);
    } catch (err) {
      console.error("checkAuth failed:", err.response?.data || err.message);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login
  const login = async (credentials) => {
    try {
      const response = await axios.post("/api/auth/login", credentials);
      const { token, user } = response.data;

      if (!token) throw new Error("No token returned from server");

      // Save token
      localStorage.setItem("token", token);
      setToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Save user (direct from backend preferred)
      if (user) {
        setUser(user);
      } else {
        const meRes = await axios.get("/api/auth/me");
        setUser(meRes.data);
      }

      setError(null);
      return user || (await axios.get("/api/auth/me")).data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  // ✅ Register
  const register = async (userData) => {
    try {
      const response = await axios.post("/api/auth/register", userData);
      const { token, user } = response.data;

      if (!token) throw new Error("No token returned from server");

      // Save token
      localStorage.setItem("token", token);
      setToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Save user
      if (user) {
        setUser(user);
      } else {
        const meRes = await axios.get("/api/auth/me");
        setUser(meRes.data);
      }

      setError(null);
      return user || (await axios.get("/api/auth/me")).data;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    _setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
