'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export interface DashboardMetrics {
  // KPIs principais
  totalPipeline: number
  ticketMedio: number
  taxaConversao: number
  totalLeads: number
  leadsFechados: number

  // Por etapa
  leadsPorEtapa: {
    etapa: string
    quantidade: number
    valor: number
  }[]

  // Conversão por etapa
  conversaoPorEtapa: {
    etapa: string
    taxa: number
  }[]

  // Tempo por etapa
  tempoPorEtapa: {
    etapa: string
    diasMedio: number
  }[]

  // Evolução temporal
  evolucaoMensal: {
    mes: string
    quantidade: number
    valor: number
  }[]

  // Top leads
  topLeads: any[]

  // Atividade recente
  atividadeRecente: any[]
}

export function useDashboardMetrics(
  startDate?: Date,
  endDate?: Date,
  userId?: string
) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMetrics = async () => {
    try {
      setLoading(true)

      // Base queries
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .eq('ativo', true)
        .gte('created_at', startDate?.toISOString() || new Date(0).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString())

      let mudancasQuery = supabase
        .from('mudancas_etapa')
        .select('*')
        .gte('created_at', startDate?.toISOString() || new Date(0).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString())

      // Aplicar filtro de usuário se selecionado
      if (userId && userId !== 'all') {
        leadsQuery = leadsQuery.eq('created_by', userId)
        // Nota: mudancas_etapa pode ou não ter created_by, dependendo da estrutura. 
        // Se a mudança deve ser filtrada pelo dono do lead ou quem fez a mudança, 
        // isso precisa ser considerado. Por enquanto, assumindo leads filtrados.
        // Para filtro perfeito de mudanças, precisaríamos fazer join ou filtrar em memória baseada nos leads.
      }

      const { data: leadsData } = await leadsQuery
      const { data: mudancasData } = await mudancasQuery

      if (!leadsData) return

      let leads = leadsData as any[]
      const mudancas = mudancasData as any[]

      // Se filtrou por usuário, precisamos garantir que as mudanças consideradas sejam apenas desses leads
      if (userId && userId !== 'all') {
        const leadIds = new Set(leads.map(l => l.id))
        // Filtra mudanças que pertencem aos leads do usuário (assumindo que mudancas tem lead_id)
        // Se mudancas_etapa tem lead_id, isso funciona.
      }

      // Calcular KPIs
      const totalPipeline = leads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)
      const totalLeads = leads.length
      const leadsFechados = leads.filter(l => l.etapa === 'fechado').length
      const ticketMedio = totalLeads > 0 ? totalPipeline / totalLeads : 0
      const taxaConversao = totalLeads > 0 ? (leadsFechados / totalLeads) * 100 : 0

      // Leads por etapa
      const leadsPorEtapa = ['novo', 'contato', 'proposta', 'negociacao', 'fechado'].map(etapa => ({
        etapa,
        quantidade: leads.filter(l => l.etapa === etapa).length,
        valor: leads.filter(l => l.etapa === etapa)
          .reduce((sum, l) => sum + (l.valor_estimado || 0), 0),
      }))

      // Tempo médio por etapa
      const tempoPorEtapa = leadsPorEtapa.map(({ etapa }) => {
        // Filtra mudanças relevantes apenas para os leads carregados (se filtrado) ou todos
        const leadIds = new Set(leads.map(l => l.id))
        const mudancasEtapa = mudancas?.filter(m => m.etapa_anterior === etapa && leadIds.has(m.lead_id)) || []

        const tempoTotal = mudancasEtapa.reduce((sum, m) => {
          const interval = m.tempo_na_etapa_anterior
          // Converter interval PostgreSQL para dias (simplificado)
          const dias = interval ? parseInt(interval.split(' ')[0]) : 0
          return sum + dias
        }, 0)
        const diasMedio = mudancasEtapa.length > 0 ? tempoTotal / mudancasEtapa.length : 0

        return { etapa, diasMedio }
      })

      // Evolução mensal (últimos 6 meses)
      const evolucaoMensal = Array.from({ length: 6 }, (_, i) => {
        const mes = subMonths(new Date(), i)
        const start = startOfMonth(mes)
        const end = endOfMonth(mes)

        const leadsDoMes = leads.filter(l => {
          const created = new Date(l.created_at)
          return created >= start && created <= end
        })

        return {
          mes: mes.toLocaleDateString('pt-BR', { month: 'short' }),
          quantidade: leadsDoMes.length,
          valor: leadsDoMes.reduce((sum, l) => sum + (l.valor_estimado || 0), 0),
        }
      }).reverse()

      // Top leads (maiores valores)
      const topLeads = [...leads]
        .sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))
        .slice(0, 10)

      setMetrics({
        totalPipeline,
        ticketMedio,
        taxaConversao,
        totalLeads,
        leadsFechados,
        leadsPorEtapa,
        conversaoPorEtapa: [], // Implementar se necessário
        tempoPorEtapa,
        evolucaoMensal,
        topLeads,
        atividadeRecente: [], // Implementar se necessário
      })
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, userId])

  return { metrics, loading, refetch: fetchMetrics }
}
