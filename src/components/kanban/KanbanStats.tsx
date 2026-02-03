'use client'

import { LeadExtended } from '@/types/lead.types'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'

interface KanbanStatsProps {
  leads: LeadExtended[]
}

export function KanbanStats({ leads: allLeads }: KanbanStatsProps) {
  const totalPipeline = allLeads.reduce((sum, lead) => sum + (lead.valor_estimado || 0), 0)
  const ticketMedio = allLeads.length > 0 ? totalPipeline / allLeads.length : 0

  // Calcular taxa de conversão (simplificado)
  const fechados = allLeads.filter(l => l.etapa === 'fechado').length
  const taxaConversao = allLeads.length > 0 ? (fechados / allLeads.length) * 100 : 0

  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total em Pipeline</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(totalPipeline)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(ticketMedio)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Leads Ativos</p>
          <p className="text-2xl font-bold text-blue-900">{allLeads.length}</p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-green-600">
            {taxaConversao.toFixed(0)}%
          </p>
        </div>
      </div>
    </Card>
  )
}
