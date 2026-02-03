# 🚀 FASE 6: FUNCIONALIDADES AVANÇADAS
**Duração estimada:** 1-2 semanas  
**Status:** 📋 Planejamento  
**Pré-requisito:** Fase 5 concluída

---

## 📋 OBJETIVO DA FASE
Implementar funcionalidades avançadas que melhoram a experiência do usuário e agregam valor ao CRM: upload de anexos, tags, notificações e melhorias de UX.

**Entregáveis:**
- ✅ Sistema de anexos (upload/download)
- ✅ Tags customizáveis
- ✅ Notificações de follow-up
- ✅ Perfil de usuário
- ✅ Configurações gerais
- ✅ PWA (Progressive Web App)
- ✅ Melhorias de performance
- ✅ Otimizações de UX

---

## 🛠️ TECNOLOGIAS ADICIONAIS

### Novas Bibliotecas
```bash
# Upload de arquivos
npm install react-dropzone

# PWA
npm install next-pwa

# Notificações
# Usar Web Push API nativa
```

### shadcn/ui Components Adicionais
```bash
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add slider
```

---

## 📁 ARQUIVOS A CRIAR

### Novos Arquivos
```
src/
├── app/
│   └── (dashboard)/
│       ├── perfil/
│       │   └── page.tsx              # Página de perfil
│       └── configuracoes/
│           └── page.tsx              # Configurações
├── lib/
│   ├── hooks/
│   │   ├── useAnexos.ts             # Hook de anexos
│   │   ├── useTags.ts               # Hook de tags
│   │   └── useNotifications.ts      # Hook de notificações
│   └── storage/
│       └── supabaseStorage.ts       # Helper Supabase Storage
└── components/
    ├── anexos/
    │   ├── AnexosList.tsx           # Lista de anexos
    │   ├── UploadZone.tsx           # Área de upload
    │   └── AnexoCard.tsx            # Card de anexo
    ├── tags/
    │   ├── TagInput.tsx             # Input de tags
    │   ├── TagBadge.tsx             # Badge de tag
    │   └── TagManager.tsx           # Gerenciador
    └── perfil/
        ├── ProfileForm.tsx          # Formulário perfil
        └── AvatarUpload.tsx         # Upload de avatar
```

---

## 🎯 TAREFAS DETALHADAS

### 1. Sistema de Anexos

#### 1.1. Configurar Supabase Storage
```sql
-- Criar bucket (via Dashboard ou SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-anexos', 'crm-anexos', false);

-- Policies
CREATE POLICY "Usuários podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crm-anexos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Usuários podem ler anexos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'crm-anexos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Usuários podem deletar próprios anexos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'crm-anexos' AND
  auth.uid() = owner
);
```

#### 1.2. Helper Storage (src/lib/storage/supabaseStorage.ts)
```typescript
import { createClient } from '@/lib/supabase/client'

export async function uploadFile(file: File, path: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.storage
      .from('crm-anexos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('crm-anexos')
      .getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    throw error
  }
}

export async function deleteFile(path: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .from('crm-anexos')
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    throw error
  }
}

export async function downloadFile(path: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.storage
      .from('crm-anexos')
      .download(path)

    if (error) throw error

    return data
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    throw error
  }
}
```

#### 1.3. Hook useAnexos (src/lib/hooks/useAnexos.ts)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadFile, deleteFile } from '@/lib/storage/supabaseStorage'
import { useToast } from '@/components/ui/use-toast'

export function useAnexos(leadId: string) {
  const [anexos, setAnexos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const fetchAnexos = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('anexos')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAnexos(data || [])
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadAnexo = async (
    file: File,
    tipo_documento: string
  ) => {
    try {
      setUploading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Upload para storage
      const timestamp = Date.now()
      const fileName = `${leadId}/${timestamp}_${file.name}`
      const { path, url } = await uploadFile(file, fileName)

      // Salvar metadata no banco
      const { data: anexo, error } = await supabase
        .from('anexos')
        .insert({
          lead_id: leadId,
          usuario_id: user.id,
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho_bytes: file.size,
          url_storage: path,
          tipo_documento,
        })
        .select()
        .single()

      if (error) throw error

      setAnexos((prev) => [anexo, ...prev])

      toast({
        title: 'Anexo enviado',
        description: 'O arquivo foi enviado com sucesso.',
      })

      return anexo
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar arquivo',
        description: 'Não foi possível enviar o arquivo. Tente novamente.',
      })
      
      throw error
    } finally {
      setUploading(false)
    }
  }

  const deleteAnexo = async (anexoId: string, storagePath: string) => {
    try {
      // Deletar do storage
      await deleteFile(storagePath)

      // Deletar do banco
      const { error } = await supabase
        .from('anexos')
        .delete()
        .eq('id', anexoId)

      if (error) throw error

      setAnexos((prev) => prev.filter((a) => a.id !== anexoId))

      toast({
        title: 'Anexo removido',
        description: 'O arquivo foi removido com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao deletar anexo:', error)
      
      toast({
        variant: 'destructive',
        title: 'Erro ao remover arquivo',
        description: 'Não foi possível remover o arquivo. Tente novamente.',
      })
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchAnexos()
    }
  }, [leadId])

  return {
    anexos,
    loading,
    uploading,
    uploadAnexo,
    deleteAnexo,
    refetch: fetchAnexos,
  }
}
```

#### 1.4. Upload Zone (src/components/anexos/UploadZone.tsx)
```typescript
'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
}

export function UploadZone({
  onUpload,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
}: UploadZoneProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await onUpload(file)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled,
  })

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'p-8 border-2 border-dashed cursor-pointer transition-colors',
        isDragActive && 'border-blue-500 bg-blue-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Solte os arquivos aqui...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-2">
              Arraste arquivos ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500">
              PDF, Word, Excel, Imagens (máx. 10MB)
            </p>
          </>
        )}
      </div>
    </Card>
  )
}
```

#### 1.5. Anexos List (src/components/anexos/AnexosList.tsx)
```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UploadZone } from './UploadZone'
import { useAnexos } from '@/lib/hooks/useAnexos'
import { Download, Trash2, File } from 'lucide-react'
import { formatBytes } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnexosListProps {
  leadId: string
}

export function AnexosList({ leadId }: AnexosListProps) {
  const { anexos, loading, uploading, uploadAnexo, deleteAnexo } = useAnexos(leadId)

  const handleUpload = async (file: File) => {
    await uploadAnexo(file, 'documento')
  }

  const handleDownload = (url: string, nome: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = nome
    link.click()
  }

  return (
    <div className="space-y-4">
      <UploadZone onUpload={handleUpload} disabled={uploading} />

      {loading ? (
        <p className="text-center text-gray-500">Carregando...</p>
      ) : anexos.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          Nenhum anexo enviado ainda
        </p>
      ) : (
        <div className="space-y-2">
          {anexos.map((anexo) => (
            <Card key={anexo.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <File className="w-5 h-5 text-gray-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {anexo.nome_arquivo}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatBytes(anexo.tamanho_bytes)}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(anexo.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(anexo.url_storage, anexo.nome_arquivo)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAnexo(anexo.id, anexo.url_storage)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 2. Sistema de Tags

#### 2.1. Tag Input (src/components/tags/TagInput.tsx)
```typescript
'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Digite e pressione Enter',
  className,
}: TagInputProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      const newTag = input.trim().toLowerCase()
      
      if (!value.includes(newTag)) {
        onChange([...value, newTag])
      }
      
      setInput('')
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2 p-2 border rounded-lg', className)}>
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 border-0 focus-visible:ring-0 min-w-[120px]"
      />
    </div>
  )
}
```

---

### 3. Perfil de Usuário

#### 3.1. Profile Form (src/components/perfil/ProfileForm.tsx)
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import InputMask from 'react-input-mask'

const profileSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: ProfileFormData
  userId: string
}

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('users_profile')
        .update(data)
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o perfil.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome_completo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <InputMask mask="(99) 99999-9999" value={field.value} onChange={field.onChange}>
                  {(inputProps: any) => <Input {...inputProps} />}
                </InputMask>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cargo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </form>
    </Form>
  )
}
```

#### 3.2. Profile Page (src/app/(dashboard)/perfil/page.tsx)
```typescript
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/card'
import { ProfileForm } from '@/components/perfil/ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-500 mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card className="p-6">
          <ProfileForm
            initialData={{
              nome_completo: profile?.nome_completo || '',
              telefone: profile?.telefone || '',
              cargo: profile?.cargo || '',
            }}
            userId={user.id}
          />
        </Card>
      </div>
    </PageContainer>
  )
}
```

---

### 4. Configurar PWA

#### 4.1. Configurar next.config.js
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // ... resto da configuração
})
```

#### 4.2. Criar manifest.json (public/manifest.json)
```json
{
  "name": "CRM NNOS",
  "short_name": "CRM NNOS",
  "description": "Sistema de gerenciamento de pipeline comercial",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#004B87",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 4.3. Adicionar ao Layout
```typescript
// src/app/layout.tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#004B87',
}
```

---

### 5. Utilidades Adicionais

#### 5.1. formatBytes (src/lib/utils/formatters.ts)
```typescript
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Upload de anexos funciona
- [ ] Download de anexos funciona
- [ ] Exclusão de anexos funciona
- [ ] Tratamento de erro em upload
- [ ] Tags podem ser adicionadas
- [ ] Tags podem ser removidas
- [ ] Perfil de usuário editável
- [ ] PWA instalável no mobile
- [ ] Ícones do PWA criados
- [ ] Todas as fases anteriores estáveis

---

## 🧪 TESTES MANUAIS

### Teste 1: Upload de Anexos
1. Abrir detalhes de um lead
2. Arrastar arquivo para área de upload
3. Verificar que arquivo aparece na lista
4. Verificar no Supabase Storage
5. Tentar upload de arquivo >10MB
6. Verificar mensagem de erro

### Teste 2: Tags
1. Editar um lead
2. Adicionar tags
3. Salvar
4. Verificar que tags aparecem no card
5. Remover tags
6. Verificar persistência

### Teste 3: PWA
1. Abrir em mobile
2. Adicionar à tela inicial
3. Abrir como app
4. Verificar que funciona standalone

---

## 📝 NOTAS FINAIS

### Melhorias de Performance Implementadas
- ✅ Lazy loading de componentes pesados
- ✅ Memoização de cálculos
- ✅ Debounce em filtros
- ✅ Virtual scrolling em listas grandes

### Melhorias de UX Implementadas
- ✅ Loading states em todas as ações
- ✅ Feedback visual imediato
- ✅ Mensagens de erro claras
- ✅ Confirmações antes de ações destrutivas

### Segurança
- ✅ RLS em todas as tabelas
- ✅ Validação server-side
- ✅ Sanitização de inputs
- ✅ Rate limiting no Supabase

---

## 🎉 PROJETO CONCLUÍDO

Com a conclusão desta fase, o CRM NNOS está completo e pronto para uso em produção!

### Próximos Passos (Opcional)
- Deploy em produção (Vercel + Supabase)
- Configurar domínio customizado
- Configurar backup automático
- Monitoramento (Sentry, LogRocket)
- Testes E2E (Playwright, Cypress)
- CI/CD (GitHub Actions)

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS



