'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-nnos-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-nnos-blue">NNOS</h1>
              <p className="text-xs text-gray-500">Pipeline Comercial</p>
            </div>
          </div>

          {/* Navegação */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={cn(
                'text-sm font-medium transition-colors hover:text-nnos-blue',
                pathname === '/dashboard' ? 'text-nnos-blue' : 'text-gray-600'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/kanban"
              className={cn(
                'text-sm font-medium transition-colors hover:text-nnos-blue',
                pathname === '/kanban' ? 'text-nnos-blue' : 'text-gray-600'
              )}
            >
              Kanban
            </Link>
            <Link
              href="/track"
              className={cn(
                'text-sm font-medium transition-colors hover:text-nnos-blue',
                pathname === '/track' ? 'text-nnos-blue' : 'text-gray-600'
              )}
            >
              Tracking
            </Link>
            <Link
              href="/perfil"
              className={cn(
                'text-sm font-medium transition-colors hover:text-nnos-blue',
                pathname === '/perfil' ? 'text-nnos-blue' : 'text-gray-600'
              )}
            >
              Perfil
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.user_metadata?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-nnos-coral rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
