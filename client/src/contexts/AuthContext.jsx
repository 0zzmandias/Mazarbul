import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar dados salvos
    const storedUser = localStorage.getItem('@Mazarbul:user');
    const storedToken = localStorage.getItem('@Mazarbul:token');

    if (storedUser && storedToken) {
      // BLINDAGEM: Verifica se não salvou "undefined" como texto por engano
      if (storedUser !== "undefined" && storedUser !== "null") {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error("Storage corrompido, limpando...", error);
          // Se o dado estiver podre, limpamos tudo para não travar o app
          localStorage.removeItem('@Mazarbul:user');
          localStorage.removeItem('@Mazarbul:token');
        }
      } else {
        // Se for "undefined" texto, limpa também
        localStorage.removeItem('@Mazarbul:user');
        localStorage.removeItem('@Mazarbul:token');
      }
    }

    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data;

      // Verificação extra antes de salvar
      if (user && token) {
        localStorage.setItem('@Mazarbul:token', token);
        localStorage.setItem('@Mazarbul:user', JSON.stringify(user));

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        return { success: true };
      } else {
        return { success: false, message: "Resposta inválida do servidor." };
      }

    } catch (error) {
      console.error("Erro no login:", error);
      return {
        success: false,
        message: error.response?.data?.error || "Erro ao conectar com servidor."
      };
    }
  };

  const signOut = () => {
    localStorage.removeItem('@Mazarbul:token');
    localStorage.removeItem('@Mazarbul:user');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const value = { currentUser, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
