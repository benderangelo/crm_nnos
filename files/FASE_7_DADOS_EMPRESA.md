# 🏢 FASE 7: DADOS DA EMPRESA
**Duração estimada:** 3-4 dias  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 6 concluída

---

## 📋 OBJETIVO DA FASE
Criar estrutura para armazenar dados detalhados da empresa cliente, necessários para geração de propostas comerciais. Estes dados são preenchidos **manualmente** após o lead estar no Kanban, e posteriormente serão usados na geração de documentos.

**IMPORTANTE:** Esta fase implementa apenas a **estrutura de dados** e **interface de preenchimento manual**. A integração com API da Receita Federal será na Fase 8.

**Entregáveis:**
- ✅ Nova tabela `dados_empresa` no Supabase
- ✅ Formulário de preenchimento manual
- ✅ Modal de dados da empresa
- ✅ Indicador visual no card (dados preenchidos ou não)
- ✅ Validações de formulário
- ✅ Integração com LeadDetailsDialog

---

## 🎯 CONCEITO

### **Relacionamento:**
```
LEADS (1) ←→ (0..1) DADOS_EMPRESA

Um lead pode ter ou não dados da empresa preenchidos
Dados da empresa sempre pertencem a um lead específico
```

### **Quando Preencher:**
- ❌ **NÃO** na criação do lead
- ✅ **SIM** quando lead está em "Proposta" ou "Negociação"
- ✅ **SIM** antes de gerar proposta comercial

### **Dados Armazenados:**
1. **Dados cadastrais** (preenchimento manual)
2. **JSON completo** (preparado para API futura)
3. **Dados do projeto** (específicos NNOS)

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### 1. Criar Tabela `dados_empresa`

```sql
-- =====================================================
-- TABELA: dados_empresa
-- Armazena dados da empresa para geração de propostas
-- =====================================================
CREATE TABLE dados_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamento (1:1 com leads)
    lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- ============================================
    -- DADOS CADASTRAIS (preenchimento manual)
    -- ============================================
    
    -- Identificação
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    
    -- Endereço
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    cep TEXT,
    municipio TEXT,
    uf TEXT,
    
    -- ============================================
    -- JSON COMPLETO (preparado para API - Fase 8)
    -- ============================================
    dados_receita_completo JSONB,
    
    -- Origem dos dados
    origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'api')),
    consultado_em TIMESTAMPTZ, -- quando usar API (Fase 8)
    
    -- ============================================
    -- DADOS DO PROJETO (específico NNOS)
    -- ============================================
    objetivo_projeto TEXT,
    periodo TEXT CHECK (periodo IN ('manha', 'tarde', 'integral')),
    modalidade TEXT CHECK (modalidade IN ('presencial', 'virtual', 'hibrido')),
    parcelamento TEXT CHECK (parcelamento IN ('1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x')),
    
    -- ============================================
    -- METADATA
    -- ============================================
    preenchido_por UUID REFERENCES users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT cnpj_valido CHECK (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'),
    CONSTRAINT cep_valido CHECK (cep IS NULL OR cep ~ '^\d{5}-\d{3}$')
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_dados_empresa_lead ON dados_empresa(lead_id);
CREATE INDEX idx_dados_empresa_cnpj ON dados_empresa(cnpj);
CREATE INDEX idx_dados_empresa_origem ON dados_empresa(origem);

-- Índice GIN para buscar dentro do JSON (quando vier da API)
CREATE INDEX idx_dados_empresa_json ON dados_empresa USING GIN (dados_receita_completo);

-- =====================================================
-- TRIGGER: updated_at
-- =====================================================
CREATE TRIGGER update_dados_empresa_updated_at
    BEFORE UPDATE ON dados_empresa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS (documentação)
-- =====================================================
COMMENT ON TABLE dados_empresa IS 'Dados detalhados da empresa para geração de propostas';
COMMENT ON COLUMN dados_empresa.dados_receita_completo IS 'JSON completo da Receita Federal (preenchido via API na Fase 8)';
COMMENT ON COLUMN dados_empresa.origem IS 'Indica se foi preenchido manualmente ou via API';
COMMENT ON COLUMN dados_empresa.objetivo_projeto IS 'Campo texto livre sobre objetivos do projeto';
COMMENT ON COLUMN dados_empresa.periodo IS 'Período de realização: manhã, tarde ou integral';
COMMENT ON COLUMN dados_empresa.modalidade IS 'Modalidade: presencial, virtual ou híbrido';
COMMENT ON COLUMN dados_empresa.parcelamento IS 'Opções de parcelamento de 1x até 12x';
```

---

### 2. View Auxiliar

```sql
-- =====================================================
-- VIEW: v_leads_com_dados_empresa
-- Facilita consultas de leads com dados da empresa
-- =====================================================
CREATE OR REPLACE VIEW v_leads_com_dados_empresa AS
SELECT 
    l.*,
    de.id as dados_empresa_id,
    de.cnpj,
    de.razao_social,
    de.nome_fantasia,
    de.logradouro,
    de.numero,
    de.bairro,
    de.cep,
    de.municipio,
    de.uf,
    de.objetivo_projeto,
    de.periodo,
    de.modalidade,
    de.parcelamento,
    de.origem as dados_origem,
    CASE 
        WHEN de.id IS NOT NULL THEN true 
        ELSE false 
    END as tem_dados_empresa
FROM leads l
LEFT JOIN dados_empresa de ON l.id = de.lead_id
WHERE l.ativo = true;

COMMENT ON VIEW v_leads_com_dados_empresa IS 'Leads com indicador se possui dados da empresa preenchidos';
```

---

### 3. RLS Policies

```sql
-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE dados_empresa ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver dados_empresa
CREATE POLICY "Usuários podem ver dados da empresa"
    ON dados_empresa FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Usuários autenticados podem criar dados_empresa
CREATE POLICY "Usuários podem criar dados da empresa"
    ON dados_empresa FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários autenticados podem atualizar dados_empresa
CREATE POLICY "Usuários podem atualizar dados da empresa"
    ON dados_empresa FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Apenas quem preencheu pode deletar (ou admin)
CREATE POLICY "Usuários podem deletar próprios dados"
    ON dados_empresa FOR DELETE
    USING (auth.uid() = preenchido_por);
```

---

## 📝 TIPOS TYPESCRIPT

### 1. Dados Empresa Types (src/types/dadosEmpresa.types.ts)

```typescript
import { Database } from './database.types'

// Tipo base do Supabase
export type DadosEmpresa = Database['public']['Tables']['dados_empresa']['Row']
export type DadosEmpresaInsert = Database['public']['Tables']['dados_empresa']['Insert']
export type DadosEmpresaUpdate = Database['public']['Tables']['dados_empresa']['Update']

// Enums
export type Periodo = 'manha' | 'tarde' | 'integral'
export type Modalidade = 'presencial' | 'virtual' | 'hibrido'
export type Parcelamento = '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x' | '11x' | '12x'
export type OrigemDados = 'manual' | 'api'

// Configurações de dropdowns
export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'integral', label: 'Integral' },
]

export const MODALIDADES: { value: Modalidade; label: string }[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrido', label: 'Híbrido' },
]

export const PARCELAMENTOS: { value: Parcelamento; label: string }[] = [
  { value: '1x', label: '1x - À vista' },
  { value: '2x', label: '2x' },
  { value: '3x', label: '3x' },
  { value: '4x', label: '4x' },
  { value: '5x', label: '5x' },
  { value: '6x', label: '6x' },
  { value: '7x', label: '7x' },
  { value: '8x', label: '8x' },
  { value: '9x', label: '9x' },
  { value: '10x', label: '10x' },
  { value: '11x', label: '11x' },
  { value: '12x', label: '12x' },
]

// Interface estendida
export interface DadosEmpresaExtended extends DadosEmpresa {
  preenchido_por_nome?: string
}
```

---

## 🎨 SCHEMA DE VALIDAÇÃO

### 1. Zod Schema (src/lib/schemas/dadosEmpresaSchema.ts)

```typescript
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
    .or(z.literal('')),
  
  // Endereço
  logradouro: z.string()
    .max(200)
    .optional()
    .or(z.literal('')),
  
  numero: z.string()
    .max(20)
    .optional()
    .or(z.literal('')),
  
  bairro: z.string()
    .max(100)
    .optional()
    .or(z.literal('')),
  
  cep: z.string()
    .regex(/^\d{5}-\d{3}$/, 'CEP inválido. Use o formato XXXXX-XXX')
    .optional()
    .or(z.literal('')),
  
  municipio: z.string()
    .max(100)
    .optional()
    .or(z.literal('')),
  
  uf: z.string()
    .length(2, 'UF deve ter 2 caracteres')
    .toUpperCase()
    .optional()
    .or(z.literal('')),
  
  // Dados do projeto
  objetivo_projeto: z.string()
    .min(10, 'Descreva o objetivo com pelo menos 10 caracteres')
    .max(2000, 'Objetivo deve ter no máximo 2000 caracteres'),
  
  periodo: z.enum(['manha', 'tarde', 'integral'], {
    required_error: 'Selecione um período',
  }),
  
  modalidade: z.enum(['presencial', 'virtual', 'hibrido'], {
    required_error: 'Selecione uma modalidade',
  }),
  
  parcelamento: z.enum(['1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x'], {
    required_error: 'Selecione uma forma de parcelamento',
  }),
})

export type DadosEmpresaFormData = z.infer<typeof dadosEmpresaFormSchema>
```

---

## 🔧 HOOK DE GERENCIAMENTO

### 1. useDadosEmpresa (src/lib/hooks/useDadosEmpresa.ts)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DadosEmpresaExtended, DadosEmpresaFormData } from '@/types/dadosEmpresa.types'
import { useToast } from '@/components/ui/use-toast'

export function useDadosEmpresa(leadId: string) {
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresaExtended | null>(null)
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Buscar dados da empresa
  const fetchDadosEmpresa = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('dados_empresa')
        .select(`
          *,
          users_profile:preenchido_por (
            nome_completo
          )
        `)
        .eq('lead_id', leadId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found (ok)
        throw error
      }

      if (data) {
        setDadosEmpresa({
          ...data,
          preenchido_por_nome: data.users_profile?.nome_completo,
        })
        setExists(true)
      } else {
        setDadosEmpresa(null)
        setExists(false)
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da empresa.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar ou atualizar dados da empresa
  const saveDadosEmpresa = async (data: DadosEmpresaFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Usuário não autenticado')

      if (exists && dadosEmpresa) {
        // Atualizar existente
        const { error } = await supabase
          .from('dados_empresa')
          .update({
            ...data,
            origem: 'manual',
          })
          .eq('id', dadosEmpresa.id)

        if (error) throw error

        toast({
          title: 'Dados atualizados',
          description: 'Os dados da empresa foram atualizados com sucesso.',
        })
      } else {
        // Criar novo
        const { data: newDados, error } = await supabase
          .from('dados_empresa')
          .insert({
            ...data,
            lead_id: leadId,
            preenchido_por: user.id,
            origem: 'manual',
          })
          .select()
          .single()

        if (error) throw error

        setDadosEmpresa(newDados)
        setExists(true)

        toast({
          title: 'Dados salvos',
          description: 'Os dados da empresa foram salvos com sucesso.',
        })
      }

      await fetchDadosEmpresa()
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Tente novamente.',
      })
      throw error
    }
  }

  // Deletar dados da empresa
  const deleteDadosEmpresa = async () => {
    if (!dadosEmpresa) return

    try {
      const { error } = await supabase
        .from('dados_empresa')
        .delete()
        .eq('id', dadosEmpresa.id)

      if (error) throw error

      setDadosEmpresa(null)
      setExists(false)

      toast({
        title: 'Dados removidos',
        description: 'Os dados da empresa foram removidos.',
      })
    } catch (error) {
      console.error('Erro ao deletar dados da empresa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover os dados.',
      })
      throw error
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchDadosEmpresa()
    }
  }, [leadId])

  return {
    dadosEmpresa,
    loading,
    exists,
    saveDadosEmpresa,
    deleteDadosEmpresa,
    refetch: fetchDadosEmpresa,
  }
}
```

---

## 🎨 COMPONENTES

### 1. DadosEmpresaForm (src/components/dados-empresa/DadosEmpresaForm.tsx)

```typescript
'use client'

import { UseFormReturn } from 'react-hook-form'
import { DadosEmpresaFormData } from '@/lib/schemas/dadosEmpresaSchema'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PERIODOS, MODALIDADES, PARCELAMENTOS } from '@/types/dadosEmpresa.types'
import InputMask from 'react-input-mask'

interface DadosEmpresaFormProps {
  form: UseFormReturn<DadosEmpresaFormData>
}

export function DadosEmpresaForm({ form }: DadosEmpresaFormProps) {
  return (
    <div className="space-y-6">
      {/* Seção: Dados Cadastrais */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dados Cadastrais</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ *</FormLabel>
                <FormControl>
                  <InputMask
                    mask="99.999.999/9999-99"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    {(inputProps: any) => (
                      <Input placeholder="00.000.000/0000-00" {...inputProps} />
                    )}
                  </InputMask>
                </FormControl>
                <FormDescription>
                  Será usado para buscar dados automaticamente na próxima fase
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="razao_social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social *</FormLabel>
                <FormControl>
                  <Input placeholder="EMPRESA EXEMPLO LTDA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nome_fantasia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl>
                  <Input placeholder="Empresa Exemplo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Endereço */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input placeholder="123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input placeholder="Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <InputMask
                    mask="99999-999"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    {(inputProps: any) => (
                      <Input placeholder="00000-000" {...inputProps} />
                    )}
                  </InputMask>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="municipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Município</FormLabel>
                <FormControl>
                  <Input placeholder="São Paulo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="SP" 
                    maxLength={2}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Dados do Projeto */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dados do Projeto</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="objetivo_projeto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objetivo do Projeto *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva os objetivos e escopo do projeto..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Será usado na proposta comercial
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PERIODOS.map((periodo) => (
                        <SelectItem key={periodo.value} value={periodo.value}>
                          {periodo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MODALIDADES.map((modalidade) => (
                        <SelectItem key={modalidade.value} value={modalidade.value}>
                          {modalidade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parcelamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PARCELAMENTOS.map((parc) => (
                        <SelectItem key={parc.value} value={parc.value}>
                          {parc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. DadosEmpresaDialog (src/components/dados-empresa/DadosEmpresaDialog.tsx)

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DadosEmpresaForm } from './DadosEmpresaForm'
import { dadosEmpresaFormSchema, DadosEmpresaFormData } from '@/lib/schemas/dadosEmpresaSchema'
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { Loader2 } from 'lucide-react'

interface DadosEmpresaDialogProps {
  leadId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DadosEmpresaDialog({ leadId, open, onOpenChange }: DadosEmpresaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { dadosEmpresa, exists, saveDadosEmpresa } = useDadosEmpresa(leadId)

  const form = useForm<DadosEmpresaFormData>({
    resolver: zodResolver(dadosEmpresaFormSchema),
    values: dadosEmpresa ? {
      cnpj: dadosEmpresa.cnpj,
      razao_social: dadosEmpresa.razao_social,
      nome_fantasia: dadosEmpresa.nome_fantasia || '',
      logradouro: dadosEmpresa.logradouro || '',
      numero: dadosEmpresa.numero || '',
      bairro: dadosEmpresa.bairro || '',
      cep: dadosEmpresa.cep || '',
      municipio: dadosEmpresa.municipio || '',
      uf: dadosEmpresa.uf || '',
      objetivo_projeto: dadosEmpresa.objetivo_projeto || '',
      periodo: dadosEmpresa.periodo || 'integral',
      modalidade: dadosEmpresa.modalidade || 'presencial',
      parcelamento: dadosEmpresa.parcelamento || '1x',
    } : {
      cnpj: '',
      razao_social: '',
      nome_fantasia: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cep: '',
      municipio: '',
      uf: '',
      objetivo_projeto: '',
      periodo: 'integral',
      modalidade: 'presencial',
      parcelamento: '1x',
    },
  })

  const onSubmit = async (data: DadosEmpresaFormData) => {
    try {
      setIsSubmitting(true)
      await saveDadosEmpresa(data)
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {exists ? 'Editar Dados da Empresa' : 'Dados da Empresa'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados cadastrais e informações do projeto
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DadosEmpresaForm form={form} />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {exists ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔗 INTEGRAÇÕES

### 1. Adicionar ao LeadDetailsDialog

Modificar `src/components/leads/LeadDetailsDialog.tsx`:

```typescript
// ... imports existentes ...
import { DadosEmpresaDialog } from '@/components/dados-empresa/DadosEmpresaDialog'
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { Building2, CheckCircle2 } from 'lucide-react'

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  // ... código existente ...
  const [showDadosEmpresaDialog, setShowDadosEmpresaDialog] = useState(false)
  const { exists: temDadosEmpresa } = useDadosEmpresa(lead?.id || '')

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{lead.empresa}</DialogTitle>
            <DialogDescription>
              {/* Indicador de dados preenchidos */}
              {temDadosEmpresa && (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Dados da empresa preenchidos
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="empresa">
                <Building2 className="w-4 h-4 mr-2" />
                Dados da Empresa
              </TabsTrigger>
            </TabsList>

            {/* ... abas existentes ... */}

            <TabsContent value="empresa">
              <div className="text-center py-8">
                {temDadosEmpresa ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Dados preenchidos</p>
                    <p className="text-gray-500 mb-4">
                      Os dados da empresa já foram cadastrados
                    </p>
                    <Button onClick={() => setShowDadosEmpresaDialog(true)}>
                      Editar Dados
                    </Button>
                  </>
                ) : (
                  <>
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Dados não preenchidos</p>
                    <p className="text-gray-500 mb-4">
                      Preencha os dados da empresa para gerar propostas
                    </p>
                    <Button onClick={() => setShowDadosEmpresaDialog(true)}>
                      Preencher Dados
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* ... DialogFooter existente ... */}
        </DialogContent>
      </Dialog>

      {/* Dialog de Dados da Empresa */}
      <DadosEmpresaDialog
        leadId={lead?.id || ''}
        open={showDadosEmpresaDialog}
        onOpenChange={setShowDadosEmpresaDialog}
      />
    </>
  )
}
```

---

### 2. Badge no LeadCard

Modificar `src/components/kanban/LeadCard.tsx`:

```typescript
// ... imports existentes ...
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { CheckCircle2 } from 'lucide-react'

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { exists: temDadosEmpresa } = useDadosEmpresa(lead.id)
  
  // ... código existente ...

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-4 cursor-move hover:shadow-lg transition-shadow">
        {/* Header com badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {lead.empresa}
            </h4>
            {/* Badge de dados preenchidos */}
            {temDadosEmpresa && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Dados OK</span>
              </div>
            )}
          </div>
          <Badge className={cn('text-xs', getDaysColor(lead.dias_na_etapa))}>
            {lead.dias_na_etapa || 0}d
          </Badge>
        </div>

        {/* ... resto do card ... */}
      </Card>
    </div>
  )
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Tabela `dados_empresa` criada no Supabase
- [ ] View `v_leads_com_dados_empresa` criada
- [ ] RLS policies configuradas
- [ ] Tipos TypeScript gerados
- [ ] Schema Zod criado
- [ ] Hook `useDadosEmpresa` implementado
- [ ] Componente `DadosEmpresaForm` criado
- [ ] Componente `DadosEmpresaDialog` criado
- [ ] Integração com `LeadDetailsDialog` feita
- [ ] Badge no `LeadCard` adicionado
- [ ] Validações funcionando
- [ ] Máscaras de input aplicadas
- [ ] Formulário responsivo em mobile
- [ ] Criar dados funciona
- [ ] Atualizar dados funciona
- [ ] Toast notifications aparecem
- [ ] Sem erros no console

---

## 🧪 TESTES MANUAIS

### Teste 1: Criar Dados
1. Abrir detalhes de um lead
2. Ir para aba "Dados da Empresa"
3. Clicar em "Preencher Dados"
4. Preencher todos os campos obrigatórios
5. Salvar
6. Verificar badge "Dados OK" no card
7. Verificar no Supabase que registro foi criado

### Teste 2: Validações
1. Tentar salvar formulário vazio
2. Verificar mensagens de erro
3. Digitar CNPJ incorreto
4. Verificar validação de formato
5. Digitar CEP incorreto
6. Verificar validação

### Teste 3: Edição
1. Abrir lead com dados preenchidos
2. Ir para aba "Dados da Empresa"
3. Clicar em "Editar Dados"
4. Modificar campos
5. Salvar
6. Verificar mudanças persistidas

### Teste 4: Máscaras
1. Digitar CNPJ sem pontuação
2. Verificar que máscara formata automaticamente
3. Digitar CEP sem hífen
4. Verificar formatação

### Teste 5: Responsividade
1. Testar formulário em mobile (375px)
2. Verificar que campos ficam empilhados
3. Verificar scroll funciona
4. Verificar dropdowns funcionam

---

## 🔗 PREPARAÇÃO PARA FASE 8

### Estrutura já preparada:
- ✅ Campo `dados_receita_completo JSONB` criado
- ✅ Campo `origem` para diferenciar manual vs API
- ✅ Campo `consultado_em` para timestamp da consulta
- ✅ Formulário com todos os campos necessários

### O que a Fase 8 adicionará:
1. Botão "🔍 Buscar CNPJ" no formulário
2. Integração com API da Receita Federal
3. Preenchimento automático dos campos
4. Salvar JSON completo da API
5. Indicador visual (origem: manual ou API)

---

## 📝 NOTAS IMPORTANTES

### Sobre CNPJ
- ✅ Permite duplicatas (mesma empresa, múltiplas propostas)
- ✅ Validação de formato (XX.XXX.XXX/XXXX-XX)
- ✅ Preparado para busca automática (Fase 8)

### Sobre Dados
- ✅ Todos os dados são editáveis sempre
- ✅ Preenchimento opcional (não obrigatório na criação do lead)
- ✅ Necessário para gerar proposta (Fase 6.6)

### Sobre Performance
- ✅ Índices criados nos campos principais
- ✅ View otimizada para queries comuns
- ✅ JSONB indexado com GIN

### Sobre UX
- ✅ Badge visual indica dados preenchidos
- ✅ Aba dedicada no modal de detalhes
- ✅ Formulário limpo e organizado
- ✅ Validações claras e em português

---

## 🚀 PRÓXIMOS PASSOS (FASE 8)

Na próxima fase, implementaremos:
- Integração com API da Receita Federal
- Botão de busca automática por CNPJ
- Preenchimento automático dos campos
- Indicador de origem dos dados (manual/API)

**Arquivo:** `FASE_8_API_RECEITA.md`

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS