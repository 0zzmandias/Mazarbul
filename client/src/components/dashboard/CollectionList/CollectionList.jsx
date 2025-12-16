import React from "react";
import { motion } from "framer-motion";
import { List } from "lucide-react";
import { Link } from "react-router-dom";
import { cx } from "../../../utils/formatters";
import ExpandButton from "../../ui/ExpandButton/ExpandButton.jsx";

const palette = {
  filme: "bg-indigo-500",
  livro: "bg-emerald-500",
  jogo: "bg-fuchsia-500",
  album: "bg-amber-500",
};

export default function CollectionList({ collections, t }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <List className="w-4 h-4" />
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
            {t("section.collections")}
          </h3>
        </div>
        <ExpandButton to="/dashboard/lists" ariaLabel={t("action.manage")} />
      </div>

      <div className="flex flex-col gap-3">
        {(collections || []).map((collection) => (
          // ALTERAÇÃO AQUI: Passando ?id=... na URL
          <Link
            to={`/dashboard/lists?id=${collection.id}`}
            key={collection.id}
            className="block w-full"
          >
            <motion.div
              whileHover={{ y: -2 }}
              className="w-full text-left p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {collection.title}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                {collection.description}
              </p>

              <div className="flex -space-x-1.5 mt-2">
                {(collection.items || []).slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    title={item.title}
                    className={cx(
                      "w-5 h-5 rounded-full ring-2 ring-white dark:ring-neutral-900",
                      palette[item.type] || "bg-neutral-400",
                    )}
                  />
                ))}
                {(collection.items || []).length > 5 && (
                  <div className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] text-neutral-600 dark:text-neutral-200">
                    +{(collection.items || []).length - 5}
                  </div>
                )}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
