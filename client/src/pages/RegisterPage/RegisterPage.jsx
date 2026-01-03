import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, AtSign, AlertCircle } from "lucide-react"; // Adicionei AlertCircle
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
import api from "../../services/api"; // Conexão com o Backend
import { useAuth } from "../../contexts/AuthContext"; // Para auto-login

// Regex para validar o FORMATO do @username
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

function RegisterPage({ theme, setTheme, lang, setLang, t }) {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de controle e validação
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isUsernameTouched, setIsUsernameTouched] = useState(false);

  // Novos estados para integração
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuth(); // Importamos a função de login

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

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    if (!isUsernameTouched) {
      setIsUsernameTouched(true);
    }
    setIsUsernameValid(USERNAME_REGEX.test(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpa erros anteriores

    // 1. Validação de formato (client-side)
    if (!USERNAME_REGEX.test(username)) {
      setIsUsernameValid(false);
      setIsUsernameTouched(true);
      // Aqui podemos definir o erro no estado visual em vez de alert
      setError(getT("alert.username_invalid_format", "Formato do @username inválido."));
      return;
    }

    // 2. Validação de senha (client-side)
    if (password !== confirmPassword) {
      setError(getT("alert.password_mismatch", "As senhas não conferem!"));
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Concatena Nome e Sobrenome para o padrão do Backend
      const fullName = `${nome.trim()} ${sobrenome.trim()}`;

      // 4. Chamada REAL ao Backend
      await api.post('/auth/register', {
        name: fullName,
        email: email,
        password: password,
        handle: username
      });

      // 5. Se chegou aqui, deu certo! Vamos fazer Login Automático.
      await signIn(email, password);

      // 6. Redireciona para o Dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Erro no cadastro:", err);
      // Pega a mensagem de erro do backend (ex: "Email já está em uso")
      const backendMessage = err.response?.data?.error || "Falha ao criar conta. Tente novamente.";
      setError(backendMessage);
      setIsSubmitting(false);
    }
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
    {getT("register.subtitle", "Junte-se à comunidade Mazarbul.")}
    </p>
    </div>

    {/* Exibição de Erro do Backend */}
    {error && (
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{error}</span>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
    {/* --- CAMPOS: NOME E SOBRENOME --- */}
    <div className="flex flex-col sm:flex-row gap-4">
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
    <div className="relative w-full">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 opacity-0">
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

    {/* --- CAMPO @USERNAME --- */}
    <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
    <AtSign className="w-5 h-5" />
    </span>
    <input
    type="text"
    id="username"
    value={username}
    onChange={handleUsernameChange}
    onBlur={() => setIsUsernameTouched(true)}
    required
    placeholder={getT("form.username", "Nome de usuário (@)")}
    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      !isUsernameValid && isUsernameTouched
      ? "border-red-500 dark:border-red-400"
      : "border-neutral-300 dark:border-neutral-700"
    }`}
    />
    </div>

    {/* REGRAS DE VALIDAÇÃO (Visível) */}
    <p
    className={`text-xs px-1 ${
      !isUsernameValid && isUsernameTouched
      ? "text-red-600 dark:text-red-400"
      : "text-neutral-500 dark:text-neutral-400"
    }`}
    >
    {getT(
      "form.username_rules",
      "4-20 caracteres. Apenas letras, números e underscores (_)."
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
    placeholder={getT("form.confirm_password", "Confirmar senha")}
    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
    />
    </div>

    <button
    type="submit"
    disabled={isSubmitting}
    className={`w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
    {isSubmitting ? "Cadastrando..." : getT("register.button", "Criar conta")}
    </button>
    </form>
    </div>

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
