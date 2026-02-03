-- =====================================================
-- HABILITAR REAL-TIME PARA dados_empresa
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Habilitar replicação para a tabela dados_empresa
ALTER PUBLICATION supabase_realtime ADD TABLE dados_empresa;

-- Verificar se foi habilitado
SELECT
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'dados_empresa';
