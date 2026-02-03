'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TestRealtime() {
  const [logs, setLogs] = useState<string[]>([])
  const [leadId, setLeadId] = useState<string>('')
  const supabase = createClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20))
  }

  useEffect(() => {
    // Buscar primeiro lead
    const fetchLead = async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, empresa')
        .limit(1)
        .single()

      if (data) {
        setLeadId((data as any).id)
        addLog(`Lead encontrado: ${(data as any).empresa} (${(data as any).id})`)
      }
    }

    fetchLead()
  }, [])

  useEffect(() => {
    if (!leadId) return

    addLog('Configurando subscription...')

    const channel = supabase
      .channel(`test-dados-empresa:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dados_empresa',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          addLog(`🔴 EVENTO: ${payload.eventType}`)
          addLog(`Dados: ${JSON.stringify(payload.new || payload.old)}`)
        }
      )
      .subscribe((status) => {
        addLog(`Status da subscription: ${status}`)
      })

    return () => {
      addLog('Removendo subscription...')
      supabase.removeChannel(channel)
    }
  }, [leadId])

  const testInsert = async () => {
    if (!leadId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Deletar existente primeiro
      await supabase
        .from('dados_empresa')
        .delete()
        .eq('lead_id', leadId)

      addLog('Inserindo novo registro...')

      const { data, error } = await (supabase as any)
        .from('dados_empresa')
        .insert({
          lead_id: leadId,
          cnpj: '12.345.678/0001-90',
          razao_social: 'EMPRESA TESTE LTDA',
          objetivo_projeto: 'Teste de real-time subscription',
          periodo: 'integral',
          modalidade: 'presencial',
          parcelamento: '1x',
          preenchido_por: user?.id,
          origem: 'manual'
        })
        .select()
        .single()

      if (error) {
        addLog(`❌ Erro ao inserir: ${error.message}`)
      } else {
        addLog(`✅ Inserido: ${data.id}`)
      }
    } catch (err: any) {
      addLog(`❌ Erro: ${err.message}`)
    }
  }

  const testUpdate = async () => {
    if (!leadId) return

    try {
      const { data: existing } = await supabase
        .from('dados_empresa')
        .select('id')
        .eq('lead_id', leadId)
        .single()

      if (!existing) {
        addLog('❌ Nenhum registro para atualizar')
        return
      }

      addLog('Atualizando registro...')

      const { error } = await (supabase as any)
        .from('dados_empresa')
        .update({
          razao_social: `EMPRESA ATUALIZADA ${Date.now()}`
        })
        .eq('id', (existing as any).id)

      if (error) {
        addLog(`❌ Erro ao atualizar: ${error.message}`)
      } else {
        addLog(`✅ Atualizado`)
      }
    } catch (err: any) {
      addLog(`❌ Erro: ${err.message}`)
    }
  }

  const testDelete = async () => {
    if (!leadId) return

    try {
      const { data: existing } = await supabase
        .from('dados_empresa')
        .select('id')
        .eq('lead_id', leadId)
        .single()

      if (!existing) {
        addLog('❌ Nenhum registro para deletar')
        return
      }

      addLog('Deletando registro...')

      const { error } = await supabase
        .from('dados_empresa')
        .delete()
        .eq('id', (existing as any).id)

      if (error) {
        addLog(`❌ Erro ao deletar: ${error.message}`)
      } else {
        addLog(`✅ Deletado`)
      }
    } catch (err: any) {
      addLog(`❌ Erro: ${err.message}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste Real-time - Dados Empresa</h1>

      <Card className="p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Lead ID: <code className="bg-gray-100 px-2 py-1 rounded">{leadId || 'carregando...'}</code>
        </p>
        <p className="text-xs text-gray-500">
          Abra esta página em duas abas diferentes e teste os botões.
          Você deve ver as alterações em tempo real em ambas as abas.
        </p>
      </Card>

      <div className="space-x-2 mb-4">
        <Button onClick={testInsert} disabled={!leadId}>
          INSERT
        </Button>
        <Button onClick={testUpdate} variant="outline" disabled={!leadId}>
          UPDATE
        </Button>
        <Button onClick={testDelete} variant="destructive" disabled={!leadId}>
          DELETE
        </Button>
        <Button onClick={() => setLogs([])} variant="ghost">
          Limpar Logs
        </Button>
      </div>

      <Card className="p-4 bg-black text-green-400 font-mono text-sm h-96 overflow-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">Aguardando eventos...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1">
              {log}
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
