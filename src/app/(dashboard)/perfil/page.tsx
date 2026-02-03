import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/card'
import { ProfileForm } from '@/components/perfil/ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PerfilPage() {
  const supabase = await createClient()
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
              nome_completo: (profile as any)?.nome_completo || '',
              telefone: (profile as any)?.telefone || '',
              cargo: (profile as any)?.cargo || '',
            }}
            userId={user.id}
          />
        </Card>

        <Card className="p-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Informações da Conta</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Email:</span>{' '}
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">ID:</span>{' '}
                <span className="text-gray-600 font-mono text-xs">{user.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Criado em:</span>{' '}
                <span className="text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
