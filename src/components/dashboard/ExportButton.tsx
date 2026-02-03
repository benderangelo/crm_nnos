'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
  data: any[]
  filename: string
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    // Preparar dados
    const exportData = data.map(lead => ({
      'Empresa': lead.empresa,
      'Contato': lead.contato_nome,
      'Telefone': lead.contato_telefone,
      'Email': lead.contato_email || '',
      'Valor': lead.valor_estimado || 0,
      'Etapa': lead.etapa,
      'Origem': lead.origem || '',
      'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
    }))

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')

    // Download
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Exportar Excel
    </Button>
  )
}
