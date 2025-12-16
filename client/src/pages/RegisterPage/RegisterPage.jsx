import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// Adicionando 'User' (para Nome) e 'AtSign' (para @username)
import { Mail, Lock, User, AtSign } from "lucide-react";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";

// Regex para validar o FORMATO do @username (não a unicidade)
// Regra: 4-20 caracteres, apenas letras (a-z), números (0-9) e underscore (_)
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

function RegisterPage({ theme, setTheme, lang, setLang, t }) {
  // --- NOVOS ESTADOS ---
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estado para o helper de validação
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isUsernameTouched, setIsUsernameTouched] = useState(false); // Para não mostrar o erro antes do usuário digitar

  const navigate = useNavigate();

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

  // --- VALIDAÇÃO EM TEMPO REAL (Client-side) ---
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    if (!isUsernameTouched) {
      setIsUsernameTouched(true);
    }

    // Testa o formato
    setIsUsernameValid(USERNAME_REGEX.test(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Validação de formato (client-side)
    if (!USERNAME_REGEX.test(username)) {
      setIsUsernameValid(false);
      setIsUsernameTouched(true);
      alert(
        getT("alert.username_invalid_format", "Formato do @username inválido."),
      );
      return;
    }

    // 2. Validação de senha (client-side)
    if (password !== confirmPassword) {
      alert(getT("alert.password_mismatch", "As senhas não conferem!"));
      return;
    }

    // 3. Lógica de backend (POSTERGADA)
    // Aqui viria a chamada de API para:
    // - Verificar se email já existe
    // - Verificar se @username já existe
    // - Criar o usuário

    // Ação atual (placeholder):
    alert(
      `Cadastrando (placeholder):\nNome: ${nome} ${sobrenome}\n@: ${username}\nEmail: ${email}`,
    );
    navigate("/dashboard");
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
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {getT("register.title", "Criar sua conta")}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {getT(
                      "register.subtitle",
                      "Junte-se à comunidade Mazarbul.",
                    )}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* --- NOVOS CAMPOS: NOME E SOBRENOME --- */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Campo Nome */}
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                        <User className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        id="firstname"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        placeholder={getT("form.firstname", "Nome")}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    {/* Campo Sobrenome */}
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 opacity-0">
                        {" "}
                        {/* Icone 'fantasma' para alinhar */}
                        <User className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        id="lastname"
                        value={sobrenome}
                        onChange={(e) => setSobrenome(e.target.value)}
                        required
                        placeholder={getT("form.lastname", "Sobrenome")}
                        className="w-full pl-4 sm:pl-3 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Campo de Email */}
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

                  {/* --- CAMPO @USERNAME ATUALIZADO --- */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      {/* Icone de '@' */}
                      <AtSign className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={handleUsernameChange}
                      onBlur={() => setIsUsernameTouched(true)} // Marcar como 'tocado' ao sair
                      required
                      placeholder={getT("form.username", "Nome de usuário (@)")}
                      // Muda a cor da borda se for inválido E tocado
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        !isUsernameValid && isUsernameTouched
                          ? "border-red-500 dark:border-red-400"
                          : "border-neutral-300 dark:border-neutral-700"
                      }`}
                    />
                  </div>

                  {/* --- REGRAS DE VALIDAÇÃO (Visível) --- */}
                  {/* Aparece sempre, mas fica vermelho se inválido */}
                  <p
                    className={`text-xs px-1 ${
                      !isUsernameValid && isUsernameTouched
                        ? "text-red-600 dark:text-red-400"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {getT(
                      "form.username_rules",
                      "4-20 caracteres. Apenas letras, números e underscores (_).",
                    )}
                  </p>

                  {/* Campo de Senha */}
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
                      placeholder={getT("form.password", "Senha")}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Campo de Confirmar Senha */}
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
                        "form.confirm_password",
                        "Confirmar senha",
                      )}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                  >
                    {getT("register.button", "Criar conta")}
                  </button>
                </form>
              </div>

              {/* Link para Login */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-6 py-4">
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                  {getT("register.already_have_account", "Já tem uma conta?")}{" "}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400"
                  >
                    {getT("register.login_link", "Faça login")}
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

export default RegisterPage;
