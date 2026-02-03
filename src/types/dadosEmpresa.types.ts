import { Database } from './database.types'

// Tipos base do Supabase
export type DadosEmpresa = Database['public']['Tables']['dados_empresa']['Row']
export type DadosEmpresaInsert = Database['public']['Tables']['dados_empresa']['Insert']
export type DadosEmpresaUpdate = Database['public']['Tables']['dados_empresa']['Update']

// Enums
export type Periodo = 'manha' | 'tarde' | 'integral'
export type Modalidade = 'presencial' | 'virtual' | 'hibrido'
export type Parcelamento = '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x' | '11x' | '12x'
export type OrigemDados = 'manual' | 'api'

// Configurações de dropdowns
export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'integral', label: 'Integral' },
]

export const MODALIDADES: { value: Modalidade; label: string }[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrido', label: 'Híbrido' },
]

export const PARCELAMENTOS: { value: Parcelamento; label: string }[] = [
  { value: '1x', label: '1x - À vista' },
  { value: '2x', label: '2x' },
  { value: '3x', label: '3x' },
  { value: '4x', label: '4x' },
  { value: '5x', label: '5x' },
  { value: '6x', label: '6x' },
  { value: '7x', label: '7x' },
  { value: '8x', label: '8x' },
  { value: '9x', label: '9x' },
  { value: '10x', label: '10x' },
  { value: '11x', label: '11x' },
  { value: '12x', label: '12x' },
]

// Interface estendida
export interface DadosEmpresaExtended extends DadosEmpresa {
  preenchido_por_nome?: string
}
