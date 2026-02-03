# 📊 FASE 5: DASHBOARD & MÉTRICAS
**Duração estimada:** 1 semana  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 4 concluída

---

## 📋 OBJETIVO DA FASE
Criar dashboard completo com visualizações avançadas, gráficos e métricas de performance do pipeline comercial.

**Entregáveis:**
- ✅ Página de Dashboard
- ✅ Gráfico de funil de vendas
- ✅ Gráfico de evolução temporal
- ✅ Métricas por responsável
- ✅ Taxa de conversão por etapa
- ✅ Tempo médio por etapa
- ✅ Cartões de KPIs principais
- ✅ Filtros de período
- ✅ Exportação de relatórios (CSV/Excel)

---

## 🛠️ TECNOLOGIAS ADICIONAIS

### Novas Bibliotecas
```bash
# Gráficos
npm install recharts

# Exportação de dados
npm install xlsx
npm install jspdf jspdf-autotable

# Utilitários de data
# date-fns (já instalado)
```

### shadcn/ui Components Adicionais
```bash
npx shadcn-ui@latest add date-range-picker
```

---

## 📁 ARQUIVOS A CRIAR

### Novos Arquivos
```
src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── page.tsx                 # Página do dashboard
├── lib/
│   ├── hooks/
│   │   └── useDashboardMetrics.ts      # Hook de métricas
│   └── utils/
│       └── exportUtils.ts              # Funções de exportação
└── components/
    └── dashboard/
        ├── KPICard.tsx                  # Card de KPI
        ├── FunnelChart.tsx              # Gráfico de funil
        ├── TimelineChart.tsx            # Gráfico temporal
        ├── ConversionRateChart.tsx      # Taxa de conversão
        ├── StageTimeChart.tsx           # Tempo por etapa
        ├── TopLeadsTable.tsx            # Tabela top leads
        ├── RecentActivity.tsx           # Atividade recente
        ├── DashboardFilters.tsx         # Filtros
        └── ExportButton.tsx             # Botão exportar
```

---

## 🎯 TAREFAS DETALHADAS

### 1. Criar Hook de Métricas

#### 1.1. useDashboardMetrics (src/lib/hooks/useDashboardMetrics.ts)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export interface DashboardMetrics {
  // KPIs principais
  totalPipeline: number
  ticketMedio: number
  taxaConversao: number
  totalLeads: number
  leadsFechados: number
  
  // Por etapa
  leadsPorEtapa: {
    etapa: string
    quantidade: number
    valor: number
  }[]
  
  // Conversão por etapa
  conversaoPorEtapa: {
    etapa: string
    taxa: number
  }[]
  
  // Tempo por etapa
  tempoPorEtapa: {
    etapa: string
    diasMedio: number
  }[]
  
  // Evolução temporal
  evolucaoMensal: {
    mes: string
    quantidade: number
    valor: number
  }[]
  
  // Top leads
  topLeads: any[]
  
  // Atividade recente
  atividadeRecente: any[]
}

export function useDashboardMetrics(
  startDate?: Date,
  endDate?: Date
) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMetrics = async () => {
    try {
      setLoading(true)

      // Buscar dados
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('ativo', true)
        .gte('created_at', startDate?.toISOString() || new Date(0).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString())

      const { data: mudancas } = await supabase
        .from('mudancas_etapa')
        .select('*')
        .gte('created_at', startDate?.toISOString() || new Date(0).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString())

      if (!leads) return

      // Calcular KPIs
      const totalPipeline = leads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)
      const totalLeads = leads.length
      const leadsFechados = leads.filter(l => l.etapa === 'fechado').length
      const ticketMedio = totalLeads > 0 ? totalPipeline / totalLeads : 0
      const taxaConversao = totalLeads > 0 ? (leadsFechados / totalLeads) * 100 : 0

      // Leads por etapa
      const leadsPorEtapa = ['novo', 'contato', 'proposta', 'negociacao', 'fechado'].map(etapa => ({
        etapa,
        quantidade: leads.filter(l => l.etapa === etapa).length,
        valor: leads.filter(l => l.etapa === etapa)
          .reduce((sum, l) => sum + (l.valor_estimado || 0), 0),
      }))

      // Tempo médio por etapa
      const tempoPorEtapa = leadsPorEtapa.map(({ etapa }) => {
        const mudancasEtapa = mudancas?.filter(m => m.etapa_anterior === etapa) || []
        const tempoTotal = mudancasEtapa.reduce((sum, m) => {
          const interval = m.tempo_na_etapa_anterior
          // Converter interval PostgreSQL para dias (simplificado)
          const dias = interval ? parseInt(interval.split(' ')[0]) : 0
          return sum + dias
        }, 0)
        const diasMedio = mudancasEtapa.length > 0 ? tempoTotal / mudancasEtapa.length : 0
        
        return { etapa, diasMedio }
      })

      // Evolução mensal (últimos 6 meses)
      const evolucaoMensal = Array.from({ length: 6 }, (_, i) => {
        const mes = subMonths(new Date(), i)
        const start = startOfMonth(mes)
        const end = endOfMonth(mes)
        
        const leadsDoMes = leads.filter(l => {
          const created = new Date(l.created_at)
          return created >= start && created <= end
        })
        
        return {
          mes: mes.toLocaleDateString('pt-BR', { month: 'short' }),
          quantidade: leadsDoMes.length,
          valor: leadsDoMes.reduce((sum, l) => sum + (l.valor_estimado || 0), 0),
        }
      }).reverse()

      // Top leads (maiores valores)
      const topLeads = [...leads]
        .sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))
        .slice(0, 10)

      setMetrics({
        totalPipeline,
        ticketMedio,
        taxaConversao,
        totalLeads,
        leadsFechados,
        leadsPorEtapa,
        conversaoPorEtapa: [], // Implementar se necessário
        tempoPorEtapa,
        evolucaoMensal,
        topLeads,
        atividadeRecente: [], // Implementar se necessário
      })
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [startDate, endDate])

  return { metrics, loading, refetch: fetchMetrics }
}
```

---

### 2. Criar Componentes de Dashboard

#### 2.1. KPI Card (src/components/dashboard/KPICard.tsx)
```typescript
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: KPICardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </Card>
  )
}
```

#### 2.2. Funnel Chart (src/components/dashboard/FunnelChart.tsx)
```typescript
'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FunnelChartProps {
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
  novo: '#2563eb',
  contato: '#f97316',
  proposta: '#9333ea',
  negociacao: '#eab308',
  fechado: '#16a34a',
}

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = data.map(item => ({
    ...item,
    name: ETAPA_LABELS[item.etapa as keyof typeof ETAPA_LABELS],
    color: ETAPA_COLORS[item.etapa as keyof typeof ETAPA_COLORS],
  }))

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Funil de Vendas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'valor') return formatCurrency(value)
              return value
            }}
          />
          <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
```

#### 2.3. Timeline Chart (src/components/dashboard/TimelineChart.tsx)
```typescript
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
            formatter={(value: number, name: string) => {
              if (name === 'Valor') return formatCurrency(value)
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
```

#### 2.4. Top Leads Table (src/components/dashboard/TopLeadsTable.tsx)
```typescript
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/formatters'

interface TopLeadsTableProps {
  leads: any[]
}

const ETAPA_COLORS = {
  novo: 'bg-blue-100 text-blue-800',
  contato: 'bg-orange-100 text-orange-800',
  proposta: 'bg-purple-100 text-purple-800',
  negociacao: 'bg-yellow-100 text-yellow-800',
  fechado: 'bg-green-100 text-green-800',
}

export function TopLeadsTable({ leads }: TopLeadsTableProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Top 10 Leads por Valor</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4 font-medium text-gray-500 text-sm">
                Empresa
              </th>
              <th className="text-left py-2 px-4 font-medium text-gray-500 text-sm">
                Etapa
              </th>
              <th className="text-right py-2 px-4 font-medium text-gray-500 text-sm">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 10).map((lead) => (
              <tr key={lead.id} className="border-b last:border-0">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{lead.empresa}</p>
                    <p className="text-sm text-gray-500">{lead.contato_nome}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant="secondary"
                    className={ETAPA_COLORS[lead.etapa as keyof typeof ETAPA_COLORS]}
                  >
                    {lead.etapa}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(lead.valor_estimado || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
```

#### 2.5. Export Button (src/components/dashboard/ExportButton.tsx)
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatCurrency } from '@/lib/utils/formatters'

interface ExportButtonProps {
  data: any[]
  filename: string
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    // Preparar dados
    const exportData = data.map(lead => ({
      'Empresa': lead.empresa,
      'Contato': lead.contato_nome,
      'Telefone': lead.contato_telefone,
      'Email': lead.contato_email || '',
      'Valor': lead.valor_estimado || 0,
      'Etapa': lead.etapa,
      'Origem': lead.origem || '',
      'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
    }))

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')

    // Download
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Exportar Excel
    </Button>
  )
}
```

---

### 3. Criar Página de Dashboard

#### 3.1. Dashboard Page (src/app/(dashboard)/dashboard/page.tsx)
```typescript
'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { KPICard } from '@/components/dashboard/KPICard'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { TopLeadsTable } from '@/components/dashboard/TopLeadsTable'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics'
import { formatCurrency } from '@/lib/utils/formatters'
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{
    start?: Date
    end?: Date
  }>({})

  const { metrics, loading } = useDashboardMetrics(dateRange.start, dateRange.end)

  if (loading || !metrics) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Visão geral do pipeline comercial
            </p>
          </div>
          
          <ExportButton data={metrics.topLeads} filename="leads-report" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total em Pipeline"
            value={formatCurrency(metrics.totalPipeline)}
            icon={DollarSign}
            subtitle={`${metrics.totalLeads} leads ativos`}
          />
          
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(metrics.ticketMedio)}
            icon={TrendingUp}
          />
          
          <KPICard
            title="Taxa de Conversão"
            value={`${metrics.taxaConversao.toFixed(1)}%`}
            icon={Target}
            subtitle={`${metrics.leadsFechados} fechados`}
          />
          
          <KPICard
            title="Leads Ativos"
            value={metrics.totalLeads}
            icon={Users}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={metrics.leadsPorEtapa} />
          <TimelineChart data={metrics.evolucaoMensal} />
        </div>

        {/* Top Leads */}
        <TopLeadsTable leads={metrics.topLeads} />
      </div>
    </PageContainer>
  )
}
```

---

### 4. Adicionar ao Menu de Navegação

#### 4.1. Atualizar Header (src/components/layout/Header.tsx)

Adicionar link para Dashboard:

```typescript
import Link from 'next/link'

// Dentro do Header:
<nav className="flex items-center gap-4">
  <Link
    href="/dashboard"
    className="text-gray-700 hover:text-blue-900 font-medium"
  >
    Dashboard
  </Link>
  <Link
    href="/kanban"
    className="text-gray-700 hover:text-blue-900 font-medium"
  >
    Kanban
  </Link>
</nav>
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Página de dashboard renderiza
- [ ] KPIs calculados corretamente
- [ ] Gráfico de funil funciona
- [ ] Gráfico de evolução funciona
- [ ] Top leads table renderiza
- [ ] Exportação para Excel funciona
- [ ] Filtros de data funcionam
- [ ] Links de navegação funcionam
- [ ] Dashboard responsivo
- [ ] Sem erros no console

---

## 🧪 TESTES MANUAIS

### Teste 1: KPIs
1. Acessar /dashboard
2. Verificar valores calculados
3. Comparar com dados reais do Supabase
4. Verificar formatação (moeda, porcentagem)

### Teste 2: Gráficos
1. Verificar gráfico de funil
2. Verificar cores corretas por etapa
3. Verificar gráfico de evolução
4. Verificar tooltips

### Teste 3: Exportação
1. Clicar em "Exportar Excel"
2. Verificar download do arquivo
3. Abrir arquivo e validar dados
4. Verificar formatação

---

## 🔗 PREPARAÇÃO PARA FASE 6

### Estrutura já preparada:
- ✅ Dashboard funcional
- ✅ Métricas calculadas
- ✅ Base para features avançadas

### O que a Fase 6 receberá:
1. Dashboard estável
2. Sistema de métricas testado
3. Base para funcionalidades extras

---

## 🚀 PRÓXIMOS PASSOS (FASE 6)

Na próxima fase, implementaremos:
- Upload de anexos
- Tags customizáveis
- Notificações (opcional)
- PWA (opcional)
- Melhorias de UX

**Arquivo:** `FASE_6_AVANCADO.md`

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS