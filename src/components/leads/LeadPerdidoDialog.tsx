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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LeadExtended, MOTIVOS_PERDA, MotivoPerda } from '@/types/lead.types'
import { AlertCircle } from 'lucide-react'

interface LeadPerdidoDialogProps {
  lead: LeadExtended | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (motivo: MotivoPerda, descricao: string | null) => Promise<void>
}

export function LeadPerdidoDialog({ lead, open, onOpenChange, onConfirm }: LeadPerdidoDialogProps) {
  const [motivo, setMotivo] = useState<MotivoPerda | ''>('')
  const [descricao, setDescricao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!motivo) return

    try {
      setIsSubmitting(true)
      await onConfirm(motivo, motivo === 'outro' ? descricao : null)
      // Resetar o formulário
      setMotivo('')
      setDescricao('')
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no componente pai
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setMotivo('')
    setDescricao('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Por que este lead foi perdido?
          </DialogTitle>
          <DialogDescription>
            Lead: <span className="font-semibold">{lead?.empresa}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Select value={motivo} onValueChange={(value) => setMotivo(value as MotivoPerda)}>
              <SelectTrigger id="motivo">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {MOTIVOS_PERDA.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {motivo === 'outro' && (
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o motivo da perda..."
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivo || (motivo === 'outro' && !descricao.trim()) || isSubmitting}
          >
            Confirmar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
