import React from "react";

/**
 * TECHNICAL DETAILS COMPONENT
 * Exibe a "Ficha Técnica" da mídia.
 * REGRAS DO PLANO:
 * - País: Exibe o valor traduzido vindo do objeto trilingue do backend.
 * - Duração: Campo removido conforme solicitação.
 * - Gêneros: Exibe os gêneros limpos e reduzidos.
 */
export default function TechnicalDetails({ details, type, t, lang }) {
  if (!details) {
    return null;
  }

  // Normaliza o código do idioma para bater com as chaves do banco (PT, EN, ES)
  const safeLang = (lang || "PT").split("-")[0].toUpperCase();

  // Labels específicas para música
  const albumArtistLabel =
  safeLang === "EN" ? "Artist" : safeLang === "ES" ? "Artista" : "Artista";

  const albumTracksLabel =
  safeLang === "EN" ? "Tracks" : safeLang === "ES" ? "Pistas" : "Faixas";

  /**
   * Helper: Busca o primeiro valor existente dentre as chaves fornecidas.
   * Útil para manter compatibilidade entre nomes de chaves do banco e stubs.
   */
  const getValue = (keys) => {
    for (const k of keys) {
      if (k == null) continue;
      if (details[k] != null) return details[k];
    }
    return null;
  };

  /**
   * Renderiza uma linha da ficha técnica (Label: Valor)
   */
  const renderDetailItem = (labelKey, value) => {
    // Se o valor não existir, não renderiza a linha
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    let displayValue = value;

    // Lida com arrays (Gêneros, Tags)
    if (Array.isArray(value)) {
      displayValue = value
      .map((item) => {
        // Se for uma string de tradução (tag.xyz), usa a função t()
        if (typeof item === "string" && item.includes("tag.")) return t(item);
        return item;
      })
      .filter(Boolean)
      .join(", ");
    }
    // Lida com objetos localizados (Países: { PT: "Brasil", EN: "Brazil" })
    else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      displayValue = value[safeLang] || value["DEFAULT"] || value["EN"] || value["PT"] || "";
    }

    // Se após o processamento o valor estiver vazio, não renderiza
    if (!displayValue) return null;

    return (
      <div
      key={labelKey}
      className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-3"
      >
      <dt className="text-sm text-neutral-500 dark:text-neutral-400">
      {labelKey.includes(".") ? t(labelKey) : labelKey}
      </dt>
      <dd className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-right">
      {displayValue}
      </dd>
      </div>
    );
  };

  return (
    <div className="mt-8">
    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
    {t("section.techDetails") || "Ficha Técnica"}
    </h2>

    <dl className="flex flex-col">
    {/* --- DETALHES PARA FILMES --- */}
    {type === "filme" && (
      <>
      {renderDetailItem(
        "details.director",
        getValue(["Direção", "Diretor", "director"])
      )}
      {renderDetailItem(
        "details.genre",
        getValue(["Gêneros", "Gênero", "genres"])
      )}
      {renderDetailItem("details.year", getValue(["Ano", "year"]))}
      {renderDetailItem("details.country", getValue(["País", "country", "countries"]))}
      </>
    )}

    {/* --- DETALHES PARA LIVROS --- */}
    {type === "livro" && (
      <>
      {renderDetailItem("details.author", getValue(["author", "Autor"]))}
      {renderDetailItem(
        "details.genre",
        getValue(["genres", "Gêneros", "Gênero"])
      )}
      {renderDetailItem("details.year", getValue(["year", "Ano"]))}
      {renderDetailItem("details.country", getValue(["country", "País", "countries"]))}
      </>
    )}

    {/* --- DETALHES PARA JOGOS --- */}
    {type === "jogo" && (
      <>
      {renderDetailItem("Desenvolvedora", getValue(["Desenvolvedora"]))}
      {renderDetailItem("Plataformas", getValue(["Plataformas"]))}
      {renderDetailItem("Metacritic", getValue(["Metacritic"]))}
      {renderDetailItem(
        "details.genre",
        getValue(["Gêneros", "Gênero", "genres"])
      )}
      {renderDetailItem("details.year", getValue(["Ano", "year"]))}
      {renderDetailItem("details.country", getValue(["country", "País", "countries"]))}
      </>
    )}

    {/* --- DETALHES PARA ÁLBUNS --- */}
    {type === "album" && (
      <>
      {renderDetailItem(albumArtistLabel, getValue(["Artista"]))}
      {renderDetailItem(albumTracksLabel, getValue(["Faixas"]))}
      {renderDetailItem(
        "details.genre",
        getValue(["Gêneros", "Gênero", "genres"])
      )}
      {renderDetailItem("details.year", getValue(["Ano", "year"]))}
      {renderDetailItem("details.country", getValue(["country", "País", "countries"]))}
      </>
    )}
    </dl>
    </div>
  );
}
