'use client'

import { useState } from 'react'
import { FileText, Download, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePropostas } from '@/lib/hooks/usePropostas'
import { useDadosEmpresa } from '@/lib/hooks/useDadosEmpresa'
import { PropostaAnexo } from '@/types/proposta.types'
import { formatBytes } from '@/lib/utils/formatters'

interface PropostasTabProps {
    leadId: string
    lead: {
        empresa: string
        contato_nome: string
        contato_telefone: string
        valor_estimado: number
        observacoes: string | null
    }
}

export function PropostasTab({ leadId, lead }: PropostasTabProps) {
    const { propostas, loading, isGenerating, gerarProposta, downloadProposta, deletarProposta } = usePropostas(leadId)
    const { dadosEmpresa, exists: temDadosEmpresa } = useDadosEmpresa(leadId)

    const [propostaToDelete, setPropostaToDelete] = useState<PropostaAnexo | null>(null)

    const handleGerarProposta = async () => {
        if (!temDadosEmpresa || !dadosEmpresa) {
            return
        }

        const dadosCompletos = {
            lead: {
                empresa: lead.empresa,
                contato_nome: lead.contato_nome,
                contato_telefone: lead.contato_telefone,
                valor_estimado: lead.valor_estimado,
                observacoes: lead.observacoes,
            },
            empresa: {
                razao_social: dadosEmpresa.razao_social,
                nome_fantasia: dadosEmpresa.nome_fantasia || '',
                cnpj: dadosEmpresa.cnpj,
                logradouro: dadosEmpresa.logradouro || '',
                numero: dadosEmpresa.numero || '',
                bairro: dadosEmpresa.bairro || '',
                cep: dadosEmpresa.cep || '',
                municipio: dadosEmpresa.municipio || '',
                uf: dadosEmpresa.uf || '',
                objetivo_projeto: dadosEmpresa.objetivo_projeto || '',
                periodo: dadosEmpresa.periodo || '',
                modalidade: dadosEmpresa.modalidade || '',
                parcelamento: dadosEmpresa.parcelamento || '',
            },
            numero_aps: 0, // Será preenchido pelo hook
            data_geracao: new Date().toISOString(),
        }

        await gerarProposta(dadosCompletos)
    }

    const handleDownload = (proposta: PropostaAnexo) => {
        downloadProposta(proposta)
    }

    const handleDeleteClick = (proposta: PropostaAnexo) => {
        setPropostaToDelete(proposta)
    }

    const handleDeleteConfirm = async () => {
        if (propostaToDelete) {
            await deletarProposta(propostaToDelete)
            setPropostaToDelete(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!temDadosEmpresa) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    É necessário preencher os <strong>Dados da Empresa</strong> antes de gerar propostas.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Propostas Comerciais</h3>
                    <p className="text-sm text-muted-foreground">
                        {propostas.length} proposta{propostas.length !== 1 ? 's' : ''} gerada{propostas.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    onClick={handleGerarProposta}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4 mr-2" />
                            Gerar Proposta
                        </>
                    )}
                </Button>
            </div>

            {/* Lista de propostas */}
            {propostas.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                        Nenhuma proposta gerada ainda
                    </p>
                    <Button onClick={handleGerarProposta} disabled={isGenerating}>
                        <Plus className="w-4 h-4 mr-2" />
                        Gerar Primeira Proposta
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {propostas.map((proposta) => (
                        <div
                            key={proposta.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <FileText className="w-8 h-8 text-primary" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium">{proposta.nome_arquivo}</p>
                                        <Badge variant="outline">
                                            APS-{proposta.numero_aps?.toString().padStart(3, '0')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{formatBytes(proposta.tamanho_bytes)}</span>
                                        <span>•</span>
                                        <span>
                                            {new Date(proposta.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        {proposta.criado_por_nome && (
                                            <>
                                                <span>•</span>
                                                <span>por {proposta.criado_por_nome}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(proposta)}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(proposta)}
                                >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialog de confirmação de delete */}
            <AlertDialog open={!!propostaToDelete} onOpenChange={(open) => !open && setPropostaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deletar proposta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deletar <strong>{propostaToDelete?.nome_arquivo}</strong>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                            Deletar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
