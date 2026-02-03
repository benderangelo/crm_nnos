-- =====================================================
-- FIX DEFINITIVO: Constraint etapa_valida
-- =====================================================

-- O erro "violates check constraint 'etapa_valida'" é a PROVA de que
-- a constraint existe, mesmo que não esteja visível na interface simplificada.
-- Se ela não existisse, não haveria erro de validação.

-- Para garantir que resolvemos, vamos rodar em uma única transação:

BEGIN;

-- 1. Tentar remover a constraint (se ela existir)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS etapa_valida;

-- 2. Recriar a constraint com TODAS as etapas do sistema
-- Isso inclui 'proposta' e 'negociacao' que provavelmente faltavam
ALTER TABLE leads ADD CONSTRAINT etapa_valida 
  CHECK (etapa IN ('novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido'));

COMMIT;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Após rodar, execute este comando separado para confirmar que ela foi criada:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'leads'::regclass;
