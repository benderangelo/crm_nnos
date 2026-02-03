// Tipos baseados na resposta real da BrasilAPI
export interface BrasilAPICNPJResponse {
  cnpj: string
  identificador_matriz_filial: number
  descricao_identificador_matriz_filial: string
  razao_social: string
  nome_fantasia: string
  situacao_cadastral: number
  descricao_situacao_cadastral: string
  data_situacao_cadastral: string
  motivo_situacao_cadastral: number
  descricao_motivo_situacao_cadastral: string
  nome_cidade_no_exterior: string
  codigo_natureza_juridica: number
  natureza_juridica: string
  data_inicio_atividade: string
  cnae_fiscal: number
  cnae_fiscal_descricao: string
  descricao_tipo_de_logradouro: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  uf: string
  codigo_municipio: number
  municipio: string
  ddd_telefone_1: string
  ddd_telefone_2: string
  ddd_fax: string
  qualificacao_do_responsavel: number
  capital_social: number
  porte: string
  opcao_pelo_simples: boolean | null
  data_opcao_pelo_simples: string | null
  data_exclusao_do_simples: string | null
  opcao_pelo_mei: boolean | null
  situacao_especial: string
  data_situacao_especial: string | null
  cnaes_secundarios: Array<{
    codigo: number
    descricao: string
  }>
  qsa: Array<{
    identificador_de_socio: number
    nome_socio: string
    cnpj_cpf_do_socio: string
    codigo_qualificacao_socio: number
    qualificacao_socio: string
    data_entrada_sociedade: string
    pais: string | null
    representante_legal: string
    nome_representante_legal: string
    codigo_qualificacao_representante_legal: number
    qualificacao_representante_legal: string
  }>
  regime_tributario?: Array<{
    ano: number
    cnpj_da_scp: string | null
    forma_de_tributacao: string
    quantidade_de_escrituracoes: number
  }>
}

export interface BrasilAPIError {
  message: string
  type: string
  name?: string
}
