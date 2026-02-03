# 📊 FASE 11: DASHBOARD COM FILTROS POR USUÁRIO
**Duração:** 1 dia | **Prioridade:** 🟡 ALTA | **Pré-requisito:** Fase 10

## 📋 CONTEXTO
> "Tem que ter filtro no dashboard por pessoa, por usuário. Ver quem criou 10, quem converteu 5."

**Objetivo:** Filtros e gráficos por usuário para acompanhar empenho individual.

## 🎯 FUNCIONALIDADES

### Filtros:
- Por Usuário (dropdown)
- Por Período (semana/mês/trimestre/ano)
- Limpar Filtros

### Novos Gráficos:
1. **Top Criadores** - Ranking por quantidade
2. **Top por Valor** - Ranking por R$ fechado
3. **Taxa de Conversão** - Tabela com %
4. **Evolução Mensal** - Linha do tempo por pessoa

## 📊 QUERIES

```sql
-- Top Criadores
SELECT u.email, COUNT(l.id) as total
FROM leads l
JOIN auth.users u ON l.criado_por = u.id
WHERE l.created_at >= :data_inicio
GROUP BY u.email
ORDER BY total DESC;

-- Taxa Conversão
SELECT 
  criado_por,
  COUNT(*) as criados,
  COUNT(*) FILTER (WHERE stage = 'fechado') as fechados,
  ROUND((COUNT(*) FILTER (WHERE stage = 'fechado')::numeric / COUNT(*) * 100), 2) as taxa
FROM leads
GROUP BY criado_por;
```

## ✅ CHECKLIST
- [ ] Componente DashboardFilters
- [ ] TopCriadoresChart  
- [ ] TaxaConversaoTable
- [ ] Filtros aplicam em toda página
- [ ] Queries otimizadas

**Estimativa:** 1 dia | **Complexidade:** 4/10
