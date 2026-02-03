'use client'

import { InteracaoExtended } from '@/types/interacao.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InteracaoTypeIcon } from './InteracaoTypeIcon'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InteracaoCardProps {
  interacao: InteracaoExtended
  onEdit?: () => void
  onDelete?: () => void
}

export function InteracaoCard({ interacao, onEdit, onDelete }: InteracaoCardProps) {
  const timeAgo = formatDistanceToNow(new Date(interacao.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  const getResultadoBadge = () => {
    if (!interacao.resultado) return null

    const variants = {
      positivo: { label: 'Positivo', className: 'bg-green-100 text-green-800' },
      negativo: { label: 'Negativo', className: 'bg-red-100 text-red-800' },
      neutro: { label: 'Neutro', className: 'bg-gray-100 text-gray-800' },
    }

    const variant = variants[interacao.resultado]

    return (
      <Badge variant="secondary" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        {/* Ícone do tipo */}
        <InteracaoTypeIcon tipo={interacao.tipo} size="md" />

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {interacao.titulo && (
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {interacao.titulo}
                </h4>
              )}
              <p className="text-xs text-gray-500">
                {interacao.usuario_nome || 'Usuário'} · {timeAgo}
              </p>
            </div>

            {/* Menu de ações */}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Descrição */}
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
            {interacao.descricao}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {getResultadoBadge()}

            {interacao.duracao_minutos && (
              <Badge variant="outline" className="text-xs">
                {interacao.duracao_minutos} min
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
