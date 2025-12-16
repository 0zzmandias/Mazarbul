import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
// Caminho que funcionou:
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";

// CORREÇÃO 1: Estamos recebendo as props do App.jsx novamente
function LoginPage({ theme, setTheme, lang, setLang, t }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // CORREÇÃO 2: Criamos o 'safeT' para lidar com 't' indefinido
  // (caso o i18n não tenha carregado no App.jsx ainda)
  const safeT = (key, fallback) => {
    if (typeof t === "function") {
      const translated = t(key);
      // Se a tradução for a própria chave E um fallback foi fornecido,
      // use o fallback.
      if (translated === key && fallback) {
        return fallback;
      }
      return translated;
    }
    return fallback || key;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Login com: ${email} e ${password}`);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/*
       * CORREÇÃO 3: Passamos as props (globais) recebidas do App.jsx
       * E o mais importante: passamos 'safeT' para o HeaderBar.
       */}
      <HeaderBar
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={safeT}
      />

      <main className="pt-20">
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {safeT("login.title", "Login")}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {safeT("login.subtitle", "Acesse sua conta Mazarbul.")}
                  </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campo Email */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={safeT("form.email", "Email")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Campo Senha */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={safeT("form.password", "Senha")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Esqueci a senha */}
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400"
                    >
                      {safeT("login.forgot_password", "Esqueceu a senha?")}
                    </Link>
                  </div>

                  {/* Botão Entrar */}
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                  >
                    {safeT("login.button", "Entrar")}
                  </button>
                </form>
              </div>

              {/* Link para Cadastro */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-6 py-4">
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                  {safeT("login.no_account", "Ainda não tem uma conta?")}{" "}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400"
                  >
                    {safeT("login.register_link", "Cadastre-se")}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
