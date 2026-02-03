'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { interacaoFormSchema, InteracaoFormData } from '@/lib/schemas/interacaoSchema'
import { TIPOS_INTERACAO } from '@/types/interacao.types'
import { Loader2 } from 'lucide-react'

interface NewInteracaoFormProps {
  onSubmit: (data: InteracaoFormData) => Promise<void>
  defaultTipo?: string
}

export function NewInteracaoForm({ onSubmit, defaultTipo = 'nota' }: NewInteracaoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InteracaoFormData>({
    resolver: zodResolver(interacaoFormSchema),
    defaultValues: {
      tipo: defaultTipo as any,
      titulo: '',
      descricao: '',
      duracao_minutos: undefined,
      resultado: undefined,
    },
  })

  const handleSubmit = async (data: InteracaoFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      form.reset()
    } catch (error) {
      // Erro já tratado
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTipo = form.watch('tipo')
  const showDuracao = ['ligacao', 'reuniao'].includes(selectedTipo)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Tipo */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Interação</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIPOS_INTERACAO.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      <span className="flex items-center gap-2">
                        <span>{tipo.icon}</span>
                        <span>{tipo.nome}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título (opcional) */}
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Primeira ligação, Envio de proposta..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o que aconteceu nesta interação..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Duração (apenas para ligação/reunião) */}
          {showDuracao && (
            <FormField
              control={form.control}
              name="duracao_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Resultado */}
          <FormField
            control={form.control}
            name="resultado"
            render={({ field }) => (
              <FormItem className={showDuracao ? '' : 'col-span-2'}>
                <FormLabel>Resultado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="positivo">✅ Positivo</SelectItem>
                    <SelectItem value="neutro">➖ Neutro</SelectItem>
                    <SelectItem value="negativo">❌ Negativo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botão Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Interação
        </Button>
      </form>
    </Form>
  )
}
