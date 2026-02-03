'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { LeadCard } from './LeadCard'
import { ETAPAS, LeadExtended, Etapa, LeadFilters, MotivoPerda } from '@/types/lead.types'
import { useLeads } from '@/lib/hooks/useLeads'
import { KanbanFilters } from './KanbanFilters'
import { KanbanStats } from './KanbanStats'
import { LeadDetailsDialog } from '@/components/leads/LeadDetailsDialog'
import { LeadPerdidoDialog } from '@/components/leads/LeadPerdidoDialog'
import { ResponsavelEtapaDialog } from '@/components/leads/ResponsavelEtapaDialog'
import { useToast, ToastContainer } from '@/components/ui/toast'

export function KanbanBoard() {
  const [filters, setFilters] = useState<LeadFilters>({ periodo: 'todos' })
  const { leads, loading, updateLeadEtapa, updateLeadWithMotivo } = useLeads(filters)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<LeadExtended | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [leadToMarkLost, setLeadToMarkLost] = useState<LeadExtended | null>(null)
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [pendingEtapa, setPendingEtapa] = useState<Etapa | null>(null)
  const { toast, toasts } = useToast()

  // Estados para o dialog de responsável
  const [showResponsavelDialog, setShowResponsavelDialog] = useState(false)
  const [leadToMove, setLeadToMove] = useState<LeadExtended | null>(null)

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requer mover 8px antes de ativar drag
      },
    })
  )

  // Agrupar leads por etapa
  const leadsByEtapa = ETAPAS.reduce((acc, etapa) => {
    acc[etapa.id] = leads.filter((lead) => lead.etapa === etapa.id)
    return acc
  }, {} as Record<Etapa, LeadExtended[]>)

  // Handler para início do drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handler para fim do drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const leadId = active.id as string
    const overId = over.id as string

    // Verificar se o over.id é uma etapa válida ou um UUID de lead
    const etapasValidas = ETAPAS.map(e => e.id as string)
    let novaEtapa: Etapa

    if (etapasValidas.includes(overId)) {
      // O alvo é uma coluna (etapa)
      novaEtapa = overId as Etapa
    } else {
      // O alvo é um lead - encontrar a etapa desse lead
      const leadAlvo = leads.find((l) => l.id === overId)
      if (!leadAlvo) {
        setActiveId(null)
        return
      }
      novaEtapa = leadAlvo.etapa as Etapa
    }

    // Encontrar o lead que está sendo movido
    const lead = leads.find((l) => l.id === leadId)

    if (lead && lead.etapa !== novaEtapa) {
      // TRAVA: Impedir movimentação de leads perdidos
      if (lead.etapa === 'perdido') {
        toast({
          variant: 'destructive',
          title: 'Lead perdido não pode ser movido',
          description: 'Leads marcados como perdidos não podem ser movidos para outras etapas.',
        })
        setActiveId(null)
        return
      }

      // Se mover para "perdido" e ainda não tem motivo, mostrar modal de perda
      if (novaEtapa === 'perdido' && !lead.motivo_perda) {
        setLeadToMarkLost(lead)
        setPendingEtapa(novaEtapa)
        setShowLostDialog(true)
      } else {
        // Mostrar dialog para informar o responsável da etapa anterior
        setLeadToMove(lead)
        setPendingEtapa(novaEtapa)
        setShowResponsavelDialog(true)
      }
    }

    setActiveId(null)
  }

  // Handler para confirmar mudança de etapa com responsável
  const handleConfirmResponsavel = async (responsavelNome: string) => {
    if (!leadToMove || !pendingEtapa) return

    await updateLeadEtapa(leadToMove.id, pendingEtapa, responsavelNome)

    // Limpar estados
    setLeadToMove(null)
    setPendingEtapa(null)
  }

  // Handler para confirmar perda do lead
  const handleConfirmLost = async (motivo: MotivoPerda, descricao: string | null) => {
    if (!leadToMarkLost || !pendingEtapa) return

    // Pedir o responsável da etapa anterior também para leads perdidos
    // Por enquanto, vamos usar um fluxo simplificado
    await updateLeadWithMotivo(leadToMarkLost.id, pendingEtapa, motivo, descricao)

    // Limpar estados
    setLeadToMarkLost(null)
    setPendingEtapa(null)
  }

  // Encontrar lead ativo para DragOverlay
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  // Handler para clique no lead card
  const handleLeadClick = (lead: LeadExtended) => {
    setSelectedLead(lead)
    setShowDetailsDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <KanbanFilters filters={filters} onFiltersChange={setFilters} />

      {/* Estatísticas */}
      <KanbanStats leads={leads} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ETAPAS.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              leads={leadsByEtapa[etapa.id]}
              loading={loading}
              onLeadClick={handleLeadClick}
            />
          ))}
        </div>

        {/* Overlay durante drag */}
        <DragOverlay>
          {activeLead ? (
            <div className="rotate-3">
              <LeadCard lead={activeLead} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Lead Details Dialog */}
      <LeadDetailsDialog
        lead={selectedLead}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      {/* Lead Perdido Dialog */}
      <LeadPerdidoDialog
        lead={leadToMarkLost}
        open={showLostDialog}
        onOpenChange={setShowLostDialog}
        onConfirm={handleConfirmLost}
      />

      {/* Responsável da Etapa Dialog */}
      <ResponsavelEtapaDialog
        open={showResponsavelDialog}
        onOpenChange={(open) => {
          setShowResponsavelDialog(open)
          if (!open) {
            setLeadToMove(null)
            setPendingEtapa(null)
          }
        }}
        leadNome={leadToMove?.empresa || ''}
        etapaAnterior={leadToMove?.etapa || ''}
        etapaNova={pendingEtapa || ''}
        onConfirm={handleConfirmResponsavel}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
