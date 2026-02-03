import { z } from 'zod'

export const dadosEmpresaFormSchema = z.object({
  // Dados cadastrais
  cnpj: z.string()
    .min(1, 'CNPJ é obrigatório')
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX'),

  razao_social: z.string()
    .min(3, 'Razão social deve ter pelo menos 3 caracteres')
    .max(200, 'Razão social deve ter no máximo 200 caracteres'),

  nome_fantasia: z.string()
    .max(200, 'Nome fantasia deve ter no máximo 200 caracteres')
    .optional()
    .transform(val => val === '' ? undefined : val),

  // Endereço
  logradouro: z.string()
    .max(200)
    .optional()
    .transform(val => val === '' ? undefined : val),

  numero: z.string()
    .max(20)
    .optional()
    .transform(val => val === '' ? undefined : val),

  bairro: z.string()
    .max(100)
    .optional()
    .transform(val => val === '' ? undefined : val),

  cep: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val)
    .refine(val => !val || /^\d{5}-\d{3}$/.test(val), {
      message: 'CEP inválido. Use o formato XXXXX-XXX'
    }),

  municipio: z.string()
    .max(100)
    .optional()
    .transform(val => val === '' ? undefined : val),

  uf: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val)
    .refine(val => !val || val.length === 2, {
      message: 'UF deve ter 2 caracteres'
    }),

  // Dados do projeto
  objetivo_projeto: z.string()
    .min(10, 'Descreva o objetivo com pelo menos 10 caracteres')
    .max(2000, 'Objetivo deve ter no máximo 2000 caracteres'),

  periodo: z.enum(['manha', 'tarde', 'integral'], {
    message: 'Selecione um período',
  }),

  modalidade: z.enum(['presencial', 'virtual', 'hibrido'], {
    message: 'Selecione uma modalidade',
  }),

  parcelamento: z.enum(['1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x'], {
    message: 'Selecione uma forma de parcelamento',
  }),
})

export type DadosEmpresaFormData = z.infer<typeof dadosEmpresaFormSchema>
