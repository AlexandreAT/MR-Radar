/** Status HTTP usados pelo backend, para não espalhar números soltos pelo código. */
export enum StatusHttp {
    RequisicaoInvalida = 400,
    NaoAutorizado = 401,
    Proibido = 403,
    NaoEncontrado = 404,
    MetodoNaoPermitido = 405,
    ConteudoMuitoGrande = 413,
    TipoNaoSuportado = 415,
    MuitasRequisicoes = 429,
    ErroInterno = 500,
    GatewayInvalido = 502,
    TempoEsgotado = 504,
}
