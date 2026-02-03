export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anexos: {
        Row: {
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          lead_id: string
          mime_type: string | null
          nome_arquivo: string
          numero_aps: number | null
          storage_path: string | null
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          tipo_documento: string | null
          url_storage: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          lead_id: string
          mime_type?: string | null
          nome_arquivo: string
          numero_aps?: number | null
          storage_path?: string | null
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          tipo_documento?: string | null
          url_storage: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string
          mime_type?: string | null
          nome_arquivo?: string
          numero_aps?: number | null
          storage_path?: string | null
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          tipo_documento?: string | null
          url_storage?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_dados_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      contador_aps: {
        Row: {
          id: number
          proximo_numero: number
          updated_at: string | null
        }
        Insert: {
          id?: number
          proximo_numero?: number
          updated_at?: string | null
        }
        Update: {
          id?: number
          proximo_numero?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      dados_empresa: {
        Row: {
          bairro: string | null
          cep: string | null
          cnpj: string
          consultado_em: string | null
          created_at: string | null
          dados_receita_completo: Json | null
          id: string
          lead_id: string
          logradouro: string | null
          modalidade: string | null
          municipio: string | null
          nome_fantasia: string | null
          numero: string | null
          objetivo_projeto: string | null
          origem: string | null
          parcelamento: string | null
          periodo: string | null
          preenchido_por: string | null
          razao_social: string
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cnpj: string
          consultado_em?: string | null
          created_at?: string | null
          dados_receita_completo?: Json | null
          id?: string
          lead_id: string
          logradouro?: string | null
          modalidade?: string | null
          municipio?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          objetivo_projeto?: string | null
          origem?: string | null
          parcelamento?: string | null
          periodo?: string | null
          preenchido_por?: string | null
          razao_social: string
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cnpj?: string
          consultado_em?: string | null
          created_at?: string | null
          dados_receita_completo?: Json | null
          id?: string
          lead_id?: string
          logradouro?: string | null
          modalidade?: string | null
          municipio?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          objetivo_projeto?: string | null
          origem?: string | null
          parcelamento?: string | null
          periodo?: string | null
          preenchido_por?: string | null
          razao_social?: string
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dados_empresa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_empresa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "v_leads_com_dados_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_empresa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "v_leads_com_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_empresa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "v_leads_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_empresa_preenchido_por_fkey"
            columns: ["preenchido_por"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_responsaveis: {
        Row: {
          alterado_em: string | null
          etapa_anterior: string | null
          etapa_nova: string
          id: string
          lead_id: string
          motivo: string | null
          usuario_anterior_id: string | null
          usuario_novo_id: string
        }
        Insert: {
          alterado_em?: string | null
          etapa_anterior?: string | null
          etapa_nova: string
          id?: string
          lead_id: string
          motivo?: string | null
          usuario_anterior_id?: string | null
          usuario_novo_id: string
        }
        Update: {
          alterado_em?: string | null
          etapa_anterior?: string | null
          etapa_nova?: string
          id?: string
          lead_id?: string
          motivo?: string | null
          usuario_anterior_id?: string | null
          usuario_novo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_responsaveis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_responsaveis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_dados_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_responsaveis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_responsaveis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_responsaveis_usuario_anterior_id_fkey"
            columns: ["usuario_anterior_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_responsaveis_usuario_novo_id_fkey"
            columns: ["usuario_novo_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      interacoes: {
        Row: {
          created_at: string | null
          descricao: string
          duracao_minutos: number | null
          id: string
          lead_id: string
          resultado: string | null
          tipo: string
          titulo: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          duracao_minutos?: number | null
          id?: string
          lead_id: string
          resultado?: string | null
          tipo: string
          titulo?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          duracao_minutos?: number | null
          id?: string
          lead_id?: string
          resultado?: string | null
          tipo?: string
          titulo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_dados_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ativo: boolean | null
          contato_cargo: string | null
          contato_email: string | null
          contato_nome: string
          contato_telefone: string
          created_at: string | null
          created_by: string | null
          data_entrada_etapa: string | null
          data_fechamento: string | null
          data_primeiro_contato: string | null
          empresa: string
          etapa: string
          id: string
          motivo_perda: string | null
          motivo_perda_descricao: string | null
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          probabilidade: number | null
          proxima_acao_data: string | null
          proxima_acao_descricao: string | null
          responsavel_id: string | null
          segmento: string | null
          tags: string[] | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          ativo?: boolean | null
          contato_cargo?: string | null
          contato_email?: string | null
          contato_nome: string
          contato_telefone: string
          created_at?: string | null
          created_by?: string | null
          data_entrada_etapa?: string | null
          data_fechamento?: string | null
          data_primeiro_contato?: string | null
          empresa: string
          etapa?: string
          id?: string
          motivo_perda?: string | null
          motivo_perda_descricao?: string | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          probabilidade?: number | null
          proxima_acao_data?: string | null
          proxima_acao_descricao?: string | null
          responsavel_id?: string | null
          segmento?: string | null
          tags?: string[] | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          ativo?: boolean | null
          contato_cargo?: string | null
          contato_email?: string | null
          contato_nome?: string
          contato_telefone?: string
          created_at?: string | null
          created_by?: string | null
          data_entrada_etapa?: string | null
          data_fechamento?: string | null
          data_primeiro_contato?: string | null
          empresa?: string
          etapa?: string
          id?: string
          motivo_perda?: string | null
          motivo_perda_descricao?: string | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          probabilidade?: number | null
          proxima_acao_data?: string | null
          proxima_acao_descricao?: string | null
          responsavel_id?: string | null
          segmento?: string | null
          tags?: string[] | null
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      mudancas_etapa: {
        Row: {
          created_at: string | null
          etapa_anterior: string
          etapa_nova: string
          id: string
          lead_id: string
          observacao: string | null
          responsavel_nome: string | null
          tempo_na_etapa_anterior: unknown
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          etapa_anterior: string
          etapa_nova: string
          id?: string
          lead_id: string
          observacao?: string | null
          responsavel_nome?: string | null
          tempo_na_etapa_anterior?: unknown
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          etapa_anterior?: string
          etapa_nova?: string
          id?: string
          lead_id?: string
          observacao?: string | null
          responsavel_nome?: string | null
          tempo_na_etapa_anterior?: unknown
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mudancas_etapa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_etapa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_dados_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_etapa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_etapa_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_etapa_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_funil_vendas: {
        Row: {
          dias_medio_etapa: number | null
          etapa: string | null
          quantidade: number | null
          ticket_medio: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      v_leads_com_dados_empresa: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          cnpj: string | null
          contato_cargo: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          created_by: string | null
          dados_empresa_id: string | null
          dados_origem: string | null
          data_entrada_etapa: string | null
          data_fechamento: string | null
          data_primeiro_contato: string | null
          empresa: string | null
          etapa: string | null
          id: string | null
          logradouro: string | null
          modalidade: string | null
          motivo_perda: string | null
          municipio: string | null
          nome_fantasia: string | null
          numero: string | null
          objetivo_projeto: string | null
          observacoes: string | null
          origem: string | null
          parcelamento: string | null
          periodo: string | null
          prioridade: string | null
          probabilidade: number | null
          proxima_acao_data: string | null
          proxima_acao_descricao: string | null
          razao_social: string | null
          responsavel_id: string | null
          segmento: string | null
          tags: string[] | null
          tem_dados_empresa: boolean | null
          uf: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      v_leads_com_usuarios: {
        Row: {
          ativo: boolean | null
          contato_cargo: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          created_by: string | null
          criado_por_nome: string | null
          data_entrada_etapa: string | null
          data_fechamento: string | null
          data_primeiro_contato: string | null
          empresa: string | null
          etapa: string | null
          id: string | null
          motivo_perda: string | null
          motivo_perda_descricao: string | null
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          probabilidade: number | null
          proxima_acao_data: string | null
          proxima_acao_descricao: string | null
          responsavel_avatar: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          segmento: string | null
          tags: string[] | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      v_leads_completo: {
        Row: {
          ativo: boolean | null
          contato_cargo: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string | null
          created_by: string | null
          data_entrada_etapa: string | null
          data_fechamento: string | null
          data_primeiro_contato: string | null
          dias_na_etapa_atual: number | null
          empresa: string | null
          etapa: string | null
          id: string | null
          motivo_perda: string | null
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          probabilidade: number | null
          proxima_acao_data: string | null
          proxima_acao_descricao: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          segmento: string | null
          tags: string[] | null
          total_anexos: number | null
          total_interacoes: number | null
          ultima_interacao: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      v_propostas_lead: {
        Row: {
          created_at: string | null
          criado_por: string | null
          criado_por_nome: string | null
          descricao: string | null
          id: string | null
          lead_empresa: string | null
          lead_id: string | null
          mime_type: string | null
          nome_arquivo: string | null
          numero_aps: number | null
          storage_path: string | null
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          tipo_documento: string | null
          url_storage: string | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_dados_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_com_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      obter_proximo_aps: { Args: never; Returns: number }
      soft_delete_lead: { Args: { lead_id: string }; Returns: undefined }
      upsert_mudanca_etapa: {
        Args: {
          p_etapa_anterior: string
          p_etapa_nova: string
          p_lead_id: string
          p_observacao?: string
          p_responsavel_nome: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
