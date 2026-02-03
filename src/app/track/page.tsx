'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ETAPAS } from '@/types/lead.types'
import { ArrowRight, User, Building2, Calendar, Search, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface MudancaEtapa {
  id: string
  lead_id: string
  etapa_anterior: string
  etapa_nova: string
  responsavel_nome: string | null
  observacao: string | null
  created_at: string
  lead?: {
    empresa: string
    contato_nome: string | null
  }
}

interface LeadComMudancas {
  id: string
  empresa: string
  contato_nome: string | null
  mudancas: MudancaEtapa[]
}

export default function TrackPage() {
  const [leadsComMudancas, setLeadsComMudancas] = useState<LeadComMudancas[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const supabase = createClient()

  const getNomeEtapa = (etapaId: string) => {
    const etapa = ETAPAS.find(e => e.id === etapaId)
    return etapa?.nome || etapaId
  }

  const getCorEtapa = (etapaId: string) => {
    const etapa = ETAPAS.find(e => e.id === etapaId)
    return etapa?.cor || '#gray'
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar todas as mudanças de etapa com dados do lead
        const { data: mudancas, error } = await supabase
          .from('mudancas_etapa')
          .select(`
            *,
            lead:leads(empresa, contato_nome)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Agrupar mudanças por lead
        const leadsMap = new Map<string, LeadComMudancas>()

        mudancas?.forEach((mudanca: any) => {
          const leadId = mudanca.lead_id
          if (!leadsMap.has(leadId)) {
            leadsMap.set(leadId, {
              id: leadId,
              empresa: mudanca.lead?.empresa || 'Lead desconhecido',
              contato_nome: mudanca.lead?.contato_nome,
              mudancas: [],
            })
          }
          leadsMap.get(leadId)!.mudancas.push(mudanca)
        })

        setLeadsComMudancas(Array.from(leadsMap.values()))
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar leads pela busca
  const leadsFiltrados = leadsComMudancas.filter(lead =>
    lead.empresa.toLowerCase().includes(busca.toLowerCase()) ||
    lead.contato_nome?.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tracking de Responsaveis</h1>
            <p className="text-gray-500 mt-1">
              Visualize quem foi responsavel por cada etapa dos leads
            </p>
          </div>
          <Link href="/kanban">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Kanban
            </Button>
          </Link>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por empresa ou contato..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de Leads */}
        {leadsFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {busca ? 'Nenhum lead encontrado para a busca.' : 'Nenhuma mudanca de etapa registrada ainda.'}
          </div>
        ) : (
          <div className="space-y-6">
            {leadsFiltrados.map((lead) => (
              <div key={lead.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Header do Lead */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-white" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">{lead.empresa}</h2>
                      {lead.contato_nome && (
                        <p className="text-blue-200 text-sm">{lead.contato_nome}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabela de Mudancas */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Etapa Anterior
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Etapa Nova
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Responsavel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observacao
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lead.mudancas.map((mudanca) => (
                        <tr key={mudanca.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getCorEtapa(mudanca.etapa_anterior)}20`,
                                color: getCorEtapa(mudanca.etapa_anterior),
                              }}
                            >
                              {getNomeEtapa(mudanca.etapa_anterior)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${getCorEtapa(mudanca.etapa_nova)}20`,
                                  color: getCorEtapa(mudanca.etapa_nova),
                                }}
                              >
                                {getNomeEtapa(mudanca.etapa_nova)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {mudanca.responsavel_nome ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {mudanca.responsavel_nome}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {mudanca.created_at
                                ? new Date(mudanca.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {mudanca.observacao ? (
                              <span className="text-sm text-gray-600">{mudanca.observacao}</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
