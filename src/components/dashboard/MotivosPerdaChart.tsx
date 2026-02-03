'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MOTIVOS_PERDA } from '@/types/lead.types'
import { AlertCircle } from 'lucide-react'

interface MotivoCount {
  motivo: string
  count: number
  label: string
}

export function MotivosPerdaChart() {
  const [motivosCounts, setMotivosCounts] = useState<MotivoCount[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchMotivosPerda()
  }, [])

  const fetchMotivosPerda = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('motivo_perda')
        .eq('etapa', 'perdido')
        .not('motivo_perda', 'is', null)

      if (error) throw error

      // Contar motivos
      const counts = MOTIVOS_PERDA.map((motivo) => ({
        motivo: motivo.value,
        label: motivo.label,
        count: (data || []).filter((lead: any) => lead.motivo_perda === motivo.value).length,
      })).filter((item) => item.count > 0)

      const totalCount = counts.reduce((sum, item) => sum + item.count, 0)

      setMotivosCounts(counts)
      setTotal(totalCount)
    } catch (error) {
      console.error('Erro ao buscar motivos de perda:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPercentage = (count: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  const getBarColor = (index: number) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-gray-500',
      'bg-indigo-500',
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Motivos de Perda
          </CardTitle>
          <CardDescription>Distribuição dos motivos de leads perdidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (motivosCounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Motivos de Perda
          </CardTitle>
          <CardDescription>Distribuição dos motivos de leads perdidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nenhum lead perdido com motivo registrado
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Motivos de Perda
        </CardTitle>
        <CardDescription>
          Distribuição dos motivos de leads perdidos ({total} {total === 1 ? 'lead' : 'leads'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {motivosCounts.map((item, index) => (
            <div key={item.motivo} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.count} ({getPercentage(item.count)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getBarColor(index)}`}
                  style={{ width: `${getPercentage(item.count)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
