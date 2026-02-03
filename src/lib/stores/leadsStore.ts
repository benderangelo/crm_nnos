import { create } from 'zustand'
import { LeadExtended, LeadFilters } from '@/types/lead.types'

interface LeadsState {
  leads: LeadExtended[]
  filters: LeadFilters
  setLeads: (leads: LeadExtended[]) => void
  setFilters: (filters: LeadFilters) => void
  addLead: (lead: LeadExtended) => void
  updateLead: (leadId: string, updates: Partial<LeadExtended>) => void
  removeLead: (leadId: string) => void
}

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: [],
  filters: { periodo: 'todos' },
  setLeads: (leads) => set({ leads }),
  setFilters: (filters) => set({ filters }),
  addLead: (lead) =>
    set((state) => ({
      leads: [lead, ...state.leads],
    })),
  updateLead: (leadId, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      ),
    })),
  removeLead: (leadId) =>
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== leadId),
    })),
}))
