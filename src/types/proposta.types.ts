export interface DadosProposta {
    // Dados do lead
    lead: {
        empresa: string
        contato_nome: string
        contato_telefone: string
        valor_estimado: number
        observacoes: string | null
    }

    // Dados da empresa
    empresa: {
        razao_social: string
        nome_fantasia: string
        cnpj: string
        logradouro: string
        numero: string
        bairro: string
        cep: string
        municipio: string
        uf: string
        objetivo_projeto: string
        periodo: string
        modalidade: string
        parcelamento: string
    }

    // Metadata
    numero_aps: number
    data_geracao: string
}

// Interface base para anexos
export interface Anexo {
    id: string
    lead_id: string
    tipo_documento: string
    nome_arquivo: string
    tamanho_bytes: number
    mime_type: string
    storage_path: string
    numero_aps: number | null
    criado_por: string
    created_at: string
    updated_at: string
}

// Estender a interface Anexo para propostas
export interface PropostaAnexo extends Anexo {
    numero_aps: number
    lead_empresa: string
    criado_por_nome: string
}
