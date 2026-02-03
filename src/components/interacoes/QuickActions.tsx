'use client'

import { Button } from '@/components/ui/button'
import { Phone, MessageCircle } from 'lucide-react'
import { useInteracoes } from '@/lib/hooks/useInteracoes'
import { useToast } from '@/components/ui/toast'

interface QuickActionsProps {
  leadId: string
  telefone: string
}

export function QuickActions({ leadId, telefone }: QuickActionsProps) {
  const { createInteracao } = useInteracoes(leadId)
  const { toast } = useToast()

  const handleLigar = async () => {
    try {
      // Abrir discador do telefone
      window.location.href = `tel:${telefone.replace(/\D/g, '')}`

      // Registrar interação
      await createInteracao({
        tipo: 'ligacao',
        descricao: 'Ligação realizada via CRM',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar a ligação.',
      })
    }
  }

  const handleWhatsApp = async () => {
    try {
      // Abrir WhatsApp
      const phoneNumber = telefone.replace(/\D/g, '')
      window.open(`https://wa.me/55${phoneNumber}`, '_blank')

      // Registrar interação
      await createInteracao({
        tipo: 'whatsapp',
        descricao: 'Mensagem enviada via WhatsApp',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar o WhatsApp.',
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleLigar}
        className="flex-1 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        <Phone className="mr-2 h-4 w-4" />
        Ligar
      </Button>
      <Button
        onClick={handleWhatsApp}
        className="flex-1 bg-green-600 hover:bg-green-700"
        size="sm"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        WhatsApp
      </Button>
    </div>
  )
}
