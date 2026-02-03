import { create } from 'zustand'

interface DadosEmpresaState {
  // Map de leadId -> boolean (se tem dados ou não)
  dadosMap: Record<string, boolean>

  // Setar se um lead tem dados
  setHasDados: (leadId: string, hasDados: boolean) => void

  // Obter se um lead tem dados
  hasDados: (leadId: string) => boolean
}

export const useDadosEmpresaStore = create<DadosEmpresaState>((set, get) => ({
  dadosMap: {},

  setHasDados: (leadId: string, hasDados: boolean) => {
    set((state) => ({
      dadosMap: {
        ...state.dadosMap,
        [leadId]: hasDados
      }
    }))
  },

  hasDados: (leadId: string) => {
    return get().dadosMap[leadId] || false
  }
}))
