'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeadExtended, Etapa, LeadFilters, MotivoPerda } from '@/types/lead.types'
import { useToast } from '@/components/ui/toast'
import { LeadFormData } from '@/lib/schemas/leadSchema'
import { useLeadsStore } from '@/lib/stores/leadsStore'

export function useLeads(filters?: LeadFilters) {
  const { leads, setLeads, addLead, updateLead: updateLeadInStore, removeLead } = useLeadsStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Buscar leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('leads')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      // Aplicar filtro de busca
      if (filters?.busca) {
        query = query.or(`empresa.ilike.%${filters.busca}%,contato_nome.ilike.%${filters.busca}%`)
      }

      // Aplicar filtro de responsável
      if (filters?.responsavel_id) {
        query = query.eq('created_by', filters.responsavel_id)
      }

      // Aplicar filtro de período
      if (filters?.periodo && filters.periodo !== 'todos') {
        const now = new Date()
        let dateFrom: Date

        switch (filters.periodo) {
          case 'hoje':
            dateFrom = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'semana':
            dateFrom = new Date(now.setDate(now.getDate() - 7))
            break
          case 'mes':
            dateFrom = new Date(now.setMonth(now.getMonth() - 1))
            break
        }

        query = query.gte('created_at', dateFrom!.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Processar dados
      const processedLeads: LeadExtended[] = (data || []).map((lead: any) => ({
        ...lead,
        dias_na_etapa: calculateDaysInStage(lead.data_entrada_etapa || lead.created_at),
      }))

      setLeads(processedLeads)
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcular dias na etapa
  const calculateDaysInStage = (dataEntrada: string | null): number => {
    if (!dataEntrada) return 0
    const now = new Date()
    const entrada = new Date(dataEntrada)
    const diff = now.getTime() - entrada.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Atualizar etapa de um lead (com responsável da etapa anterior)
  const updateLeadEtapa = async (
    leadId: string,
    novaEtapa: Etapa,
    responsavelEtapaAnterior?: string
  ) => {
    try {
      // Buscar lead atual para registrar a mudança
      const leadAtual = leads.find(l => l.id === leadId)
      const etapaAnterior = leadAtual?.etapa || 'novo'

      console.log(`[updateLeadEtapa] Atualizando lead ${leadId} para etapa: "${novaEtapa}" (Anterior: "${etapaAnterior}")`)

      // Atualizar o lead
      const { error: updateError } = await (supabase as any)
        .from('leads')
        .update({
          etapa: novaEtapa,
          data_entrada_etapa: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Registrar/atualizar na tabela mudancas_etapa com o responsável
      // Regra: só pode existir um responsável por etapa por lead
      // Usando RPC para fazer upsert (contorna limitações de RLS)
      if (responsavelEtapaAnterior) {
        try {
          const { error: rpcError } = await (supabase as any)
            .rpc('upsert_mudanca_etapa', {
              p_lead_id: leadId,
              p_etapa_anterior: etapaAnterior,
              p_etapa_nova: novaEtapa,
              p_responsavel_nome: responsavelEtapaAnterior,
            })

          if (rpcError) {
            console.error('Erro ao registrar mudança de etapa:', rpcError)
          }
        } catch (mudancaError) {
          console.error('Erro ao registrar mudança de etapa:', mudancaError)
        }
      }

      // Atualizar estado global imediatamente (optimistic update)
      updateLeadInStore(leadId, { etapa: novaEtapa, dias_na_etapa: 0 })

      toast({
        title: 'Lead atualizado',
        description: 'A etapa do lead foi atualizada com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao atualizar lead:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: 'Não foi possível atualizar o lead. Tente novamente.',
      })
      // Reverter mudança otimista em caso de erro
      fetchLeads()
    }
  }

  // Atualizar etapa com motivo de perda
  const updateLeadWithMotivo = async (
    leadId: string,
    novaEtapa: Etapa,
    motivo: MotivoPerda,
    descricao: string | null,
    responsavelEtapaAnterior?: string
  ) => {
    try {
      // Buscar lead atual para registrar a mudança
      const leadAtual = leads.find(l => l.id === leadId)
      const etapaAnterior = leadAtual?.etapa || 'novo'

      const { error: updateError } = await (supabase as any)
        .from('leads')
        .update({
          etapa: novaEtapa,
          motivo_perda: motivo,
          motivo_perda_descricao: descricao,
          data_entrada_etapa: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Registrar/atualizar na tabela mudancas_etapa com o responsável
      // Regra: só pode existir um responsável por etapa por lead
      // Usando RPC para fazer upsert (contorna limitações de RLS)
      if (responsavelEtapaAnterior) {
        try {
          const { error: rpcError } = await (supabase as any)
            .rpc('upsert_mudanca_etapa', {
              p_lead_id: leadId,
              p_etapa_anterior: etapaAnterior,
              p_etapa_nova: novaEtapa,
              p_responsavel_nome: responsavelEtapaAnterior,
              p_observacao: `Motivo: ${motivo}${descricao ? ` - ${descricao}` : ''}`,
            })

          if (rpcError) {
            console.error('Erro ao registrar mudança de etapa (perdido):', rpcError)
          }
        } catch (mudancaError) {
          console.error('Erro ao registrar mudança de etapa (perdido):', mudancaError)
        }
      }

      // Atualizar estado global
      updateLeadInStore(leadId, {
        etapa: novaEtapa,
        motivo_perda: motivo,
        motivo_perda_descricao: descricao,
        dias_na_etapa: 0,
      })

      toast({
        title: 'Lead marcado como perdido',
        description: 'O lead foi movido para a etapa Perdido.',
      })
    } catch (err) {
      console.error('Erro ao atualizar lead:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: 'Não foi possível marcar o lead como perdido. Tente novamente.',
      })
      throw err
    }
  }

  // Criar novo lead
  const createLead = async (data: LeadFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não autenticado')

      const { data: newLead, error: insertError } = await (supabase as any)
        .from('leads')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao inserir lead:', insertError)
        throw insertError
      }

      // Adicionar ao estado global
      const processedLead: LeadExtended = {
        ...newLead,
        dias_na_etapa: 0,
      }
      addLead(processedLead)

      toast({
        title: 'Lead criado com sucesso!',
        description: `${data.empresa} foi adicionado ao pipeline.`,
      })

      return newLead
    } catch (err) {
      console.error('Erro ao criar lead:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar lead',
        description: 'Não foi possível criar o lead. Tente novamente.',
      })
      throw err
    }
  }

  // Atualizar lead
  const updateLead = async (leadId: string, data: Partial<LeadFormData>) => {
    try {
      const { error: updateError } = await (supabase as any)
        .from('leads')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Atualizar estado global
      updateLeadInStore(leadId, data)

      toast({
        title: 'Lead atualizado',
        description: 'As informações foram atualizadas com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao atualizar lead:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: 'Não foi possível atualizar o lead. Tente novamente.',
      })
      throw err
    }
  }

  // Soft delete usando RPC para contornar problema de RLS
  const deleteLead = async (leadId: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .rpc('soft_delete_lead', { lead_id: leadId })

      if (deleteError) throw deleteError

      // Remover do estado global
      removeLead(leadId)

      toast({
        title: 'Lead removido',
        description: 'O lead foi removido do pipeline.',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover lead',
        description: 'Não foi possível remover o lead. Tente novamente.',
      })
      throw err
    }
  }

  // Buscar ao montar e quando filtros mudarem
  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.busca, filters?.responsavel_id, filters?.periodo])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    updateLeadEtapa,
    updateLeadWithMotivo,
    createLead,
    updateLead,
    deleteLead,
  }
}
