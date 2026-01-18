import React, { createContext, useContext, useState, useMemo } from "react";
import api, { favoriteService, collectionService } from "../services/api";
// Importamos apenas o que resta de estático (Mídias e Clubes)
import {
  staticMediaDatabase,
  staticClubsDatabase,
} from "../hooks/useUserProfileData.js";

const UserDatabaseContext = createContext(null);

export function UserDatabaseProvider({ children }) {
  // db agora é apenas um estado para compatibilidade,
  // já que o hook useUserProfileData gerencia sua própria busca na API
  const [db, setDb] = useState({});
  const mediaDatabase = staticMediaDatabase;

  // Clubes permanecem em memória até a migração para o Backend
  const [clubsDb, setClubsDb] = useState(staticClubsDatabase);

  // --- FUNÇÕES CONECTADAS AO BACKEND (POSTGRESQL) ---

  /**
   * Alterna favorito no banco via API.
   * Não manipula memória: o componente local (MediaDetails) cuida do toggle visual.
   */
  const toggleFavorite = async (mediaId) => {
    try {
      await favoriteService.toggle(mediaId);
    } catch (error) {
      console.error("[CONTEXT] Erro ao alternar favorito:", error);
      throw error;
    }
  };

  /**
   * Cria coleção no banco via API.
   */
  const createCollection = async (title, description, isPublic = true) => {
    try {
      const response = await collectionService.create({
        name: title,
        description,
        isPublic
      });
      return response.data.id;
    } catch (error) {
      console.error("[CONTEXT] Erro ao criar coleção:", error);
      throw error;
    }
  };

  /**
   * Adiciona mídia à coleção no banco via API.
   */
  const addMediaToCollection = async (collectionId, mediaId) => {
    try {
      await collectionService.addItem(collectionId, mediaId);
    } catch (error) {
      console.error("[CONTEXT] Erro ao adicionar item:", error);
      throw error;
    }
  };

  /**
   * Remove mídia da coleção no banco via API.
   */
  const removeMediaFromCollection = async (collectionId, mediaId) => {
    try {
      await collectionService.removeItem(collectionId, mediaId);
    } catch (error) {
      console.error("[CONTEXT] Erro ao remover item:", error);
      throw error;
    }
  };

  /**
   * Atualiza perfil no banco via API.
   */
  const updateUserProfile = async (updatedData) => {
    try {
      const response = await api.put('/users/profile', updatedData);
      return response.data;
    } catch (error) {
      console.error("[CONTEXT] Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  // --- FUNÇÕES EM MEMÓRIA (CLUBES - AINDA NÃO NO BACKEND) ---

  const createClub = (ownerHandle, clubData) => {
    const newClub = {
      id: `c_${Date.now()}`,
      ownerHandle: ownerHandle.replace("@", ""),
      membersCount: 1,
      ...clubData,
      activeWorks: [],
      topics: [],
      members: [{ name: "Fundador", handle: ownerHandle, role: "owner", avatar: "F" }],
    };
    setClubsDb((prevClubs) => [...prevClubs, newClub]);
    return newClub.id;
  };

  const updateClub = (clubId, updatedData) => {
    setClubsDb((prevClubs) =>
    prevClubs.map((club) => club.id === clubId ? { ...club, ...updatedData } : club)
    );
  };

  const deleteClub = (clubId) => {
    setClubsDb((prevClubs) => prevClubs.filter((c) => c.id !== clubId));
  };

  // Lógica de "Update/Delete" de Coleção movida para o limbo (aguardando rotas de PATCH/DELETE no backend)
  const updateCollectionDetails = () => console.warn("Rota de edição de coleção não implementada no Backend.");
  const deleteCollection = () => console.warn("Rota de exclusão de coleção não implementada no Backend.");

  const value = useMemo(
    () => ({
      db,
      setDb,
      mediaDatabase,
      clubsDb,
      toggleFavorite,
      createCollection,
      updateCollectionDetails,
      addMediaToCollection,
      removeMediaFromCollection,
      deleteCollection,
      createClub,
      updateClub,
      deleteClub,
      updateUserProfile,
    }),
    [db, clubsDb]
  );

  return (
    <UserDatabaseContext.Provider value={value}>
    {children}
    </UserDatabaseContext.Provider>
  );
}

export function useUserDatabase() {
  const context = useContext(UserDatabaseContext);
  if (!context) {
    throw new Error("useUserDatabase deve ser usado dentro de um UserDatabaseProvider");
  }
  return context;
}
