'use client'

import { UseFormReturn } from 'react-hook-form'
import { LeadFormData } from '@/lib/schemas/leadSchema'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyInput } from '@/components/ui/currency-input'
import { TagInput } from '@/components/tags/TagInput'
import InputMask from 'react-input-mask'

interface LeadFormFieldsProps {
  form: UseFormReturn<LeadFormData>
  isEditing?: boolean
}

export function LeadFormFields({ form, isEditing = true }: LeadFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Seção: Informações da Empresa */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Informações do Projeto</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="empresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Projeto *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Treinamento Comercial" {...field} disabled={!isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Contato */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contato Principal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contato_nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Contato *</FormLabel>
                <FormControl>
                  <Input placeholder="João Silva" {...field} disabled={!isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contato_telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <InputMask
                    mask="(99) 99999-9999"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!isEditing}
                  >
                    {(inputProps: any) => (
                      <Input placeholder="(37) 99999-9999" {...inputProps} />
                    )}
                  </InputMask>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contato_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contato@empresa.com.br" {...field} value={field.value || ''} disabled={!isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Informações Comerciais */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Informações Comerciais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor_estimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Estimado</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="etapa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etapa Inicial</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={!isEditing}>
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="novo">🎯 Novo Lead</SelectItem>
                    <SelectItem value="contato">💬 Em Contato</SelectItem>
                    <SelectItem value="proposta">📋 Proposta Enviada</SelectItem>
                    <SelectItem value="negociacao">🤝 Negociação</SelectItem>
                    <SelectItem value="fechado">✅ Fechado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Tags */}
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Digite uma tag e pressione Enter"
              />
            </FormControl>
            <FormDescription>
              Adicione tags para organizar e filtrar seus leads
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Seção: Observações */}
      <FormField
        control={form.control}
        name="observacoes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Adicione observações sobre este lead..."
                className="resize-none"
                rows={4}
                {...field}
                value={field.value || ''}
                disabled={!isEditing}
              />
            </FormControl>
            <FormDescription>
              Informações adicionais sobre o lead (máx. 1000 caracteres)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
