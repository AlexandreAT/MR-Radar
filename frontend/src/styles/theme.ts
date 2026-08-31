/** Cores, espaçamentos e fontes usados em todo o dashboard. */
export const tema = {
    cores: {
        fundo: "#12161d",
        fundoPainel: "#1a1f29",
        fundoCampo: "#101419",
        fundoCodigo: "#0d1117",
        fundoDestaque: "#3a2f10",
        borda: "#2b3341",
        bordaDestaque: "#7a6320",
        texto: "#e6e9ef",
        textoSecundario: "#98a2b3",
        textoBotaoPrimario: "#ffffff",
        primaria: "#4c8dff",
        primariaEscura: "#2f6fd8",
        aberto: "#f0a020",
        resolvido: "#3fb950",
        erro: "#f26d6d",
        fundoErro: "#3a1d1d",
        rotuloIssue: "#f2564b",
        rotuloSuggestion: "#ff8b3d",
        rotuloNit: "#f2d94e",
        rotuloQuestion: "#58a6ff",
        rotuloPraise: "#3fb950",
    },
    espacamentos: {
        pequeno: "8px",
        medio: "16px",
        grande: "24px",
    },
    fontes: {
        padrao: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        codigo: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
    },
    raioBorda: "8px",
} as const;

/** Tipo do tema, usado para tipar o objeto theme dentro dos styled components. */
export type Tema = typeof tema;
