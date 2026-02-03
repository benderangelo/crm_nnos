'use client'

import { UseFormReturn } from 'react-hook-form'
import { DadosEmpresaFormData } from '@/lib/schemas/dadosEmpresaSchema'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PERIODOS, MODALIDADES, PARCELAMENTOS } from '@/types/dadosEmpresa.types'
import InputMask from 'react-input-mask'
import { Loader2, Search } from 'lucide-react'

interface DadosEmpresaFormProps {
  form: UseFormReturn<DadosEmpresaFormData>
  onBuscarCNPJ?: () => void
  buscandoCNPJ?: boolean
}

export function DadosEmpresaForm({ form, onBuscarCNPJ, buscandoCNPJ }: DadosEmpresaFormProps) {
  return (
    <div className="space-y-6">
      {/* Seção: Dados Cadastrais */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dados Cadastrais</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <InputMask
                      mask="99.999.999/9999-99"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {(inputProps: any) => (
                        <Input placeholder="00.000.000/0000-00" {...inputProps} />
                      )}
                    </InputMask>
                  </FormControl>
                  {onBuscarCNPJ && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onBuscarCNPJ}
                      disabled={buscandoCNPJ || !field.value}
                    >
                      {buscandoCNPJ ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Buscar CNPJ
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <FormDescription>
                  Digite o CNPJ e clique em &quot;Buscar CNPJ&quot; para preencher automaticamente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="razao_social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social *</FormLabel>
                <FormControl>
                  <Input placeholder="EMPRESA EXEMPLO LTDA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nome_fantasia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl>
                  <Input placeholder="Empresa Exemplo" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Endereço */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida, etc" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input placeholder="123" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input placeholder="Centro" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <InputMask
                    mask="99999-999"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    {(inputProps: any) => (
                      <Input placeholder="00000-000" {...inputProps} />
                    )}
                  </InputMask>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="municipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Município</FormLabel>
                <FormControl>
                  <Input placeholder="São Paulo" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SP"
                    maxLength={2}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Seção: Dados do Projeto */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dados do Projeto</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={5}>
                      {PERIODOS.map((periodo) => (
                        <SelectItem key={periodo.value} value={periodo.value}>
                          {periodo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={5}>
                      {MODALIDADES.map((modalidade) => (
                        <SelectItem key={modalidade.value} value={modalidade.value}>
                          {modalidade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parcelamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={5}>
                      {PARCELAMENTOS.map((parc) => (
                        <SelectItem key={parc.value} value={parc.value}>
                          {parc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="objetivo_projeto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objetivo do Projeto *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva os objetivos e escopo do projeto..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Será usado na proposta comercial
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
