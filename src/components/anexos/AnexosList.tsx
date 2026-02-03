'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadZone } from './UploadZone'
import { useAnexos } from '@/lib/hooks/useAnexos'
import { Download, Trash2, File } from 'lucide-react'
import { formatBytes } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

interface AnexosListProps {
  leadId: string
}

export function AnexosList({ leadId }: AnexosListProps) {
  const { anexos, loading, uploading, uploadAnexo, deleteAnexo } = useAnexos(leadId)
  const supabase = createClient()

  const handleUpload = async (file: File) => {
    await uploadAnexo(file, 'documento')
  }

  const handleDownload = (storagePath: string, nome: string) => {
    // Gerar URL pública do Supabase Storage
    const { data } = supabase.storage
      .from('crm-anexos')
      .getPublicUrl(storagePath)

    const link = document.createElement('a')
    link.href = data.publicUrl
    link.download = nome
    link.target = '_blank'
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
