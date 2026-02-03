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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadFormFields } from './LeadFormFields'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import { leadFormSchema, LeadFormData } from '@/lib/schemas/leadSchema'
import { LeadExtended } from '@/types/lead.types'
import { useLeads } from '@/lib/hooks/useLeads'
import { Loader2, Trash2 } from 'lucide-react'
import { InteracoesTimeline } from '@/components/interacoes/InteracoesTimeline'
import { QuickActions } from '@/components/interacoes/QuickActions'
import { Separator } from '@/components/ui/separator'
import { AnexosList } from '@/components/anexos/AnexosList'
import { DadosEmpresaDialog } from '@/components/dados-empresa/DadosEmpresaDialog'
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { Building2, CheckCircle2 } from 'lucide-react'
import { PropostasTab } from '@/components/propostas/PropostasTab'

interface LeadDetailsDialogProps {
  lead: LeadExtended | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDadosEmpresaDialog, setShowDadosEmpresaDialog] = useState(false)
  const { updateLead } = useLeads()
  const { exists: temDadosEmpresa } = useDadosEmpresa(lead?.id || '')

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema) as any,
    values: lead ? ({
      empresa: lead.empresa,
      contato_nome: lead.contato_nome,
      contato_telefone: lead.contato_telefone,
      contato_email: lead.contato_email || '',
      valor_estimado: lead.valor_estimado || 0,
      etapa: lead.etapa as any,
      tags: lead.tags || [],
      observacoes: lead.observacoes || '',
    } as LeadFormData) : undefined,
  })

  const onSubmit = async (data: LeadFormData) => {
    if (!lead) return

    try {
      setIsSubmitting(true)
      await updateLead(lead.id, data)
      setIsEditing(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!lead) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{lead.empresa}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Editando informações do lead' : 'Detalhes do lead'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full flex-1 flex flex-col overflow-hidden px-6">
            <TabsList className="grid w-full grid-cols-5 mt-4">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
              <TabsTrigger value="propostas">Propostas</TabsTrigger>
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="flex-1 overflow-auto mt-4 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-auto pr-4 pb-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <LeadFormFields form={form} isEditing={isEditing} />
                  </form>
                </Form>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="flex-1 overflow-auto mt-4 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-auto pr-4 pb-4 space-y-4">
                {/* Ações Rápidas */}
                <QuickActions leadId={lead.id} telefone={lead.contato_telefone} />

                <Separator />

                {/* Timeline */}
                <InteracoesTimeline leadId={lead.id} />
              </div>
            </TabsContent>

            <TabsContent value="anexos" className="flex-1 overflow-auto mt-4 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-auto pr-4 pb-4">
                <AnexosList leadId={lead.id} />
              </div>
            </TabsContent>

            <TabsContent value="propostas" className="flex-1 overflow-auto mt-4 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-auto pr-4 pb-4">
                <PropostasTab
                  leadId={lead.id}
                  lead={{
                    empresa: lead.empresa,
                    contato_nome: lead.contato_nome,
                    contato_telefone: lead.contato_telefone,
                    valor_estimado: lead.valor_estimado || 0,
                    observacoes: lead.observacoes,
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="empresa" className="flex-1 overflow-auto mt-4 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-auto pr-4 pb-4">
                <div className="text-center py-8">
                  {temDadosEmpresa ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Dados preenchidos</p>
                      <p className="text-gray-500 mb-4">
                        Os dados da empresa já foram cadastrados
                      </p>
                      <Button onClick={() => setShowDadosEmpresaDialog(true)}>
                        Editar Dados
                      </Button>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Dados não preenchidos</p>
                      <p className="text-gray-500 mb-4">
                        Preencha os dados da empresa para gerar propostas
                      </p>
                      <Button onClick={() => setShowDadosEmpresaDialog(true)}>
                        Preencher Dados
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between px-6 py-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      form.reset()
                    }}
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
                    Salvar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Fechar
                  </Button>
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteLeadDialog
        lead={lead}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => {
          onOpenChange(false)
          setShowDeleteDialog(false)
        }}
      />

      <DadosEmpresaDialog
        leadId={lead?.id || ''}
        open={showDadosEmpresaDialog}
        onOpenChange={setShowDadosEmpresaDialog}
      />
    </>
  )
}
