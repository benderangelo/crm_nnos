'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { KPICard } from '@/components/dashboard/KPICard'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { FunnelValueChart } from '@/components/dashboard/FunnelValueChart'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { TopLeadsTable } from '@/components/dashboard/TopLeadsTable'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { MotivosPerdaChart } from '@/components/dashboard/MotivosPerdaChart'
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics'
import { formatCurrency } from '@/lib/utils/formatters'
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsers } from '@/lib/hooks/useUsers'

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{
    start?: Date
    end?: Date
  }>({})
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const { users } = useUsers()

  const { metrics, loading } = useDashboardMetrics(dateRange.start, dateRange.end, selectedUser)

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

          <div className="flex items-center gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportButton data={metrics.topLeads} filename="leads-report" />
          </div>
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
          <FunnelValueChart data={metrics.leadsPorEtapa} />
        </div>

        {/* Timeline Chart */}
        <div className="grid grid-cols-1">
          <TimelineChart data={metrics.evolucaoMensal} />
        </div>

        {/* Motivos de Perda */}
        <MotivosPerdaChart />

        {/* Top Leads */}
        <TopLeadsTable leads={metrics.topLeads} />
      </div>
    </PageContainer>
  )
}
