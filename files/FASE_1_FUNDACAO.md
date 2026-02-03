# 🏗️ FASE 1: FUNDAÇÃO
**Duração estimada:** 1 semana  
**Status:** 📋 Planejamento

---

## 📋 OBJETIVO DA FASE
Criar a estrutura base do projeto Next.js com autenticação funcional do Supabase, garantindo que a fundação esteja sólida para as próximas fases.

**Entregáveis:**
- ✅ Projeto Next.js configurado
- ✅ Supabase integrado e testado
- ✅ Sistema de autenticação (login/signup/logout)
- ✅ Layout principal com identidade visual NNOS
- ✅ Rotas protegidas
- ✅ Estrutura de pastas escalável

---

## 🛠️ STACK TECNOLÓGICO

### Core
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Styling:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth)

### Bibliotecas Principais
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "next": "^14.0.0",
  "react": "^18.2.0",
  "typescript": "^5.3.0",
  "tailwindcss": "^3.4.0",
  "zustand": "^4.5.0"
}
```

### Dev Tools
- ESLint + Prettier (formatação)
- TypeScript strict mode
- Git flow (main + develop branches)

---

## 📁 ESTRUTURA DE PASTAS

Criar a seguinte estrutura de pastas que suportará todas as fases futuras:

```
crm-nnos/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Grupo de rotas de autenticação
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/               # Grupo de rotas protegidas
│   │   │   ├── layout.tsx            # Layout principal do dashboard
│   │   │   └── kanban/               # FASE 2
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes (se necessário)
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Redirect para /kanban
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── auth/                     # Componentes de autenticação
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── layout/                   # Componentes de layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx (FASE 5)
│   │   │   └── PageContainer.tsx
│   │   ├── kanban/                   # FASE 2
│   │   ├── leads/                    # FASE 3
│   │   └── dashboard/                # FASE 5
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Cliente browser
│   │   │   ├── server.ts            # Cliente server
│   │   │   └── middleware.ts        # Middleware de auth
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useLeads.ts          # FASE 2
│   │   │   └── useInteracoes.ts     # FASE 4
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── leadsStore.ts        # FASE 2
│   │   └── utils/
│   │       ├── formatters.ts         # Formatação de dados
│   │       └── validators.ts         # Validações
│   └── types/
│       ├── database.types.ts         # Gerado pelo Supabase
│       ├── lead.types.ts             # FASE 2
│       └── user.types.ts
├── public/
│   └── images/
│       └── logo-nnos.svg
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎯 TAREFAS DETALHADAS

### 1. Setup Inicial do Projeto

#### 1.1. Criar Projeto Next.js
```bash
npx create-next-app@latest crm-nnos --typescript --tailwind --app --eslint
cd crm-nnos
```

**Configurações durante instalação:**
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ src/ directory: Yes
- ✅ App Router: Yes
- ✅ Import alias: Yes (@/*)

#### 1.2. Instalar Dependências
```bash
# Supabase
npm install @supabase/supabase-js

# Zustand (gerenciamento de estado)
npm install zustand

# shadcn/ui (será configurado no próximo passo)
npx shadcn-ui@latest init

# Utilitários
npm install clsx tailwind-merge
npm install -D @types/node
```

#### 1.3. Configurar shadcn/ui
```bash
npx shadcn-ui@latest init
```

Instalar componentes básicos que serão usados em todas as fases:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
```

---

### 2. Configuração do Supabase

#### 2.1. Criar arquivo .env.local
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 2.2. Criar .env.example (para documentação)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

#### 2.3. Criar Cliente Supabase (src/lib/supabase/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 2.4. Criar Cliente Server (src/lib/supabase/server.ts)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

#### 2.5. Gerar Tipos do Supabase
```bash
# Instalar CLI do Supabase
npm install -g supabase

# Gerar tipos (substitua PROJECT_ID pelo seu)
npx supabase gen types typescript --project-id "seu-project-id" > src/types/database.types.ts
```

---

### 3. Sistema de Autenticação

#### 3.1. Criar Hook useAuth (src/lib/hooks/useAuth.ts)
```typescript
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

#### 3.2. Criar Store de Autenticação (src/lib/stores/authStore.ts)
```typescript
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
```

#### 3.3. Criar Componentes de Autenticação

**LoginForm.tsx:**
- Campo de email
- Campo de senha
- Botão de login
- Link para signup
- Validação básica
- Toast de erro/sucesso

**SignupForm.tsx:**
- Campo de nome completo
- Campo de email
- Campo de senha
- Campo de confirmação de senha
- Botão de signup
- Link para login
- Validação de senha forte
- Toast de erro/sucesso

**Referência de implementação:**
```typescript
// src/components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: error.message,
      })
    } else {
      router.push('/kanban')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* Implementar campos */}
    </form>
  )
}
```

---

### 4. Layout Principal

#### 4.1. Criar Header (src/components/layout/Header.tsx)

**Elementos do Header:**
- Logo NNOS (esquerda)
- Título "Pipeline Comercial"
- Avatar do usuário (direita)
- Dropdown menu com:
  - Nome do usuário
  - Email
  - Logout

**Cores da identidade NNOS:**
```typescript
// Adicionar ao tailwind.config.ts
colors: {
  nnos: {
    blue: '#004B87',
    coral: '#FF8C42',
    dark: '#1a1a1a',
    gray: '#6B7280',
  }
}
```

#### 4.2. Criar PageContainer (src/components/layout/PageContainer.tsx)
```typescript
interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("max-w-[1600px] mx-auto px-4 md:px-6 py-6", className)}>
      {children}
    </div>
  )
}
```

#### 4.3. Criar Layout do Dashboard (src/app/(dashboard)/layout.tsx)
```typescript
import { Header } from '@/components/layout/Header'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {children}
    </div>
  )
}
```

---

### 5. Middleware de Autenticação

#### 5.1. Criar Middleware (src/middleware.ts)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 6. Rotas

#### 6.1. Página de Login (src/app/(auth)/login/page.tsx)
```typescript
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nnos-blue to-blue-700">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            {/* Logo NNOS */}
            <h1 className="text-3xl font-bold text-nnos-blue">NNOS</h1>
            <p className="text-gray-500 mt-2">Pipeline Comercial</p>
          </div>
          
          <LoginForm />
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Não tem uma conta? </span>
            <Link href="/signup" className="text-nnos-blue font-semibold hover:underline">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 6.2. Página de Signup (src/app/(auth)/signup/page.tsx)
Similar ao login, mas com SignupForm

#### 6.3. Página Principal (src/app/page.tsx)
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/kanban')
  } else {
    redirect('/login')
  }
}
```

#### 6.4. Página Kanban (src/app/(dashboard)/kanban/page.tsx)
```typescript
// Por enquanto, apenas um placeholder para FASE 2
export default function KanbanPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Kanban - Em Desenvolvimento</h1>
      <p className="text-gray-500 mt-2">FASE 2 será implementada aqui</p>
    </div>
  )
}
```

---

### 7. Utilitários

#### 7.1. Formatadores (src/lib/utils/formatters.ts)
```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatPhone(phone: string): string {
  // (37) 99999-9999
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}
```

#### 7.2. Validadores (src/lib/utils/validators.ts)
```typescript
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return re.test(password)
}

export function isValidPhone(phone: string): boolean {
  // (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  const re = /^\(\d{2}\) \d{4,5}-\d{4}$/
  return re.test(phone)
}
```

---

## 🔗 PREPARAÇÃO PARA FASE 2

### Estrutura já preparada:
- ✅ Pasta `src/components/kanban/` criada (vazia)
- ✅ Rota `/kanban` criada com placeholder
- ✅ Hook `useLeads.ts` estruturado (vazio)
- ✅ Store `leadsStore.ts` estruturado (vazio)
- ✅ Tipos `lead.types.ts` estruturado (vazio)

### O que a Fase 2 receberá:
1. Sistema de autenticação funcionando
2. Layout principal renderizado
3. Rota `/kanban` protegida
4. Cliente Supabase configurado
5. Utilitários de formatação prontos
6. shadcn/ui components instalados

---

## ✅ CHECKLIST DE CONCLUSÃO

Antes de considerar a Fase 1 concluída, verificar:

- [ ] Projeto Next.js criado e rodando (`npm run dev`)
- [ ] Supabase conectado (testar com console.log)
- [ ] Tipos do Supabase gerados
- [ ] Login funciona (redireciona para /kanban)
- [ ] Signup funciona (cria usuário e perfil)
- [ ] Logout funciona (redireciona para /login)
- [ ] Middleware protege rotas corretamente
- [ ] Header mostra nome do usuário logado
- [ ] Layout responsivo funciona em mobile (testar no DevTools)
- [ ] Toast notifications funcionam
- [ ] ESLint sem erros (`npm run lint`)
- [ ] Build funciona (`npm run build`)

---

## 🧪 TESTES MANUAIS

### Teste 1: Fluxo de Signup
1. Acessar `/signup`
2. Preencher formulário com dados válidos
3. Verificar que foi criado em auth.users (Supabase Dashboard)
4. Verificar que foi criado em users_profile
5. Verificar redirecionamento para /kanban

### Teste 2: Fluxo de Login
1. Acessar `/login`
2. Fazer login com usuário criado
3. Verificar redirecionamento para /kanban
4. Verificar que nome aparece no header

### Teste 3: Proteção de Rotas
1. Fazer logout
2. Tentar acessar `/kanban` diretamente
3. Verificar redirecionamento para /login

### Teste 4: Responsividade
1. Abrir DevTools (F12)
2. Testar em Mobile (375px)
3. Testar em Tablet (768px)
4. Testar em Desktop (1440px)
5. Verificar que layout se adapta

---

## 📝 NOTAS IMPORTANTES

### Sobre Internet
- ❌ Não implementar funcionalidade offline
- ✅ Mostrar mensagem clara quando sem conexão
- ✅ Loading states durante requisições

### Sobre Erros
- ✅ Sempre usar try/catch em operações async
- ✅ Mostrar mensagens de erro amigáveis via Toast
- ✅ Logar erros no console para debug

### Sobre TypeScript
- ✅ Usar strict mode
- ✅ Evitar `any`, preferir `unknown`
- ✅ Tipar todas as props de componentes

### Sobre Performance
- ✅ Usar Next.js Image para imagens
- ✅ Lazy load de componentes pesados
- ✅ Memoizar componentes quando necessário

---

## 📚 RECURSOS

### Documentação Oficial
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Supabase Auth Helpers
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## 🚀 PRÓXIMOS PASSOS (FASE 2)

Na próxima fase, implementaremos:
- Visualização do Kanban com 5 etapas
- Busca de leads do Supabase
- Drag & Drop entre etapas
- Cards estilizados com informações
- Filtros básicos

**Arquivo:** `FASE_2_KANBAN.md`

---

**Data de criação:** Janeiro 2026  
**Versão:** 1.0  
**Projeto:** CRM NNOS