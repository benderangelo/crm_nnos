# 🔍 FASE 8: AUTOCOMPLETE CNPJ
**Duração estimada:** 1-2 dias  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 7 concluída

---

## 📋 OBJETIVO DA FASE
Implementar integração com **BrasilAPI** para buscar automaticamente dados da empresa através do CNPJ, preenchendo o formulário de dados da empresa de forma automática e salvando o JSON completo para referência futura.

**Entregáveis:**
- ✅ Integração com BrasilAPI
- ✅ Botão "Buscar CNPJ" no formulário
- ✅ Preenchimento automático dos campos
- ✅ Loading state durante busca
- ✅ Tratamento de erros
- ✅ Salvar JSON completo da API
- ✅ Indicador visual de origem (manual vs API)

---

## 🌐 API: BrasilAPI

### **Informações Gerais:**
- **URL:** https://brasilapi.com.br
- **Gratuita:** ✅ Sim, 100% free
- **Rate Limit:** Razoável (sem limite oficial)
- **Autenticação:** ❌ Não requer
- **Documentação:** https://brasilapi.com.br/docs

### **Endpoint CNPJ:**
```
GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}
```

### **Parâmetro {cnpj}:**
```regex
^[0-9]{14}$ | ^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$
```

**Aceita somente esse formato:**
- ✅ Sem formatação: `19131243000197` (14 dígitos)

---

## 📊 MAPEAMENTO DE CAMPOS

### **JSON → Tabela `dados_empresa`**

| Campo API (BrasilAPI) | Campo Tabela | Notas |
|----------------------|--------------|-------|
| `cnpj` | `cnpj` | Formatar antes de salvar |
| `razao_social` | `razao_social` | Direto |
| `nome_fantasia` | `nome_fantasia` | Pode vir vazio |
| `logradouro` | `logradouro` | Direto |
| `numero` | `numero` | Direto |
| `bairro` | `bairro` | Direto |
| `cep` | `cep` | Formatar: `XXXXX-XXX` |
| `municipio` | `municipio` | Direto |
| `uf` | `uf` | Direto |
| *(JSON completo)* | `dados_receita_completo` | Salvar tudo |
| *(hardcoded)* | `origem` | Setar como `'api'` |
| `NOW()` | `consultado_em` | Timestamp da consulta |

### **Formatações Necessárias:**

#### **CNPJ:**
```
Entrada API: "19131243000197"
Saída tabela: "19.131.243/0001-97"
```

#### **CEP:**
```
Entrada API: "01311902"
Saída tabela: "01311-902"
```

---

## 🔧 IMPLEMENTAÇÃO

### 1. Helper: formatCNPJ (src/lib/utils/formatters.ts)

```typescript
/**
 * Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/\D/g, '')
  
  if (numbers.length !== 14) {
    return cnpj // Retorna original se inválido
  }
  
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Remove formatação do CNPJ (para enviar à API)
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}
```

### 2. Helper: formatCEP (src/lib/utils/formatters.ts)

```typescript
/**
 * Formata CEP para o padrão XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  const numbers = cep.replace(/\D/g, '')
  
  if (numbers.length !== 8) {
    return cep // Retorna original se inválido
  }
  
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}
```

---

### 3. Tipos BrasilAPI (src/types/brasilapi.types.ts)

```typescript
// Tipos baseados na resposta real da BrasilAPI
export interface BrasilAPICNPJResponse {
  cnpj: string
  identificador_matriz_filial: number
  descricao_identificador_matriz_filial: string
  razao_social: string
  nome_fantasia: string
  situacao_cadastral: number
  descricao_situacao_cadastral: string
  data_situacao_cadastral: string
  motivo_situacao_cadastral: number
  descricao_motivo_situacao_cadastral: string
  nome_cidade_no_exterior: string
  codigo_natureza_juridica: number
  natureza_juridica: string
  data_inicio_atividade: string
  cnae_fiscal: number
  cnae_fiscal_descricao: string
  descricao_tipo_de_logradouro: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  uf: string
  codigo_municipio: number
  municipio: string
  ddd_telefone_1: string
  ddd_telefone_2: string
  ddd_fax: string
  qualificacao_do_responsavel: number
  capital_social: number
  porte: string
  opcao_pelo_simples: boolean | null
  data_opcao_pelo_simples: string | null
  data_exclusao_do_simples: string | null
  opcao_pelo_mei: boolean | null
  situacao_especial: string
  data_situacao_especial: string | null
  cnaes_secundarios: Array<{
    codigo: number
    descricao: string
  }>
  qsa: Array<{
    identificador_de_socio: number
    nome_socio: string
    cnpj_cpf_do_socio: string
    codigo_qualificacao_socio: number
    qualificacao_socio: string
    data_entrada_sociedade: string
    pais: string | null
    representante_legal: string
    nome_representante_legal: string
    codigo_qualificacao_representante_legal: number
    qualificacao_representante_legal: string
  }>
  regime_tributario?: Array<{
    ano: number
    cnpj_da_scp: string | null
    forma_de_tributacao: string
    quantidade_de_escrituracoes: number
  }>
}

export interface BrasilAPIError {
  message: string
  type: string
  name?: string
}
```

---

### 4. Service: BrasilAPI (src/lib/services/brasilapi.ts)

```typescript
import { BrasilAPICNPJResponse, BrasilAPIError } from '@/types/brasilapi.types'
import { cleanCNPJ } from '@/lib/utils/formatters'

const BRASILAPI_BASE_URL = 'https://brasilapi.com.br/api'

/**
 * Busca dados de CNPJ na BrasilAPI
 * @param cnpj - CNPJ com ou sem formatação
 * @returns Dados completos da empresa
 */
export async function consultarCNPJ(cnpj: string): Promise<BrasilAPICNPJResponse> {
  // Limpar CNPJ (remover pontos, barras e hífens)
  const cnpjLimpo = cleanCNPJ(cnpj)
  
  // Validar formato
  if (cnpjLimpo.length !== 14 || !/^\d{14}$/.test(cnpjLimpo)) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.')
  }
  
  try {
    const response = await fetch(`${BRASILAPI_BASE_URL}/cnpj/v1/${cnpjLimpo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado na base de dados da Receita Federal.')
      }
      
      if (response.status === 429) {
        throw new Error('Muitas requisições. Aguarde alguns segundos e tente novamente.')
      }
      
      // Tentar parsear erro da API
      try {
        const error: BrasilAPIError = await response.json()
        throw new Error(error.message || 'Erro ao consultar CNPJ.')
      } catch {
        throw new Error(`Erro ao consultar CNPJ. Status: ${response.status}`)
      }
    }
    
    const data: BrasilAPICNPJResponse = await response.json()
    return data
    
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erro desconhecido ao consultar CNPJ.')
  }
}

/**
 * Mapeia resposta da BrasilAPI para formulário
 */
export function mapBrasilAPIToForm(data: BrasilAPICNPJResponse) {
  const logradouroCompleto = data.descricao_tipo_de_logradouro 
    ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`.trim()
    : data.logradouro
  
  return {
    cnpj: formatCNPJ(data.cnpj),
    razao_social: data.razao_social || '',
    nome_fantasia: data.nome_fantasia || '',
    logradouro: logradouroCompleto,
    numero: data.numero || '',
    bairro: data.bairro || '',
    cep: formatCEP(data.cep),
    municipio: data.municipio || '',
    uf: data.uf || '',
  }
}
```

---

### 5. Atualizar useDadosEmpresa Hook

Adicionar ao hook `src/lib/hooks/useDadosEmpresa.ts`:

```typescript
import { consultarCNPJ, mapBrasilAPIToForm } from '@/lib/services/brasilapi'
import { BrasilAPICNPJResponse } from '@/types/brasilapi.types'

export function useDadosEmpresa(leadId: string) {
  // ... código existente ...
  
  const [isConsultingAPI, setIsConsultingAPI] = useState(false)

  /**
   * Busca dados do CNPJ na BrasilAPI e retorna para preencher formulário
   */
  const buscarCNPJ = async (cnpj: string) => {
    try {
      setIsConsultingAPI(true)

      const data = await consultarCNPJ(cnpj)
      
      toast({
        title: 'CNPJ encontrado!',
        description: `Dados de ${data.razao_social} carregados com sucesso.`,
      })

      return {
        formData: mapBrasilAPIToForm(data),
        jsonCompleto: data,
      }
      
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Erro ao buscar CNPJ'
      
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar CNPJ',
        description: message,
      })
      
      throw error
      
    } finally {
      setIsConsultingAPI(false)
    }
  }

  // Modificar saveDadosEmpresa para aceitar JSON completo
  const saveDadosEmpresa = async (
    data: DadosEmpresaFormData,
    dadosAPICompleto?: BrasilAPICNPJResponse
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Usuário não autenticado')

      const payload = {
        ...data,
        origem: dadosAPICompleto ? 'api' : 'manual',
        dados_receita_completo: dadosAPICompleto || null,
        consultado_em: dadosAPICompleto ? new Date().toISOString() : null,
      }

      if (exists && dadosEmpresa) {
        // Atualizar
        const { error } = await supabase
          .from('dados_empresa')
          .update(payload)
          .eq('id', dadosEmpresa.id)

        if (error) throw error
      } else {
        // Criar
        const { data: newDados, error } = await supabase
          .from('dados_empresa')
          .insert({
            ...payload,
            lead_id: leadId,
            preenchido_por: user.id,
          })
          .select()
          .single()

        if (error) throw error
        setDadosEmpresa(newDados)
        setExists(true)
      }

      toast({
        title: exists ? 'Dados atualizados' : 'Dados salvos',
        description: 'Os dados da empresa foram salvos com sucesso.',
      })

      await fetchDadosEmpresa()
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados.',
      })
      throw error
    }
  }

  return {
    dadosEmpresa,
    loading,
    exists,
    isConsultingAPI,
    buscarCNPJ,
    saveDadosEmpresa,
    deleteDadosEmpresa,
    refetch: fetchDadosEmpresa,
  }
}
```

---

### 6. Atualizar DadosEmpresaDialog

Modificar `src/components/dados-empresa/DadosEmpresaDialog.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { Search, Loader2, Sparkles } from 'lucide-react'
import { BrasilAPICNPJResponse } from '@/types/brasilapi.types'

export function DadosEmpresaDialog({ leadId, open, onOpenChange }: DadosEmpresaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { 
    dadosEmpresa, 
    exists, 
    isConsultingAPI,
    buscarCNPJ,
    saveDadosEmpresa 
  } = useDadosEmpresa(leadId)
  
  // Guardar JSON completo da API para salvar junto
  const dadosAPIRef = useRef<BrasilAPICNPJResponse | null>(null)

  const form = useForm<DadosEmpresaFormData>({
    // ... configuração existente ...
  })

  // Handler para buscar CNPJ
  const handleBuscarCNPJ = async () => {
    const cnpj = form.getValues('cnpj')
    
    if (!cnpj) {
      toast({
        variant: 'destructive',
        title: 'CNPJ não informado',
        description: 'Digite um CNPJ para buscar.',
      })
      return
    }

    try {
      const { formData, jsonCompleto } = await buscarCNPJ(cnpj)
      
      // Preencher formulário com dados da API
      form.setValue('cnpj', formData.cnpj)
      form.setValue('razao_social', formData.razao_social)
      form.setValue('nome_fantasia', formData.nome_fantasia)
      form.setValue('logradouro', formData.logradouro)
      form.setValue('numero', formData.numero)
      form.setValue('bairro', formData.bairro)
      form.setValue('cep', formData.cep)
      form.setValue('municipio', formData.municipio)
      form.setValue('uf', formData.uf)
      
      // Guardar JSON completo para salvar depois
      dadosAPIRef.current = jsonCompleto
      
    } catch (error) {
      // Erro já tratado no hook
      dadosAPIRef.current = null
    }
  }

  const onSubmit = async (data: DadosEmpresaFormData) => {
    try {
      setIsSubmitting(true)
      
      // Passar JSON da API se existir
      await saveDadosEmpresa(data, dadosAPIRef.current || undefined)
      
      // Limpar ref
      dadosAPIRef.current = null
      
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {exists ? 'Editar Dados da Empresa' : 'Dados da Empresa'}
          </DialogTitle>
          <DialogDescription>
            Preencha manualmente ou busque automaticamente por CNPJ
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Campo CNPJ com botão de busca */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dados Cadastrais</h3>
                  
                  {/* CNPJ com botão */}
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <InputMask
                              mask="99.999.999/9999-99"
                              value={field.value}
                              onChange={field.onChange}
                            >
                              {(inputProps: any) => (
                                <Input 
                                  placeholder="00.000.000/0000-00" 
                                  {...inputProps}
                                  disabled={isConsultingAPI}
                                />
                              )}
                            </InputMask>
                          </FormControl>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBuscarCNPJ}
                            disabled={isConsultingAPI || !field.value}
                            className="shrink-0"
                          >
                            {isConsultingAPI ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Buscando...
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4 mr-2" />
                                Buscar
                              </>
                            )}
                          </Button>
                        </div>
                        <FormDescription className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Clique em "Buscar" para preencher automaticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Indicador se veio da API */}
                  {dadosAPIRef.current && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Dados preenchidos automaticamente pela BrasilAPI
                      </p>
                    </div>
                  )}

                  {/* Resto do formulário (campos existentes) */}
                  <div className="mt-4 space-y-4">
                    {/* ... campos restantes ... */}
                  </div>
                </div>
                
                {/* ... resto das seções ... */}
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isConsultingAPI}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || isConsultingAPI}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {exists ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 7. Indicador de Origem

Adicionar badge na aba "Dados da Empresa" do `LeadDetailsDialog`:

```typescript
<TabsContent value="empresa">
  <div className="text-center py-8">
    {temDadosEmpresa ? (
      <>
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">Dados preenchidos</p>
        
        {/* Badge de origem */}
        {dadosEmpresa?.origem === 'api' ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Preenchido via API
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mb-4">
            <Edit className="w-4 h-4" />
            Preenchido manualmente
          </div>
        )}
        
        <p className="text-gray-500 mb-4">
          Os dados da empresa já foram cadastrados
        </p>
        <Button onClick={() => setShowDadosEmpresaDialog(true)}>
          Editar Dados
        </Button>
      </>
    ) : (
      // ... conteúdo quando não tem dados ...
    )}
  </div>
</TabsContent>
```

---

## 🎨 UX/UI

### **Fluxo do Usuário:**

```
1. Usuário abre modal "Dados da Empresa"
   ↓
2. Digite CNPJ no campo (com máscara)
   ↓
3. Clica botão "🔍 Buscar"
   ↓
4. Loading state: "Buscando..."
   ↓
5a. Sucesso:
    - Todos os campos preenchidos automaticamente
    - Banner verde: "Dados preenchidos pela BrasilAPI"
    - Usuário pode editar qualquer campo
    - Clica "Salvar"
    
5b. Erro:
    - Toast vermelho com mensagem de erro
    - Campos permanecem vazios
    - Usuário pode preencher manualmente
```

### **Estados Visuais:**

**Loading:**
```
[CNPJ Input] [🔄 Buscando...] ← botão disabled
```

**Sucesso:**
```
✨ Dados preenchidos automaticamente pela BrasilAPI
[Campos todos preenchidos e editáveis]
```

**Erro:**
```
Toast: "❌ CNPJ não encontrado na base de dados"
[Campos vazios, disponíveis para preenchimento manual]
```

---

## ⚠️ TRATAMENTO DE ERROS

### **Erros Possíveis:**

| Erro | Mensagem ao Usuário | Ação |
|------|---------------------|-------|
| CNPJ inválido | "CNPJ inválido. Deve conter 14 dígitos." | Validar antes de buscar |
| CNPJ não encontrado (404) | "CNPJ não encontrado na base da Receita Federal." | Permitir preenchimento manual |
| Rate limit (429) | "Muitas requisições. Aguarde e tente novamente." | Retry após 3 segundos |
| Timeout | "Tempo esgotado. Verifique sua conexão." | Permitir retry |
| Erro de rede | "Erro de conexão. Verifique sua internet." | Permitir retry |
| Erro desconhecido | "Erro ao buscar CNPJ. Tente novamente." | Log no console |

---

## 📝 CAMPOS SALVOS

### **Quando busca via API:**

```sql
INSERT INTO dados_empresa (
  -- Campos preenchidos automaticamente
  cnpj,                      -- Formatado
  razao_social,
  nome_fantasia,
  logradouro,                
  numero,
  bairro,
  cep,                       -- Formatado
  municipio,
  uf,
  
  -- Campos da API
  dados_receita_completo,    -- JSON completo
  origem,                    -- 'api'
  consultado_em,             -- NOW()
  
  -- Campos do projeto (usuário preenche depois)
  objetivo_projeto,          -- NULL
  periodo,                   -- NULL
  modalidade,                -- NULL
  parcelamento,              -- NULL
  
  -- Metadata
  lead_id,
  preenchido_por,
  created_at
)
```

---

## 🧪 TESTES MANUAIS

### Teste 1: Busca com Sucesso
1. Abrir modal "Dados da Empresa"
2. Digitar CNPJ: `19.131.243/0001-97`
3. Clicar "Buscar"
4. Verificar loading state
5. Verificar campos preenchidos automaticamente
6. Verificar banner verde de sucesso
7. Editar "Objetivo do projeto"
8. Salvar
9. Verificar no Supabase:
   - Campos preenchidos
   - `origem = 'api'`
   - `dados_receita_completo` tem JSON
   - `consultado_em` tem timestamp

### Teste 2: CNPJ Não Encontrado
1. Digitar CNPJ inválido: `00.000.000/0000-00`
2. Clicar "Buscar"
3. Verificar toast de erro
4. Verificar campos permanecem vazios
5. Preencher manualmente
6. Salvar
7. Verificar no Supabase: `origem = 'manual'`

### Teste 3: Edição Pós-API
1. Lead com dados preenchidos via API
2. Abrir para editar
3. Modificar "Razão Social"
4. Salvar
5. Verificar que `origem` continua `'api'`
6. Verificar que `dados_receita_completo` mantém original

### Teste 4: Validação CNPJ
1. Tentar buscar com campo vazio
2. Verificar toast de erro
3. Digitar CNPJ com menos de 14 dígitos
4. Verificar validação

### Teste 5: Loading State
1. Digitar CNPJ válido
2. Clicar "Buscar"
3. Durante busca:
   - Botão mostra "Buscando..."
   - Botão está disabled
   - Input CNPJ está disabled
4. Após resposta:
   - Botão volta ao normal
   - Inputs habilitados

---

## 📊 DADOS SALVOS NO JSON

### **Exemplo de `dados_receita_completo`:**

```json
{
  "cnpj": "19131243000197",
  "razao_social": "OPEN KNOWLEDGE BRASIL",
  "nome_fantasia": "REDE PELO CONHECIMENTO LIVRE",
  "situacao_cadastral": 2,
  "descricao_situacao_cadastral": "ATIVA",
  "natureza_juridica": "Associação Privada",
  "data_inicio_atividade": "2013-10-03",
  "logradouro": "PAULISTA 37",
  "numero": "37",
  "complemento": "ANDAR 4",
  "bairro": "BELA VISTA",
  "cep": "01311902",
  "municipio": "SAO PAULO",
  "uf": "SP",
  "capital_social": 0,
  "porte": "DEMAIS",
  "cnaes_secundarios": [...],
  "qsa": [...],
  "regime_tributario": [...]
}
```

**Utilidade futura:**
- Gerar relatórios detalhados
- Verificar quadro societário
- Consultar CNAEs
- Análise de regime tributário

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Funções `formatCNPJ` e `cleanCNPJ` criadas
- [ ] Função `formatCEP` criada
- [ ] Tipos `BrasilAPICNPJResponse` definidos
- [ ] Service `consultarCNPJ` implementado
- [ ] Function `mapBrasilAPIToForm` criada
- [ ] Hook `useDadosEmpresa` atualizado com `buscarCNPJ`
- [ ] Campo `saveDadosEmpresa` aceita JSON completo
- [ ] Botão "Buscar" adicionado ao formulário
- [ ] Loading state implementado
- [ ] Tratamento de erros funcionando
- [ ] Banner de sucesso aparece
- [ ] Campos são preenchidos automaticamente
- [ ] JSON completo é salvo em `dados_receita_completo`
- [ ] Campo `origem` setado corretamente
- [ ] Badge de origem exibido no LeadDetailsDialog
- [ ] Todos os testes passando

---

## 🔒 SEGURANÇA E PRIVACIDADE

### **LGPD:**
✅ **Dados públicos** - BrasilAPI retorna apenas dados públicos da Receita Federal  
✅ **Consentimento** - Usuário inicia busca manualmente  
✅ **Finalidade** - Dados usados apenas para cadastro comercial  
✅ **Transparência** - Indicamos origem (manual vs API)  

### **Rate Limiting:**
⚠️ BrasilAPI não tem limite oficial, mas:
- Implementar debounce (300ms)
- Evitar múltiplas buscas simultâneas
- Cache de resultados (opcional Fase 9)

---

## 💡 MELHORIAS FUTURAS (Opcionais)

### **Fase 9.1: Cache Local**
```typescript
// Guardar último resultado por 5 minutos
localStorage.setItem(`cnpj_${cnpj}`, JSON.stringify({
  data: result,
  timestamp: Date.now()
}))
```

### **Fase 9.2: Histórico de Consultas**
```sql
CREATE TABLE consultas_cnpj (
  id UUID PRIMARY KEY,
  cnpj TEXT,
  usuario_id UUID,
  sucesso BOOLEAN,
  consultado_em TIMESTAMPTZ
)
```

### **Fase 9.3: Validação Situação Cadastral**
```typescript
// Avisar se empresa está INATIVA
if (data.situacao_cadastral !== 2) {
  toast({
    variant: 'warning',
    title: 'Atenção',
    description: 'Esta empresa está com situação cadastral INATIVA'
  })
}
```

---

## 📚 REFERÊNCIAS

- **BrasilAPI:** https://brasilapi.com.br
- **Documentação CNPJ:** https://brasilapi.com.br/docs#tag/CNPJ
- **Receita Federal:** https://www.gov.br/receitafederal/pt-br

---

## 🎯 RESULTADO ESPERADO

Após esta fase:
- ✅ Usuário digita CNPJ
- ✅ Clica "Buscar"  
- ✅ Campos preenchem automaticamente
- ✅ JSON completo salvo
- ✅ Badge indica origem
- ✅ Usuário pode editar tudo
- ✅ Sistema funciona offline (preenchimento manual)

**Experiência muito mais rápida e profissional!** ⚡

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS  
**API:** BrasilAPI (Gratuita)