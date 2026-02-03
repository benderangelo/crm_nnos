'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadFile, deleteFile } from '@/lib/storage/supabaseStorage'
import { useToast } from '@/components/ui/toast'

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
        } as any)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
