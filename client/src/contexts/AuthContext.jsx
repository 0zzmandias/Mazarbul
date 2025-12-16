import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Mantemos tudo em minúsculo para evitar conflitos
  const [currentUser, setCurrentUser] = useState({
    handle: "alex",
    name: "Alex",
    email: "alex@mazarbul.com",
  });

  const value = { currentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
