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
