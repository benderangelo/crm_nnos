'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadFilters } from '@/types/lead.types'
import { Search, X } from 'lucide-react'

interface KanbanFiltersProps {
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
}

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Busca */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por empresa ou contato..."
          className="pl-10 pr-10"
          value={filters.busca || ''}
          onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
        />
        {filters.busca && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onFiltersChange({ ...filters, busca: '' })}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Período */}
      <Select
        value={filters.periodo || 'todos'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, periodo: value as any })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="semana">Última semana</SelectItem>
          <SelectItem value="mes">Último mês</SelectItem>
          <SelectItem value="todos">Todos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
