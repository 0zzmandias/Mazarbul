import React, { useState } from "react";
import { Link } from "react-router-dom";
// Importando 'Mail' para o campo e 'MailCheck' para o sucesso
import { Mail, MailCheck } from "lucide-react";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";

function ForgotPasswordPage({ theme, setTheme, lang, setLang, t }) {
  const [email, setEmail] = useState("");
  // Estado para controlar a exibição do formulário ou da mensagem de sucesso
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    // Lógica de backend (POSTERGADA)
    // Aqui chamaria a API para enviar o email

    // Ação atual (placeholder):
    alert(`(Simulação) Enviando link de recuperação para: ${email}`);

    // Muda para o estado de "Sucesso"
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <HeaderBar
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={getT}
      />

      <main className="pt-20">
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          {/* Usando o mesmo tamanho de card do Login */}
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Renderização Condicional:
                  Se 'isSubmitted' for true, mostra a mensagem de sucesso.
                  Senão, mostra o formulário.
                */}

                {!isSubmitted ? (
                  // --- ESTADO 1: FORMULÁRIO ---
                  <>
                    <div className="flex flex-col items-center text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                        {getT("forgot.title", "Recuperar Senha")}
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                        {getT(
                          "forgot.subtitle",
                          "Insira seu e-mail e enviaremos um link para criar uma nova senha.",
                        )}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                          placeholder={getT("form.email", "Email")}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                      >
                        {getT("forgot.button", "Enviar link de recuperação")}
                      </button>
                    </form>
                  </>
                ) : (
                  // --- ESTADO 2: SUCESSO ---
                  <div className="flex flex-col items-center text-center py-8">
                    <MailCheck className="w-12 h-12 text-green-500 mb-4" />
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {getT("forgot.success_title", "Link enviado!")}
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                      {getT(
                        "forgot.success_text",
                        "Verifique sua caixa de entrada (e pasta de spam) nos próximos minutos.",
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Link para Voltar ao Login (aparece nos dois estados) */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-6 py-4">
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400"
                  >
                    {getT(
                      "forgot.back_to_login",
                      "Lembrou a senha? Voltar para o Login",
                    )}
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

export default ForgotPasswordPage;
