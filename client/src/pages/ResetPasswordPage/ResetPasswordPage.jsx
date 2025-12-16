import React, { useState } from "react";
// useNavigate para redirecionar após o sucesso, Link para o botão de sucesso
import { useNavigate, Link } from "react-router-dom";
// Ícones
import { Lock, CheckCircle } from "lucide-react";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";

// Página de Resetar Senha (acessada pelo link do email)
function ResetPasswordPage({ theme, setTheme, lang, setLang, t }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Estado para controlar a exibição do formulário ou da mensagem de sucesso
  const [isSubmitted, setIsSubmitted] = useState(false);

  const navigate = useNavigate();

  // Função 'safeT' (get translation)
  const getT = (key, fallback) => {
    if (typeof t === "function") {
      const translated = t(key);
      if (translated === key && fallback) {
        return fallback;
      }
      return translated;
    }
    return fallback || key;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Validação de senha (client-side)
    if (newPassword !== confirmPassword) {
      alert(getT("alert.password_mismatch", "As senhas não conferem!"));
      return;
    }

    // 2. Lógica de backend (POSTERGADA)
    // Aqui chamaria a API (POST /api/reset-password) com:
    // - o 'token' (que viria da URL, ex: /reset-password?token=...)
    // - a 'newPassword'

    // Ação atual (placeholder):
    alert(`(Simulação) Senha redefinida com sucesso para: ${newPassword}`);

    // 3. Muda para o estado de "Sucesso"
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Esta página não tem o HeaderBar, pois é uma página isolada
          acessada por um link externo (email). Isso é uma prática
          comum para evitar distrações. Se preferir, podemos adicioná-lo.
          Vamos testar sem ele primeiro.
      */}
      {/* <HeaderBar
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={getT}
      />
      */}

      {/* Centraliza o card na tela */}
      <main className="pt-20">
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-sm">
            {/* Logo acima do card */}
            <div className="flex justify-center mb-4">
              <Link to="/" className="font-semibold text-lg">
                Mazarbul
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                {!isSubmitted ? (
                  // --- ESTADO 1: FORMULÁRIO ---
                  <>
                    <div className="flex flex-col items-center text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                        {getT("reset.title", "Crie sua nova senha")}
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                        {getT(
                          "reset.subtitle",
                          "Quase lá! Insira sua nova senha abaixo.",
                        )}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Nova Senha */}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                          <Lock className="w-5 h-5" />
                        </span>
                        <input
                          type="password"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder={getT(
                            "settings.account.password.new",
                            "Nova Senha",
                          )}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Confirmar Nova Senha */}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                          <Lock className="w-5 h-5" />
                        </span>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder={getT(
                            "settings.account.password.confirm",
                            "Confirmar Nova Senha",
                          )}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                      >
                        {getT("reset.button", "Salvar Nova Senha")}
                      </button>
                    </form>
                  </>
                ) : (
                  // --- ESTADO 2: SUCESSO ---
                  <div className="flex flex-col items-center text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {getT("reset.success.title", "Senha Redefinida!")}
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                      {getT(
                        "reset.success.subtitle",
                        "Sua senha foi alterada com sucesso.",
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                    >
                      {getT("reset.success.button", "Ir para o Login")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
