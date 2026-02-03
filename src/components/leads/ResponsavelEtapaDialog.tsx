'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User } from 'lucide-react'
import { ETAPAS } from '@/types/lead.types'

interface ResponsavelEtapaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadNome: string
  etapaAnterior: string
  etapaNova: string
  onConfirm: (responsavelNome: string) => void
}

export function ResponsavelEtapaDialog({
  open,
  onOpenChange,
  leadNome,
  etapaAnterior,
  etapaNova,
  onConfirm,
}: ResponsavelEtapaDialogProps) {
  const [responsavelNome, setResponsavelNome] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obter nome da etapa
  const getNomeEtapa = (etapaId: string) => {
    const etapa = ETAPAS.find(e => e.id === etapaId)
    return etapa?.nome || etapaId
  }

  const handleConfirm = async () => {
    if (!responsavelNome.trim()) return

    setIsSubmitting(true)
    try {
      await onConfirm(responsavelNome.trim())
      setResponsavelNome('')
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setResponsavelNome('')
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && responsavelNome.trim()) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Responsável pela Etapa
          </DialogTitle>
          <DialogDescription>
            Informe quem foi o responsável pela etapa <strong>{getNomeEtapa(etapaAnterior)}</strong> do lead <strong>{leadNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="responsavel-nome">Nome do responsável</Label>
            <Input
              id="responsavel-nome"
              placeholder="Digite o nome do responsável..."
              value={responsavelNome}
              onChange={(e) => setResponsavelNome(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Movendo para: {getNomeEtapa(etapaNova)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!responsavelNome.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
