-- =====================================================
-- FIX RLS: dados_empresa
-- Execute este SQL no Supabase para corrigir as policies
-- =====================================================

-- Primeiro, remover todas as policies existentes
DROP POLICY IF EXISTS "Usuários podem ver dados da empresa" ON dados_empresa;
DROP POLICY IF EXISTS "Usuários podem criar dados da empresa" ON dados_empresa;
DROP POLICY IF EXISTS "Usuários podem atualizar dados da empresa" ON dados_empresa;
DROP POLICY IF EXISTS "Usuários podem deletar próprios dados" ON dados_empresa;

-- Recriar policies mais permissivas
CREATE POLICY "Enable read for authenticated users"
    ON dados_empresa FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON dados_empresa FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON dados_empresa FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON dados_empresa FOR DELETE
    TO authenticated
    USING (true);
