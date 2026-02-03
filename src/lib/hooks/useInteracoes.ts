'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InteracaoExtended } from '@/types/interacao.types'
import { useToast } from '@/components/ui/toast'
import { InteracaoFormData } from '@/lib/schemas/interacaoSchema'
import { useInteracoesStore } from '@/lib/stores/interacoesStore'

export function useInteracoes(leadId: string) {
  const { getInteracoes, setInteracoes: setInteracoesStore, addInteracao, updateInteracao: updateInteracaoStore, removeInteracao } = useInteracoesStore()
  const interacoes = getInteracoes(leadId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Buscar interações
  const fetchInteracoes = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('interacoes')
        .select(`
          *,
          users_profile:usuario_id (
            nome_completo
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const processedInteracoes: InteracaoExtended[] = (data || []).map((interacao: any) => ({
        id: interacao.id,
        lead_id: interacao.lead_id,
        usuario_id: interacao.usuario_id,
        tipo: interacao.tipo,
        titulo: interacao.titulo,
        descricao: interacao.descricao,
        duracao_minutos: interacao.duracao_minutos,
        resultado: interacao.resultado,
        created_at: interacao.created_at,
        usuario_nome: interacao.users_profile?.nome_completo,
      }))

      setInteracoesStore(leadId, processedInteracoes)
    } catch (err) {
      console.error('Erro ao buscar interações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Criar nova interação
  const createInteracao = async (data: InteracaoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não autenticado')

      const { data: newInteracao, error: insertError } = await supabase
        .from('interacoes')
        .insert({
          ...data,
          lead_id: leadId,
          usuario_id: user.id,
        } as any)
        .select(`
          *,
          users_profile:usuario_id (
            nome_completo
          )
        `)
        .single()

      if (insertError) throw insertError

      // Adicionar ao estado global
      const processedInteracao: InteracaoExtended = {
        id: (newInteracao as any).id,
        lead_id: (newInteracao as any).lead_id,
        usuario_id: (newInteracao as any).usuario_id,
        tipo: (newInteracao as any).tipo,
        titulo: (newInteracao as any).titulo,
        descricao: (newInteracao as any).descricao,
        duracao_minutos: (newInteracao as any).duracao_minutos,
        resultado: (newInteracao as any).resultado,
        created_at: (newInteracao as any).created_at,
        usuario_nome: (newInteracao as any).users_profile?.nome_completo,
      }

      addInteracao(leadId, processedInteracao)

      toast({
        title: 'Interação registrada',
        description: 'A interação foi adicionada ao histórico.',
      })

      return newInteracao
    } catch (err) {
      console.error('Erro ao criar interação:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar interação',
        description: 'Não foi possível registrar a interação. Tente novamente.',
      })
      throw err
    }
  }

  // Atualizar interação
  const updateInteracao = async (interacaoId: string, data: Partial<InteracaoFormData>) => {
    try {
      const { error: updateError } = await (supabase as any)
        .from('interacoes')
        .update(data)
        .eq('id', interacaoId)

      if (updateError) throw updateError

      updateInteracaoStore(leadId, interacaoId, data)

      toast({
        title: 'Interação atualizada',
        description: 'A interação foi atualizada com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao atualizar interação:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar interação',
        description: 'Não foi possível atualizar. Tente novamente.',
      })
      throw err
    }
  }

  // Deletar interação
  const deleteInteracao = async (interacaoId: string) => {
    try {
      console.log('🗑️ Tentando deletar interação:', interacaoId)

      // Verificar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 Usuário atual:', user?.id)

      // Buscar a interação antes de deletar para debug
      const { data: interacaoData } = await supabase
        .from('interacoes')
        .select('*')
        .eq('id', interacaoId)
        .single()

      console.log('📄 Dados da interação:', interacaoData)

      const { data, error: deleteError } = await supabase
        .from('interacoes')
        .delete()
        .eq('id', interacaoId)

      console.log('✅ Resultado delete:', { data, error: deleteError })

      if (deleteError) throw deleteError

      removeInteracao(leadId, interacaoId)

      toast({
        title: 'Interação removida',
        description: 'A interação foi removida do histórico.',
      })
    } catch (err) {
      console.error('❌ Erro ao deletar interação:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover interação',
        description: 'Não foi possível remover. Tente novamente.',
      })
      throw err
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchInteracoes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  return {
    interacoes,
    loading,
    error,
    refetch: fetchInteracoes,
    createInteracao,
    updateInteracao,
    deleteInteracao,
  }
}
