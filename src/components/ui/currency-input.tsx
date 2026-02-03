'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number
  onValueChange?: (value: number) => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value))
      }
    }, [value])

    const formatCurrency = (num: number) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value

      // Remove tudo que não é número
      const numbers = input.replace(/\D/g, '')

      // Converte para número (divide por 100 para considerar centavos)
      const numValue = parseInt(numbers || '0') / 100

      setDisplayValue(formatCurrency(numValue))
      onValueChange?.(numValue)
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={cn('pl-10', className)}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
