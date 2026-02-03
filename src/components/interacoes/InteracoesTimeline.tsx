'use client'

import { useState } from 'react'
import { useInteracoes } from '@/lib/hooks/useInteracoes'
import { InteracaoCard } from './InteracaoCard'
import { NewInteracaoForm } from './NewInteracaoForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus } from 'lucide-react'
import { InteracaoFormData } from '@/lib/schemas/interacaoSchema'
import { Skeleton } from '@/components/ui/skeleton'

interface InteracoesTimelineProps {
  leadId: string
}

export function InteracoesTimeline({ leadId }: InteracoesTimelineProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const { interacoes, loading, createInteracao, deleteInteracao } = useInteracoes(leadId)

  const handleCreateInteracao = async (data: InteracaoFormData) => {
    await createInteracao(data)
    setShowNewForm(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botão Adicionar */}
      {!showNewForm && (
        <Button
          onClick={() => setShowNewForm(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Interação
        </Button>
      )}

      {/* Formulário */}
      {showNewForm && (
        <Card className="p-4">
          <NewInteracaoForm onSubmit={handleCreateInteracao} />
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setShowNewForm(false)}
          >
            Cancelar
          </Button>
        </Card>
      )}

      <Separator />

      {/* Timeline */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {interacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma interação registrada ainda</p>
              <p className="text-sm mt-2">
                Adicione a primeira interação com este lead
              </p>
            </div>
          ) : (
            interacoes.map((interacao) => (
              <InteracaoCard
                key={interacao.id}
                interacao={interacao}
                onDelete={() => deleteInteracao(interacao.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
