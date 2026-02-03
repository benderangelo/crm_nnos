'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function TestDadosEmpresa() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const supabase = createClient()

  const testInsert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User:', user)

      // Buscar um lead primeiro
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, empresa')
        .limit(1)
        .single()

      if (leadsError) throw leadsError
      console.log('Lead encontrado:', leads)

      // Tentar inserir dados
      const { data, error } = await (supabase as any)
        .from('dados_empresa')
        .insert({
          lead_id: (leads as any).id,
          cnpj: '12.345.678/0001-90',
          razao_social: 'EMPRESA TESTE LTDA',
          nome_fantasia: 'Empresa Teste',
          objetivo_projeto: 'Teste de desenvolvimento de sistema',
          periodo: 'integral',
          modalidade: 'presencial',
          parcelamento: '1x',
          preenchido_por: user?.id,
          origem: 'manual'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir:', error)
        setError(error)
      } else {
        console.log('Inserido com sucesso:', data)
        setResult(data)
      }
    } catch (err: any) {
      console.error('Erro geral:', err)
      setError(err)
    }
  }

  const testSelect = async () => {
    try {
      const { data, error } = await supabase
        .from('dados_empresa')
        .select('*')
        .limit(5)

      if (error) {
        console.error('Erro ao buscar:', error)
        setError(error)
      } else {
        console.log('Dados encontrados:', data)
        setResult(data)
      }
    } catch (err: any) {
      console.error('Erro geral:', err)
      setError(err)
    }
  }

  const testUpdate = async () => {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('dados_empresa')
        .select('id')
        .limit(1)
        .single()

      if (selectError) throw selectError

      const { data, error } = await (supabase as any)
        .from('dados_empresa')
        .update({
          razao_social: 'EMPRESA ATUALIZADA LTDA'
        })
        .eq('id', (existing as any).id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar:', error)
        setError(error)
      } else {
        console.log('Atualizado com sucesso:', data)
        setResult(data)
      }
    } catch (err: any) {
      console.error('Erro geral:', err)
      setError(err)
    }
  }

  const testDelete = async () => {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('dados_empresa')
        .select('id')
        .limit(1)
        .single()

      if (selectError) throw selectError

      const { error } = await supabase
        .from('dados_empresa')
        .delete()
        .eq('id', (existing as any).id)

      if (error) {
        console.error('Erro ao deletar:', error)
        setError(error)
      } else {
        console.log('Deletado com sucesso')
        setResult('Deletado com sucesso')
      }
    } catch (err: any) {
      console.error('Erro geral:', err)
      setError(err)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste CRUD - Dados Empresa</h1>

      <div className="space-x-2 mb-4">
        <Button onClick={testInsert}>Test INSERT</Button>
        <Button onClick={testSelect} variant="outline">Test SELECT</Button>
        <Button onClick={testUpdate} variant="outline">Test UPDATE</Button>
        <Button onClick={testDelete} variant="destructive">Test DELETE</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Erro:</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h3 className="font-bold">Resultado:</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
