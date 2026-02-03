import { PDFDocument } from 'pdf-lib'
import { DadosProposta } from '@/types/proposta.types'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

const TEMPLATE_PATH = '/templates/aps.pdf'

/**
 * Converte número de parcelas para formato "NX"
 */
function formatParcela(parcelamento: string): string {
    // Se já está no formato "NX", retorna direto
    if (/^\d+X?$/i.test(parcelamento)) {
        return parcelamento.toUpperCase()
    }

    // Se é número puro, adiciona X
    if (/^\d+$/.test(parcelamento)) {
        return `${parcelamento}X`
    }

    return parcelamento
}

/**
 * Traduz período para formato completo
 */
function formatPeriodo(periodo: string): string {
    const periodos: Record<string, string> = {
        'manha': 'MANHÃ',
        'tarde': 'TARDE',
        'integral': 'INTEGRAL',
        'manha_tarde': 'MANHÃ E TARDE',
    }

    return periodos[periodo.toLowerCase()] || periodo.toUpperCase()
}

/**
 * Traduz modalidade para formato completo
 */
function formatModalidade(modalidade: string): string {
    const modalidades: Record<string, string> = {
        'presencial': 'PRESENCIAL',
        'virtual': 'VIRTUAL',
        'hibrido': 'HÍBRIDO',
    }

    return modalidades[modalidade.toLowerCase()] || modalidade.toUpperCase()
}

/**
 * Gera PDF da proposta usando template com formulário
 */
export async function gerarPropostaPDF(dados: DadosProposta): Promise<Uint8Array> {
    try {
        // Carregar template
        const templateBytes = await fetch(TEMPLATE_PATH).then(res => {
            if (!res.ok) throw new Error('Template não encontrado')
            return res.arrayBuffer()
        })

        const pdfDoc = await PDFDocument.load(templateBytes)
        const form = pdfDoc.getForm()

        // Obter data de geração
        const dataGeracao = new Date(dados.data_geracao)
        const dataFormatada = formatDate(dataGeracao)

        // Endereço completo
        const enderecoCompleto = `${dados.empresa.logradouro}, ${dados.empresa.numero}`

        // PREENCHER CAMPOS DO FORMULÁRIO
        // (ordem conforme aparece no PDF)

        // Cabeçalho
        form.getTextField('Numero APS').setText(dados.numero_aps.toString().padStart(3, '0'))
        form.getTextField('Projeto').setText(dados.lead.empresa)

        // Dados do Cliente
        form.getTextField('Cliente').setText(dados.empresa.razao_social)
        form.getTextField('Nome Fantasia').setText(dados.empresa.nome_fantasia || '')
        form.getTextField('CNPJ').setText(dados.empresa.cnpj)
        form.getTextField('Endereço').setText(enderecoCompleto)
        form.getTextField('Bairro').setText(dados.empresa.bairro || '')
        form.getTextField('Cidade').setText(dados.empresa.municipio || '')
        form.getTextField('UF').setText(dados.empresa.uf || '')
        form.getTextField('CEP').setText(dados.empresa.cep || '')
        form.getTextField('Contato').setText(dados.lead.contato_nome)
        form.getTextField('Telefone').setText(dados.lead.contato_telefone)

        // Dados do Projeto
        form.getTextField('Objetivo do Projeto').setText(dados.empresa.objetivo_projeto || '')
        form.getTextField('Público Alvo').setText('') // Vazio por enquanto
        form.getTextField('Modalidade').setText(formatModalidade(dados.empresa.modalidade))
        form.getTextField('N Turmas').setText('') // Vazio por enquanto
        form.getTextField('Total Participantes').setText('') // Vazio por enquanto
        form.getTextField('Período').setText(formatPeriodo(dados.empresa.periodo))
        form.getTextField('Carga Horária').setText('') // Vazio por enquanto

        // Forma de Pagamento
        const valorFormatado = formatCurrency(dados.lead.valor_estimado)
        form.getTextField('Investimento').setText(valorFormatado)
        form.getTextField('Investimento').setText(valorFormatado)
        form.getTextField('Parcela').setText(formatParcela(dados.empresa.parcelamento))
        form.getTextField('Data Hoje').setText(dataFormatada)

        // Observações
        if (dados.lead.observacoes) {
            form.getTextField('Observações').setText(dados.lead.observacoes)
        }

        // Dados Complementares / Rodapé
        form.getTextField('Data Hoje').setText(dataFormatada)
        form.getTextField('Cliente').setText(dados.empresa.razao_social)

        // Achatar formulário (tornar não editável)
        form.flatten()

        // Gerar PDF
        const pdfBytes = await pdfDoc.save()

        return pdfBytes

    } catch (error) {
        console.error('Erro ao gerar PDF:', error)
        throw new Error('Falha ao gerar proposta em PDF')
    }
}

/**
 * Gera nome do arquivo da proposta
 */
export function gerarNomeArquivoProposta(
    numeroAPS: number,
    razaoSocial: string,
    versao: number = 1
): string {
    // Limpar razão social (remover caracteres especiais)
    const razaoLimpa = razaoSocial
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove especiais
        .replace(/\s+/g, '_') // Substitui espaços por underscore
        .substring(0, 50) // Limita tamanho

    const apsFormatado = numeroAPS.toString().padStart(3, '0')
    const versaoSuffix = versao > 1 ? `_v${versao}` : ''

    return `APS_${apsFormatado}_${razaoLimpa}${versaoSuffix}.pdf`
}
