# 💬 FASE 4: INTERAÇÕES & TIMELINE
**Duração estimada:** 1 semana  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 3 concluída

---

## 📋 OBJETIVO DA FASE
Implementar sistema completo de interações com leads, permitindo registrar e visualizar histórico de atividades (notas, ligações, emails, reuniões) em uma timeline cronológica.

**Entregáveis:**
- ✅ Timeline de interações no modal de detalhes
- ✅ Formulário para adicionar interações
- ✅ Tipos de interação (nota, ligação, email, reunião, whatsapp)
- ✅ Edição e exclusão de interações
- ✅ Filtros por tipo de interação
- ✅ Botões de ação rápida nos cards
- ✅ Contador de interações no card
- ✅ Data da última interação visível

---

## 🛠️ TECNOLOGIAS ADICIONAIS

### Novas Bibliotecas
```bash
# Formatação de datas relativas
npm install date-fns

# Ícones adicionais (já instalado, mas confirmar)
# lucide-react
```

### shadcn/ui Components Adicionais
```bash
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add hover-card
```
---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### Novos Arquivos
```
src/
├── types/
│   └── interacao.types.ts              # Tipos de Interação
├── lib/
│   ├── hooks/
│   │   └── useInteracoes.ts            # Hook para interações
│   └── schemas/
│       └── interacaoSchema.ts          # Schema Zod
├── components/
│   └── interacoes/
│       ├── InteracoesTimeline.tsx      # Timeline principal
│       ├── InteracaoCard.tsx           # Card de interação
│       ├── NewInteracaoForm.tsx        # Formulário de nova interação
│       ├── InteracaoTypeIcon.tsx       # Ícone por tipo
│       └── QuickActions.tsx            # Ações rápidas (ligar, whatsapp)
```

### Arquivos a Modificar
```
src/components/leads/LeadDetailsDialog.tsx  # Adicionar timeline
src/components/kanban/LeadCard.tsx          # Adicionar contador e botões
```

---

## 🎯 TAREFAS DETALHADAS

### 1. Definir Tipos TypeScript

#### 1.1. Interacao Types (src/types/interacao.types.ts)
```typescript
import { Database } from './database.types'

// Tipo base do Supabase
export type Interacao = Database['public']['Tables']['interacoes']['Row']

// Tipo para inserção
export type InteracaoInsert = Database['public']['Tables']['interacoes']['Insert']

// Tipos de interação
export type TipoInteracao = 'nota' | 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'proposta' | 'outro'

// Resultado da interação
export type ResultadoInteracao = 'positivo' | 'negativo' | 'neutro'

// Interface estendida
export interface InteracaoExtended extends Interacao {
  usuario_nome?: string
}

// Config dos tipos
export interface TipoInteracaoConfig {
  id: TipoInteracao
  nome: string
  icon: string
  cor: string
}

export const TIPOS_INTERACAO: TipoInteracaoConfig[] = [
  { id: 'nota', nome: 'Nota', icon: '📝', cor: 'text-gray-600' },
  { id: 'ligacao', nome: 'Ligação', icon: '📞', cor: 'text-blue-600' },
  { id: 'email', nome: 'Email', icon: '✉️', cor: 'text-purple-600' },
  { id: 'reuniao', nome: 'Reunião', icon: '🤝', cor: 'text-green-600' },
  { id: 'whatsapp', nome: 'WhatsApp', icon: '💬', cor: 'text-green-500' },
  { id: 'proposta', nome: 'Proposta', icon: '📋', cor: 'text-orange-600' },
  { id: 'outro', nome: 'Outro', icon: '📌', cor: 'text-gray-500' },
]
```

---

### 2. Criar Schema de Validação

#### 2.1. Interacao Schema (src/lib/schemas/interacaoSchema.ts)
```typescript
import { z } from 'zod'

export const interacaoFormSchema = z.object({
  tipo: z.enum(['nota', 'ligacao', 'email', 'reuniao', 'whatsapp', 'proposta', 'outro']),
  
  titulo: z.string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .optional(),
  
  descricao: z.string()
    .min(5, 'Descrição deve ter pelo menos 5 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  
  duracao_minutos: z.number()
    .min(0, 'Duração deve ser positiva')
    .optional(),
  
  resultado: z.enum(['positivo', 'negativo', 'neutro']).optional(),
})

export type InteracaoFormData = z.infer<typeof interacaoFormSchema>
```

---

### 3. Criar Hook de Interações

#### 3.1. useInteracoes Hook (src/lib/hooks/useInteracoes.ts)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InteracaoExtended, InteracaoFormData } from '@/types/interacao.types'
import { useToast } from '@/components/ui/use-toast'

export function useInteracoes(leadId: string) {
  const [interacoes, setInteracoes] = useState<InteracaoExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Buscar interações
  const fetchInteracoes = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('interacoes')
        .select(`
          *,
          users_profile:usuario_id (
            nome_completo
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const processedInteracoes: InteracaoExtended[] = (data || []).map((interacao) => ({
        ...interacao,
        usuario_nome: interacao.users_profile?.nome_completo,
      }))

      setInteracoes(processedInteracoes)
    } catch (err) {
      console.error('Erro ao buscar interações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Criar nova interação
  const createInteracao = async (data: InteracaoFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Usuário não autenticado')

      const { data: newInteracao, error: insertError } = await supabase
        .from('interacoes')
        .insert({
          ...data,
          lead_id: leadId,
          usuario_id: user.id,
        })
        .select(`
          *,
          users_profile:usuario_id (
            nome_completo
          )
        `)
        .single()

      if (insertError) throw insertError

      // Adicionar ao estado local
      setInteracoes((prev) => [
        { ...newInteracao, usuario_nome: newInteracao.users_profile?.nome_completo },
        ...prev,
      ])

      toast({
        title: 'Interação registrada',
        description: 'A interação foi adicionada ao histórico.',
      })

      return newInteracao
    } catch (err) {
      console.error('Erro ao criar interação:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar interação',
        description: 'Não foi possível registrar a interação. Tente novamente.',
      })
      throw err
    }
  }

  // Atualizar interação
  const updateInteracao = async (interacaoId: string, data: Partial<InteracaoFormData>) => {
    try {
      const { error: updateError } = await supabase
        .from('interacoes')
        .update(data)
        .eq('id', interacaoId)

      if (updateError) throw updateError

      setInteracoes((prev) =>
        prev.map((interacao) =>
          interacao.id === interacaoId ? { ...interacao, ...data } : interacao
        )
      )

      toast({
        title: 'Interação atualizada',
        description: 'A interação foi atualizada com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao atualizar interação:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar interação',
        description: 'Não foi possível atualizar. Tente novamente.',
      })
      throw err
    }
  }

  // Deletar interação
  const deleteInteracao = async (interacaoId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('interacoes')
        .delete()
        .eq('id', interacaoId)

      if (deleteError) throw deleteError

      setInteracoes((prev) => prev.filter((i) => i.id !== interacaoId))

      toast({
        title: 'Interação removida',
        description: 'A interação foi removida do histórico.',
      })
    } catch (err) {
      console.error('Erro ao deletar interação:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover interação',
        description: 'Não foi possível remover. Tente novamente.',
      })
      throw err
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchInteracoes()
    }
  }, [leadId])

  return {
    interacoes,
    loading,
    error,
    refetch: fetchInteracoes,
    createInteracao,
    updateInteracao,
    deleteInteracao,
  }
}
```

---

### 4. Criar Componentes de Interações

#### 4.1. InteracaoTypeIcon (src/components/interacoes/InteracaoTypeIcon.tsx)
```typescript
import { TIPOS_INTERACAO, TipoInteracao } from '@/types/interacao.types'
import { cn } from '@/lib/utils'

interface InteracaoTypeIconProps {
  tipo: TipoInteracao
  size?: 'sm' | 'md' | 'lg'
}

export function InteracaoTypeIcon({ tipo, size = 'md' }: InteracaoTypeIconProps) {
  const config = TIPOS_INTERACAO.find((t) => t.id === tipo)
  
  if (!config) return null

  const sizeClasses = {
    sm: 'w-6 h-6 text-lg',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-14 h-14 text-3xl',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gray-100',
        sizeClasses[size]
      )}
    >
      <span>{config.icon}</span>
    </div>
  )
}
```

#### 4.2. InteracaoCard (src/components/interacoes/InteracaoCard.tsx)
```typescript
'use client'

import { useState } from 'react'
import { InteracaoExtended } from '@/types/interacao.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InteracaoTypeIcon } from './InteracaoTypeIcon'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InteracaoCardProps {
  interacao: InteracaoExtended
  onEdit?: () => void
  onDelete?: () => void
}

export function InteracaoCard({ interacao, onEdit, onDelete }: InteracaoCardProps) {
  const timeAgo = formatDistanceToNow(new Date(interacao.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  const getResultadoBadge = () => {
    if (!interacao.resultado) return null

    const variants = {
      positivo: { label: 'Positivo', className: 'bg-green-100 text-green-800' },
      negativo: { label: 'Negativo', className: 'bg-red-100 text-red-800' },
      neutro: { label: 'Neutro', className: 'bg-gray-100 text-gray-800' },
    }

    const variant = variants[interacao.resultado]

    return (
      <Badge variant="secondary" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        {/* Ícone do tipo */}
        <InteracaoTypeIcon tipo={interacao.tipo} size="md" />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {interacao.titulo && (
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {interacao.titulo}
                </h4>
              )}
              <p className="text-xs text-gray-500">
                {interacao.usuario_nome || 'Usuário'} · {timeAgo}
              </p>
            </div>

            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Descrição */}
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
            {interacao.descricao}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {getResultadoBadge()}
            
            {interacao.duracao_minutos && (
              <Badge variant="outline" className="text-xs">
                {interacao.duracao_minutos} min
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
```

#### 4.3. NewInteracaoForm (src/components/interacoes/NewInteracaoForm.tsx)
```typescript
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormItem>
                <FormLabel>Resultado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
```

#### 4.4. InteracoesTimeline (src/components/interacoes/InteracoesTimeline.tsx)
```typescript
'use client'

import { useState } from 'react'
import { useInteracoes } from '@/lib/hooks/useInteracoes'
import { InteracaoCard } from './InteracaoCard'
import { NewInteracaoForm } from './NewInteracaoForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus } from 'lucide-react'
import { InteracaoFormData } from '@/lib/schemas/interacaoSchema'
import { Skeleton } from '@/components/ui/skeleton'

interface InteracoesTimelineProps {
  leadId: string
}

export function InteracoesTimeline({ leadId }: InteracoesTimelineProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const { interacoes, loading, createInteracao, deleteInteracao } = useInteracoes(leadId)

  const handleCreateInteracao = async (data: InteracaoFormData) => {
    await createInteracao(data)
    setShowNewForm(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botão Adicionar */}
      {!showNewForm && (
        <Button
          onClick={() => setShowNewForm(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Interação
        </Button>
      )}

      {/* Formulário */}
      {showNewForm && (
        <Card className="p-4">
          <NewInteracaoForm onSubmit={handleCreateInteracao} />
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setShowNewForm(false)}
          >
            Cancelar
          </Button>
        </Card>
      )}

      <Separator />

      {/* Timeline */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {interacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma interação registrada ainda</p>
              <p className="text-sm mt-2">
                Adicione a primeira interação com este lead
              </p>
            </div>
          ) : (
            interacoes.map((interacao) => (
              <InteracaoCard
                key={interacao.id}
                interacao={interacao}
                onDelete={() => deleteInteracao(interacao.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

#### 4.5. Quick Actions (src/components/interacoes/QuickActions.tsx)
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Phone, MessageCircle } from 'lucide-react'
import { useInteracoes } from '@/lib/hooks/useInteracoes'
import { useToast } from '@/components/ui/use-toast'

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
```

---

### 5. Integrar com Componentes Existentes

#### 5.1. Atualizar LeadDetailsDialog

Modificar a aba "Histórico":

```typescript
// ... imports existentes ...
import { InteracoesTimeline } from '@/components/interacoes/InteracoesTimeline'
import { QuickActions } from '@/components/interacoes/QuickActions'

// Dentro do TabsContent de histórico:
<TabsContent value="historico" className="space-y-4">
  {/* Ações Rápidas */}
  <QuickActions leadId={lead.id} telefone={lead.contato_telefone} />
  
  <Separator />
  
  {/* Timeline */}
  <InteracoesTimeline leadId={lead.id} />
</TabsContent>
```

#### 5.2. Atualizar LeadCard

Adicionar contador de interações e última interação:

```typescript
// ... imports existentes ...
import { useInteracoes } from '@/lib/hooks/useInteracoes'

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { interacoes } = useInteracoes(lead.id)
  
  // ... código existente ...

  // Adicionar após o valor:
  {interacoes.length > 0 && (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <MessageCircle className="w-3 h-3" />
        <span>{interacoes.length} interações</span>
      </div>
    </div>
  )}
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Timeline renderiza interações corretamente
- [ ] Formulário de nova interação funciona
- [ ] Tipos de interação implementados
- [ ] Ícones corretos para cada tipo
- [ ] Edição de interação funciona
- [ ] Exclusão de interação funciona
- [ ] Contador de interações no card
- [ ] Botão "Ligar" abre discador
- [ ] Botão "WhatsApp" abre WhatsApp
- [ ] Ações rápidas registram interações
- [ ] Timeline responsiva em mobile
- [ ] Scroll funciona na timeline
- [ ] Sem erros no console

---

## 🧪 TESTES MANUAIS

### Teste 1: Criar Interação
1. Abrir detalhes de um lead
2. Ir para aba "Histórico"
3. Clicar em "Adicionar Interação"
4. Preencher formulário
5. Submeter
6. Verificar que aparece na timeline

### Teste 2: Ações Rápidas
1. Clicar em "Ligar" no modal de detalhes
2. Verificar que abre discador
3. Verificar que registrou interação
4. Clicar em "WhatsApp"
5. Verificar que abre WhatsApp
6. Verificar que registrou interação

### Teste 3: Timeline
1. Criar várias interações de tipos diferentes
2. Verificar ordem cronológica (mais recente primeiro)
3. Verificar ícones corretos
4. Verificar badges de resultado
5. Verificar tempo relativo ("há 2 minutos")

### Teste 4: Contador
1. Verificar que cards mostram número de interações
2. Criar nova interação
3. Verificar que contador atualiza

---

## 🔗 PREPARAÇÃO PARA FASE 5

### Estrutura já preparada:
- ✅ Histórico completo de interações
- ✅ Dados para calcular métricas avançadas
- ✅ Sistema de registro funcional

### O que a Fase 5 receberá:
1. Dados de interações para análises
2. Base para calcular ciclo de vendas
3. Histórico para relatórios

---

## 📝 NOTAS IMPORTANTES

### Performance
- ✅ Carregar interações sob demanda (só quando abrir detalhes)
- ✅ Limitar scroll da timeline (virtualized scroll se >100 itens)
- ✅ Cache de interações enquanto modal aberto

### UX
- ✅ Feedback visual em ações rápidas
- ✅ Confirmação antes de deletar interação
- ✅ Loading states visíveis

---

## 🚀 PRÓXIMOS PASSOS (FASE 5)

Na próxima fase, implementaremos:
- Dashboard avançado
- Gráficos de funil
- Métricas de performance
- Relatórios exportáveis

**Arquivo:** `FASE_5_DASHBOARD.md`

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS