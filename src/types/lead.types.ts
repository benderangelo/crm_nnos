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
  { id: 'novo', nome: 'Novo Lead', cor: 'bg-gray-100 border border-gray-300', icon: '🎯' },
  { id: 'contato', nome: 'Em Contato', cor: 'bg-gray-100 border border-gray-300', icon: '💬' },
  { id: 'proposta', nome: 'Proposta Enviada', cor: 'bg-gray-100 border border-gray-300', icon: '📋' },
  { id: 'negociacao', nome: 'Negociação', cor: 'bg-gray-100 border border-gray-300', icon: '🤝' },
  { id: 'fechado', nome: 'Fechado', cor: 'bg-gray-100 border border-gray-300', icon: '✅' },
  { id: 'perdido', nome: 'Perdido', cor: 'bg-red-50 border border-red-300', icon: '💔' },
]

// Filtros
export interface LeadFilters {
  busca?: string
  responsavel_id?: string
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos'
}

// Motivos de perda
export type MotivoPerda =
  | 'fechou_concorrente'
  | 'sem_budget'
  | 'preco_alto'
  | 'prazo'
  | 'proposta_tecnica'
  | 'mudanca_diretoria'
  | 'projeto_cancelado'
  | 'outro'

export interface MotivoConfig {
  value: MotivoPerda
  label: string
}

export const MOTIVOS_PERDA: MotivoConfig[] = [
  { value: 'fechou_concorrente', label: 'Fechou com Concorrente' },
  { value: 'sem_budget', label: 'Sem Orçamento' },
  { value: 'preco_alto', label: 'Preço Alto' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'proposta_tecnica', label: 'Proposta Técnica Inadequada' },
  { value: 'mudanca_diretoria', label: 'Mudança de Diretoria' },
  { value: 'projeto_cancelado', label: 'Projeto Cancelado' },
  { value: 'outro', label: 'Outro' },
]
