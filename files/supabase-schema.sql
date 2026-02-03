-- =====================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - CRM NNOS
-- Supabase PostgreSQL
-- =====================================================

-- =====================================================
-- 1. TABELA: users_profile
-- Complementa auth.users com informações do perfil
-- =====================================================
CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    telefone TEXT,
    cargo TEXT,
    avatar_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_users_profile_ativo ON users_profile(ativo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABELA: leads
-- Armazena empresas e negócios em potencial
-- =====================================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa TEXT NOT NULL,
    contato_nome TEXT NOT NULL,
    contato_telefone TEXT NOT NULL,
    contato_email TEXT,
    contato_cargo TEXT,
    
    -- Informações comerciais
    valor_estimado DECIMAL(12, 2) DEFAULT 0,
    etapa TEXT NOT NULL DEFAULT 'novo',
    origem TEXT, -- ex: indicação, site, telefone, evento
    probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100),
    
    -- Classificação
    segmento TEXT, -- ex: construção, indústria, comércio
    prioridade TEXT DEFAULT 'media', -- baixa, media, alta
    tags TEXT[], -- array de tags customizáveis
    
    -- Gestão
    responsavel_id UUID REFERENCES users_profile(id),
    proxima_acao_data DATE,
    proxima_acao_descricao TEXT,
    
    -- Datas importantes
    data_primeiro_contato TIMESTAMPTZ,
    data_entrada_etapa TIMESTAMPTZ DEFAULT NOW(),
    data_fechamento TIMESTAMPTZ,
    
    -- Observações
    observacoes TEXT,
    motivo_perda TEXT, -- se perdido, por que?
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT etapa_valida CHECK (etapa IN ('novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido'))
);

-- Índices para performance
CREATE INDEX idx_leads_etapa ON leads(etapa) WHERE ativo = true;
CREATE INDEX idx_leads_responsavel ON leads(responsavel_id) WHERE ativo = true;
CREATE INDEX idx_leads_proxima_acao ON leads(proxima_acao_data) WHERE ativo = true;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. TABELA: interacoes
-- Histórico de todas as interações com o lead
-- =====================================================
CREATE TABLE interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users_profile(id),
    
    -- Tipo e conteúdo
    tipo TEXT NOT NULL, -- nota, ligacao, email, reuniao, whatsapp, proposta
    titulo TEXT,
    descricao TEXT NOT NULL,
    
    -- Metadados
    duracao_minutos INTEGER, -- para ligações/reuniões
    resultado TEXT, -- positivo, negativo, neutro
    
    -- Controle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tipo_valido CHECK (tipo IN ('nota', 'ligacao', 'email', 'reuniao', 'whatsapp', 'proposta', 'outro'))
);

-- Índices para performance
CREATE INDEX idx_interacoes_lead ON interacoes(lead_id);
CREATE INDEX idx_interacoes_created_at ON interacoes(created_at DESC);
CREATE INDEX idx_interacoes_tipo ON interacoes(tipo);

-- =====================================================
-- 4. TABELA: anexos
-- Armazenamento de arquivos relacionados aos leads
-- =====================================================
CREATE TABLE anexos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users_profile(id),
    
    -- Informações do arquivo
    nome_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT, -- pdf, docx, xlsx, jpg, etc
    tamanho_bytes BIGINT,
    url_storage TEXT NOT NULL, -- caminho no Supabase Storage
    
    -- Classificação
    tipo_documento TEXT, -- proposta, contrato, apresentacao, outro
    descricao TEXT,
    
    -- Controle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tipo_documento_valido CHECK (tipo_documento IN ('proposta', 'contrato', 'apresentacao', 'documento', 'imagem', 'outro'))
);

-- Índices para performance
CREATE INDEX idx_anexos_lead ON anexos(lead_id);
CREATE INDEX idx_anexos_created_at ON anexos(created_at DESC);

-- =====================================================
-- 5. TABELA: mudancas_etapa
-- Log de mudanças de etapa para análise
-- =====================================================
CREATE TABLE mudancas_etapa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES users_profile(id),
    
    etapa_anterior TEXT NOT NULL,
    etapa_nova TEXT NOT NULL,
    
    tempo_na_etapa_anterior INTERVAL, -- calculado automaticamente
    observacao TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_mudancas_lead ON mudancas_etapa(lead_id);
CREATE INDEX idx_mudancas_created_at ON mudancas_etapa(created_at DESC);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Segurança a nível de linha
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudancas_etapa ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: users_profile
-- =====================================================

-- Usuário pode ver seu próprio perfil
CREATE POLICY "Usuários podem ver próprio perfil"
    ON users_profile FOR SELECT
    USING (auth.uid() = id);

-- Usuário pode atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil"
    ON users_profile FOR UPDATE
    USING (auth.uid() = id);

-- Usuário pode ver perfis de outros usuários ativos (para atribuir leads)
CREATE POLICY "Usuários podem ver outros perfis ativos"
    ON users_profile FOR SELECT
    USING (ativo = true);

-- =====================================================
-- POLICIES: leads
-- =====================================================

-- Usuários autenticados podem ver todos os leads ativos
CREATE POLICY "Usuários podem ver leads ativos"
    ON leads FOR SELECT
    USING (auth.uid() IS NOT NULL AND ativo = true);

-- Usuários autenticados podem criar leads
CREATE POLICY "Usuários podem criar leads"
    ON leads FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários autenticados podem atualizar leads
CREATE POLICY "Usuários podem atualizar leads"
    ON leads FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Apenas quem criou pode deletar (soft delete na verdade)
CREATE POLICY "Usuários podem deletar próprios leads"
    ON leads FOR DELETE
    USING (auth.uid() = created_by);

-- =====================================================
-- POLICIES: interacoes
-- =====================================================

-- Usuários podem ver interações dos leads que eles têm acesso
CREATE POLICY "Usuários podem ver interações"
    ON interacoes FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM leads WHERE leads.id = interacoes.lead_id AND leads.ativo = true)
    );

-- Usuários podem criar interações
CREATE POLICY "Usuários podem criar interações"
    ON interacoes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem atualizar suas próprias interações
CREATE POLICY "Usuários podem atualizar próprias interações"
    ON interacoes FOR UPDATE
    USING (auth.uid() = usuario_id);

-- =====================================================
-- POLICIES: anexos
-- =====================================================

-- Usuários podem ver anexos dos leads que eles têm acesso
CREATE POLICY "Usuários podem ver anexos"
    ON anexos FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM leads WHERE leads.id = anexos.lead_id AND leads.ativo = true)
    );

-- Usuários podem criar anexos
CREATE POLICY "Usuários podem criar anexos"
    ON anexos FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem deletar seus próprios anexos
CREATE POLICY "Usuários podem deletar próprios anexos"
    ON anexos FOR DELETE
    USING (auth.uid() = usuario_id);

-- =====================================================
-- POLICIES: mudancas_etapa
-- =====================================================

-- Usuários podem ver mudanças de etapa
CREATE POLICY "Usuários podem ver mudanças"
    ON mudancas_etapa FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM leads WHERE leads.id = mudancas_etapa.lead_id AND leads.ativo = true)
    );

-- Sistema pode inserir mudanças (via trigger)
CREATE POLICY "Sistema pode inserir mudanças"
    ON mudancas_etapa FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 7. TRIGGER: Registrar mudanças de etapa automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION log_mudanca_etapa()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se a etapa mudou
    IF OLD.etapa IS DISTINCT FROM NEW.etapa THEN
        INSERT INTO mudancas_etapa (
            lead_id,
            usuario_id,
            etapa_anterior,
            etapa_nova,
            tempo_na_etapa_anterior,
            observacao
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.etapa,
            NEW.etapa,
            NOW() - OLD.data_entrada_etapa,
            'Mudança automática de etapa'
        );
        
        -- Atualiza data de entrada na nova etapa
        NEW.data_entrada_etapa = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_mudanca_etapa
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_mudanca_etapa();

-- =====================================================
-- 8. FUNÇÃO: Criar perfil automaticamente após signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, nome_completo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela auth.users (executado pelo Supabase)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. VIEWS ÚTEIS
-- =====================================================

-- View: Leads com informações agregadas
CREATE OR REPLACE VIEW v_leads_completo AS
SELECT 
    l.*,
    u.nome_completo as responsavel_nome,
    u.telefone as responsavel_telefone,
    (SELECT COUNT(*) FROM interacoes WHERE lead_id = l.id) as total_interacoes,
    (SELECT COUNT(*) FROM anexos WHERE lead_id = l.id) as total_anexos,
    (SELECT MAX(created_at) FROM interacoes WHERE lead_id = l.id) as ultima_interacao,
    EXTRACT(DAY FROM (NOW() - l.data_entrada_etapa)) as dias_na_etapa_atual
FROM leads l
LEFT JOIN users_profile u ON l.responsavel_id = u.id
WHERE l.ativo = true;

-- View: Funil de vendas (métricas)
CREATE OR REPLACE VIEW v_funil_vendas AS
SELECT 
    etapa,
    COUNT(*) as quantidade,
    SUM(valor_estimado) as valor_total,
    AVG(valor_estimado) as ticket_medio,
    AVG(EXTRACT(DAY FROM (NOW() - data_entrada_etapa))) as dias_medio_etapa
FROM leads
WHERE ativo = true
GROUP BY etapa
ORDER BY 
    CASE etapa
        WHEN 'novo' THEN 1
        WHEN 'contato' THEN 2
        WHEN 'proposta' THEN 3
        WHEN 'negociacao' THEN 4
        WHEN 'fechado' THEN 5
        WHEN 'perdido' THEN 6
    END;

-- =====================================================
-- 10. DADOS DE EXEMPLO (OPCIONAL - comentado)
-- =====================================================

-- Insira dados de exemplo após criar seu primeiro usuário:
-- 
-- INSERT INTO leads (empresa, contato_nome, contato_telefone, valor_estimado, etapa, responsavel_id, created_by)
-- VALUES 
--     ('Construtora Silva', 'João Silva', '(37) 99999-1111', 85000, 'novo', 'SEU_USER_ID', 'SEU_USER_ID'),
--     ('Auto Peças Brasil', 'Maria Santos', '(37) 99999-2222', 45000, 'novo', 'SEU_USER_ID', 'SEU_USER_ID'),
--     ('Logística Express', 'Carlos Oliveira', '(37) 99999-3333', 120000, 'contato', 'SEU_USER_ID', 'SEU_USER_ID');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para executar no Supabase:
-- 1. Acesse o SQL Editor no dashboard do Supabase
-- 2. Cole este script completo
-- 3. Execute (Run)
-- 4. Configure o Storage para anexos (se necessário)
-- 5. Configure autenticação de email/senha no Authentication