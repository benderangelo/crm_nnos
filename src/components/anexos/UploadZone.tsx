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
