-- Script de debug para verificar políticas RLS e permissões

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'leads';

-- 2. Listar todas as políticas da tabela leads
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'leads';

-- 3. Testar se o usuário autenticado pode atualizar
-- Execute isso enquanto estiver logado no app:
-- SELECT auth.uid(); -- Ver seu user ID
-- SELECT * FROM users_profile WHERE id = auth.uid(); -- Ver se o perfil existe

-- 4. Testar update manual (execute enquanto logado)
-- UPDATE leads SET ativo = false WHERE id = 'SEU_LEAD_ID_AQUI';

-- 5. Verificar se há triggers que podem estar impedindo o update
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'leads';
