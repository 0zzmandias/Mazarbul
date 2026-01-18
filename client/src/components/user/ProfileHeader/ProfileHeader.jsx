import React from "react";
import { User } from "lucide-react"; // Importação do ícone para o fallback

function ProfileHeader({ profile, tags, t }) {
  if (!profile) {
    return null;
  }

  return (
    <section className="flex flex-row items-start gap-6 md:gap-8">
    {/* Coluna da Esquerda: Informações do Usuário */}
    <div className="flex-1 min-w-0">
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
    {profile.name}
    </h1>
    <div className="mt-1 text-neutral-500">{profile.handle}</div>
    <p className="mt-4 text-neutral-700 dark:text-neutral-300 max-w-2xl">
    {profile.bio}
    </p>

    {/* Contêiner das Tags */}
    <div className="mt-4 flex flex-row gap-2 flex-nowrap overflow-hidden">
    {tags &&
      tags.map((tagKey) => (
        <span
        key={tagKey}
        className="inline-flex items-center justify-center h-8 px-3 rounded-full border border-neutral-200 dark:border-neutral-700 text-sm leading-none bg-white/60 dark:bg-neutral-900/60 capitalize shrink-0"
        >
        {t(tagKey)}
        </span>
      ))}
      </div>
      </div>

      {/* Coluna da Direita (Avatar): Lógica de Fallback Implementada */}
      <div className="w-48 md:w-56 flex-shrink-0">
      {profile.avatarUrl ? (
        <img
        src={profile.avatarUrl}
        alt={`Avatar de ${profile.name}`}
        className="w-full h-auto rounded-2xl object-cover border border-neutral-200 dark:border-neutral-800 shadow-sm"
        />
      ) : (
        <div className="w-full aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <User className="w-16 h-16" />
        </div>
      )}
      </div>
      </section>
  );
}

export default ProfileHeader;
