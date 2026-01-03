import React from 'react';
import { Link } from 'react-router-dom'; // Assumindo uso de React Router

// Dicionário local para fallback das tags (idealmente viria de um hook useI18n, mas vamos manter funcional aqui)
const TAG_LABELS = {
    'tag.action': 'Ação',
    'tag.science-fiction': 'Ficção Científica',
    'tag.adventure': 'Aventura',
    'tag.drama': 'Drama',
    'tag.comedy': 'Comédia'
};

/**
 * MediaCard
 * Componente responsável por exibir o card de um filme/série.
 * Recebe o objeto completo do backend (ex: tmdb_603) via prop 'data'.
 */
const MediaCard = ({ data, lang = 'PT' }) => {
    // Proteção contra dados nulos
    if (!data) return null;

    // 1. Resolução de Idioma (I18n)
    // Tenta pegar o idioma pedido (PT), senão vai para EN, senão avisa que está indisponível.
    const title = data.titles?.[lang] || data.titles?.['EN'] || 'Título Indisponível';
    const synopsis = data.synopses?.[lang] || data.synopses?.['EN'] || 'Sinopse indisponível.';

    // 2. Extração de Metadados
    const year = data.releaseYear || 'N/A';
    const poster = data.posterUrl || 'https://via.placeholder.com/500x750?text=No+Poster';

    return (
        <div className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full">

        {/* --- PÔSTER --- */}
        <div className="relative w-full aspect-[2/3] overflow-hidden">
        <img
        src={poster}
        alt={title}
        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        />

        {/* Badge de Ano (Canto superior) */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
        {year}
        </div>

        {/* Overlay no Hover (opcional, para dar feedback visual) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="p-4 flex flex-col flex-grow">
        {/* Título */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2 line-clamp-1" title={title}>
        {title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
        {data.tags && data.tags.slice(0, 3).map((tag) => (
            <span
            key={tag}
            className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
            >
            {TAG_LABELS[tag] || tag.replace('tag.', '')}
            </span>
        ))}
        </div>

        {/* Sinopse (Truncada) */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-grow">
        {synopsis}
        </p>

        {/* Botão de Ação */}
        {/* Usamos o ID composto (tmdb_603) para criar o link de navegação */}
        <Link
        to={`/media/${data.id}`}
        className="mt-auto w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
        >
        Ver Detalhes
        </Link>
        </div>
        </div>
    );
};

export default MediaCard;
