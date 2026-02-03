# 📊 Documentação do Banco de Dados - CRM NNOS

## Índice
1. [Visão Geral](#visão-geral)
2. [Tabelas Detalhadas](#tabelas-detalhadas)
3. [Relacionamentos](#relacionamentos)
4. [Segurança (RLS)](#segurança-rls)
5. [Triggers e Funções](#triggers-e-funções)
6. [Como Usar](#como-usar)

---

## Visão Geral

O banco de dados foi projetado para ser **simples, escalável e seguro**, usando as melhores práticas do Supabase.

### Características Principais:
- ✅ Autenticação integrada do Supabase (email/senha)
- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Auditoria automática (created_at, updated_at)
- ✅ Soft delete (coluna `ativo`)
- ✅ Histórico completo de mudanças de etapa
- ✅ Suporte a anexos via Supabase Storage

---

## Tabelas Detalhadas

### 1. **users_profile**
Complementa a tabela `auth.users` do Supabase com informações de perfil.

**Campos:**
- `id` (UUID, PK): Referência ao auth.users
- `nome_completo` (TEXT): Nome do usuário
- `telefone` (TEXT): Telefone de contato
- `cargo` (TEXT): Cargo na empresa
- `avatar_url` (TEXT): URL da foto de perfil
- `ativo` (BOOLEAN): Se o usuário está ativo
- `created_at`, `updated_at`: Timestamps

**Por que existe?**
O Supabase não permite adicionar campos customizados em `auth.users`, então criamos uma tabela complementar.

---

### 2. **leads**
Tabela principal do CRM. Armazena empresas/negócios.

**Campos Principais:**
- `id` (UUID, PK): Identificador único
- `empresa` (TEXT): Nome da empresa
- `contato_nome`, `contato_telefone`, `contato_email`: Dados do contato
- `valor_estimado` (DECIMAL): Valor do negócio
- `etapa` (TEXT): novo | contato | proposta | negociacao | fechado | perdido
- `responsavel_id` (UUID): Quem é dono do lead
- `proxima_acao_data`, `proxima_acao_descricao`: Follow-up
- `tags` (TEXT[]): Array de tags customizáveis

**Campos Calculados (via View):**
- `dias_na_etapa_atual`: Quantos dias está na etapa
- `total_interacoes`: Quantidade de interações
- `ultima_interacao`: Data da última interação

**Constraints:**
- Etapa deve ser uma das 6 opções válidas
- Probabilidade entre 0-100

---

### 3. **interacoes**
Histórico cronológico de todas as ações/notas relacionadas ao lead.

**Tipos de Interação:**
- `nota`: Anotação geral
- `ligacao`: Registro de ligação telefônica
- `email`: Email enviado/recebido
- `reuniao`: Reunião presencial/online
- `whatsapp`: Mensagem WhatsApp
- `proposta`: Proposta comercial enviada
- `outro`: Outros tipos

**Uso:**
Cada vez que o vendedor faz qualquer ação, registra aqui. Serve como linha do tempo do lead.

---

### 4. **anexos**
Gerencia arquivos relacionados aos leads (propostas, contratos, apresentações).

**Como funciona:**
1. Arquivo é enviado para o **Supabase Storage**
2. URL do arquivo é salva nesta tabela
3. Metadados (nome, tipo, tamanho) também são salvos

**Tipos de Documento:**
- `proposta`: Proposta comercial
- `contrato`: Contrato assinado
- `apresentacao`: Apresentação/slides
- `documento`: Documento genérico
- `imagem`: Fotos/imagens
- `outro`: Outros

---

### 5. **mudancas_etapa**
Log automático de todas as mudanças de etapa.

**Campos:**
- `etapa_anterior`, `etapa_nova`: Transição
- `tempo_na_etapa_anterior`: Quanto tempo ficou na etapa
- `observacao`: Nota opcional

**Utilidade:**
- Analisar ciclo de vendas
- Identificar gargalos no funil
- Relatórios de performance

**Importante:** Alimentada automaticamente via TRIGGER!

---

## Relacionamentos

```
auth.users (Supabase)
    ↓ (1:1)
users_profile
    ↓ (1:N)
leads ───┬─→ (1:N) interacoes
         ├─→ (1:N) anexos
         └─→ (1:N) mudancas_etapa
```

### Detalhamento:
- Um **user** tem um **profile**
- Um **user** pode ser responsável por vários **leads**
- Um **lead** pode ter várias **interações**
- Um **lead** pode ter vários **anexos**
- Um **lead** gera várias **mudanças de etapa**

### Cascata de Delete:
- Deletar um lead → deleta todas interações, anexos e mudanças
- Deletar um user → deleta seu profile (mas leads permanecem)

---

## Segurança (RLS)

### O que é Row Level Security?
Permite controlar **quais linhas** cada usuário pode ver/editar, não apenas quais tabelas.

### Policies Implementadas:

#### **users_profile:**
- ✅ Usuário vê seu próprio perfil
- ✅ Usuário vê perfis de outros (para atribuir leads)
- ✅ Usuário atualiza apenas seu perfil

#### **leads:**
- ✅ Todos os usuários autenticados veem todos os leads ativos
- ✅ Todos podem criar leads
- ✅ Todos podem atualizar leads
- ⚠️ Apenas criador pode deletar

**Por que todos veem todos?**
Como você mencionou que é uso interno com 5 pessoas e não precisa de permissões diferentes, todos têm acesso a tudo. Se no futuro quiser mudar isso, basta ajustar as policies.

#### **interacoes, anexos, mudancas_etapa:**
- ✅ Usuários veem apenas de leads que eles têm acesso
- ✅ Usuários criam livremente
- ✅ Usuários editam/deletam apenas o que criaram

---

## Triggers e Funções

### 1. **update_updated_at_column()**
**O que faz:** Atualiza automaticamente o campo `updated_at` sempre que um registro é modificado.

**Aplicado em:** users_profile, leads

### 2. **log_mudanca_etapa()**
**O que faz:** 
- Detecta quando a etapa de um lead muda
- Registra automaticamente na tabela `mudancas_etapa`
- Calcula tempo na etapa anterior
- Atualiza `data_entrada_etapa` do lead

**Quando executa:** Sempre que um lead é atualizado (BEFORE UPDATE)

### 3. **handle_new_user()**
**O que faz:**
- Quando um novo usuário se registra via Auth
- Cria automaticamente um registro em `users_profile`
- Popula com email ou nome (se fornecido)

**Quando executa:** Após signup (AFTER INSERT em auth.users)

---

## Views Úteis

### **v_leads_completo**
Traz todos os dados do lead + informações agregadas:
- Nome do responsável
- Total de interações
- Total de anexos
- Última interação
- Dias na etapa atual

**Uso:**
```sql
SELECT * FROM v_leads_completo 
WHERE etapa = 'proposta' 
ORDER BY dias_na_etapa_atual DESC;
```

### **v_funil_vendas**
Métricas agregadas por etapa:
- Quantidade de leads
- Valor total
- Ticket médio
- Tempo médio na etapa

**Uso:**
```sql
SELECT * FROM v_funil_vendas;
```

---

## Como Usar

### 1. **Executar o Script**
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o script `supabase-schema.sql`
4. Clique em **Run**

### 2. **Configurar Autenticação**
1. Vá em **Authentication** → **Providers**
2. Habilite **Email**
3. Configure templates de email (opcional)

### 3. **Configurar Storage (para anexos)**
1. Vá em **Storage**
2. Crie um bucket chamado `crm-anexos`
3. Configure policies de acesso:
```sql
-- Policy para upload
CREATE POLICY "Usuários podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'crm-anexos' AND
    auth.role() = 'authenticated'
);

-- Policy para leitura
CREATE POLICY "Usuários podem baixar arquivos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'crm-anexos' AND
    auth.role() = 'authenticated'
);
```

### 4. **Testar Localmente (Opcional)**
```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar localmente
supabase start

# Aplicar migrations
supabase db reset
```

---

## Queries Úteis

### Buscar leads por responsável
```sql
SELECT * FROM v_leads_completo
WHERE responsavel_id = 'USER_ID'
ORDER BY proxima_acao_data;
```

### Leads sem interação há mais de 7 dias
```sql
SELECT * FROM v_leads_completo
WHERE 
    ultima_interacao < NOW() - INTERVAL '7 days'
    OR ultima_interacao IS NULL
ORDER BY dias_na_etapa_atual DESC;
```

### Total em pipeline por usuário
```sql
SELECT 
    u.nome_completo,
    COUNT(l.id) as total_leads,
    SUM(l.valor_estimado) as valor_pipeline
FROM users_profile u
LEFT JOIN leads l ON u.id = l.responsavel_id AND l.ativo = true
GROUP BY u.id, u.nome_completo;
```

### Taxa de conversão
```sql
SELECT 
    COUNT(CASE WHEN etapa = 'fechado' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(*), 0) as taxa_conversao
FROM leads
WHERE ativo = true;
```

---

## Migrações Futuras

### Se precisar adicionar campos:
```sql
ALTER TABLE leads 
ADD COLUMN campo_novo TEXT;
```

### Se precisar adicionar permissões diferentes:
```sql
-- Exemplo: Apenas gerentes veem todos os leads
ALTER TABLE users_profile 
ADD COLUMN tipo_usuario TEXT DEFAULT 'vendedor';

-- Atualizar policy
DROP POLICY "Usuários podem ver leads ativos" ON leads;

CREATE POLICY "Vendedores veem próprios leads"
ON leads FOR SELECT
USING (
    auth.uid() = responsavel_id OR
    EXISTS (
        SELECT 1 FROM users_profile 
        WHERE id = auth.uid() 
        AND tipo_usuario = 'gerente'
    )
);
```

---

## Backup e Manutenção

### Backup Automático
O Supabase faz backup diário automaticamente (plano pago).

### Backup Manual
```bash
# Via CLI
supabase db dump -f backup.sql

# Restaurar
supabase db reset --db-url "postgresql://..."
```

### Limpar dados antigos (opcional)
```sql
-- Deletar leads perdidos há mais de 1 ano
DELETE FROM leads 
WHERE 
    etapa = 'perdido' 
    AND updated_at < NOW() - INTERVAL '1 year';

-- Arquivar ao invés de deletar
UPDATE leads 
SET ativo = false
WHERE etapa = 'perdido' 
AND updated_at < NOW() - INTERVAL '1 year';
```

---

## Métricas de Performance

### Índices Criados:
- ✅ leads.etapa (para filtros por etapa)
- ✅ leads.responsavel_id (para filtros por responsável)
- ✅ leads.proxima_acao_data (para agenda)
- ✅ interacoes.lead_id (para histórico)
- ✅ anexos.lead_id (para arquivos)

### Esperado:
- Consultas < 50ms para até 10.000 leads
- Drag & drop < 100ms
- Views agregadas < 200ms

---

## Suporte e Contato

**Dúvidas sobre Supabase:**
- Documentação: https://supabase.com/docs
- Discord: https://discord.supabase.com

**Próximos Passos:**
1. Executar script SQL
2. Configurar autenticação
3. Criar primeiro usuário de teste
4. Conectar frontend React ao Supabase
5. Implementar queries no código

---

🚀 **Estrutura pronta para produção!**