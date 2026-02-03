# 🎯 FASE 2: KANBAN FUNCIONAL
**Duração estimada:** 1 semana  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 1 concluída

---

## 📋 OBJETIVO DA FASE
Implementar o Kanban visual com drag-and-drop funcional, integrado ao Supabase, permitindo visualizar e movimentar leads entre as etapas do funil comercial.

**Entregáveis:**
- ✅ Visualização Kanban com 5 etapas
- ✅ Cards de leads estilizados com identidade NNOS
- ✅ Drag & Drop funcional entre colunas
- ✅ Persistência de mudanças no Supabase
- ✅ Loading states e feedback visual
- ✅ Filtros básicos (busca e período)
- ✅ Totalizadores por etapa
- ✅ Design responsivo (funciona em mobile e desktop)

---

## 🛠️ TECNOLOGIAS ADICIONAIS

### Novas Bibliotecas
```bash
# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Ícones (Lucide React)
npm install lucide-react

# Date utilities
npm install date-fns
```

### shadcn/ui Components Adicionais
```bash
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
```

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### Novos Arquivos
```
src/
├── types/
│   └── lead.types.ts                 # Tipos de Lead
├── lib/
│   ├── hooks/
│   │   └── useLeads.ts               # Hook para gerenciar leads
│   └── stores/
│       └── leadsStore.ts             # Store Zustand
├── components/
│   └── kanban/
│       ├── KanbanBoard.tsx           # Board principal
│       ├── KanbanColumn.tsx          # Coluna de etapa
│       ├── LeadCard.tsx              # Card do lead
│       ├── LeadCardSkeleton.tsx      # Loading skeleton
│       ├── KanbanFilters.tsx         # Filtros
│       └── KanbanStats.tsx           # Estatísticas
```

### Arquivos a Modificar
```
src/app/(dashboard)/kanban/page.tsx   # Implementar Kanban real
```

---

## 🎯 TAREFAS DETALHADAS

### 1. Definir Tipos TypeScript

#### 1.1. Lead Types (src/types/lead.types.ts)
```typescript
import { Database } from './database.types'

// Tipo base do Supabase
export type Lead = Database['public']['Tables']['leads']['Row']

// Tipo para inserção (sem campos auto-gerados)
export type LeadInsert = Database['public']['Tables']['leads']['Insert']

// Tipo para atualização
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

// Etapas possíveis
export type Etapa = 'novo' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'

// Interface estendida com dados calculados
export interface LeadExtended extends Lead {
  dias_na_etapa?: number
  total_interacoes?: number
  ultima_interacao?: string
  responsavel_nome?: string
}

// Config das etapas para o Kanban
export interface EtapaConfig {
  id: Etapa
  nome: string
  cor: string
  icon: string
}

export const ETAPAS: EtapaConfig[] = [
  { id: 'novo', nome: 'Novo Lead', cor: 'bg-blue-600', icon: '🎯' },
  { id: 'contato', nome: 'Em Contato', cor: 'bg-orange-500', icon: '💬' },
  { id: 'proposta', nome: 'Proposta Enviada', cor: 'bg-purple-600', icon: '📋' },
  { id: 'negociacao', nome: 'Negociação', cor: 'bg-yellow-600', icon: '🤝' },
  { id: 'fechado', nome: 'Fechado', cor: 'bg-green-600', icon: '✅' },
]

// Filtros
export interface LeadFilters {
  busca?: string
  responsavel_id?: string
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos'
}
```

---

### 2. Criar Hook de Gerenciamento de Leads

#### 2.1. useLeads Hook (src/lib/hooks/useLeads.ts)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadExtended, Etapa, LeadFilters } from '@/types/lead.types'
import { useToast } from '@/components/ui/use-toast'

export function useLeads(filters?: LeadFilters) {
  const [leads, setLeads] = useState<LeadExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Buscar leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('leads')
        .select(`
          *,
          users_profile:responsavel_id (
            nome_completo
          )
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      // Aplicar filtro de busca
      if (filters?.busca) {
        query = query.or(`empresa.ilike.%${filters.busca}%,contato_nome.ilike.%${filters.busca}%`)
      }

      // Aplicar filtro de responsável
      if (filters?.responsavel_id) {
        query = query.eq('responsavel_id', filters.responsavel_id)
      }

      // Aplicar filtro de período
      if (filters?.periodo && filters.periodo !== 'todos') {
        const now = new Date()
        let dateFrom: Date

        switch (filters.periodo) {
          case 'hoje':
            dateFrom = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'semana':
            dateFrom = new Date(now.setDate(now.getDate() - 7))
            break
          case 'mes':
            dateFrom = new Date(now.setMonth(now.getMonth() - 1))
            break
        }

        query = query.gte('created_at', dateFrom.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Processar dados
      const processedLeads: LeadExtended[] = (data || []).map((lead) => ({
        ...lead,
        responsavel_nome: lead.users_profile?.nome_completo,
        dias_na_etapa: calculateDaysInStage(lead.data_entrada_etapa),
      }))

      setLeads(processedLeads)
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcular dias na etapa
  const calculateDaysInStage = (dataEntrada: string | null): number => {
    if (!dataEntrada) return 0
    const now = new Date()
    const entrada = new Date(dataEntrada)
    const diff = now.getTime() - entrada.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Atualizar etapa de um lead
  const updateLeadEtapa = async (leadId: string, novaEtapa: Etapa) => {
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          etapa: novaEtapa,
          // data_entrada_etapa será atualizada pelo trigger
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Atualizar estado local imediatamente (optimistic update)
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId
            ? { ...lead, etapa: novaEtapa, dias_na_etapa: 0 }
            : lead
        )
      )

      toast({
        title: 'Lead atualizado',
        description: 'A etapa do lead foi atualizada com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao atualizar lead:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: 'Não foi possível atualizar o lead. Tente novamente.',
      })
      // Reverter mudança otimista em caso de erro
      fetchLeads()
    }
  }

  // Buscar ao montar e quando filtros mudarem
  useEffect(() => {
    fetchLeads()
  }, [filters?.busca, filters?.responsavel_id, filters?.periodo])

  // Revalidar a cada 30 segundos (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    updateLeadEtapa,
  }
}
```

---

### 3. Criar Store Zustand (opcional, mas recomendado)

#### 3.1. Leads Store (src/lib/stores/leadsStore.ts)
```typescript
import { create } from 'zustand'
import { LeadExtended, LeadFilters } from '@/types/lead.types'

interface LeadsState {
  leads: LeadExtended[]
  filters: LeadFilters
  setLeads: (leads: LeadExtended[]) => void
  setFilters: (filters: LeadFilters) => void
  updateLead: (leadId: string, updates: Partial<LeadExtended>) => void
}

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: [],
  filters: { periodo: 'todos' },
  setLeads: (leads) => set({ leads }),
  setFilters: (filters) => set({ filters }),
  updateLead: (leadId, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      ),
    })),
}))
```

---

### 4. Criar Componentes do Kanban

#### 4.1. LeadCard (src/components/kanban/LeadCard.tsx)
```typescript
'use client'

import { LeadExtended } from '@/types/lead.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPhone } from '@/lib/utils/formatters'
import { Phone, Mail, Calendar, Clock } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  lead: LeadExtended
  onClick?: () => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Cor baseada em dias na etapa
  const getDaysColor = (dias: number | undefined) => {
    if (!dias) return 'text-green-600'
    if (dias <= 7) return 'text-green-600'
    if (dias <= 14) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className="p-4 cursor-move hover:shadow-lg transition-shadow bg-white border border-gray-200"
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2 line-clamp-2">
            {lead.empresa}
          </h4>
          <Badge
            variant="secondary"
            className={cn('text-xs font-bold whitespace-nowrap', getDaysColor(lead.dias_na_etapa))}
          >
            {lead.dias_na_etapa || 0}d
          </Badge>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3" />
            <span>{lead.contato_nome}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3" />
            <span className="truncate">{formatPhone(lead.contato_telefone)}</span>
          </div>
        </div>

        {/* Value & Next Action */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-900">
              {formatCurrency(lead.valor_estimado || 0)}
            </span>
            {lead.proxima_acao_data && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(lead.proxima_acao_data).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags (se houver) */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {lead.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{lead.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
```

#### 4.2. LeadCardSkeleton (src/components/kanban/LeadCardSkeleton.tsx)
```typescript
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LeadCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    </Card>
  )
}
```

#### 4.3. KanbanColumn (src/components/kanban/KanbanColumn.tsx)
```typescript
'use client'

import { LeadExtended, EtapaConfig } from '@/types/lead.types'
import { LeadCard } from './LeadCard'
import { LeadCardSkeleton } from './LeadCardSkeleton'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  etapa: EtapaConfig
  leads: LeadExtended[]
  loading?: boolean
  onLeadClick?: (lead: LeadExtended) => void
}

export function KanbanColumn({ etapa, leads, loading, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
  })

  const totalValor = leads.reduce((sum, lead) => sum + (lead.valor_estimado || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn('rounded-t-lg p-4', etapa.cor)}>
        <div className="flex items-center justify-between mb-2 text-gray">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{etapa.icon}</span>
            <h3 className="font-semibold text-sm uppercase tracking-wide">
              {etapa.nome}
            </h3>
          </div>
          <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs font-bold">
            {leads.length}
          </span>
        </div>
        <p className="text-xs font-semibold opacity-90 text-gray">
          {formatCurrency(totalValor)}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 bg-gray-100 rounded-b-lg p-3 space-y-3 min-h-[500px] transition-colors',
          isOver && 'bg-blue-50 ring-2 ring-blue-400 ring-inset'
        )}
      >
        {loading ? (
          <>
            <LeadCardSkeleton />
            <LeadCardSkeleton />
            <LeadCardSkeleton />
          </>
        ) : (
          <SortableContext
            items={leads.map((lead) => lead.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick?.(lead)}
              />
            ))}
          </SortableContext>
        )}

        {!loading && leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Arraste leads para cá
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 4.4. KanbanStats (src/components/kanban/KanbanStats.tsx)
```typescript
'use client'

import { LeadExtended } from '@/types/lead.types'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'

interface KanbanStatsProps {
  leads: LeadExtended[]
}

export function KanbanStats({ leads: allLeads }: KanbanStatsProps) {
  const totalPipeline = allLeads.reduce((sum, lead) => sum + (lead.valor_estimado || 0), 0)
  const ticketMedio = allLeads.length > 0 ? totalPipeline / allLeads.length : 0
  
  // Calcular taxa de conversão (simplificado)
  const fechados = allLeads.filter(l => l.etapa === 'fechado').length
  const taxaConversao = allLeads.length > 0 ? (fechados / allLeads.length) * 100 : 0

  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total em Pipeline</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(totalPipeline)}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(ticketMedio)}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Leads Ativos</p>
          <p className="text-2xl font-bold text-blue-900">{allLeads.length}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-green-600">
            {taxaConversao.toFixed(0)}%
          </p>
        </div>
      </div>
    </Card>
  )
}
```

#### 4.5. KanbanFilters (src/components/kanban/KanbanFilters.tsx)
```typescript
'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadFilters } from '@/types/lead.types'
import { Search, X } from 'lucide-react'

interface KanbanFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
}

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Busca */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por empresa ou contato..."
          className="pl-10 pr-10"
          value={filters.busca || ''}
          onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
        />
        {filters.busca && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onFiltersChange({ ...filters, busca: '' })}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Período */}
      <Select
        value={filters.periodo || 'todos'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, periodo: value as any })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="semana">Última semana</SelectItem>
          <SelectItem value="mes">Último mês</SelectItem>
          <SelectItem value="todos">Todos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

#### 4.6. KanbanBoard (src/components/kanban/KanbanBoard.tsx)
```typescript
'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { LeadCard } from './LeadCard'
import { ETAPAS, LeadExtended, Etapa, LeadFilters } from '@/types/lead.types'
import { useLeads } from '@/lib/hooks/useLeads'
import { KanbanFilters } from './KanbanFilters'
import { KanbanStats } from './KanbanStats'

export function KanbanBoard() {
  const [filters, setFilters] = useState<LeadFilters>({ periodo: 'todos' })
  const { leads, loading, updateLeadEtapa } = useLeads(filters)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requer mover 8px antes de ativar drag
      },
    })
  )

  // Agrupar leads por etapa
  const leadsByEtapa = ETAPAS.reduce((acc, etapa) => {
    acc[etapa.id] = leads.filter((lead) => lead.etapa === etapa.id)
    return acc
  }, {} as Record<Etapa, LeadExtended[]>)

  // Handler para início do drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handler para fim do drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const leadId = active.id as string
    const novaEtapa = over.id as Etapa

    // Encontrar o lead que está sendo movido
    const lead = leads.find((l) => l.id === leadId)

    if (lead && lead.etapa !== novaEtapa) {
      // Atualizar etapa
      updateLeadEtapa(leadId, novaEtapa)
    }

    setActiveId(null)
  }

  // Encontrar lead ativo para DragOverlay
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <KanbanFilters filters={filters} onFiltersChange={setFilters} />

      {/* Estatísticas */}
      <KanbanStats leads={leads} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ETAPAS.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              leads={leadsByEtapa[etapa.id]}
              loading={loading}
            />
          ))}
        </div>

        {/* Overlay durante drag */}
        <DragOverlay>
          {activeLead ? (
            <div className="rotate-3">
              <LeadCard lead={activeLead} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
```

---

### 5. Implementar Página Kanban

#### 5.1. Kanban Page (src/app/(dashboard)/kanban/page.tsx)
```typescript
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function KanbanPage() {
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
          
          {/* Botão Novo Lead - será implementado na FASE 3 */}
          <Button 
            size="lg" 
            className="gap-2 bg-gradient-to-r from-blue-900 to-blue-700"
            disabled
          >
            <Plus className="w-5 h-5" />
            Novo Lead
          </Button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard />
      </div>
    </PageContainer>
  )
}
```

---

## 📱 RESPONSIVIDADE

### Breakpoints Tailwind
- **Mobile:** < 768px → 1 coluna (scroll vertical entre etapas)
- **Tablet:** 768px - 1024px → 3 colunas
- **Desktop:** > 1024px → 5 colunas

### Testes de Responsividade
1. **Mobile (375px):**
   - Cards devem ter largura completa
   - Scroll horizontal entre etapas (se necessário)
   - Touch target mínimo 44x44px
   - Drag funcional com toque

2. **Tablet (768px):**
   - 3 colunas visíveis
   - Cards legíveis
   - Navegação entre etapas suave

3. **Desktop (1440px):**
   - 5 colunas visíveis
   - Espaçamento adequado
   - Hover states funcionando

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Leads são buscados do Supabase
- [ ] Kanban renderiza com 5 etapas
- [ ] Cards mostram todas as informações corretamente
- [ ] Drag & drop funciona entre etapas
- [ ] Mudanças persistem no banco de dados
- [ ] Trigger registra mudanças em `mudancas_etapa`
- [ ] Loading states aparecem durante fetch
- [ ] Filtro de busca funciona
- [ ] Filtro de período funciona
- [ ] Estatísticas calculam corretamente
- [ ] Design responsivo funciona em todas as telas
- [ ] Toast notifications aparecem em ações
- [ ] Sem erros no console
- [ ] ESLint sem warnings

---

## 🧪 TESTES MANUAIS

### Teste 1: Visualização Inicial
1. Acessar `/kanban`
2. Verificar que leads aparecem nas etapas corretas
3. Verificar totalizadores (quantidade e valor por etapa)
4. Verificar estatísticas no rodapé

### Teste 2: Drag & Drop
1. Arrastar um lead da etapa "Novo" para "Em Contato"
2. Verificar animação suave
3. Verificar que lead aparece na nova coluna
4. Atualizar página e verificar persistência
5. Verificar no Supabase Dashboard que `mudancas_etapa` foi registrada

### Teste 3: Filtros
1. Digitar nome de empresa na busca
2. Verificar que apenas leads correspondentes aparecem
3. Selecionar "Última semana" no filtro de período
4. Verificar que apenas leads recentes aparecem
5. Limpar filtros e verificar que todos voltam

### Teste 4: Responsividade
1. Testar em tela de 375px (mobile)
2. Testar em tela de 768px (tablet)
3. Testar em tela de 1440px (desktop)
4. Verificar que drag funciona em todas
5. Verificar que não há scroll horizontal indesejado

### Teste 5: Performance
1. Criar 50 leads de teste
2. Verificar tempo de carregamento (< 2s esperado)
3. Verificar que drag continua suave
4. Verificar que não há lag ao filtrar

---

## 🔗 PREPARAÇÃO PARA FASE 3

### Estrutura já preparada:
- ✅ Botão "Novo Lead" criado (disabled)
- ✅ Pasta `src/components/leads/` criada (vazia)
- ✅ Função `onClick` nos cards (preparada para modal)
- ✅ Tipos `LeadInsert` e `LeadUpdate` definidos

### O que a Fase 3 receberá:
1. Kanban funcional e estável
2. Sistema de atualização de leads testado
3. UI patterns estabelecidos
4. Integração com Supabase validada

---

## 📝 NOTAS IMPORTANTES

### Performance
- ✅ Usar `SortableContext` para otimizar drag and drop
- ✅ Implementar optimistic updates para melhor UX
- ✅ Debounce no filtro de busca (300ms)

### Tratamento de Erros
- ✅ Mostrar toast em caso de erro de conexão
- ✅ Mensagem clara: "Verifique sua conexão com a internet"
- ✅ Não mostrar dados desatualizados em caso de erro

### Acessibilidade
- ✅ Drag & drop acessível via teclado (dnd-kit suporta)
- ✅ Labels apropriados em inputs
- ✅ Contraste de cores adequado

---

## 🚀 PRÓXIMOS PASSOS (FASE 3)

Na próxima fase, implementaremos:
- Modal/Dialog de novo lead
- Formulário com validação
- Modal de detalhes do lead
- Edição de lead existente
- Soft delete de lead

**Arquivo:** `FASE_3_CRUD_LEADS.md`

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS