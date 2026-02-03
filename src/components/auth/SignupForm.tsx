'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidEmail, isStrongPassword, validatePasswordMatch } from '@/lib/utils/validators'
import { Database } from '@/types/database.types'

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validação
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos')
      return
    }

    if (!isValidEmail(email)) {
      setError('Email inválido')
      return
    }

    if (!isStrongPassword(password)) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula e número')
      return
    }

    if (!validatePasswordMatch(password, confirmPassword)) {
      setError('As senhas não conferem')
      return
    }

    setLoading(true)

    try {
      // 1. Criar usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // 2. Criar perfil do usuário
      if (data.user) {
        const profileData: Database['public']['Tables']['users_profile']['Insert'] = {
          id: data.user.id,
          nome_completo: fullName,
        }

        const { error: profileError } = await supabase
          .from('users_profile')
          .insert(profileData as any)

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }
      }

      // 3. Redirecionar para o Kanban
      router.push('/kanban')
      router.refresh()
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome Completo</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="João Silva"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, incluindo maiúscula, minúscula e número
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
