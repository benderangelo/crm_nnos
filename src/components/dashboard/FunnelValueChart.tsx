'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FunnelValueChartProps {
    data: {
        etapa: string
        quantidade: number
        valor: number
    }[]
}

const ETAPA_LABELS = {
    novo: 'Novo Lead',
    contato: 'Em Contato',
    proposta: 'Proposta',
    negociacao: 'Negociação',
    fechado: 'Fechado',
}

const ETAPA_COLORS = {
    novo: '#60a5fa',
    contato: '#3b82f6',
    proposta: '#2563eb',
    negociacao: '#1d4ed8',
    fechado: '#16a34a',
}

export function FunnelValueChart({ data }: FunnelValueChartProps) {
    const chartData = data.map(item => ({
        ...item,
        name: ETAPA_LABELS[item.etapa as keyof typeof ETAPA_LABELS],
        color: ETAPA_COLORS[item.etapa as keyof typeof ETAPA_COLORS],
    }))

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Funil de Vendas (Valor)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                        tickFormatter={(value) => formatCurrency(value)}
                        width={80}
                    />
                    <Tooltip
                        formatter={(value: any, name?: string) => {
                            if (name === 'valor' || name === 'Valor') return formatCurrency(value || 0)
                            return value
                        }}
                        labelStyle={{ color: '#111827' }}
                    />
                    <Bar dataKey="valor" name="Valor" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    )
}
