import { z } from 'zod'

export const leadFormSchema = z.object({
  // Informações da empresa
  empresa: z.string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(100, 'Nome da empresa deve ter no máximo 100 caracteres'),

  // Informações de contato
  contato_nome: z.string()
    .min(2, 'Nome do contato deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do contato deve ter no máximo 100 caracteres'),

  contato_telefone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido. Use o formato (XX) XXXXX-XXXX'),

  contato_email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),

  // Informações comerciais
  valor_estimado: z.number()
    .min(0, 'Valor deve ser positivo')
    .default(0),

  etapa: z.enum(['novo', 'contato', 'proposta', 'negociacao', 'fechado'])
    .default('novo'),

  // Tags e observações
  tags: z.array(z.string()).optional().nullable(),
  observacoes: z.string().max(1000).optional().nullable(),
})

export type LeadFormData = z.infer<typeof leadFormSchema>

// Schema para edição (permite campos parciais)
export const leadEditSchema = leadFormSchema.partial()
