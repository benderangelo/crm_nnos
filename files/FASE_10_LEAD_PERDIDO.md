# 💔 FASE 12: ETAPA "LEAD PERDIDO" COM MOTIVO
**Duração:** 4-6 horas | **Prioridade:** 🟢 MÉDIA

## 📋 CONTEXTO
> "Criar mais uma caixinha no kanban de proposta perdida e colocar motivo. Fechou com outro, troca de budget..."

**Objetivo:** Nova etapa no kanban para leads perdidos com motivo obrigatório.

## 🎯 FUNCIONALIDADES

### Nova Etapa Kanban:
**"Perdido"** - Última coluna do kanban

### Motivos (enum):
- `fechou_concorrente` - Fechou com concorrente
- `sem_budget` - Sem orçamento
- `preco_alto` - Preço muito alto
- `prazo` - Prazo não atendeu
- `proposta_tecnica` - Proposta técnica inadequada
- `mudanca_diretoria` - Mudança de gestão
- `projeto_cancelado` - Cliente cancelou projeto
- `outro` - Outro motivo (campo texto livre)

## 🗄️ BANCO DE DADOS

```sql
-- Adicionar colunas na tabela leads
ALTER TABLE leads 
ADD COLUMN motivo_perda TEXT NULL CHECK (
  motivo_perda IN (
    'fechou_concorrente',
    'sem_budget',
    'preco_alto',
    'prazo',
    'proposta_tecnica',
    'mudanca_diretoria',
    'projeto_cancelado',
    'outro'
  )
),
ADD COLUMN motivo_perda_descricao TEXT NULL;

-- Comentários
COMMENT ON COLUMN leads.motivo_perda IS 'Motivo da perda do lead';
COMMENT ON COLUMN leads.motivo_perda_descricao IS 'Descrição detalhada quando motivo = outro';
```

## 🔧 FRONTEND

### Modal ao Mover para "Perdido":

```typescript
// LeadPerdidoDialog.tsx
export function LeadPerdidoDialog({ lead, onConfirm }: Props) {
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Por que este lead foi perdido?</DialogTitle>
        </DialogHeader>
        
        <Select value={motivo} onValueChange={setMotivo}>
          <SelectItem value="fechou_concorrente">Fechou com Concorrente</SelectItem>
          <SelectItem value="sem_budget">Sem Orçamento</SelectItem>
          <SelectItem value="preco_alto">Preço Alto</SelectItem>
          <SelectItem value="prazo">Prazo</SelectItem>
          <SelectItem value="proposta_tecnica">Proposta Técnica</SelectItem>
          <SelectItem value="mudanca_diretoria">Mudança de Diretoria</SelectItem>
          <SelectItem value="projeto_cancelado">Projeto Cancelado</SelectItem>
          <SelectItem value="outro">Outro</SelectItem>
        </Select>

        {motivo === 'outro' && (
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o motivo..."
          />
        )}

        <DialogFooter>
          <Button onClick={() => onConfirm(motivo, descricao)}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Lógica Drag & Drop:

```typescript
// No onDragEnd do Kanban
if (newStage === 'perdido' && !lead.motivo_perda) {
  setLeadToMarkLost(lead)
  setShowLostDialog(true)
  return // Não move ainda
}
```

## 📊 DASHBOARD

### Novo Gráfico: Motivos de Perda

```typescript
// MotivosPerdaChart.tsx
const { data } = await supabase
  .from('leads')
  .select('motivo_perda')
  .eq('stage', 'perdido')

// Gráfico de pizza mostrando distribuição dos motivos
```

## 🔍 DIFERENÇA: Perdido vs Frio

**Lead Perdido:**
- ❌ Definitivamente não vai fechar
- ❌ Cliente fechou com outro ou desistiu
- ❌ Precisa de motivo obrigatório
- ❌ Sai do pipeline ativo

**Lead Frio (existente):**
- ⏸️ Parado temporariamente
- ⏸️ Pode voltar no futuro
- ⏸️ Continua no pipeline
- ⏸️ Ex: "Aguardando nova diretoria"

## ✅ CHECKLIST
- [ ] Colunas `motivo_perda` e `motivo_perda_descricao` criadas
- [ ] Nova stage "Perdido" no enum
- [ ] Modal LeadPerdidoDialog criado
- [ ] Drag & drop valida motivo obrigatório
- [ ] Gráfico de motivos no dashboard
- [ ] Badge "Perdido" no card com ícone 💔

**Estimativa:** 4-6h | **Complexidade:** 3/10
