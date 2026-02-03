# 👥 FASE 10: TRACKING DE USUÁRIOS POR ETAPA
**Duração:** 1 dia | **Prioridade:** 🔴 CRÍTICA | **Complexidade:** 3/10

---

## 📋 CONTEXTO DA REUNIÃO

> **Pedro Colares:** "Isso é um recurso que a gente precisa, que a gente possa ter o controle de quem está trazendo o quê? Porque a gente vai ter comissionamento em cima de quem está trazendo e a gente tem meta."

> **Igor:** "Preciso linkar cada etapa com o usuário da etapa. Hoje eu consigo ver quem criou, mas não aparece visualmente no CRM."

**Problema:** Não há tracking de quem está fazendo cada etapa do lead.  
**Impacto:** Impossível fazer comissionamento e acompanhar metas individuais.

---

## 🎯 OBJETIVO

Rastrear completamente quais usuários estão envolvidos em cada etapa do lead:
- ✅ Quem criou o lead
- ✅ Quem é o responsável atual
- ✅ Histórico de transferências
- ✅ Base para comissionamento

---

## 🗄️ BANCO DE DADOS

### 1. Colunas na tabela `leads`

```sql
ALTER TABLE leads 
ADD COLUMN criado_por UUID REFERENCES auth.users(id),
ADD COLUMN responsavel_atual UUID REFERENCES auth.users(id),
ADD COLUMN modificado_por UUID REFERENCES auth.users(id);

CREATE INDEX idx_leads_criado_por ON leads(criado_por);
CREATE INDEX idx_leads_responsavel_atual ON leads(responsavel_atual);
```

### 2. Tabela de histórico

```sql
CREATE TABLE historico_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  usuario_anterior UUID REFERENCES auth.users(id),
  usuario_novo UUID NOT NULL REFERENCES auth.users(id),
  etapa_anterior TEXT,
  etapa_nova TEXT NOT NULL,
  motivo TEXT,
  alterado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historico_lead_id ON historico_responsaveis(lead_id);
CREATE INDEX idx_historico_usuario ON historico_responsaveis(usuario_novo);
```

### 3. Trigger automático

```sql
CREATE OR REPLACE FUNCTION registrar_mudanca_responsavel()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.responsavel_atual IS DISTINCT FROM NEW.responsavel_atual) 
     OR (OLD.stage IS DISTINCT FROM NEW.stage) THEN
    
    INSERT INTO historico_responsaveis (
      lead_id, usuario_anterior, usuario_novo, 
      etapa_anterior, etapa_nova
    ) VALUES (
      NEW.id, OLD.responsavel_atual, NEW.responsavel_atual,
      OLD.stage, NEW.stage
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mudanca_responsavel
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION registrar_mudanca_responsavel();
```

### 4. View com usuários

```sql
CREATE VIEW v_leads_com_usuarios AS
SELECT 
  l.*,
  up_criador.nome as criado_por_nome,
  up_criador.email as criado_por_email,
  up_responsavel.nome as responsavel_nome,
  up_responsavel.email as responsavel_email
FROM leads l
LEFT JOIN users_profile up_criador ON l.criado_por = up_criador.user_id
LEFT JOIN users_profile up_responsavel ON l.responsavel_atual = up_responsavel.user_id
WHERE l.deleted_at IS NULL;
```

---

## 🔧 IMPLEMENTAÇÃO

### 1. Types

```typescript
// src/types/tracking.types.ts

export interface HistoricoResponsavel {
  id: string
  lead_id: string
  usuario_anterior: string | null
  usuario_novo: string
  etapa_anterior: string | null
  etapa_nova: string
  alterado_em: string
}

// Estender Lead
export interface LeadComUsuarios extends Lead {
  criado_por_nome: string
  criado_por_email: string
  responsavel_nome: string
  responsavel_email: string
}
```

### 2. Hook: useUsuarios

```typescript
// src/lib/hooks/useUsuarios.ts

export function useUsuarios() {
  const supabase = useSupabase()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('users_profile')
        .select('user_id, nome, email')
        .order('nome')
      
      setUsuarios(data || [])
    }
    fetch()
  }, [])

  return { usuarios }
}
```

### 3. Atualizar criação de lead

```typescript
// Ao criar lead
const { data: { user } } = await supabase.auth.getUser()

await supabase.from('leads').insert({
  ...leadData,
  criado_por: user.id,         // NOVO
  responsavel_atual: user.id,  // NOVO
  modificado_por: user.id      // NOVO
})
```

### 4. Componente: TransferirResponsavelDialog

```typescript
// src/components/leads/TransferirResponsavelDialog.tsx

export function TransferirResponsavelDialog({ leadId, onSuccess }: Props) {
  const { usuarios } = useUsuarios()
  const [novoResponsavel, setNovoResponsavel] = useState('')

  const handleTransferir = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('leads')
      .update({
        responsavel_atual: novoResponsavel,
        modificado_por: user.id
      })
      .eq('id', leadId)
    
    onSuccess()
  }

  return (
    <Dialog>
      <Select value={novoResponsavel} onValueChange={setNovoResponsavel}>
        {usuarios.map(u => (
          <SelectItem key={u.user_id} value={u.user_id}>
            {u.nome}
          </SelectItem>
        ))}
      </Select>
      <Button onClick={handleTransferir}>Transferir</Button>
    </Dialog>
  )
}
```

### 5. Badge no LeadCard

```typescript
// Mostrar responsável no card
<div className="flex items-center gap-2">
  <User className="w-4 h-4" />
  <span className="text-sm">{lead.responsavel_nome}</span>
</div>
```

### 6. Histórico no LeadDetailsDialog

```typescript
// Nova aba "Histórico"
<TabsContent value="historico">
  {historico.map(item => (
    <div key={item.id}>
      {item.usuario_anterior_nome} → {item.usuario_novo_nome}
      <br />
      Etapa: {item.etapa_nova}
      <br />
      {formatDistanceToNow(new Date(item.alterado_em))}
    </div>
  ))}
</TabsContent>
```

---

## 📊 INDICADORES DISPONÍVEIS

Com tracking implementado:

✅ **Leads criados por usuário**  
✅ **Leads ativos por responsável**  
✅ **Taxa de conversão individual**  
✅ **Pipeline por pessoa**  
✅ **Histórico de transferências**  
✅ **Tempo médio em cada etapa por usuário**

---

## ✅ CHECKLIST

**Banco:**
- [ ] Colunas adicionadas
- [ ] Tabela histórico criada
- [ ] Trigger criado
- [ ] View criada

**Código:**
- [ ] Types criados
- [ ] Hook useUsuarios
- [ ] Hook useHistoricoResponsaveis
- [ ] Atualizar criação de lead
- [ ] Componente TransferirResponsavel
- [ ] Badge no LeadCard
- [ ] Aba Histórico

**Funcionalidades:**
- [ ] Registra quem criou
- [ ] Mostra responsável atual
- [ ] Permite transferir
- [ ] Histórico funciona

---

## 🎯 RESULTADO FINAL

**Antes:**
- ❌ Não sabe quem criou
- ❌ Não sabe quem é responsável
- ❌ Sem histórico
- ❌ Impossível comissionar

**Depois:**
- ✅ Tracking completo
- ✅ Histórico de mudanças
- ✅ Base para comissionamento
- ✅ Accountability total

---

**Estimativa:** 1 dia (6-8h) | **Complexidade:** 3/10 | **Risco:** 1/10