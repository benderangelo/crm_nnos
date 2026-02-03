'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DadosEmpresaFormData } from '@/lib/schemas/dadosEmpresaSchema'
import { useToast } from '@/components/ui/toast'
import { useDadosEmpresaStore } from '@/lib/stores/dadosEmpresaStore'
import { consultarCNPJ, mapBrasilAPIToForm } from '@/lib/services/brasilapi'
import { BrasilAPICNPJResponse } from '@/types/brasilapi.types'

export function useDadosEmpresa(leadId: string) {
  const [dadosEmpresa, setDadosEmpresa] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  // Usar store global para o estado 'exists'
  const setHasDados = useDadosEmpresaStore(state => state.setHasDados)
  const exists = useDadosEmpresaStore(state => state.hasDados(leadId))

  // Buscar dados da empresa
  const fetchDadosEmpresa = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('dados_empresa')
        .select(`
          *,
          users_profile:preenchido_por (
            nome_completo
          )
        `)
        .eq('lead_id', leadId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        setDadosEmpresa({
          ...(data as any),
          preenchido_por_nome: (data as any).users_profile?.nome_completo,
        })
        setHasDados(leadId, true)
      } else {
        setDadosEmpresa(null)
        setHasDados(leadId, false)
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da empresa.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar ou atualizar dados da empresa
  const saveDadosEmpresa = async (
    data: DadosEmpresaFormData,
    apiResponse?: BrasilAPICNPJResponse | null
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não autenticado')

      const dataToSave = {
        ...data,
        origem: apiResponse ? 'api' : 'manual',
        dados_receita_completo: apiResponse || null,
        consultado_em: apiResponse ? new Date().toISOString() : null,
      }

      if (exists && dadosEmpresa) {
        // Atualizar existente
        const { error } = await (supabase as any)
          .from('dados_empresa')
          .update(dataToSave)
          .eq('id', dadosEmpresa.id)

        if (error) throw error

        toast({
          title: 'Dados atualizados',
          description: 'Os dados da empresa foram atualizados com sucesso.',
        })
      } else {
        // Criar novo
        const { data: newDados, error } = await (supabase as any)
          .from('dados_empresa')
          .insert({
            ...dataToSave,
            lead_id: leadId,
            preenchido_por: user.id,
          })
          .select()
          .single()

        if (error) throw error

        setDadosEmpresa(newDados)
        setHasDados(leadId, true)

        toast({
          title: 'Dados salvos',
          description: 'Os dados da empresa foram salvos com sucesso.',
        })
      }

      await fetchDadosEmpresa()
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Tente novamente.',
      })
      throw error
    }
  }

  // Deletar dados da empresa
  const deleteDadosEmpresa = async () => {
    if (!dadosEmpresa) return

    try {
      const { error } = await supabase
        .from('dados_empresa')
        .delete()
        .eq('id', dadosEmpresa.id)

      if (error) throw error

      setDadosEmpresa(null)
      setHasDados(leadId, false)

      toast({
        title: 'Dados removidos',
        description: 'Os dados da empresa foram removidos.',
      })
    } catch (error) {
      console.error('Erro ao deletar dados da empresa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover os dados.',
      })
      throw error
    }
  }

  // Buscar dados do CNPJ na BrasilAPI
  const buscarDadosCNPJ = async (cnpj: string): Promise<{
    formData: Partial<DadosEmpresaFormData>
    apiResponse: BrasilAPICNPJResponse
  }> => {
    try {
      const apiResponse = await consultarCNPJ(cnpj)
      const formData = mapBrasilAPIToForm(apiResponse)

      toast({
        title: 'CNPJ encontrado',
        description: 'Dados da empresa carregados com sucesso.',
      })

      return { formData, apiResponse }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar CNPJ',
        description: error instanceof Error ? error.message : 'Não foi possível buscar os dados do CNPJ.',
      })
      throw error
    }
  }

  useEffect(() => {
    if (!leadId) return

    fetchDadosEmpresa()

    // Configurar real-time subscription
    const channel = supabase
      .channel(`dados_empresa:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dados_empresa',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchDadosEmpresa()
          } else if (payload.eventType === 'DELETE') {
            setDadosEmpresa(null)
            setHasDados(leadId, false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  return {
    dadosEmpresa,
    loading,
    exists,
    saveDadosEmpresa,
    deleteDadosEmpresa,
    buscarDadosCNPJ,
    refetch: fetchDadosEmpresa,
  }
}
