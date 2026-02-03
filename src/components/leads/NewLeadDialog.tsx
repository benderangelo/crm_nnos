'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { LeadFormFields } from './LeadFormFields'
import { leadFormSchema, LeadFormData } from '@/lib/schemas/leadSchema'
import { useLeads } from '@/lib/hooks/useLeads'
import { Loader2 } from 'lucide-react'

interface NewLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewLeadDialog({ open, onOpenChange }: NewLeadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createLead } = useLeads()

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema) as any,
    defaultValues: {
      empresa: '',
      contato_nome: '',
      contato_telefone: '',
      contato_email: '',
      valor_estimado: 0,
      etapa: 'novo',
      observacoes: '',
      tags: [],
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    try {
      setIsSubmitting(true)
      await createLead(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Adicione um novo lead ao pipeline comercial
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <LeadFormFields form={form} />
            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
