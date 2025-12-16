import React, { createContext, useContext, useState, useMemo } from "react";
// Importamos os dados estáticos *originais*
import {
  staticUserDatabase,
  staticMediaDatabase,
  staticClubsDatabase,
} from "../hooks/useUserProfileData.js";

// --- Definição do Contexto ---
const UserDatabaseContext = createContext(null);

// --- O Provedor ---
export function UserDatabaseProvider({ children }) {
  const [db, setDb] = useState(staticUserDatabase);
  const mediaDatabase = staticMediaDatabase;

  // Estado para os Clubes
  const [clubsDb, setClubsDb] = useState(staticClubsDatabase);

  // --- Funções para Modificar a "Memória" ---

  const toggleFavorite = (userId, mediaData) => {
    if (!mediaData) return;

    setDb((prevDb) => {
      const userHandle = userId.replace("@", "");
      const currentUser = prevDb[userHandle];
      if (!currentUser) return prevDb;

      const currentFavorites = currentUser.favorites || [];
      const isFavorited = currentFavorites.some(
        (fav) => fav.id === mediaData.id,
      );

      let newFavorites;

      if (isFavorited) {
        newFavorites = currentFavorites.filter(
          (fav) => fav.id !== mediaData.id,
        );
      } else {
        const newFavoriteItem = {
          id: mediaData.id,
          type: mediaData.type,
          title: mediaData.title,
          year: mediaData.details?.Ano || mediaData.year,
          score: mediaData.communityAverage || mediaData.score,
          tags: mediaData.details?.Gênero || mediaData.tags,
        };
        newFavorites = [...currentFavorites, newFavoriteItem];
      }

      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          favorites: newFavorites,
        },
      };
    });
  };

  // --- LÓGICA DE LISTAS ---

  const createCollection = (userId, title, description) => {
    const userHandle = userId.replace("@", "");
    const newCollection = {
      id: `col_${Date.now()}`,
      title,
      description,
      items: [],
    };

    setDb((prevDb) => {
      const currentUser = prevDb[userHandle];
      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          collections: [...(currentUser.collections || []), newCollection],
        },
      };
    });
    return newCollection.id;
  };

  const updateCollectionDetails = (
    userId,
    collectionId,
    newTitle,
    newDescription,
  ) => {
    const userHandle = userId.replace("@", "");
    setDb((prevDb) => {
      const currentUser = prevDb[userHandle];
      const newCollections = currentUser.collections.map((col) =>
        col.id === collectionId
          ? { ...col, title: newTitle, description: newDescription }
          : col,
      );
      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          collections: newCollections,
        },
      };
    });
  };

  const addMediaToCollection = (userId, collectionId, mediaId) => {
    const userHandle = userId.replace("@", "");
    const itemData = mediaDatabase[mediaId];
    if (!itemData) return;

    const newCollectionItem = {
      id: itemData.id,
      type: itemData.type,
      title: itemData.title.PT || "Título Desconhecido",
    };

    setDb((prevDb) => {
      const currentUser = prevDb[userHandle];
      if (!currentUser) return prevDb;

      const newCollections = currentUser.collections.map((col) => {
        if (col.id === collectionId) {
          if (col.items.some((item) => item.id === mediaId)) return col;
          return { ...col, items: [...col.items, newCollectionItem] };
        }
        return col;
      });

      const isFavorited = currentUser.favorites.some(
        (fav) => fav.id === mediaId,
      );
      let newFavorites = currentUser.favorites;
      if (!isFavorited) {
        const newFavoriteItem = {
          id: itemData.id,
          type: itemData.type,
          title: itemData.title,
          year: itemData.details?.Ano,
          score: itemData.communityAverage,
          tags: itemData.details?.Gênero,
        };
        newFavorites = [...currentUser.favorites, newFavoriteItem];
      }

      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          collections: newCollections,
          favorites: newFavorites,
        },
      };
    });
  };

  const removeMediaFromCollection = (userId, collectionId, mediaId) => {
    const userHandle = userId.replace("@", "");
    setDb((prevDb) => {
      const currentUser = prevDb[userHandle];
      const newCollections = currentUser.collections.map((col) => {
        if (col.id === collectionId) {
          const newItems = col.items.filter((item) => item.id !== mediaId);
          return { ...col, items: newItems };
        }
        return col;
      });
      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          collections: newCollections,
        },
      };
    });
  };

  const deleteCollection = (userId, collectionId) => {
    const userHandle = userId.replace("@", "");
    setDb((prevDb) => {
      const currentUser = prevDb[userHandle];
      const newCollections = currentUser.collections.filter(
        (col) => col.id !== collectionId,
      );
      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          collections: newCollections,
        },
      };
    });
  };

  // --- LÓGICA DE PERFIL (NOVO) ---
  const updateUserProfile = (userId, updatedData) => {
    const userHandle = userId.replace("@", "");

    setDb((prevDb) => {
      const currentUser = prevDb[userHandle];
      if (!currentUser) return prevDb;

      return {
        ...prevDb,
        [userHandle]: {
          ...currentUser,
          profile: {
            ...currentUser.profile,
            ...updatedData, // Mescla os novos dados (nome, bio, avatar)
          },
        },
      };
    });
  };

  // --- LÓGICA DE CLUBES ---

  const createClub = (ownerHandle, clubData) => {
    const newClub = {
      id: `c_${Date.now()}`,
      ownerHandle: ownerHandle.replace("@", ""),
      membersCount: 1,
      ...clubData,
      activeWorks: [],
      topics: [],
      members: [
        {
          name: "Fundador",
          handle: ownerHandle,
          role: "owner",
          avatar: "F",
        },
      ],
    };

    setClubsDb((prevClubs) => [...prevClubs, newClub]);
    return newClub.id;
  };

  const updateClub = (clubId, updatedData) => {
    setClubsDb((prevClubs) =>
      prevClubs.map((club) =>
        club.id === clubId ? { ...club, ...updatedData } : club,
      ),
    );
  };

  const deleteClub = (clubId) => {
    setClubsDb((prevClubs) => prevClubs.filter((c) => c.id !== clubId));
  };

  const value = useMemo(
    () => ({
      db,
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
      updateUserProfile, // Exportando a nova função
    }),
    [db, clubsDb],
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
    throw new Error(
      "useUserDatabase deve ser usado dentro de um UserDatabaseProvider",
    );
  }
  return context;
}
