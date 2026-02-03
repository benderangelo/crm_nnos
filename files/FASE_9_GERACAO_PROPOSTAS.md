# 📄 FASE 9: GERAÇÃO AUTOMÁTICA DE PROPOSTAS
**Duração estimada:** 2-3 dias  
**Status:** 📋 Planejamento  
**Pré-requisitos:** Fase 7 (Dados Empresa) concluída

---

## 📋 OBJETIVO DA FASE
Implementar sistema de geração automática de propostas comerciais em PDF usando o template existente com campos de formulário, incluindo:
- ✅ Preenchimento automático de todos os campos
- ✅ Contador incremental de número APS
- ✅ Salvamento automático como anexo do lead
- ✅ Histórico de propostas geradas
- ✅ Download e visualização

**Entregáveis:**
- ✅ Botão "Gerar Proposta" no lead
- ✅ PDF gerado com todos os dados
- ✅ Anexo salvo automaticamente
- ✅ Contador APS funcional
- ✅ Lista de propostas no lead

---

## 🗄️ ARQUITETURA DE DADOS

**⚡ OTIMIZAÇÃO:** Vamos reutilizar a tabela `anexos` existente ao invés de criar uma nova tabela! Isso simplifica a arquitetura e mantém tudo centralizado.

---

### 1. Atualizar Tabela Existente: `anexos`

**Você já tem a tabela `anexos` com a coluna `tipo_documento` e `numero_aps`!**  

**Coluna `tipo_documento` existente será usada para identificar propostas!**

---

### 2. View: Propostas do Lead

```sql
-- View para facilitar consulta de propostas
CREATE VIEW v_propostas_lead AS
SELECT 
  a.*,
  l.empresa as lead_empresa,
  u.email as criado_por_email
FROM anexos a
LEFT JOIN leads l ON a.lead_id = l.id
LEFT JOIN users_profile u ON a.criado_por = u.user_id
WHERE a.tipo_documento = 'proposta'  -- Usa coluna existente
ORDER BY a.numero_aps DESC NULLS LAST, a.created_at DESC;
```

---

### 3. Nova Tabela: `contador_aps`

```sql
-- Tabela para controlar o contador incremental de APS
CREATE TABLE contador_aps (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Apenas 1 registro
  proximo_numero INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro inicial
INSERT INTO contador_aps (id, proximo_numero) VALUES (1, 1);

-- RLS
ALTER TABLE contador_aps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver contador"
  ON contador_aps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas sistema pode atualizar contador"
  ON contador_aps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para obter próximo número APS (thread-safe)
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
```

### 4. Supabase Storage Bucket

**Já existe um bucket de anexos chamado crm-anexos**

---

## 🔧 IMPLEMENTAÇÃO

### 1. Types (src/types/proposta.types.ts)

```typescript
export interface DadosProposta {
  // Dados do lead
  lead: {
    empresa: string
    contato_nome: string
    contato_telefone: string
    valor_estimado: number
    observacoes: string | null
  }
  
  // Dados da empresa
  empresa: {
    razao_social: string
    nome_fantasia: string
    cnpj: string
    logradouro: string
    numero: string
    bairro: string
    cep: string
    municipio: string
    uf: string
    objetivo_projeto: string
    periodo: string
    modalidade: string
    parcelamento: string
  }
  
  // Metadata
  numero_aps: number
  data_geracao: string
}

// Estender a interface Anexo existente para propostas
export interface PropostaAnexo extends Anexo {
  numero_aps: number
  lead_empresa: string
  criado_por_email: string
}
```

**Nota:** Assumindo que você já tem uma interface `Anexo` com os campos básicos (id, lead_id, tipo_documento, nome_arquivo, storage_path, etc). Se não tiver, adicionar:

```typescript
export interface Anexo {
  id: string
  lead_id: string
  tipo_documento: string
  nome_arquivo: string
  tamanho_bytes: number
  mime_type: string
  storage_path: string
  numero_aps: number | null  // Nova coluna
  criado_por: string
  created_at: string
  updated_at: string
}
```

---

### 2. Service: Gerador de Propostas (src/lib/services/gerarProposta.ts)

```typescript
import { PDFDocument } from 'pdf-lib'
import { DadosProposta } from '@/types/proposta.types'

const TEMPLATE_PATH = '/templates/APS_TESTE_-_form.pdf'

/**
 * Formata valor monetário para o padrão brasileiro
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data para DD/MM/YYYY
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

/**
 * Converte número de parcelas para formato "NX"
 */
function formatParcela(parcelamento: string): string {
  // Se já está no formato "NX", retorna direto
  if (/^\d+X?$/i.test(parcelamento)) {
    return parcelamento.toUpperCase()
  }
  
  // Se é número puro, adiciona X
  if (/^\d+$/.test(parcelamento)) {
    return `${parcelamento}X`
  }
  
  return parcelamento
}

/**
 * Traduz período para formato completo
 */
function formatPeriodo(periodo: string): string {
  const periodos: Record<string, string> = {
    'manha': 'MANHÃ',
    'tarde': 'TARDE',
    'integral': 'INTEGRAL',
    'manha_tarde': 'MANHÃ E TARDE',
  }
  
  return periodos[periodo.toLowerCase()] || periodo.toUpperCase()
}

/**
 * Traduz modalidade para formato completo
 */
function formatModalidade(modalidade: string): string {
  const modalidades: Record<string, string> = {
    'presencial': 'PRESENCIAL',
    'virtual': 'VIRTUAL',
    'hibrido': 'HÍBRIDO',
  }
  
  return modalidades[modalidade.toLowerCase()] || modalidade.toUpperCase()
}

/**
 * Gera PDF da proposta usando template com formulário
 */
export async function gerarPropostaPDF(dados: DadosProposta): Promise<Uint8Array> {
  try {
    // Carregar template
    const templateBytes = await fetch(TEMPLATE_PATH).then(res => {
      if (!res.ok) throw new Error('Template não encontrado')
      return res.arrayBuffer()
    })
    
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Obter data de geração
    const dataGeracao = new Date(dados.data_geracao)
    const dataFormatada = formatDate(dataGeracao)
    
    // Endereço completo
    const enderecoCompleto = `${dados.empresa.logradouro}, ${dados.empresa.numero}`
    
    // PREENCHER CAMPOS DO FORMULÁRIO
    // (ordem conforme aparece no PDF)
    
    // Cabeçalho
    form.getTextField('Número APS').setText(dados.numero_aps.toString().padStart(3, '0'))
    form.getTextField('Projeto').setText(dados.lead.empresa)
    
    // Dados do Cliente
    form.getTextField('Cliente#0').setText(dados.empresa.razao_social)
    form.getTextField('Nome Fantasia').setText(dados.empresa.nome_fantasia || '')
    form.getTextField('CNPJ').setText(dados.empresa.cnpj)
    form.getTextField('Endereço').setText(enderecoCompleto)
    form.getTextField('Bairro').setText(dados.empresa.bairro || '')
    form.getTextField('Cidade').setText(dados.empresa.municipio || '')
    form.getTextField('UF').setText(dados.empresa.uf || '')
    form.getTextField('CEP').setText(dados.empresa.cep || '')
    form.getTextField('Contato').setText(dados.lead.contato_nome)
    form.getTextField('Telefone').setText(dados.lead.contato_telefone)
    
    // Dados do Projeto
    form.getTextField('Objetivo do Projeto').setText(dados.empresa.objetivo_projeto || '')
    form.getTextField('Público Alvo').setText('') // Vazio por enquanto
    form.getTextField('Modalidade').setText(formatModalidade(dados.empresa.modalidade))
    form.getTextField('N Turmas').setText('') // Vazio por enquanto
    form.getTextField('Total Participantes').setText('') // Vazio por enquanto
    form.getTextField('Período').setText(formatPeriodo(dados.empresa.periodo))
    form.getTextField('Carga Horaria').setText('') // Vazio por enquanto
    
    // Forma de Pagamento
    const valorFormatado = formatCurrency(dados.lead.valor_estimado)
    form.getTextField('Investimento#0').setText(valorFormatado)
    form.getTextField('Investimento#1').setText(valorFormatado)
    form.getTextField('Parcela').setText(formatParcela(dados.empresa.parcelamento))
    form.getTextField('Data Hoje#0').setText(dataFormatada)
    
    // Observações
    if (dados.lead.observacoes) {
      form.getTextField('Observações').setText(dados.lead.observacoes)
    }
    
    // Dados Complementares / Rodapé
    form.getTextField('Data Hoje#1').setText(dataFormatada)
    form.getTextField('Cliente#1').setText(dados.empresa.razao_social)
    
    // Achatar formulário (tornar não editável)
    form.flatten()
    
    // Gerar PDF
    const pdfBytes = await pdfDoc.save()
    
    return pdfBytes
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw new Error('Falha ao gerar proposta em PDF')
  }
}

/**
 * Gera nome do arquivo da proposta
 */
export function gerarNomeArquivoProposta(
  numeroAPS: number,
  razaoSocial: string,
  versao: number = 1
): string {
  // Limpar razão social (remover caracteres especiais)
  const razaoLimpa = razaoSocial
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .substring(0, 50) // Limita tamanho
  
  const apsFormatado = numeroAPS.toString().padStart(3, '0')
  const versaoSuffix = versao > 1 ? `_v${versao}` : ''
  
  return `APS_${apsFormatado}_${razaoLimpa}${versaoSuffix}.pdf`
}
```

---

### 3. Hook: usePropostas (src/lib/hooks/usePropostas.ts)

```typescript
import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { PropostaAnexo, DadosProposta } from '@/types/proposta.types'
import { gerarPropostaPDF, gerarNomeArquivoProposta } from '@/lib/services/gerarProposta'

export function usePropostas(leadId: string) {
  const supabase = useSupabase()
  const { toast } = useToast()
  
  const [propostas, setPropostas] = useState<PropostaAnexo[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * Buscar propostas do lead
   */
  const fetchPropostas = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('v_propostas_lead')
        .select('*')
        .eq('lead_id', leadId)
        .order('numero_aps', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setPropostas(data || [])
      
    } catch (error) {
      console.error('Erro ao buscar propostas:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar propostas',
        description: 'Não foi possível carregar as propostas.',
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Obter próximo número APS
   */
  const obterProximoAPS = async (): Promise<number> => {
    const { data, error } = await supabase
      .rpc('obter_proximo_aps')
    
    if (error) throw error
    
    return data as number
  }

  /**
   * Gerar nova proposta
   */
  const gerarProposta = async (dadosCompletos: DadosProposta): Promise<string> => {
    try {
      setIsGenerating(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')
      
      // Obter próximo número APS
      const numeroAPS = await obterProximoAPS()
      
      // Adicionar número APS e data aos dados
      const dadosComAPS: DadosProposta = {
        ...dadosCompletos,
        numero_aps: numeroAPS,
        data_geracao: new Date().toISOString(),
      }
      
      // Gerar PDF
      const pdfBytes = await gerarPropostaPDF(dadosComAPS)
      
      // Nome do arquivo
      const nomeArquivo = gerarNomeArquivoProposta(
        numeroAPS,
        dadosCompletos.empresa.razao_social,
        1
      )
      
      // Path no storage
      const storagePath = `${leadId}/${numeroAPS}/${nomeArquivo}`
      
      // Upload para Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('anexos-leads') // Ou o nome do seu bucket existente
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false,
        })
      
      if (uploadError) throw uploadError
      
      // Salvar registro na tabela anexos existente
      const { data: anexo, error: dbError } = await supabase
        .from('anexos')  // Usando tabela existente
        .insert({
          lead_id: leadId,
          tipo_documento: 'proposta',  // Usando coluna existente
          nome_arquivo: nomeArquivo,
          tamanho_bytes: pdfBytes.length,
          mime_type: 'application/pdf',
          storage_path: storagePath,
          numero_aps: numeroAPS,  // Nova coluna
          criado_por: user.id,
        })
        .select()
        .single()
      
      if (dbError) throw dbError
      
      toast({
        title: 'Proposta gerada!',
        description: `Proposta APS-${numeroAPS.toString().padStart(3, '0')} criada com sucesso.`,
      })
      
      // Recarregar lista
      await fetchPropostas()
      
      return anexo.id
      
    } catch (error) {
      console.error('Erro ao gerar proposta:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar proposta',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Fazer download de proposta
   */
  const downloadProposta = async (proposta: PropostaAnexo) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('anexos-leads') // Ou o nome do seu bucket existente
        .download(proposta.storage_path)
      
      if (error) throw error
      
      // Criar URL para download
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = proposta.nome_arquivo
      link.click()
      
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Download iniciado',
        description: proposta.nome_arquivo,
      })
      
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer download',
        description: 'Não foi possível baixar o arquivo.',
      })
    }
  }

  /**
   * Deletar proposta
   */
  const deletarProposta = async (proposta: PropostaAnexo) => {
    try {
      // Deletar do storage
      const { error: storageError } = await supabase
        .storage
        .from('anexos-leads') // Ou o nome do seu bucket existente
        .remove([proposta.storage_path])
      
      if (storageError) throw storageError
      
      // Deletar do banco
      const { error: dbError } = await supabase
        .from('anexos')  // Usando tabela existente
        .delete()
        .eq('id', proposta.id)
      
      if (dbError) throw dbError
      
      toast({
        title: 'Proposta deletada',
        description: proposta.nome_arquivo,
      })
      
      // Recarregar lista
      await fetchPropostas()
      
    } catch (error) {
      console.error('Erro ao deletar proposta:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar a proposta.',
      })
    }
  }

  // Carregar propostas ao montar
  useEffect(() => {
    fetchPropostas()
  }, [leadId])

  return {
    propostas,
    loading,
    isGenerating,
    gerarProposta,
    downloadProposta,
    deletarProposta,
    refetch: fetchPropostas,
  }
}
```

---

### 4. Componente: PropostasTab (src/components/propostas/PropostasTab.tsx)

```typescript
'use client'

import { useState } from 'react'
import { FileText, Download, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePropostas } from '@/lib/hooks/usePropostas'
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { PropostaAnexo } from '@/types/proposta.types'
import { formatBytes } from '@/lib/utils/formatters'

interface PropostasTabProps {
  leadId: string
  lead: {
    empresa: string
    contato_nome: string
    contato_telefone: string
    valor_estimado: number
    observacoes: string | null
  }
}

export function PropostasTab({ leadId, lead }: PropostasTabProps) {
  const { propostas, loading, isGenerating, gerarProposta, downloadProposta, deletarProposta } = usePropostas(leadId)
  const { dadosEmpresa, exists: temDadosEmpresa } = useDadosEmpresa(leadId)
  
  const [propostaToDelete, setPropostaToDelete] = useState<PropostaAnexo | null>(null)

  const handleGerarProposta = async () => {
    if (!temDadosEmpresa || !dadosEmpresa) {
      return
    }

    const dadosCompletos = {
      lead: {
        empresa: lead.empresa,
        contato_nome: lead.contato_nome,
        contato_telefone: lead.contato_telefone,
        valor_estimado: lead.valor_estimado,
        observacoes: lead.observacoes,
      },
      empresa: {
        razao_social: dadosEmpresa.razao_social,
        nome_fantasia: dadosEmpresa.nome_fantasia || '',
        cnpj: dadosEmpresa.cnpj,
        logradouro: dadosEmpresa.logradouro || '',
        numero: dadosEmpresa.numero || '',
        bairro: dadosEmpresa.bairro || '',
        cep: dadosEmpresa.cep || '',
        municipio: dadosEmpresa.municipio || '',
        uf: dadosEmpresa.uf || '',
        objetivo_projeto: dadosEmpresa.objetivo_projeto || '',
        periodo: dadosEmpresa.periodo || '',
        modalidade: dadosEmpresa.modalidade || '',
        parcelamento: dadosEmpresa.parcelamento || '',
      },
      numero_aps: 0, // Será preenchido pelo hook
      data_geracao: new Date().toISOString(),
    }

    await gerarProposta(dadosCompletos)
  }

  const handleDownload = (proposta: PropostaAnexo) => {
    downloadProposta(proposta)
  }

  const handleDeleteClick = (proposta: PropostaAnexo) => {
    setPropostaToDelete(proposta)
  }

  const handleDeleteConfirm = async () => {
    if (propostaToDelete) {
      await deletarProposta(propostaToDelete)
      setPropostaToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!temDadosEmpresa) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          É necessário preencher os <strong>Dados da Empresa</strong> antes de gerar propostas.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Propostas Comerciais</h3>
          <p className="text-sm text-muted-foreground">
            {propostas.length} proposta{propostas.length !== 1 ? 's' : ''} gerada{propostas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={handleGerarProposta}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Gerar Proposta
            </>
          )}
        </Button>
      </div>

      {/* Lista de propostas */}
      {propostas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhuma proposta gerada ainda
          </p>
          <Button onClick={handleGerarProposta} disabled={isGenerating}>
            <Plus className="w-4 h-4 mr-2" />
            Gerar Primeira Proposta
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {propostas.map((proposta) => (
            <div
              key={proposta.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
            >
              <div className="flex items-center gap-4 flex-1">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{proposta.nome_arquivo}</p>
                    <Badge variant="outline">
                      APS-{proposta.numero_aps?.toString().padStart(3, '0')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatBytes(proposta.tamanho_bytes)}</span>
                    <span>•</span>
                    <span>
                      {new Date(proposta.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span>por {proposta.criado_por_email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(proposta)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(proposta)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de delete */}
      <AlertDialog open={!!propostaToDelete} onOpenChange={(open) => !open && setPropostaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar <strong>{propostaToDelete?.nome_arquivo}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

---

### 5. Integração: LeadDetailsDialog

Adicionar nova aba "Propostas" no `LeadDetailsDialog.tsx`:

```typescript
import { PropostasTab } from '@/components/propostas/PropostasTab'

// Dentro do TabsList:
<TabsList>
  <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
  <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
  <TabsTrigger value="propostas">Propostas</TabsTrigger> {/* NOVO */}
  <TabsTrigger value="interacoes">Interações</TabsTrigger>
</TabsList>

// Dentro do TabsContent:
<TabsContent value="propostas">
  <PropostasTab 
    leadId={lead.id} 
    lead={{
      empresa: lead.empresa,
      contato_nome: lead.contato_nome,
      contato_telefone: lead.contato_telefone,
      valor_estimado: lead.valor_estimado,
      observacoes: lead.observacoes,
    }}
  />
</TabsContent>
```

---

### 6. Helper: formatBytes (src/lib/utils/formatters.ts)

```typescript
/**
 * Formata bytes para formato legível
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
```

---

## 📊 MAPEAMENTO COMPLETO DE CAMPOS

| Campo no PDF | Fonte de Dados | Transformação |
|--------------|----------------|---------------|
| **Número APS** | `contador_aps.proximo_numero` | Incremental, formatar com 3 dígitos: `001` |
| **Projeto** | `leads.empresa` | Direto |
| **Cliente#0** | `dados_empresa.razao_social` | Direto |
| **Nome Fantasia** | `dados_empresa.nome_fantasia` | Direto (pode ser vazio) |
| **CNPJ** | `dados_empresa.cnpj` | Direto (já formatado) |
| **Endereço** | `dados_empresa.logradouro + numero` | Concatenar: "Rua X, 123" |
| **Bairro** | `dados_empresa.bairro` | Direto |
| **Cidade** | `dados_empresa.municipio` | Direto |
| **UF** | `dados_empresa.uf` | Direto |
| **CEP** | `dados_empresa.cep` | Direto (já formatado) |
| **Contato** | `leads.contato_nome` | Direto |
| **Telefone** | `leads.contato_telefone` | Direto |
| **Objetivo do Projeto** | `dados_empresa.objetivo_projeto` | Direto |
| **Público Alvo** | - | Vazio (futuro) |
| **Modalidade** | `dados_empresa.modalidade` | Traduzir: `presencial` → `PRESENCIAL` |
| **N Turmas** | - | Vazio (futuro) |
| **Total Participantes** | - | Vazio (futuro) |
| **Período** | `dados_empresa.periodo` | Traduzir: `manha` → `MANHÃ` |
| **Carga Horaria** | - | Vazio (futuro) |
| **Investimento#0** | `leads.valor_estimado` | Formatar: `R$ 121.800,00` |
| **Investimento#1** | `leads.valor_estimado` | Formatar: `R$ 121.800,00` |
| **Parcela** | `dados_empresa.parcelamento` | Formatar: `12` → `12X` |
| **Observações** | `leads.observacoes` | Direto (pode ser vazio) |
| **Data Hoje#0** | `NOW()` | Formatar: `14/01/2026` |
| **Data Hoje#1** | `NOW()` | Formatar: `14/01/2026` |
| **Cliente#1** | `dados_empresa.razao_social` | Direto |

---

## 🎨 FLUXO DO USUÁRIO

```
1. Lead em "Negociação" ou "Fechado" (qualquer stage)
   ↓
2. Usuário abre detalhes do lead
   ↓
3. Clica na aba "Propostas"
   ↓
4. Clica botão "Gerar Proposta"
   ↓
5. Sistema:
   - Valida dados da empresa (obrigatório)
   - Obtém próximo número APS (001, 002, 003...)
   - Gera PDF com todos os campos preenchidos
   - Upload para Supabase Storage
   - Salva registro em anexos_lead
   ↓
6. Proposta aparece na lista
   ↓
7. Usuário pode:
   - Download PDF
   - Gerar nova versão
   - Deletar proposta
```

---

## 📦 ESTRUTURA DE ARQUIVOS NO STORAGE

```
anexos-leads/
├── {lead-id-1}/
│   ├── 001/
│   │   └── APS_001_Empresa_Exemplo.pdf
│   ├── 002/
│   │   └── APS_002_Empresa_Exemplo.pdf
│   └── 003/
│       ├── APS_003_Empresa_Exemplo.pdf
│       └── APS_003_Empresa_Exemplo_v2.pdf
├── {lead-id-2}/
│   └── 004/
│       └── APS_004_Outra_Empresa.pdf
```

**Organização:**
- Pasta por lead
- Subpasta por número APS
- Versionamento no nome do arquivo

---

## 🧪 TESTES MANUAIS

### Teste 1: Gerar Primeira Proposta
1. Lead com dados_empresa preenchidos
2. Abrir aba "Propostas"
3. Clicar "Gerar Proposta"
4. Verificar:
   - ✅ Loading aparece
   - ✅ Toast de sucesso
   - ✅ Proposta aparece na lista
   - ✅ Badge "APS-001"
   - ✅ Download funciona
5. Abrir PDF e verificar:
   - ✅ Todos os campos preenchidos
   - ✅ Formatações corretas
   - ✅ Número APS = 001

### Teste 2: Contador Incremental
1. Gerar proposta no Lead A → APS-001
2. Gerar proposta no Lead B → APS-002
3. Gerar proposta no Lead C → APS-003
4. Verificar que cada número é único e sequencial

### Teste 3: Múltiplas Propostas Mesmo Lead
1. Gerar primeira proposta
2. Modificar dados da empresa
3. Gerar segunda proposta
4. Verificar:
   - ✅ Novo número APS
   - ✅ Ambas aparecem na lista
   - ✅ Ordenadas por número APS desc

### Teste 4: Validação Dados Empresa
1. Lead sem dados_empresa
2. Abrir aba "Propostas"
3. Verificar:
   - ✅ Alerta aparece
   - ✅ Botão "Gerar" disabled ou ausente
   - ✅ Direciona para preencher dados

### Teste 5: Download e Delete
1. Proposta existente
2. Clicar "Download"
3. Verificar PDF baixa corretamente
4. Clicar "Deletar"
5. Confirmar exclusão
6. Verificar:
   - ✅ Proposta removida da lista
   - ✅ Arquivo deletado do storage
   - ✅ Registro removido do banco

### Teste 6: Campos Vazios
1. Lead com alguns campos NULL
2. Gerar proposta
3. Verificar que campos vazios não quebram PDF

### Teste 7: Formatações
1. CNPJ: 19.131.243/0001-97
2. CEP: 01311-902
3. Valor: R$ 121.800,00
4. Parcela: 12X
5. Data: 14/01/2026
6. Período: MANHÃ
7. Modalidade: HÍBRIDO

### Teste 8: Thread Safety (Contador)
1. Abrir 3 abas do navegador
2. 3 usuários gerando proposta simultaneamente
3. Verificar que cada um recebe número único
4. Sem duplicatas

---

## ✅ CHECKLIST DE CONCLUSÃO

**Banco de Dados:**
- [ ] Coluna `numero_aps` adicionada na tabela `anexos`
- [ ] Índice criado para `numero_aps`
- [ ] Tabela `contador_aps` criada
- [ ] Função `obter_proximo_aps()` criada
- [ ] View `v_propostas_lead` criada

**Storage:**
- [ ] Bucket de anexos já existente (ou criar se não tiver)
- [ ] Políticas de storage configuradas
- [ ] Upload funciona
- [ ] Download funciona
- [ ] Delete funciona

**Código:**
- [ ] Types definidos (PropostaAnexo, DadosProposta)
- [ ] Service `gerarPropostaPDF` implementado
- [ ] Helpers de formatação criados
- [ ] Hook `usePropostas` implementado
- [ ] Componente `PropostasTab` criado
- [ ] Integração com `LeadDetailsDialog`
- [ ] pdf-lib instalado

**Funcionalidades:**
- [ ] Gera PDF com template
- [ ] Todos os campos preenchidos
- [ ] Contador APS funcional e incremental
- [ ] Upload automático para storage
- [ ] Registro salvo na tabela `anexos`
- [ ] Lista de propostas carrega corretamente
- [ ] Download funciona
- [ ] Delete funciona
- [ ] Validação de dados da empresa
- [ ] Propostas aparecem com `tipo_documento = 'proposta'`

**UX/UI:**
- [ ] Botão "Gerar Proposta" aparece
- [ ] Loading states implementados
- [ ] Toasts informativos
- [ ] Badge com número APS
- [ ] Lista ordenada corretamente
- [ ] Alerta quando falta dados
- [ ] Dialog de confirmação delete
- [ ] Responsivo

**Testes:**
- [ ] Todos os 8 testes manuais passam
- [ ] Sem erros no console
- [ ] Sem warnings
- [ ] Performance OK (<2s para gerar)

---

## 📚 DEPENDENCIES

```bash
npm install pdf-lib
```

**Tamanho:** ~150kb (pequeno e rápido)

---

## ⚡ PERFORMANCE

**Métricas esperadas:**
- ⚡ Gerar PDF: ~300-800ms
- ⚡ Upload Storage: ~200-500ms
- ⚡ Insert banco: ~50-100ms
- ⚡ **Total: ~1-2 segundos**

**Otimizações:**
- Template em cache
- Operações em paralelo
- Compressão de PDF

---

## 🔒 SEGURANÇA

**RLS Policies:**
- ✅ Apenas autenticados veem anexos
- ✅ Apenas criador pode deletar
- ✅ Storage privado (não público)

**Validações:**
- ✅ Dados da empresa obrigatórios
- ✅ User autenticado obrigatório
- ✅ Contador thread-safe (sem race condition)

---

## 🚀 MELHORIAS FUTURAS

### **Fase 9.1: Edição de Propostas**
- Editar proposta existente
- Criar nova versão (v2, v3...)
- Comparar versões

### **Fase 9.2: Preview Antes de Gerar**
- Modal com preview do PDF
- Editar campos antes de salvar
- "Gerar e Baixar" ou "Gerar e Enviar"

### **Fase 9.3: Templates Múltiplos**
- Diferentes templates por tipo de projeto
- Seletor de template
- Templates customizáveis

### **Fase 9.4: Envio Automático**
- Botão "Gerar e Enviar por Email"
- Integração com Zoho Sign
- Tracking de visualização

---

## 📊 ESTIMATIVA

**Tempo total: 1-2 dias** (reduzido por usar tabela existente!)

- Banco (adicionar coluna, contador, view): 2h
- Storage (verificar/configurar): 30min
- Service (geração PDF): 4h
- Hook (usePropostas): 3h
- Componente (PropostasTab): 4h
- Integração (LeadDetailsDialog): 1h
- Testes: 3h
- Ajustes: 2h

**Complexidade: 5/10** (era 6/10, ficou mais simples!)

**Risco de quebrar código: 1/10** (apenas adiciona coluna e nova feature isolada)

---

## 🎉 RESULTADO FINAL

**Antes:**
- ⏱️ 20-30 minutos preenchendo Word manualmente
- 📄 Arquivos soltos no computador
- ❌ Risco de erros de digitação
- 😐 Numeração manual

**Depois:**
- ⚡ 2 segundos gerando automaticamente
- 📦 Tudo organizado na tabela `anexos` existente (reutilização!)
- ✅ Dados 100% corretos
- 🎯 Numeração sequencial automática
- 😍 Experiência profissional!

**Bônus da arquitetura simplificada:**
- ✅ Sem duplicação de tabelas
- ✅ Menos complexidade
- ✅ Todos anexos em um só lugar
- ✅ Implementação mais rápida (1-2 dias vs 2-3 dias)

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS  
**Biblioteca:** pdf-lib  
**Template:** APS_TESTE_-_form.pdf