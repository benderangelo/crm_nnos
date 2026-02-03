# 🏢 FASE 7: CLIENTES & LEADS SEPARADOS
**Duração estimada:** 2 semanas  
**Status:** 📋 Planejamento Futuro  
**Pré-requisito:** Fase 6 concluída + Sistema em produção

---

## 📋 OBJETIVO DA FASE
Refatorar a arquitetura do sistema para separar o conceito de **Clientes** (cadastro principal) de **Leads** (oportunidades comerciais), permitindo um cadastro centralizado de clientes e transformando o Kanban em uma ferramenta de gestão de oportunidades de venda.

**Entregáveis:**
- ✅ Nova tabela `clientes` como entidade principal
- ✅ Refatoração da tabela `leads` (oportunidades)
- ✅ Migração de dados existentes
- ✅ Tela de cadastro/gestão de clientes
- ✅ Kanban focado em oportunidades
- ✅ Relacionamento cliente → múltiplos leads
- ✅ Histórico unificado por cliente
- ✅ Relatórios por cliente vs por oportunidade

---

## 🎯 MUDANÇA CONCEITUAL

### **ANTES (Fases 1-6):**
```
LEAD = Cliente + Oportunidade (tudo junto)
- Um registro = uma empresa com uma oportunidade
- Fechou? Fica em "fechado" para sempre
- Nova venda? Cria lead duplicado
```

### **DEPOIS (Fase 7):**
```
CLIENTE (entidade permanente)
    └── LEADS (oportunidades comerciais)
        └── Cada lead é uma tentativa de venda

- Cliente é cadastrado uma vez
- Cada nova oportunidade = novo lead
- Cliente pode ter vários leads (histórico, fechado, novo)
- Kanban mostra oportunidades, não clientes
```

---

## 📊 NOVA ARQUITETURA DE DADOS

### Diagrama Conceitual

```
┌─────────────────────────────────────┐
│           CLIENTES                  │
│  (Cadastro Central)                 │
│                                     │
│  - Nome da empresa                  │
│  - Dados de contato                 │
│  - Status: ativo/inativo            │
│  - Tipo: PF/PJ                      │
│  - Segmento                         │
└─────────────────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────┐
│           LEADS                     │
│  (Oportunidades Comerciais)         │
│                                     │
│  - cliente_id (FK)                  │
│  - Valor estimado                   │
│  - Etapa do funil                   │
│  - Probabilidade                    │
│  - Data abertura/fechamento         │
│  - Motivo ganho/perda               │
└─────────────────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────┐
│         INTERACOES                  │
│  (Histórico de Atividades)          │
│                                     │
│  - lead_id (FK)                     │
│  - Tipo, descrição                  │
│  - Data, usuário                    │
└─────────────────────────────────────┘
```

---

## 🗄️ ALTERAÇÕES NO BANCO DE DADOS

### 1. Criar Nova Tabela `clientes`

```sql
-- =====================================================
-- TABELA: clientes
-- Cadastro central de todos os clientes da empresa
-- =====================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações da empresa
    nome_empresa TEXT NOT NULL,
    nome_fantasia TEXT,
    documento TEXT UNIQUE, -- CNPJ/CPF
    tipo_pessoa TEXT DEFAULT 'juridica', -- juridica, fisica
    segmento TEXT,
    porte TEXT, -- micro, pequena, media, grande
    
    -- Contato principal
    contato_nome TEXT NOT NULL,
    contato_cargo TEXT,
    contato_telefone TEXT NOT NULL,
    contato_email TEXT,
    contato_whatsapp TEXT,
    
    -- Endereço
    endereco_cep TEXT,
    endereco_logradouro TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    
    -- Classificação
    status TEXT DEFAULT 'ativo', -- ativo, inativo, prospecto
    origem TEXT, -- indicacao, site, evento, ligacao_fria, etc
    tags TEXT[],
    
    -- Informações comerciais
    data_primeira_compra DATE,
    valor_total_vendas DECIMAL(12, 2) DEFAULT 0,
    quantidade_vendas INTEGER DEFAULT 0,
    
    -- Observações
    observacoes TEXT,
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users_profile(id),
    responsavel_id UUID REFERENCES users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tipo_pessoa_valido CHECK (tipo_pessoa IN ('juridica', 'fisica')),
    CONSTRAINT status_valido CHECK (status IN ('ativo', 'inativo', 'prospecto'))
);

-- Índices
CREATE INDEX idx_clientes_nome ON clientes(nome_empresa);
CREATE INDEX idx_clientes_documento ON clientes(documento);
CREATE INDEX idx_clientes_status ON clientes(status) WHERE ativo = true;
CREATE INDEX idx_clientes_responsavel ON clientes(responsavel_id);
CREATE INDEX idx_clientes_tags ON clientes USING GIN(tags);

-- Trigger updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Refatorar Tabela `leads`

```sql
-- =====================================================
-- REFATORAÇÃO: leads (agora são oportunidades)
-- =====================================================

-- Adicionar campo cliente_id
ALTER TABLE leads ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT;

-- Criar índice
CREATE INDEX idx_leads_cliente ON leads(cliente_id);

-- Adicionar campos adicionais para oportunidades
ALTER TABLE leads ADD COLUMN titulo TEXT; -- Ex: "Proposta Q1 2026", "Expansão São Paulo"
ALTER TABLE leads ADD COLUMN tipo_venda TEXT; -- novo_cliente, upsell, cross_sell, renovacao
ALTER TABLE leads ADD COLUMN data_fechamento_prevista DATE;
ALTER TABLE leads ADD COLUMN data_fechamento_real DATE;
ALTER TABLE leads ADD COLUMN motivo_ganho TEXT; -- quando etapa = fechado
ALTER TABLE leads ADD COLUMN concorrentes TEXT[]; -- quem mais está disputando

-- Adicionar constraint
ALTER TABLE leads ADD CONSTRAINT tipo_venda_valido 
    CHECK (tipo_venda IN ('novo_cliente', 'upsell', 'cross_sell', 'renovacao'));

-- IMPORTANTE: Manter campos de contato por compatibilidade (serão movidos para clientes)
-- Mas torná-los opcionais agora que temos cliente_id
ALTER TABLE leads ALTER COLUMN contato_nome DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN contato_telefone DROP NOT NULL;
```

---

### 3. Script de Migração de Dados

```sql
-- =====================================================
-- MIGRAÇÃO: Transformar leads antigos em clientes + leads
-- =====================================================

-- Criar clientes a partir dos leads existentes
INSERT INTO clientes (
    id,
    nome_empresa,
    contato_nome,
    contato_cargo,
    contato_telefone,
    contato_email,
    segmento,
    origem,
    tags,
    observacoes,
    status,
    responsavel_id,
    created_by,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    empresa as nome_empresa,
    contato_nome,
    contato_cargo,
    contato_telefone,
    contato_email,
    segmento,
    origem,
    tags,
    observacoes,
    CASE 
        WHEN etapa = 'fechado' THEN 'ativo'
        WHEN etapa = 'perdido' THEN 'inativo'
        ELSE 'prospecto'
    END as status,
    responsavel_id,
    created_by,
    created_at
FROM leads
WHERE ativo = true;

-- Atualizar leads para referenciar os novos clientes
-- (Matching por nome + telefone para evitar duplicatas)
UPDATE leads l
SET cliente_id = c.id
FROM clientes c
WHERE l.empresa = c.nome_empresa 
  AND l.contato_telefone = c.contato_telefone;

-- Adicionar título aos leads antigos
UPDATE leads
SET titulo = CONCAT('Oportunidade ', empresa)
WHERE titulo IS NULL;

-- Verificar que todos os leads têm cliente_id
-- (Se houver algum NULL, revisar manualmente)
SELECT COUNT(*) as leads_sem_cliente 
FROM leads 
WHERE cliente_id IS NULL AND ativo = true;

-- Após confirmar que está tudo certo, tornar cliente_id obrigatório
-- ALTER TABLE leads ALTER COLUMN cliente_id SET NOT NULL;
```

---

### 4. Ajustar Tabela `interacoes`

```sql
-- Interações continuam relacionadas a leads (oportunidades)
-- Mas podemos adicionar visualização por cliente através de JOINs

-- View para ver todas as interações de um cliente
CREATE OR REPLACE VIEW v_interacoes_cliente AS
SELECT 
    c.id as cliente_id,
    c.nome_empresa,
    i.*,
    l.titulo as lead_titulo,
    l.etapa as lead_etapa
FROM interacoes i
JOIN leads l ON i.lead_id = l.id
JOIN clientes c ON l.cliente_id = c.id;
```

---

### 5. Views Úteis

```sql
-- View: Clientes com estatísticas
CREATE OR REPLACE VIEW v_clientes_completo AS
SELECT 
    c.*,
    u.nome_completo as responsavel_nome,
    COUNT(DISTINCT l.id) as total_oportunidades,
    COUNT(DISTINCT l.id) FILTER (WHERE l.etapa = 'fechado') as total_fechados,
    SUM(l.valor_estimado) FILTER (WHERE l.etapa NOT IN ('fechado', 'perdido')) as valor_pipeline,
    SUM(l.valor_estimado) FILTER (WHERE l.etapa = 'fechado') as valor_fechado,
    MAX(l.created_at) as ultima_oportunidade,
    COUNT(DISTINCT i.id) as total_interacoes
FROM clientes c
LEFT JOIN users_profile u ON c.responsavel_id = u.id
LEFT JOIN leads l ON c.id = l.cliente_id AND l.ativo = true
LEFT JOIN interacoes i ON l.id = i.lead_id
WHERE c.ativo = true
GROUP BY c.id, u.nome_completo;

-- View: Leads com informações do cliente
CREATE OR REPLACE VIEW v_leads_com_cliente AS
SELECT 
    l.*,
    c.nome_empresa as cliente_nome,
    c.documento as cliente_documento,
    c.segmento as cliente_segmento,
    c.status as cliente_status,
    u.nome_completo as responsavel_nome,
    (SELECT COUNT(*) FROM interacoes WHERE lead_id = l.id) as total_interacoes,
    EXTRACT(DAY FROM (NOW() - l.data_entrada_etapa)) as dias_na_etapa_atual
FROM leads l
JOIN clientes c ON l.cliente_id = c.id
LEFT JOIN users_profile u ON l.responsavel_id = u.id
WHERE l.ativo = true;
```

---

### 6. RLS Policies para `clientes`

```sql
-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver clientes ativos
CREATE POLICY "Usuários podem ver clientes ativos"
    ON clientes FOR SELECT
    USING (auth.uid() IS NOT NULL AND ativo = true);

-- Usuários podem criar clientes
CREATE POLICY "Usuários podem criar clientes"
    ON clientes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem atualizar clientes
CREATE POLICY "Usuários podem atualizar clientes"
    ON clientes FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Apenas criador pode deletar
CREATE POLICY "Usuários podem deletar próprios clientes"
    ON clientes FOR DELETE
    USING (auth.uid() = created_by);
```

---

## 🎨 NOVAS INTERFACES

### 1. Tela de Clientes (nova)

```
/clientes
├── Lista de clientes (tabela/cards)
├── Filtros (status, segmento, responsável)
├── Busca
├── Botão "Novo Cliente"
└── Ações por cliente:
    ├── Ver detalhes
    ├── Editar
    ├── Criar nova oportunidade
    └── Ver histórico de oportunidades
```

### 2. Tela de Detalhes do Cliente (nova)

```
Modal/Página do Cliente
├── Aba "Informações"
│   ├── Dados cadastrais
│   ├── Contatos
│   └── Endereço
├── Aba "Oportunidades"
│   ├── Lista de leads ativos
│   ├── Histórico de oportunidades fechadas/perdidas
│   └── Botão "Nova Oportunidade"
├── Aba "Histórico"
│   ├── Timeline agregada de todas as interações
│   └── Filtro por lead
└── Aba "Financeiro"
    ├── Valor total vendido
    ├── Quantidade de vendas
    └── Gráfico temporal
```

### 3. Kanban Modificado

```
/kanban (agora mostra OPORTUNIDADES, não clientes)

Card do Lead:
├── Título da oportunidade
├── Nome do cliente (link para perfil)
├── Valor
├── Dias na etapa
└── Botões de ação
```

### 4. Formulário de Nova Oportunidade

```
Criar Lead:
├── Selecionar cliente existente (dropdown/busca)
│   └── OU criar cliente novo
├── Título da oportunidade
├── Valor estimado
├── Tipo de venda (novo, upsell, cross-sell)
├── Probabilidade
├── Data prevista de fechamento
└── Observações
```

---

## 📝 TIPOS TYPESCRIPT

### Cliente Types (src/types/cliente.types.ts)

```typescript
import { Database } from './database.types'

export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export type StatusCliente = 'ativo' | 'inativo' | 'prospecto'
export type TipoPessoa = 'juridica' | 'fisica'

export interface ClienteExtended extends Cliente {
  responsavel_nome?: string
  total_oportunidades?: number
  total_fechados?: number
  valor_pipeline?: number
  valor_fechado?: number
  ultima_oportunidade?: string
  total_interacoes?: number
}

// Lead agora é oportunidade
export type TipoVenda = 'novo_cliente' | 'upsell' | 'cross_sell' | 'renovacao'

export interface LeadComCliente extends Lead {
  cliente_nome: string
  cliente_documento?: string
  cliente_segmento?: string
  cliente_status: string
}
```

---

## 🔧 HOOKS

### useClientes (src/lib/hooks/useClientes.ts)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClienteExtended } from '@/types/cliente.types'
import { useToast } from '@/components/ui/use-toast'

interface ClienteFilters {
  busca?: string
  status?: string
  segmento?: string
  responsavel_id?: string
}

export function useClientes(filters?: ClienteFilters) {
  const [clientes, setClientes] = useState<ClienteExtended[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  const fetchClientes = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('v_clientes_completo')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.busca) {
        query = query.or(`nome_empresa.ilike.%${filters.busca}%,contato_nome.ilike.%${filters.busca}%`)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.segmento) {
        query = query.eq('segmento', filters.segmento)
      }

      if (filters?.responsavel_id) {
        query = query.eq('responsavel_id', filters.responsavel_id)
      }

      const { data, error } = await query

      if (error) throw error

      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar os clientes.',
      })
    } finally {
      setLoading(false)
    }
  }

  const createCliente = async (data: ClienteInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert({
          ...data,
          created_by: user?.id,
          responsavel_id: data.responsavel_id || user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setClientes((prev) => [newCliente, ...prev])

      toast({
        title: 'Cliente criado',
        description: `${data.nome_empresa} foi cadastrado com sucesso.`,
      })

      return newCliente
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar cliente',
        description: 'Não foi possível criar o cliente.',
      })
      throw error
    }
  }

  const updateCliente = async (clienteId: string, data: ClienteUpdate) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update(data)
        .eq('id', clienteId)

      if (error) throw error

      setClientes((prev) =>
        prev.map((c) => (c.id === clienteId ? { ...c, ...data } : c))
      )

      toast({
        title: 'Cliente atualizado',
        description: 'As informações foram atualizadas.',
      })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o cliente.',
      })
      throw error
    }
  }

  const deleteCliente = async (clienteId: string) => {
    try {
      // Soft delete
      const { error } = await supabase
        .from('clientes')
        .update({ ativo: false })
        .eq('id', clienteId)

      if (error) throw error

      setClientes((prev) => prev.filter((c) => c.id !== clienteId))

      toast({
        title: 'Cliente removido',
        description: 'O cliente foi removido do cadastro.',
      })
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: 'Não foi possível remover o cliente.',
      })
      throw error
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [filters])

  return {
    clientes,
    loading,
    refetch: fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
  }
}
```

---

## 🎯 COMPONENTES PRINCIPAIS

### 1. ClientesTable (src/components/clientes/ClientesTable.tsx)

Tabela com:
- Nome da empresa
- Contato principal
- Status (badge colorido)
- Total de oportunidades
- Valor em pipeline
- Ações (ver, editar, nova oportunidade)

### 2. ClienteDetailsDialog (src/components/clientes/ClienteDetailsDialog.tsx)

Modal com abas:
- Informações cadastrais
- Lista de oportunidades
- Histórico agregado
- Botão "Nova Oportunidade"

### 3. ClienteForm (src/components/clientes/ClienteForm.tsx)

Formulário completo com:
- Dados da empresa
- Contato principal
- Endereço (opcional)
- Classificação

### 4. NovaOportunidadeDialog (modificado)

Agora com:
- Seleção de cliente (dropdown busca)
- OU link "Criar novo cliente"
- Campos da oportunidade

---

## 🔄 MODIFICAÇÕES EM COMPONENTES EXISTENTES

### LeadCard (src/components/kanban/LeadCard.tsx)

```typescript
// Adicionar nome do cliente
<div className="flex items-center gap-2 text-xs text-gray-500">
  <Building className="w-3 h-3" />
  <Link href={`/clientes/${lead.cliente_id}`} className="hover:underline">
    {lead.cliente_nome}
  </Link>
</div>

// Título da oportunidade (novo)
<h4 className="font-semibold text-gray-900">
  {lead.titulo}
</h4>
```

### LeadForm

Adicionar no topo:
```typescript
<FormField name="cliente_id">
  <ClienteSelect 
    value={cliente_id}
    onChange={setClienteId}
    onCreateNew={() => setShowClienteForm(true)}
  />
</FormField>
```

---

## 📊 DASHBOARD ATUALIZADO

### Novas Métricas:

```
┌─────────────────────────────────────┐
│  Total de Clientes: 150             │
│  ├─ Ativos: 120                     │
│  ├─ Inativos: 20                    │
│  └─ Prospectos: 10                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Oportunidades Abertas: 45          │
│  Oportunidades Fechadas: 30         │
│  Taxa de Conversão: 40%             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Ticket Médio por Cliente: R$ 15k   │
│  Valor Médio por Oportunidade: R$ 8k│
└─────────────────────────────────────┘
```

### Novos Gráficos:

1. **Clientes Ativos vs Inativos** (pizza)
2. **Oportunidades por Cliente** (barras)
3. **Taxa de Sucesso por Tipo de Venda** (barras)
4. **Evolução de Novos Clientes** (linha)

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Nova tabela `clientes` criada
- [ ] Tabela `leads` refatorada
- [ ] Migração de dados executada e validada
- [ ] Views criadas e funcionando
- [ ] Policies RLS configuradas
- [ ] Tela de clientes implementada
- [ ] Formulário de cliente funcionando
- [ ] Kanban atualizado (mostra oportunidades)
- [ ] Link cliente → oportunidades funciona
- [ ] Criar oportunidade para cliente existente funciona
- [ ] Histórico agregado por cliente funciona
- [ ] Dashboard com novas métricas
- [ ] Todos os testes passando
- [ ] Documentação atualizada

---

## 🧪 TESTES MANUAIS

### Teste 1: Migração
1. Fazer backup do banco
2. Executar script de migração
3. Validar que todos os leads têm cliente_id
4. Verificar contagem: N leads → N clientes

### Teste 2: Criar Cliente
1. Acessar /clientes
2. Clicar "Novo Cliente"
3. Preencher formulário
4. Salvar
5. Verificar na lista

### Teste 3: Nova Oportunidade
1. Abrir detalhes de um cliente
2. Clicar "Nova Oportunidade"
3. Preencher dados
4. Verificar no Kanban

### Teste 4: Histórico Unificado
1. Criar 2 oportunidades para o mesmo cliente
2. Adicionar interações em ambas
3. Ver detalhes do cliente
4. Verificar que histórico mostra tudo

### Teste 5: Múltiplas Vendas
1. Cliente A tem oportunidade 1 (fechado)
2. Criar oportunidade 2 para cliente A
3. Verificar que aparecem separadas no Kanban
4. Verificar métricas do cliente

---

## 📝 NOTAS IMPORTANTES

### Sobre Migração
⚠️ **BACKUP OBRIGATÓRIO** antes de executar migração  
⚠️ Executar em horário de baixo uso  
⚠️ Testar primeiro em ambiente de staging  
⚠️ Ter plano de rollback preparado  

### Sobre Duplicatas
- Script de migração usa nome + telefone para matching
- Pode haver duplicatas se dados inconsistentes
- Revisar manualmente após migração
- Implementar verificação de duplicatas no cadastro

### Sobre Performance
- Views podem ficar lentas com muitos dados
- Considerar materializar views se necessário
- Adicionar índices conforme uso

### Compatibilidade
- Manter campos antigos em `leads` por um período
- Deprecar gradualmente
- Atualizar documentação da API

---

## 🚀 BENEFÍCIOS APÓS IMPLEMENTAÇÃO

✅ **Cadastro único** - Cliente cadastrado uma vez  
✅ **Múltiplas vendas** - Várias oportunidades por cliente  
✅ **Histórico completo** - Toda jornada do cliente  
✅ **Relatórios melhores** - Separação cliente vs oportunidade  
✅ **Escalável** - Preparado para crescimento  
✅ **Profissional** - Modelo usado por CRMs enterprise  

---

## 💡 PRÓXIMOS PASSOS (Pós-Fase 7)

### Fase 8 (Opcional):
- Múltiplos contatos por cliente
- Contas corporativas (hierarquia)
- Territórios de venda
- Previsão de receita (forecast)
- Integração com ERP
- API pública para parceiros

---

## 🎓 QUANDO IMPLEMENTAR

**Implemente a Fase 7 quando:**
- ✅ Sistema em produção e estável
- ✅ Base de clientes crescendo
- ✅ Necessidade de múltiplas vendas por cliente
- ✅ Equipe familiarizada com o sistema atual
- ✅ Tempo disponível para refatoração (2 semanas)

**NÃO implemente se:**
- ❌ Ainda no MVP
- ❌ Poucos clientes cadastrados
- ❌ Raramente há múltiplas vendas por cliente
- ❌ Pressa para features novas

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS  
**Status:** Planejamento Futuro