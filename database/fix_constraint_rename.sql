-- =====================================================
-- FIX FINAL: Renomear e recriar constraint
-- =====================================================

BEGIN;

-- 1. Remover a constraint antiga (com o nome que estava diferente do padrão)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS etapa_valida;

-- 2. Remover também pelo novo nome, caso já tenha tentado rodar
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_etapa_check;

-- 3. Criar com o nome padronizado (leads_...) e os valores corretos
ALTER TABLE leads ADD CONSTRAINT leads_etapa_check
  CHECK (etapa IN ('novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido'));

COMMIT;

-- Verifica se foi criado corretamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass;
