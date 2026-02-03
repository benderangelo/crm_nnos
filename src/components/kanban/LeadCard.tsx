'use client'

import { LeadExtended } from '@/types/lead.types'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  lead: LeadExtended
  onClick?: () => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Helper para cor baseada em dias na etapa (mantido para visualização rápida de "alerta")
  const getDaysColor = (dias: number | undefined) => {
    if (!dias) return 'text-green-600'
    if (dias <= 7) return 'text-green-600'
    if (dias <= 14) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className="p-3 cursor-move hover:shadow-md transition-shadow bg-white border border-gray-200"
        onClick={onClick}
      >
        <div className="flex flex-col gap-2">
          <h4 className="font-medium text-gray-700 text-sm leading-tight truncate">
            {lead.empresa}
          </h4>

          <div className="flex items-center justify-between mt-1">
            {/* Dias na Etapa */}
            <span className={cn('text-xs font-medium', getDaysColor(lead.dias_na_etapa))}>
              {lead.dias_na_etapa || 0}d
            </span>

            {/* Valor Estimado */}
            <span className="text-sm font-bold text-gray-700">
              {formatCurrency(lead.valor_estimado || 0)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
