import { z } from 'zod'

export const interacaoFormSchema = z.object({
  tipo: z.enum(['nota', 'ligacao', 'email', 'reuniao', 'whatsapp', 'proposta', 'outro']),

  titulo: z.string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  descricao: z.string()
    .min(5, 'Descrição deve ter pelo menos 5 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),

  duracao_minutos: z.number()
    .min(0, 'Duração deve ser positiva')
    .optional(),

  resultado: z.enum(['positivo', 'negativo', 'neutro']).optional(),
})

export type InteracaoFormData = z.infer<typeof interacaoFormSchema>
