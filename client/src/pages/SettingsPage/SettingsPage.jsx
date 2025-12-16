import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import HeaderBar from "../../components/layout/HeaderBar/HeaderBar.jsx";
// Ícones
import {
  User,
  Shield,
  SlidersHorizontal,
  AtSign,
  Camera,
  Mail,
  KeyRound,
  Bell,
  Trash2,
} from "lucide-react";

// IMPORTAÇÕES DE CONTEXTO (NOVO)
import { useUserDatabase } from "../../contexts/UserDatabaseContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

// --- COMPONENTE DE TOGGLE REUTILIZÁVEL ---
function ToggleSwitch({ enabled, setEnabled, "aria-label": ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        enabled ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700"
      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/**
 * SectionRow
 * Linha padrão para os blocos 2 e 3 de cada aba.
 */
function SectionRow({ title, description, right, titleId }) {
  return (
    <div className="py-5" aria-labelledby={titleId}>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-9">
          <h3 id={titleId} className="text-lg font-semibold">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {description}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-3 justify-self-start sm:justify-self-end self-center">
          {right}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function SettingsPage({ theme, setTheme, lang, setLang, t }) {
  const [activeSection, setActiveSection] = useState("profile");

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

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <HeaderBar
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={getT}
      />

      <main className="pt-28 max-w-5xl mx-auto px-4 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          {getT("settings.title", "Configurações")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
          {/* Coluna Esquerda: Menu */}
          <aside className="md:col-span-1">
            <nav className="flex flex-col space-y-1">
              <SettingsMenuButton
                label={getT("settings.nav.profile", "Perfil")}
                icon={<User className="w-5 h-5" />}
                isActive={activeSection === "profile"}
                onClick={() => setActiveSection("profile")}
              />
              <SettingsMenuButton
                label={getT("settings.nav.account", "Conta")}
                icon={<Shield className="w-5 h-5" />}
                isActive={activeSection === "account"}
                onClick={() => setActiveSection("account")}
              />
              <SettingsMenuButton
                label={getT("settings.nav.preferences", "Preferências")}
                icon={<SlidersHorizontal className="w-5 h-5" />}
                isActive={activeSection === "preferences"}
                onClick={() => setActiveSection("preferences")}
              />
            </nav>
          </aside>

          {/* Coluna Direita: Conteúdo */}
          <section className="md:col-span-3">
            {activeSection === "profile" && <ProfileSection getT={getT} />}
            {activeSection === "account" && <AccountSection getT={getT} />}
            {activeSection === "preferences" && (
              <PreferencesSection getT={getT} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Botão de Menu reutilizável ---
function SettingsMenuButton({ label, icon, isActive, onClick }) {
  const activeClasses =
    "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100";
  const inactiveClasses =
    "hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- Seção 1: Perfil (CONECTADA) ---
function ProfileSection({ getT }) {
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth(); // Dados Reais
  const { updateUserProfile } = useUserDatabase(); // Função Real

  // Estados iniciais vazios (preenchidos pelo useEffect)
  const [avatar, setAvatar] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [bio, setBio] = useState("");
  const [saveState, setSaveState] = useState("idle");

  // Carrega dados reais quando a página monta ou usuário muda
  useEffect(() => {
    if (currentUser) {
      setAvatar(
        currentUser.avatarUrl ||
          "https://placehold.co/128x128/E0E0E0/333333?text=A",
      );

      // Separa Nome e Sobrenome (supondo que no banco é "Alex Lima")
      const names = (currentUser.name || "").split(" ");
      setFirstname(names[0] || "");
      setLastname(names.slice(1).join(" ") || "");

      setBio(currentUser.bio || "");
    }
  }, [currentUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveState("saving");

    // Simula um pequeno delay para feedback visual, mas salva de verdade
    setTimeout(() => {
      updateUserProfile(currentUser.handle, {
        name: `${firstname} ${lastname}`.trim(),
        bio: bio,
        avatarUrl: avatar,
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    }, 600);
  };

  const getButtonText = (keyIdle, keySaving, keySaved) => {
    if (saveState === "saving") return getT(keySaving, "Salvando...");
    if (saveState === "saved") return getT(keySaved, "Salvo!");
    return getT(keyIdle, "Salvar");
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 sm:px-8 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">
          {getT("settings.profile.title", "Perfil Público")}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {getT(
            "settings.profile.subtitle",
            "Como você aparece para outros no Mazarbul.",
          )}
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSaveProfile}>
        <div className="p-6 sm:p-8 space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {getT("settings.profile.avatar", "Foto de Perfil")}
            </label>
            <div className="flex items-center gap-4 mt-1.5">
              <img
                src={avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/png, image/jpeg"
                onChange={handleAvatarChange}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Camera className="w-4 h-4" />
                  {getT("settings.profile.avatar.change", "Mudar foto")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAvatar(
                      "https://placehold.co/128x128/E0E0E0/333333?text=A",
                    )
                  }
                  className="text-sm font-medium text-red-600 dark:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  {getT("settings.profile.avatar.remove", "Remover")}
                </button>
              </div>
            </div>
          </div>

          {/* Nome e Sobrenome */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full">
              <label
                htmlFor="firstname"
                className="block text-sm font-medium mb-1.5"
              >
                {getT("settings.profile.firstname", "Nome")}
              </label>
              <input
                type="text"
                id="firstname"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="lastname"
                className="block text-sm font-medium mb-1.5"
              >
                {getT("settings.profile.lastname", "Sobrenome")}
              </label>
              <input
                type="text"
                id="lastname"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* @username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1.5"
            >
              {getT("settings.profile.username", "Nome de usuário (@)")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <AtSign className="w-5 h-5" />
              </span>
              <input
                type="text"
                id="username"
                value={currentUser?.handle || "@alexl"} // Valor real
                readOnly
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 cursor-not-allowed text-sm"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 px-1">
              {getT(
                "settings.profile.username.locked",
                "Nomes de usuário não podem ser alterados.",
              )}
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1.5">
              {getT("settings.profile.bio", "Sua Bio")}
            </label>
            <textarea
              id="bio"
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={getT(
                "settings.profile.bio.placeholder",
                "Escreva um pouco sobre você...",
              )}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 sm:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end">
          <button
            type="submit"
            disabled={saveState === "saving"}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
              saveState === "saved"
                ? "bg-green-600"
                : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:opacity-50`}
          >
            {getButtonText(
              "settings.profile.save_button",
              "settings.profile.save_button.saving",
              "settings.profile.save_button.saved",
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Seção 2: Conta (Mantida igual, mas conectável futuramente) ---
function AccountSection({ getT }) {
  const email = "alexl@exemplo.com";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordSave = (e) => {
    e.preventDefault();
    alert("Simulação: Senha alterada com sucesso!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = () => {
    alert("Simulação: Conta excluída.");
  };

  return (
    <div className="space-y-6">
      {/* Card de Email e Senha */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">
            {getT("settings.account.title", "Conta")}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {getT(
              "settings.account.subtitle",
              "Gerencie suas informações de login e segurança.",
            )}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="px-6 sm:px-8 py-0">
          {/* Email */}
          <SectionRow
            title={getT("settings.account.email", "Email")}
            description={
              <>
                {getT(
                  "settings.account.email.subtitle",
                  "Seu email de login é",
                )}{" "}
                <strong>{email}</strong>
              </>
            }
            titleId="account-email-title"
            right={
              <button
                type="button"
                onClick={() =>
                  alert("Fluxo de mudança de email (backend postergado)")
                }
                className="h-9 inline-flex items-center justify-center text-sm font-medium px-3.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {getT("settings.account.email.change_button", "Mudar Email")}
              </button>
            }
          />

          <div className="border-b border-neutral-200 dark:border-neutral-800 -mx-6 sm:-mx-8"></div>

          {/* Mudar Senha */}
          <div className="py-5">
            <h3 className="text-lg font-semibold">
              {getT("settings.account.password.subtitle", "Mudar Senha")}
            </h3>
            <form onSubmit={handlePasswordSave} className="space-y-4 mt-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium mb-1.5"
                >
                  {getT("settings.account.password.current", "Senha Atual")}
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full sm:max-w-md px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium mb-1.5"
                >
                  {getT("settings.account.password.new", "Nova Senha")}
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full sm:max-w-md px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-1.5"
                >
                  {getT(
                    "settings.account.password.confirm",
                    "Confirmar Nova Senha",
                  )}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full sm:max-w-md px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                >
                  {getT(
                    "settings.account.password.save_button",
                    "Salvar Nova Senha",
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Zona de Perigo */}
      <div className="rounded-2xl border border-red-500/50 dark:border-red-500/30 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-500">
            {getT("settings.account.danger_zone", "Zona de Perigo")}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {getT(
              "settings.account.delete.text",
              "Esta ação é permanente e irreversível.",
            )}
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="mt-4 inline-flex items-center gap-2 justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          >
            <Trash2 className="w-4 h-4" />
            {getT("settings.account.delete.button", "Excluir minha conta")}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Seção 3: Preferências (Mantida igual, sem botões extras) ---
function PreferencesSection({ getT }) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saveState, setSaveState] = useState("idle");

  const handleSavePrefs = (e) => {
    e.preventDefault();
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    }, 1500);
  };

  const getButtonText = (keyIdle, keySaving, keySaved) => {
    if (saveState === "saving") return getT(keySaving, "Salvando...");
    if (saveState === "saved") return getT(keySaved, "Salvo!");
    return getT(keyIdle, "Salvar");
  };

  return (
    <form
      onSubmit={handleSavePrefs}
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 sm:px-8 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">
          {getT("settings.preferences.title", "Preferências")}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {getT(
            "settings.preferences.subtitle",
            "Controle a privacidade do seu perfil e notificações.",
          )}
        </p>
      </div>

      {/* Conteúdo */}
      <div className="px-6 sm:px-8 py-0">
        <SectionRow
          title={getT("settings.preferences.privacy", "Privacidade")}
          description={getT(
            "settings.preferences.privacy.private_profile.desc",
            "Se ativado, seu perfil e atividades só serão visíveis para você.",
          )}
          titleId="preferences-privacy-title"
          right={
            <ToggleSwitch
              enabled={isPrivate}
              setEnabled={setIsPrivate}
              aria-label={getT(
                "settings.preferences.privacy.private_profile",
                "Perfil Privado",
              )}
            />
          }
        />

        <div className="border-b border-neutral-200 dark:border-neutral-800 -mx-6 sm:-mx-8"></div>

        <SectionRow
          title={getT("settings.preferences.notifications", "Notificações")}
          description={getT(
            "settings.preferences.notifications.email.desc",
            "Receber emails quando alguém seguir você ou comentar em suas reviews.",
          )}
          titleId="preferences-notifications-title"
          right={
            <ToggleSwitch
              enabled={emailNotifications}
              setEnabled={setEmailNotifications}
              aria-label={getT(
                "settings.preferences.notifications.email.title",
                "Notificações por Email",
              )}
            />
          }
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 sm:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex justify-end">
        <button
          type="submit"
          disabled={saveState === "saving"}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
            saveState === "saved"
              ? "bg-green-600"
              : "bg-blue-600 hover:bg-blue-700"
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:opacity-50`}
        >
          {getButtonText(
            "settings.preferences.save_button",
            "settings.profile.save_button.saving",
            "settings.profile.save_button.saved",
          )}
        </button>
      </div>
    </form>
  );
}

export default SettingsPage;
