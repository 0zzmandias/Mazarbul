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
} from "lucide-react";

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

// Cores Hexadecimais
const COLORS = {
  bronze: "#cd7f32",
  silver: "#9ca3af",
  gold: "#eab308",
  locked: "#525252",
};

const BadgeCard = ({ achievement, currentProgress = 0, onClick }) => {
  const IconComponent = ICON_MAP[achievement.iconName] || Star;
  const [bronzeTier, silverTier, goldTier] = achievement.tiers;

  // Estados de Conquista
  const hasBronze = currentProgress >= bronzeTier;
  const hasSilver = currentProgress >= silverTier;
  const hasGold = currentProgress >= goldTier;

  // --- LÓGICA DE CORES E PROGRESSO ---
  let percentage = 0;
  let strokeColor = COLORS.bronze;
  let iconColor = COLORS.locked;
  let iconBg = "bg-neutral-200 dark:bg-neutral-800";
  let isIconLocked = true;

  if (!hasBronze) {
    // 0 -> Buscando Bronze
    // "Ícone apagado e a barra ao redor do ícone cor de bronze"
    percentage = (currentProgress / bronzeTier) * 100;
    strokeColor = COLORS.bronze;
    iconColor = COLORS.locked;
    isIconLocked = true;
  } else if (!hasSilver) {
    // Bronze -> Buscando Prata
    // "Barra e ícone da cor da estrela de prata [ALVO]? Não.
    // Regra corrigida: Até Prata ser alcançada, barra e ícone devem ser da cor da estrela de prata."
    // *Interpretação:* Se eu tenho Bronze, eu estou "no nível Prata" ou "buscando Prata"?
    // O texto diz: "até a estrela de prata ser alcançada, a barra e o ícone sejam da cor da estrela de prata"
    // Isso significa que visualmente ele fica Prateado enquanto busca a prata? Ou ele fica Bronze e a barra Prata?
    // Pelo seu último parágrafo: "ícone prateado... e barra dourada sendo carregada" (quando tem prata).
    // Logo: Se tem Bronze -> Ícone BRONZE, Barra PRATA.

    percentage =
      ((currentProgress - bronzeTier) / (silverTier - bronzeTier)) * 100;
    strokeColor = COLORS.silver; // Barra Prata (Alvo)
    iconColor = COLORS.bronze; // Ícone Bronze (Conquistado)
    iconBg = "bg-orange-900/10 dark:bg-orange-900/20";
    isIconLocked = false;
  } else if (!hasGold) {
    // Prata -> Buscando Ouro
    // "Ícone prateado... barra dourada"
    percentage =
      ((currentProgress - silverTier) / (goldTier - silverTier)) * 100;
    strokeColor = COLORS.gold; // Barra Ouro (Alvo)
    iconColor = COLORS.silver; // Ícone Prata (Conquistado)
    iconBg = "bg-gray-400/10 dark:bg-gray-400/20";
    isIconLocked = false;
  } else {
    // Ouro
    percentage = 100;
    strokeColor = COLORS.gold;
    iconColor = COLORS.gold;
    iconBg = "bg-yellow-500/10 dark:bg-yellow-500/20";
    isIconLocked = false;
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      onClick={() => onClick(achievement)}
      className="flex flex-col items-center justify-center cursor-pointer group p-2 rounded-xl transition-transform hover:scale-105"
    >
      <div className="relative w-28 h-28 flex items-center justify-center mb-2">
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-neutral-200 dark:stroke-neutral-800"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Barra de Progresso sempre visível (pois a página é restrita ao dono) */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={strokeColor}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div
          className={`
          z-10 p-4 rounded-full transition-colors duration-300
          ${iconBg}
        `}
          style={{ color: !isIconLocked ? iconColor : undefined }}
        >
          <IconComponent
            size={32}
            strokeWidth={1.5}
            className={
              isIconLocked ? "text-neutral-400 dark:text-neutral-600" : ""
            }
          />
        </div>
      </div>

      <h3
        className={`
        text-sm font-bold text-center mb-1 leading-tight max-w-[120px]
        ${hasBronze ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-500"}
      `}
      >
        {achievement.title}
      </h3>

      <div className="flex items-end gap-1 mt-1 h-6">
        <Star
          size={14}
          fill={hasSilver ? COLORS.silver : "none"}
          color={hasSilver ? COLORS.silver : "#525252"}
          className="mb-0.5"
        />
        <Star
          size={18}
          fill={hasGold ? COLORS.gold : "none"}
          color={hasGold ? COLORS.gold : "#525252"}
          className="mb-2"
        />
        <Star
          size={14}
          fill={hasBronze ? COLORS.bronze : "none"}
          color={hasBronze ? COLORS.bronze : "#525252"}
          className="mb-0.5"
        />
      </div>
    </div>
  );
};

export default BadgeCard;
