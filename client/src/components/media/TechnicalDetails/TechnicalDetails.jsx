import React from "react";

// Componente para exibir a "Ficha Técnica" de uma mídia.
export default function TechnicalDetails({ details, type, t, lang }) {
  if (!details) {
    return null;
  }

  const safeLang = (lang || "PT").split("-")[0].toUpperCase();

  // Helper: pega o primeiro valor existente dentre várias chaves possíveis
  const getValue = (keys) => {
    for (const k of keys) {
      if (k == null) continue;
      if (details[k] != null) return details[k];
    }
    return null;
  };

  // Função para renderizar um par de chave-valor da ficha técnica
  const renderDetailItem = (labelKey, value) => {
    // Se o valor não existir, não renderiza a linha
    if (value == null || value === "") {
      return null;
    }

    let displayValue = value;

    // Lida com arrays de tags (Gênero, Plataformas)
    if (Array.isArray(value)) {
      displayValue = value
      .map((item) => {
        // Verifica se é uma string estilo "tag.action" para traduzir, ou texto puro
        if (item && item.includes && item.includes("tag.")) return t(item);
        return item;
      })
      .filter(Boolean)
      .join(", ");
    } else if (
      // Lida com objetos localizados (ex.: { PT: "EUA", EN: "USA" })
      typeof value === "object" &&
      value !== null &&
      value[safeLang]
    ) {
      displayValue = value[safeLang];
    }

    return (
      <div
      key={labelKey}
      className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 py-3"
      >
      <dt className="text-sm text-neutral-500 dark:text-neutral-400">
      {/* Se a chave tiver ponto (ex: details.year), tenta traduzir. Se for texto puro, exibe direto */}
      {labelKey.includes(".") ? t(labelKey) : labelKey}
      </dt>
      <dd className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-right">
      {displayValue}
      </dd>
      </div>
    );
  };

  return (
    <div>
    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
    {t("section.techDetails") || "Ficha Técnica"}
    </h2>

    <dl>
    {/* --- DETALHES PARA FILMES --- */}
    {type === "filme" && (
      <>
      {renderDetailItem(
        "details.director",
        getValue(["Direção", "Diretor", "director"])
      )}
      {renderDetailItem("details.duration", getValue(["Duração", "duration"]))}
      {renderDetailItem(
        "details.genre",
        getValue(["Gêneros", "Gênero", "genres"])
      )}
      {renderDetailItem("details.year", getValue(["Ano", "year"]))}
      {renderDetailItem("details.country", getValue(["País", "country"]))}
      </>
    )}

    {/* --- DETALHES PARA LIVROS --- */}
    {type === "livro" && (
      <>
      {/* Apenas as categorias decididas: Autor, Gênero, Ano, País */}
      {renderDetailItem("details.author", getValue(["author", "Autor"]))}
      {renderDetailItem(
        "details.genre",
        getValue(["genres", "Gêneros", "Gênero"])
      )}
      {renderDetailItem("details.year", getValue(["year", "Ano"]))}
      {renderDetailItem("details.country", getValue(["country", "País"]))}
      </>
    )}

    {/* --- DETALHES PARA JOGOS --- */}
    {type === "jogo" && (
      <>
      {renderDetailItem("Desenvolvedora", getValue(["Desenvolvedora"]))}
      {renderDetailItem("Plataformas", getValue(["Plataformas"]))}
      {renderDetailItem("Metacritic", getValue(["Metacritic"]))}

      {renderDetailItem("details.duration", getValue(["Duração", "duration"]))}
      {renderDetailItem(
        "details.genre",
        getValue(["Gêneros", "Gênero", "genres"])
      )}
      {renderDetailItem("details.year", getValue(["Ano", "year"]))}
      </>
    )}

    {/* --- DETALHES PARA ÁLBUNS --- */}
    {type === "album" && (
      <>
      {renderDetailItem("Artista", getValue(["Artista"]))}
      {renderDetailItem("Faixas", getValue(["Faixas"]))}

      {renderDetailItem(
        "details.genre",
        getValue(["Gêneros", "Gênero", "genres"])
      )}
      {renderDetailItem("details.year", getValue(["Ano", "year"]))}
      </>
    )}
    </dl>
    </div>
  );
}
