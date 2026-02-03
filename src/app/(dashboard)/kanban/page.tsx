'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'

export default function KanbanPage() {
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false)

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Comercial</h1>
            <p className="text-gray-500 mt-1">
              Gerencie seus leads através do funil de vendas
            </p>
          </div>

          {/* Botão Novo Lead */}
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-900 to-blue-700"
            onClick={() => setShowNewLeadDialog(true)}
          >
            <Plus className="w-5 h-5" />
            Novo Lead
          </Button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard />

        {/* New Lead Dialog */}
        <NewLeadDialog
          open={showNewLeadDialog}
          onOpenChange={setShowNewLeadDialog}
        />
      </div>
    </PageContainer>
  )
}
