import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/main.css"; // Importando os estilos globais

// 1. Importar o novo Provedor de Contexto
import { UserDatabaseProvider } from "./contexts/UserDatabaseContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. "Abraçar" a aplicação com o Provedor */}
    <UserDatabaseProvider>
      <App />
    </UserDatabaseProvider>
  </React.StrictMode>,
);
