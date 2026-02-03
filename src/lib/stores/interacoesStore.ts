import { create } from 'zustand'
import { InteracaoExtended } from '@/types/interacao.types'

interface InteracoesState {
  // Mapa de leadId -> array de interações
  interacoesByLead: Record<string, InteracaoExtended[]>

  // Definir interações para um lead específico
  setInteracoes: (leadId: string, interacoes: InteracaoExtended[]) => void

  // Adicionar interação a um lead
  addInteracao: (leadId: string, interacao: InteracaoExtended) => void

  // Atualizar interação
  updateInteracao: (leadId: string, interacaoId: string, updates: Partial<InteracaoExtended>) => void

  // Remover interação
  removeInteracao: (leadId: string, interacaoId: string) => void

  // Obter interações de um lead específico
  getInteracoes: (leadId: string) => InteracaoExtended[]
}

export const useInteracoesStore = create<InteracoesState>((set, get) => ({
  interacoesByLead: {},

  setInteracoes: (leadId, interacoes) =>
    set((state) => ({
      interacoesByLead: {
        ...state.interacoesByLead,
        [leadId]: interacoes,
      },
    })),

  addInteracao: (leadId, interacao) =>
    set((state) => ({
      interacoesByLead: {
        ...state.interacoesByLead,
        [leadId]: [interacao, ...(state.interacoesByLead[leadId] || [])],
      },
    })),

  updateInteracao: (leadId, interacaoId, updates) =>
    set((state) => ({
      interacoesByLead: {
        ...state.interacoesByLead,
        [leadId]: (state.interacoesByLead[leadId] || []).map((interacao) =>
          interacao.id === interacaoId ? { ...interacao, ...updates } : interacao
        ),
      },
    })),

  removeInteracao: (leadId, interacaoId) =>
    set((state) => ({
      interacoesByLead: {
        ...state.interacoesByLead,
        [leadId]: (state.interacoesByLead[leadId] || []).filter(
          (interacao) => interacao.id !== interacaoId
        ),
      },
    })),

  getInteracoes: (leadId) => {
    return get().interacoesByLead[leadId] || []
  },
}))
