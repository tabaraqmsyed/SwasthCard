import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("swasthcard_token") || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("swasthcard_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
      return null;
    }
  });

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("swasthcard_token");
    localStorage.removeItem("swasthcard_user");
  }, []);

  const login = useCallback((userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    if (tokenData) {
      localStorage.setItem("swasthcard_token", tokenData);
    }
    if (userData) {
      localStorage.setItem("swasthcard_user", JSON.stringify(userData));
    }
  }, []);

  // Verify and refresh user data when token is present
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verifySession() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("swasthcard_user", JSON.stringify(data.user));
          }
        } else if (response.status === 401 || response.status === 403) {
          if (isMounted) {
            logout();
          }
        }
      } catch (err) {
        console.warn("Could not verify session with server:", err);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
