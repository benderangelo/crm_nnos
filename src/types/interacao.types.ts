import { Database } from './database.types'

// Tipos de interação
export type TipoInteracao = 'nota' | 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'proposta' | 'outro'

// Resultado da interação
export type ResultadoInteracao = 'positivo' | 'negativo' | 'neutro'

// Interface base de interação (sem dependência de Supabase)
export interface Interacao {
  id: string
  lead_id: string
  usuario_id: string | null
  tipo: TipoInteracao
  titulo: string | null
  descricao: string
  duracao_minutos: number | null
  resultado: ResultadoInteracao | null
  created_at: string
}

// Tipo para inserção
export interface InteracaoInsert {
  lead_id: string
  usuario_id?: string
  tipo: TipoInteracao
  titulo?: string
  descricao: string
  duracao_minutos?: number
  resultado?: ResultadoInteracao
}

// Interface estendida com dados de usuário
export interface InteracaoExtended extends Interacao {
  usuario_nome?: string
}

// Config dos tipos de interação
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
