import { createContext, useCallback, useContext, useState } from 'react';

const tokenKey = 'token';

type AuthContextType = {
  token: string | null;
  login: (t: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));

  const login = useCallback((t: string) => {
    localStorage.setItem(tokenKey, t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
