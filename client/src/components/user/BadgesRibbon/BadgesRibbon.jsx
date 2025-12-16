import React from "react";
import {
  BookOpen,
  Music,
  Film,
  Gamepad2,
  Rocket,
  Skull,
  Sword,
  Sun,
  Swords,
  Heart,
  Shield,
  Search,
  Hourglass,
  Zap,
  EyeOff,
  Globe,
  Compass,
  Pickaxe,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Box,
  Infinity,
  Star,
  BadgeCheck,
} from "lucide-react";
import { cx } from "../../../utils/formatters";
import ExpandButton from "../../ui/ExpandButton/ExpandButton";
import { MASTER_ACHIEVEMENTS_LIST } from "../../../hooks/useUserProfileData";

const ICON_MAP = {
  "book-open": BookOpen,
  music: Music,
  film: Film,
  gamepad: Gamepad2,
  rocket: Rocket,
  skull: Skull,
  sword: Sword,
  sun: Sun,
  "sword-crossed": Swords,
  heart: Heart,
  shield: Shield,
  search: Search,
  hourglass: Hourglass,
  zap: Zap,
  "eye-off": EyeOff,
  globe: Globe,
  compass: Compass,
  pickaxe: Pickaxe,
  "thumbs-up": ThumbsUp,
  "thumbs-down": ThumbsDown,
  layers: Layers,
  box: Box,
  infinity: Infinity,
};

const COLORS = {
  bronze: "#cd7f32",
  silver: "#9ca3af",
  gold: "#eab308",
  locked: "#525252",
};

const getBadgeColor = (progress, tiers) => {
  if (!tiers) return COLORS.locked;
  const [bronze, silver, gold] = tiers;
  if (progress >= gold) return COLORS.gold;
  if (progress >= silver) return COLORS.silver;
  if (progress >= bronze) return COLORS.bronze;
  return COLORS.locked;
};

function BadgesRibbon({ badges, t, handle, isOwner }) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const displayBadges = badges
    .map((userBadge) => {
      const definition = MASTER_ACHIEVEMENTS_LIST.find(
        (item) => item.id === userBadge.id,
      );
      if (!definition) return null;
      return {
        ...userBadge,
        ...definition,
      };
    })
    .filter(Boolean);

  if (displayBadges.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <BadgeCheck className="w-4 h-4" />
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
            {t("section.achievements")}
          </h3>
        </div>

        {isOwner && handle && (
          <ExpandButton
            to={`/profile/${handle}/achievements`}
            ariaLabel={t("action.see_all")}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 select-none">
        {displayBadges.map((badge) => {
          const IconComponent = ICON_MAP[badge.iconName] || Star;
          const badgeColor = getBadgeColor(badge.progress, badge.tiers);

          // Formata o ID para Título (ex: "the-one" -> "The One")
          const badgeTitle = badge.id
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          return (
            <div
              key={badge.id}
              className="relative group flex flex-col items-center"
            >
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 transition-colors"
                style={{ borderColor: badgeColor, color: badgeColor }}
              >
                <IconComponent size={20} strokeWidth={2} />
              </div>

              {/* Tooltip atualizado: Título em negrito + Descrição */}
              <div className="absolute top-full mt-2 px-3 py-2 rounded bg-neutral-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg border border-neutral-700">
                <span className="font-bold text-neutral-200">
                  {badgeTitle}:
                </span>{" "}
                {t(`achievement.desc.${badge.id}`) || badge.id}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BadgesRibbon;
