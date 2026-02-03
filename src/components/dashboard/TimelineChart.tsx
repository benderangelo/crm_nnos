'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TimelineChartProps {
  data: {
    mes: string
    quantidade: number
    valor: number
  }[]
}

export function TimelineChart({ data }: TimelineChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            formatter={(value: any, name?: string) => {
              if (name === 'Valor') return formatCurrency(value || 0)
              return value
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="quantidade"
            stroke="#2563eb"
            name="Quantidade"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="valor"
            stroke="#16a34a"
            name="Valor"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
