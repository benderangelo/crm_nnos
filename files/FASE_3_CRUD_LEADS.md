# ✏️ FASE 3: CRUD DE LEADS
**Duração estimada:** 1 semana  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 2 concluída

---

## 📋 OBJETIVO DA FASE
Implementar o CRUD completo de leads, permitindo criar, visualizar, editar e deletar (soft delete) leads através de modais/dialogs intuitivos e responsivos.

**Entregáveis:**
- ✅ Modal de criação de novo lead
- ✅ Formulário com validação completa
- ✅ Modal de visualização/detalhes do lead
- ✅ Edição de lead existente
- ✅ Soft delete com confirmação
- ✅ Validação de campos obrigatórios
- ✅ Máscaras de input (telefone, valor)
- ✅ Feedback visual de ações (toast)
- ✅ Tratamento de erros

---

## 🛠️ TECNOLOGIAS ADICIONAIS

### Novas Bibliotecas
```bash
# Validação de formulários
npm install react-hook-form @hookform/resolvers zod

# Máscaras de input
npm install react-input-mask

# Date picker
npm install react-day-picker date-fns
```

### shadcn/ui Components Adicionais
```bash
npx shadcn-ui@latest add form
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add scroll-area
```

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### Novos Arquivos
```
src/
├── lib/
│   ├── schemas/
│   │   └── leadSchema.ts              # Schemas Zod para validação
│   └── hooks/
│       └── useLeadForm.ts             # Hook customizado para formulários
├── components/
│   ├── leads/
│   │   ├── NewLeadDialog.tsx          # Modal de novo lead
│   │   ├── LeadDetailsDialog.tsx      # Modal de detalhes
│   │   ├── LeadForm.tsx               # Formulário reutilizável
│   │   ├── DeleteLeadDialog.tsx       # Confirmação de delete
│   │   └── LeadFormFields.tsx         # Campos do formulário
│   └── ui/
│       └── currency-input.tsx         # Input customizado para moeda
```

### Arquivos a Modificar
```
src/app/(dashboard)/kanban/page.tsx    # Ativar botão Novo Lead
src/components/kanban/LeadCard.tsx     # Adicionar onClick
src/lib/hooks/useLeads.ts              # Adicionar métodos CRUD
```

---

## 🎯 TAREFAS DETALHADAS

### 1. Criar Schemas de Validação

#### 1.1. Lead Schema (src/lib/schemas/leadSchema.ts)
```typescript
import { z } from 'zod'

export const leadFormSchema = z.object({
  // Informações da empresa
  empresa: z.string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(100, 'Nome da empresa deve ter no máximo 100 caracteres'),
  
  segmento: z.string().optional(),
  
  // Informações de contato
  contato_nome: z.string()
    .min(2, 'Nome do contato deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do contato deve ter no máximo 100 caracteres'),
  
  contato_telefone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido. Use o formato (XX) XXXXX-XXXX'),
  
  contato_email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  contato_cargo: z.string().optional(),
  
  // Informações comerciais
  valor_estimado: z.number()
    .min(0, 'Valor deve ser positivo')
    .default(0),
  
  etapa: z.enum(['novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido'])
    .default('novo'),
  
  origem: z.string().optional(),
  
  probabilidade: z.number()
    .min(0, 'Probabilidade mínima é 0%')
    .max(100, 'Probabilidade máxima é 100%')
    .optional(),
  
  prioridade: z.enum(['baixa', 'media', 'alta'])
    .default('media'),
  
  // Próxima ação
  proxima_acao_data: z.date().optional().nullable(),
  proxima_acao_descricao: z.string().max(200).optional(),
  
  // Tags e observações
  tags: z.array(z.string()).optional(),
  observacoes: z.string().max(1000).optional(),
  
  // Responsável
  responsavel_id: z.string().uuid().optional().nullable(),
})

export type LeadFormData = z.infer<typeof leadFormSchema>

// Schema para edição (permite campos parciais)
export const leadEditSchema = leadFormSchema.partial()
```

---

### 2. Expandir Hook useLeads

#### 2.1. Adicionar métodos CRUD (src/lib/hooks/useLeads.ts)

Adicionar as seguintes funções ao hook existente:

```typescript
// ... código existente ...

// Criar novo lead
const createLead = async (data: LeadFormData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Usuário não autenticado')

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        ...data,
        created_by: user.id,
        responsavel_id: data.responsavel_id || user.id,
        ativo: true,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Adicionar ao estado local
    setLeads((prevLeads) => [newLead, ...prevLeads])

    toast({
      title: 'Lead criado com sucesso!',
      description: `${data.empresa} foi adicionado ao pipeline.`,
    })

    return newLead
  } catch (err) {
    console.error('Erro ao criar lead:', err)
    toast({
      variant: 'destructive',
      title: 'Erro ao criar lead',
      description: 'Não foi possível criar o lead. Tente novamente.',
    })
    throw err
  }
}

// Atualizar lead
const updateLead = async (leadId: string, data: Partial<LeadFormData>) => {
  try {
    const { error: updateError } = await supabase
      .from('leads')
      .update(data)
      .eq('id', leadId)

    if (updateError) throw updateError

    // Atualizar estado local
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, ...data } : lead
      )
    )

    toast({
      title: 'Lead atualizado',
      description: 'As informações foram atualizadas com sucesso.',
    })
  } catch (err) {
    console.error('Erro ao atualizar lead:', err)
    toast({
      variant: 'destructive',
      title: 'Erro ao atualizar lead',
      description: 'Não foi possível atualizar o lead. Tente novamente.',
    })
    throw err
  }
}

// Soft delete
const deleteLead = async (leadId: string) => {
  try {
    const { error: deleteError } = await supabase
      .from('leads')
      .update({ ativo: false })
      .eq('id', leadId)

    if (deleteError) throw deleteError

    // Remover do estado local
    setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadId))

    toast({
      title: 'Lead removido',
      description: 'O lead foi removido do pipeline.',
    })
  } catch (err) {
    console.error('Erro ao deletar lead:', err)
    toast({
      variant: 'destructive',
      title: 'Erro ao remover lead',
      description: 'Não foi possível remover o lead. Tente novamente.',
    })
    throw err
  }
}

// Retornar novas funções
return {
  leads,
  loading,
  error,
  refetch: fetchLeads,
  updateLeadEtapa,
  createLead,
  updateLead,
  deleteLead,
}
```

---

### 3. Criar Componentes de Formulário

#### 3.1. Currency Input (src/components/ui/currency-input.tsx)
```typescript
'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number
  onValueChange?: (value: number) => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value))
      }
    }, [value])

    const formatCurrency = (num: number) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      
      // Remove tudo que não é número
      const numbers = input.replace(/\D/g, '')
      
      // Converte para número (divide por 100 para considerar centavos)
      const numValue = parseInt(numbers || '0') / 100
      
      setDisplayValue(formatCurrency(numValue))
      onValueChange?.(numValue)
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={cn('pl-10', className)}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
```

#### 3.2. Lead Form Fields (src/components/leads/LeadFormFields.tsx)
```typescript
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import InputMask from 'react-input-mask'
import { cn } from '@/lib/utils'

interface LeadFormFieldsProps {
  form: UseFormReturn<LeadFormData>
  isEditing?: boolean
}

export function LeadFormFields({ form, isEditing = false }: LeadFormFieldsProps) {
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
                <FormLabel>Nome da Empresa *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Construtora Silva LTDA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="segmento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Segmento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Construção Civil, Indústria, Comércio" {...field} />
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
                  <Input placeholder="João Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contato_cargo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Diretor, Gerente, etc" {...field} />
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
                  <Input type="email" placeholder="contato@empresa.com.br" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

          <FormField
            control={form.control}
            name="origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem do Lead</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Como conheceu?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="rede_social">Rede Social</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioridade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Próxima Ação */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Próxima Ação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="proxima_acao_data"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="proxima_acao_descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Enviar proposta, Agendar reunião" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

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
```

#### 3.3. New Lead Dialog (src/components/leads/NewLeadDialog.tsx)
```typescript
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      empresa: '',
      contato_nome: '',
      contato_telefone: '',
      contato_email: '',
      valor_estimado: 0,
      etapa: 'novo',
      prioridade: 'media',
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Adicione um novo lead ao pipeline comercial
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <LeadFormFields form={form} />
            </form>
          </Form>
        </ScrollArea>

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
            Criar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.4. Lead Details Dialog (src/components/leads/LeadDetailsDialog.tsx)
```typescript
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadFormFields } from './LeadFormFields'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import { leadFormSchema, LeadFormData } from '@/lib/schemas/leadSchema'
import { LeadExtended } from '@/types/lead.types'
import { useLeads } from '@/lib/hooks/useLeads'
import { Loader2, Trash2 } from 'lucide-react'

interface LeadDetailsDialogProps {
  lead: LeadExtended | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { updateLead } = useLeads()

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    values: lead ? {
      empresa: lead.empresa,
      segmento: lead.segmento || '',
      contato_nome: lead.contato_nome,
      contato_telefone: lead.contato_telefone,
      contato_email: lead.contato_email || '',
      contato_cargo: lead.contato_cargo || '',
      valor_estimado: lead.valor_estimado || 0,
      etapa: lead.etapa,
      origem: lead.origem || '',
      probabilidade: lead.probabilidade || undefined,
      prioridade: lead.prioridade || 'media',
      proxima_acao_data: lead.proxima_acao_data ? new Date(lead.proxima_acao_data) : null,
      proxima_acao_descricao: lead.proxima_acao_descricao || '',
      tags: lead.tags || [],
      observacoes: lead.observacoes || '',
      responsavel_id: lead.responsavel_id || null,
    } : undefined,
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
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{lead.empresa}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Editando informações do lead' : 'Detalhes do lead'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="historico">Histórico (Fase 4)</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-4">
              <ScrollArea className="max-h-[calc(90vh-240px)] pr-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <LeadFormFields form={form} isEditing={isEditing} />
                  </form>
                </Form>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="historico">
              <div className="text-center py-8 text-gray-500">
                <p>Histórico de interações será implementado na Fase 4</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
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
    </>
  )
}
```

#### 3.5. Delete Lead Dialog (src/components/leads/DeleteLeadDialog.tsx)
```typescript
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
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

### 4. Modificar Página Kanban

#### 4.1. Atualizar Kanban Page (src/app/(dashboard)/kanban/page.tsx)
```typescript
'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { NewLeadDialog } from '@/components/leads/NewLeadDialog'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function KanbanPage() {
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false)

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Comercial</h1>
            <p className="text-gray-500 mt-1">
              Gerencie seus leads através do funil de vendas
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="gap-2 bg-gradient-to-r from-blue-900 to-blue-700"
            onClick={() => setShowNewLeadDialog(true)}
          >
            <Plus className="w-5 h-5" />
            Novo Lead
          </Button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard />

        {/* Dialog de Novo Lead */}
        <NewLeadDialog
          open={showNewLeadDialog}
          onOpenChange={setShowNewLeadDialog}
        />
      </div>
    </PageContainer>
  )
}
```

#### 4.2. Atualizar Kanban Board (src/components/kanban/KanbanBoard.tsx)

Adicionar state e handler para abrir dialog de detalhes:

```typescript
// ... imports existentes ...
import { LeadDetailsDialog } from '@/components/leads/LeadDetailsDialog'

export function KanbanBoard() {
  // ... código existente ...
  const [selectedLead, setSelectedLead] = useState<LeadExtended | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const handleLeadClick = (lead: LeadExtended) => {
    setSelectedLead(lead)
    setShowDetailsDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* ... código existente ... */}

      <DndContext>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ETAPAS.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              leads={leadsByEtapa[etapa.id]}
              loading={loading}
              onLeadClick={handleLeadClick} // Adicionar
            />
          ))}
        </div>
        {/* ... DragOverlay ... */}
      </DndContext>

      {/* Dialog de Detalhes */}
      <LeadDetailsDialog
        lead={selectedLead}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  )
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Botão "Novo Lead" funciona
- [ ] Modal de novo lead abre e fecha
- [ ] Todos os campos do formulário funcionam
- [ ] Máscaras de telefone aplicadas
- [ ] Input de moeda formata corretamente
- [ ] Validações funcionam (campos obrigatórios)
- [ ] Lead é criado no Supabase
- [ ] Novo lead aparece no Kanban imediatamente
- [ ] Clicar em card abre detalhes
- [ ] Modal de detalhes mostra todas as informações
- [ ] Edição de lead funciona
- [ ] Mudanças persistem no banco
- [ ] Confirmação de delete aparece
- [ ] Soft delete funciona
- [ ] Toast notifications aparecem
- [ ] Formulário responsivo em mobile
- [ ] Sem erros no console

---

## 🧪 TESTES MANUAIS

### Teste 1: Criar Novo Lead
1. Clicar em "Novo Lead"
2. Preencher apenas campos obrigatórios
3. Submeter formulário
4. Verificar lead criado no Kanban
5. Verificar no Supabase Dashboard

### Teste 2: Validações
1. Tentar submeter formulário vazio
2. Verificar mensagens de erro
3. Digitar telefone incorreto
4. Verificar validação de telefone
5. Digitar email incorreto
6. Verificar validação de email

### Teste 3: Edição
1. Clicar em um card do Kanban
2. Clicar em "Editar"
3. Modificar campos
4. Salvar
5. Verificar mudanças persistidas
6. Verificar card atualizado no Kanban

### Teste 4: Delete
1. Abrir detalhes de um lead
2. Clicar em "Excluir"
3. Verificar modal de confirmação
4. Confirmar exclusão
5. Verificar lead removido do Kanban
6. Verificar no Supabase que ativo=false

### Teste 5: Responsividade
1. Testar formulário em mobile (375px)
2. Verificar que campos ficam empilhados
3. Verificar que modal ocupa tela toda
4. Verificar scroll funciona
5. Testar em tablet e desktop

---

## 🔗 PREPARAÇÃO PARA FASE 4

### Estrutura já preparada:
- ✅ Aba "Histórico" criada (placeholder)
- ✅ Modal de detalhes pronto para receber timeline
- ✅ Relacionamento lead → interacoes no banco

### O que a Fase 4 receberá:
1. CRUD de leads completo e testado
2. Modal de detalhes estruturado com tabs
3. UI patterns consistentes
4. Validações robustas

---

## 📝 NOTAS IMPORTANTES

### Validação
- ✅ Usar Zod para type-safe validation
- ✅ Mensagens em português
- ✅ Feedback visual imediato

### UX
- ✅ Loading states durante submit
- ✅ Optimistic updates quando possível
- ✅ Confirmação antes de ações destrutivas
- ✅ Toast feedback em todas as ações

### Performance
- ✅ Form validation só no submit (não onChange)
- ✅ Debounce em campos pesados (não aplicável aqui)
- ✅ Lazy load de modal components

---

## 🚀 PRÓXIMOS PASSOS (FASE 4)

Na próxima fase, implementaremos:
- Timeline de interações
- Adicionar notas rápidas
- Registrar ligações
- Histórico completo do lead
- Tipos de interação (nota, ligação, email, etc)

**Arquivo:** `FASE_4_INTERACOES.md`

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS