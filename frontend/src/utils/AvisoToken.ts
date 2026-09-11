import { toast } from "sonner";
import { CodigoErroBackend } from "src/api/Revisao/types";
import { MensagemErro } from "src/services/types";

/** Quanto tempo (ms) a notificação de token fica visível antes de sumir sozinha. */
const DURACAO_AVISO_MS = 8000;

/** Códigos que indicam problema com o token em si (inválido, expirado, ou sem a permissão necessária). */
const CODIGOS_DE_TOKEN: string[] = [CodigoErroBackend.TokenInvalido, CodigoErroBackend.AcessoNegado];

/**
 * Mostra uma notificação quando o erro é sobre o token — os demais erros (não encontrado, limite
 * de requisições, etc.) já aparecem na caixa de erro de sempre e não precisam repetir aqui.
 *
 * Recebe só o erro já classificado e traduzido pelo backend (`codigo`/`mensagem`/`dica`, strings
 * prontas escritas à mão em cada `ErroProvedor`) — nunca o token em si, que o frontend nunca chega
 * a receber em resposta alguma.
 * @param erro Erro já convertido pelo serviço de API.
 * @param funcionalidade Nome da funcionalidade que falhou, para o usuário saber onde foi.
 * @returns Nada.
 */
export function AvisarSeProblemaDeToken(erro: MensagemErro, funcionalidade: string): void {
    if (!CODIGOS_DE_TOKEN.includes(erro.codigo))
        return;

    toast.error(`${funcionalidade}: ${erro.mensagem}`, {
        description: erro.dica || undefined,
        duration: DURACAO_AVISO_MS,
    });
}

/**
 * Mostra um aviso para cada problema não fatal devolvido junto de uma resposta que, fora isso,
 * carregou normalmente (ex.: status de resolução indisponível por falta de permissão do token).
 * @param avisos Avisos devolvidos pelo backend, se houver.
 * @returns Nada.
 */
export function AvisarAvisos(avisos: string[] | undefined): void {
    (avisos ?? []).forEach((aviso) => toast.warning(aviso, { duration: DURACAO_AVISO_MS }));
}
