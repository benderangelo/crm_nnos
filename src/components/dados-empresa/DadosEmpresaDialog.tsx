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
import { DadosEmpresaForm } from './DadosEmpresaForm'
import { dadosEmpresaFormSchema, DadosEmpresaFormData } from '@/lib/schemas/dadosEmpresaSchema'
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { BrasilAPICNPJResponse } from '@/types/brasilapi.types'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, FileText } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'

interface DadosEmpresaDialogProps {
  leadId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DadosEmpresaDialog({ leadId, open, onOpenChange }: DadosEmpresaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [apiResponse, setApiResponse] = useState<BrasilAPICNPJResponse | null>(null)
  const { dadosEmpresa, exists, saveDadosEmpresa, buscarDadosCNPJ } = useDadosEmpresa(leadId)

  const form = useForm<DadosEmpresaFormData>({
    resolver: zodResolver(dadosEmpresaFormSchema) as any,
    values: dadosEmpresa ? {
      cnpj: dadosEmpresa.cnpj,
      razao_social: dadosEmpresa.razao_social,
      nome_fantasia: dadosEmpresa.nome_fantasia || '',
      logradouro: dadosEmpresa.logradouro || '',
      numero: dadosEmpresa.numero || '',
      bairro: dadosEmpresa.bairro || '',
      cep: dadosEmpresa.cep || '',
      municipio: dadosEmpresa.municipio || '',
      uf: dadosEmpresa.uf || '',
      objetivo_projeto: dadosEmpresa.objetivo_projeto || '',
      periodo: dadosEmpresa.periodo || 'integral',
      modalidade: dadosEmpresa.modalidade || 'presencial',
      parcelamento: dadosEmpresa.parcelamento || '1x',
    } : {
      cnpj: '',
      razao_social: '',
      nome_fantasia: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cep: '',
      municipio: '',
      uf: '',
      objetivo_projeto: '',
      periodo: 'integral',
      modalidade: 'presencial',
      parcelamento: '1x',
    },
  })

  const handleBuscarCNPJ = async () => {
    const cnpj = form.getValues('cnpj')
    if (!cnpj) return

    try {
      setBuscandoCNPJ(true)
      const { formData, apiResponse: response } = await buscarDadosCNPJ(cnpj)

      // Preencher o formulário com os dados retornados
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as any, value)
        }
      })

      // Armazenar resposta completa da API
      setApiResponse(response)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setBuscandoCNPJ(false)
    }
  }

  const onSubmit = async (data: DadosEmpresaFormData) => {
    try {
      setIsSubmitting(true)
      await saveDadosEmpresa(data, apiResponse)
      onOpenChange(false)
      // Limpar API response após salvar
      setApiResponse(null)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {exists ? 'Editar Dados da Empresa' : 'Dados da Empresa'}
            </DialogTitle>
            {dadosEmpresa && (
              <Badge variant={dadosEmpresa.origem === 'api' ? 'default' : 'secondary'}>
                {dadosEmpresa.origem === 'api' ? (
                  <>
                    <Database className="w-3 h-3 mr-1" />
                    BrasilAPI
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3 mr-1" />
                    Manual
                  </>
                )}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Preencha os dados cadastrais e informações do projeto
            {dadosEmpresa?.origem === 'api' && dadosEmpresa.consultado_em && (
              <span className="block text-xs text-muted-foreground mt-1">
                Consultado em: {formatDateTime(dadosEmpresa.consultado_em)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DadosEmpresaForm
                form={form}
                onBuscarCNPJ={handleBuscarCNPJ}
                buscandoCNPJ={buscandoCNPJ}
              />
            </form>
          </Form>
        </div>

        <DialogFooter>
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
            {exists ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
