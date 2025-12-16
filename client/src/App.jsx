import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// IMPORTAÇÃO DO CONTEXTO
import { AuthProvider } from "./contexts/AuthContext.jsx";

// Importar as páginas
import HomePage from "./pages/HomePage/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";
import DashboardPage from "./pages/DashboardPage/DashboardPage.jsx";
import MediaDetailsPage from "./pages/MediaDetailsPage/MediaDetailsPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage/ForgotPasswordPage.jsx";
import SettingsPage from "./pages/SettingsPage/SettingsPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage/ResetPasswordPage.jsx";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage.jsx";
import ReviewsPage from "./pages/ReviewsPage/ReviewsPage.jsx";
import AchievementsPage from "./pages/AchievementsPage/AchievementsPage.jsx";
import ListManagementPage from "./pages/ListManagementPage/ListManagementPage.jsx";
import ClubsDiscoveryPage from "./pages/ClubsDiscoveryPage/ClubsDiscoveryPage.jsx";
import ClubDetailsPage from "./pages/ClubDetailsPage/ClubDetailsPage.jsx";
import ClubTopicPage from "./pages/ClubTopicPage/ClubTopicPage.jsx"; // NOVA IMPORTAÇÃO

// Importar os hooks
import { useTheme } from "./hooks/useTheme";
import { useI18n } from "./hooks/useI18n";

function App() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  const pageProps = { theme, setTheme, lang, setLang, t };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("lang", lang.toLowerCase());
  }, [lang]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} />} />
          <Route
            path="/profile/:handle"
            element={<ProfilePage {...pageProps} />}
          />
          <Route
            path="/profile/:handle/favorites"
            element={<FavoritesPage {...pageProps} />}
          />
          <Route
            path="/profile/:handle/reviews"
            element={<ReviewsPage {...pageProps} />}
          />
          <Route
            path="/profile/:handle/achievements"
            element={<AchievementsPage {...pageProps} />}
          />
          <Route path="/dashboard" element={<DashboardPage {...pageProps} />} />
          <Route
            path="/dashboard/lists"
            element={<ListManagementPage {...pageProps} />}
          />
          <Route
            path="/media/:mediaId"
            element={<MediaDetailsPage {...pageProps} />}
          />

          {/* ROTAS DE CLUBES */}
          <Route
            path="/clubs"
            element={<ClubsDiscoveryPage {...pageProps} />}
          />
          <Route
            path="/club/:clubId"
            element={<ClubDetailsPage {...pageProps} />}
          />

          {/* NOVA ROTA DE TÓPICO DE CLUBE */}
          <Route
            path="/club/:clubId/topic/:topicId"
            element={<ClubTopicPage {...pageProps} />}
          />

          <Route path="/login" element={<LoginPage {...pageProps} />} />
          <Route path="/register" element={<RegisterPage {...pageProps} />} />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage {...pageProps} />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage {...pageProps} />}
          />
          <Route path="/settings" element={<SettingsPage {...pageProps} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
