import { BrasilAPICNPJResponse, BrasilAPIError } from '@/types/brasilapi.types'
import { cleanCNPJ, formatCNPJ, formatCEP } from '@/lib/utils/formatters'

const BRASILAPI_BASE_URL = 'https://brasilapi.com.br/api'

/**
 * Consulta dados de CNPJ na BrasilAPI
 * @param cnpj - CNPJ com ou sem formatação
 * @returns Dados completos da empresa
 * @throws Error se CNPJ inválido ou não encontrado
 */
export async function consultarCNPJ(cnpj: string): Promise<BrasilAPICNPJResponse> {
  const cnpjLimpo = cleanCNPJ(cnpj)

  if (cnpjLimpo.length !== 14 || !/^\d{14}$/.test(cnpjLimpo)) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.')
  }

  const response = await fetch(`${BRASILAPI_BASE_URL}/cnpj/v1/${cnpjLimpo}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado na base de dados da Receita Federal.')
    }
    if (response.status === 429) {
      throw new Error('Muitas requisições. Aguarde alguns segundos e tente novamente.')
    }
    throw new Error(`Erro ao consultar CNPJ. Status: ${response.status}`)
  }

  return await response.json()
}

/**
 * Mapeia a resposta da BrasilAPI para o formato do formulário
 * @param data - Resposta completa da BrasilAPI
 * @returns Objeto com campos do formulário preenchidos
 */
export function mapBrasilAPIToForm(data: BrasilAPICNPJResponse) {
  // Concatena descrição do tipo de logradouro com o nome da rua
  const logradouroCompleto = data.descricao_tipo_de_logradouro
    ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`.trim()
    : data.logradouro

  return {
    cnpj: formatCNPJ(data.cnpj),
    razao_social: data.razao_social || '',
    nome_fantasia: data.nome_fantasia || '',
    logradouro: logradouroCompleto,
    numero: data.numero || '',
    bairro: data.bairro || '',
    cep: formatCEP(data.cep),
    municipio: data.municipio || '',
    uf: data.uf || '',
  }
}
