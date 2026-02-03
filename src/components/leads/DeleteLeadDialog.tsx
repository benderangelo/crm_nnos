'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LeadExtended } from '@/types/lead.types'
import { useLeads } from '@/lib/hooks/useLeads'
import { Loader2 } from 'lucide-react'

interface DeleteLeadDialogProps {
  lead: LeadExtended
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteLeadDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: DeleteLeadDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteLead } = useLeads()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteLead(lead.id)
      onSuccess?.()
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a remover <strong>{lead.empresa}</strong> do pipeline.
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
