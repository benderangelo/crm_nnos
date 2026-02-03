-- =====================================================
-- FASE 9: GERAÇÃO AUTOMÁTICA DE PROPOSTAS
-- Adiciona suporte para propostas na tabela anexos existente
-- =====================================================

-- PASSO 1: Dropar policies antigas PRIMEIRO (para evitar conflitos)
-- =====================================================
DROP POLICY IF EXISTS "Usuários podem ver anexos" ON anexos;
DROP POLICY IF EXISTS "Usuários podem criar anexos" ON anexos;
DROP POLICY IF EXISTS "Usuários podem deletar próprios anexos" ON anexos;

-- PASSO 2: Adicionar novas colunas na tabela anexos
-- =====================================================
ALTER TABLE anexos
ADD COLUMN IF NOT EXISTS numero_aps INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES users_profile(id);

-- PASSO 3: Migrar dados das colunas antigas para as novas
-- =====================================================
-- Copiar dados de url_storage para storage_path (se existir)
UPDATE anexos SET storage_path = url_storage WHERE storage_path IS NULL AND url_storage IS NOT NULL;

-- Copiar dados de usuario_id para criado_por (se existir)
UPDATE anexos SET criado_por = usuario_id WHERE criado_por IS NULL AND usuario_id IS NOT NULL;

-- PASSO 4: Atualizar constraint de tipo_documento
-- =====================================================
ALTER TABLE anexos DROP CONSTRAINT IF EXISTS tipo_documento_valido;
ALTER TABLE anexos ADD CONSTRAINT tipo_documento_valido 
  CHECK (tipo_documento IN ('proposta', 'contrato', 'apresentacao', 'documento', 'imagem', 'outro'));

-- PASSO 5: Adicionar índice para numero_aps
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_anexos_numero_aps ON anexos(numero_aps) WHERE numero_aps IS NOT NULL;

-- PASSO 6: Criar tabela contador_aps
-- =====================================================
CREATE TABLE IF NOT EXISTS contador_aps (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Apenas 1 registro
  proximo_numero INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro inicial (apenas se não existir)
INSERT INTO contador_aps (id, proximo_numero) 
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE contador_aps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver contador" ON contador_aps;
CREATE POLICY "Todos podem ver contador"
  ON contador_aps FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas sistema pode atualizar contador" ON contador_aps;
CREATE POLICY "Apenas sistema pode atualizar contador"
  ON contador_aps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PASSO 7: Função para obter próximo número APS (thread-safe)
-- =====================================================
CREATE OR REPLACE FUNCTION obter_proximo_aps()
RETURNS INTEGER AS $$
DECLARE
  novo_numero INTEGER;
BEGIN
  UPDATE contador_aps
  SET proximo_numero = proximo_numero + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING proximo_numero - 1 INTO novo_numero;
  
  RETURN novo_numero;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 8: View para facilitar consulta de propostas
-- =====================================================
CREATE OR REPLACE VIEW v_propostas_lead AS
SELECT 
  a.*,
  l.empresa as lead_empresa,
  u.nome_completo as criado_por_nome
FROM anexos a
LEFT JOIN leads l ON a.lead_id = l.id
LEFT JOIN users_profile u ON a.criado_por = u.id
WHERE a.tipo_documento = 'proposta'
ORDER BY a.numero_aps DESC NULLS LAST, a.created_at DESC;

-- PASSO 9: Recriar policies (usando as novas colunas)
-- =====================================================
CREATE POLICY "Usuários podem ver anexos"
  ON anexos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM leads WHERE leads.id = anexos.lead_id AND leads.ativo = true)
  );

CREATE POLICY "Usuários podem criar anexos"
  ON anexos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar próprios anexos"
  ON anexos FOR DELETE
  USING (auth.uid() = criado_por);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- NOTA: As colunas antigas (url_storage e usuario_id) NÃO foram deletadas
-- para manter compatibilidade. Você pode deletá-las manualmente depois
-- de verificar que tudo funciona:
-- 
-- ALTER TABLE anexos DROP COLUMN IF EXISTS url_storage;
-- ALTER TABLE anexos DROP COLUMN IF EXISTS usuario_id;
