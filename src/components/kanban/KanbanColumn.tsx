'use client'

import { LeadExtended, EtapaConfig } from '@/types/lead.types'
import { LeadCard } from './LeadCard'
import { LeadCardSkeleton } from './LeadCardSkeleton'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  etapa: EtapaConfig
  leads: LeadExtended[]
  loading?: boolean
  onLeadClick?: (lead: LeadExtended) => void
}

export function KanbanColumn({ etapa, leads, loading, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
  })

  const totalValor = leads.reduce((sum, lead) => sum + (lead.valor_estimado || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn('rounded-t-lg p-4', etapa.cor)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{etapa.icon}</span>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-900">
              {etapa.nome}
            </h3>
          </div>
          <span className="bg-gray-900 text-white px-2 py-1 rounded-full text-xs font-bold">
            {leads.length}
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-700">
          {formatCurrency(totalValor)}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 bg-gray-50 border-x border-b border-gray-300 rounded-b-lg p-3 space-y-3 min-h-[500px] transition-colors',
          isOver && 'bg-blue-50 ring-2 ring-blue-400 ring-inset'
        )}
      >
        {loading ? (
          <>
            <LeadCardSkeleton />
            <LeadCardSkeleton />
            <LeadCardSkeleton />
          </>
        ) : (
          <SortableContext
            items={leads.map((lead) => lead.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick?.(lead)}
              />
            ))}
          </SortableContext>
        )}

        {!loading && leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  )
}
