'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { PropostaAnexo, DadosProposta } from '@/types/proposta.types'
import { gerarPropostaPDF, gerarNomeArquivoProposta } from '@/lib/services/gerarProposta'

export function usePropostas(leadId: string) {
    const supabase = createClient()
    const { toast } = useToast()

    const [propostas, setPropostas] = useState<PropostaAnexo[]>([])
    const [loading, setLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)

    /**
     * Buscar propostas do lead
     */
    const fetchPropostas = async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from('v_propostas_lead')
                .select('*')
                .eq('lead_id', leadId)
                .order('numero_aps', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })

            if (error) throw error

            setPropostas(data || [])

        } catch (error) {
            console.error('Erro ao buscar propostas:', error)
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar propostas',
                description: 'Não foi possível carregar as propostas.',
            })
        } finally {
            setLoading(false)
        }
    }

    /**
     * Obter próximo número APS
     */
    const obterProximoAPS = async (): Promise<number> => {
        const { data, error } = await supabase
            .rpc('obter_proximo_aps')

        if (error) throw error

        return data as number
    }

    /**
     * Gerar nova proposta
     */
    const gerarProposta = async (dadosCompletos: DadosProposta): Promise<string> => {
        try {
            setIsGenerating(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Usuário não autenticado')

            // Obter próximo número APS
            const numeroAPS = await obterProximoAPS()

            // Adicionar número APS e data aos dados
            const dadosComAPS: DadosProposta = {
                ...dadosCompletos,
                numero_aps: numeroAPS,
                data_geracao: new Date().toISOString(),
            }

            // Gerar PDF
            const pdfBytes = await gerarPropostaPDF(dadosComAPS)

            // Nome do arquivo
            const nomeArquivo = gerarNomeArquivoProposta(
                numeroAPS,
                dadosCompletos.empresa.razao_social,
                1
            )

            // Path no storage
            const storagePath = `${leadId}/${numeroAPS}/${nomeArquivo}`

            // Upload para Supabase Storage
            const { error: uploadError } = await supabase
                .storage
                .from('crm-anexos')
                .upload(storagePath, pdfBytes, {
                    contentType: 'application/pdf',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            // Salvar registro na tabela anexos
            const { data: anexo, error: dbError } = await supabase
                .from('anexos')
                .insert({
                    lead_id: leadId,
                    tipo_documento: 'proposta',
                    nome_arquivo: nomeArquivo,
                    tamanho_bytes: pdfBytes.length,
                    mime_type: 'application/pdf',
                    storage_path: storagePath,
                    url_storage: storagePath, // Compatibilidade com schema antigo
                    numero_aps: numeroAPS,
                    criado_por: user.id,
                    usuario_id: user.id, // Compatibilidade com schema antigo
                } as any)
                .select()
                .single()

            if (dbError) throw dbError

            toast({
                title: 'Proposta gerada!',
                description: `Proposta APS-${numeroAPS.toString().padStart(3, '0')} criada com sucesso.`,
            })

            // Recarregar lista
            await fetchPropostas()

            return (anexo as any).id

        } catch (error) {
            console.error('Erro ao gerar proposta:', error)
            toast({
                variant: 'destructive',
                title: 'Erro ao gerar proposta',
                description: error instanceof Error ? error.message : 'Tente novamente.',
            })
            throw error
        } finally {
            setIsGenerating(false)
        }
    }

    /**
     * Fazer download de proposta
     */
    const downloadProposta = async (proposta: PropostaAnexo) => {
        try {
            const { data, error } = await supabase
                .storage
                .from('crm-anexos')
                .download(proposta.storage_path)

            if (error) throw error

            // Criar URL para download
            const url = URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download = proposta.nome_arquivo
            link.click()

            URL.revokeObjectURL(url)

            toast({
                title: 'Download iniciado',
                description: proposta.nome_arquivo,
            })

        } catch (error) {
            console.error('Erro ao fazer download:', error)
            toast({
                variant: 'destructive',
                title: 'Erro ao fazer download',
                description: 'Não foi possível baixar o arquivo.',
            })
        }
    }

    /**
     * Deletar proposta
     */
    const deletarProposta = async (proposta: PropostaAnexo) => {
        try {
            // Deletar do storage
            const { error: storageError } = await supabase
                .storage
                .from('crm-anexos')
                .remove([proposta.storage_path])

            if (storageError) throw storageError

            // Deletar do banco
            const { error: dbError } = await supabase
                .from('anexos')
                .delete()
                .eq('id', proposta.id)

            if (dbError) throw dbError

            toast({
                title: 'Proposta deletada',
                description: proposta.nome_arquivo,
            })

            // Recarregar lista
            await fetchPropostas()

        } catch (error) {
            console.error('Erro ao deletar proposta:', error)
            toast({
                variant: 'destructive',
                title: 'Erro ao deletar',
                description: 'Não foi possível deletar a proposta.',
            })
        }
    }

    // Carregar propostas ao montar
    useEffect(() => {
        fetchPropostas()
    }, [leadId])

    return {
        propostas,
        loading,
        isGenerating,
        gerarProposta,
        downloadProposta,
        deletarProposta,
        refetch: fetchPropostas,
    }
}
