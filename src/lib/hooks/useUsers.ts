import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
    id: string
    nome_completo: string
    email?: string
}

export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchUsers() {
            try {
                const { data, error } = await supabase
                    .from('users_profile')
                    .select('id, nome_completo')
                    .order('nome_completo')

                if (error) throw error

                setUsers(data || [])
            } catch (error) {
                console.error('Erro ao buscar usuários:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    return { users, loading }
}
