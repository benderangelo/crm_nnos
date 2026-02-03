-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA PERMITIR SOFT DELETE
-- =====================================================

-- 1. Primeiro, remover a política antiga de UPDATE
DROP POLICY IF EXISTS "Usuários podem atualizar leads" ON leads;

-- 2. Criar nova política de UPDATE com WITH CHECK correto
-- Permite que usuários autenticados atualizem leads (incluindo mudar ativo para false)
CREATE POLICY "Usuários podem atualizar leads"
    ON leads FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- EXPLICAÇÃO:
-- =====================================================
-- USING: Verifica se o usuário pode VER/ACESSAR a linha existente
-- WITH CHECK: Verifica se a nova linha (após update) é válida
--
-- Problema anterior: sem WITH CHECK, o RLS usava a política SELECT
-- como validação implícita, que requer ativo = true
--
-- Quando fazíamos UPDATE ativo = false, a política SELECT bloqueava
-- porque a nova linha teria ativo = false
--
-- Solução: WITH CHECK (auth.uid() IS NOT NULL) permite que qualquer
-- usuário autenticado faça UPDATE, independente do valor de ativo
-- =====================================================

-- 3. OPCIONAL: Se quiser restringir ainda mais, pode usar:
-- CREATE POLICY "Usuários podem atualizar leads"
--     ON leads FOR UPDATE
--     USING (auth.uid() IS NOT NULL AND (ativo = true OR created_by = auth.uid()))
--     WITH CHECK (auth.uid() IS NOT NULL);
--
-- Isso permitiria que:
-- - Qualquer usuário autenticado atualize leads ativos
-- - Apenas o criador possa atualizar leads inativos (incluindo reativar)
