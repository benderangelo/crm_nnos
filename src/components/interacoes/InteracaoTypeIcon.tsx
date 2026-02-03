import { TIPOS_INTERACAO, TipoInteracao } from '@/types/interacao.types'
import { cn } from '@/lib/utils'

interface InteracaoTypeIconProps {
  tipo: TipoInteracao
  size?: 'sm' | 'md' | 'lg'
}

export function InteracaoTypeIcon({ tipo, size = 'md' }: InteracaoTypeIconProps) {
  const config = TIPOS_INTERACAO.find((t) => t.id === tipo)

  if (!config) return null

  const sizeClasses = {
    sm: 'w-6 h-6 text-lg',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-14 h-14 text-3xl',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gray-100',
        sizeClasses[size]
      )}
    >
      <span>{config.icon}</span>
    </div>
  )
}
