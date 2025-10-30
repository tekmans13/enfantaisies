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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          file_url: string
          id: string
          inscription_id: string | null
          type_document: string
          uploaded_at: string | null
        }
        Insert: {
          file_url: string
          id?: string
          inscription_id?: string | null
          type_document: string
          uploaded_at?: string | null
        }
        Update: {
          file_url?: string
          id?: string
          inscription_id?: string | null
          type_document?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      home_content: {
        Row: {
          created_at: string | null
          description: string
          id: string
          section_key: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          section_key: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          section_key?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inscription_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          inscription_id: string | null
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          inscription_id?: string | null
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          inscription_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscription_documents_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          allergies_details: string | null
          authorized_person_1_first_name: string | null
          authorized_person_1_last_name: string | null
          authorized_person_1_mobile: string | null
          authorized_person_1_other_phone: string | null
          authorized_person_1_relation: string | null
          authorized_person_2_first_name: string | null
          authorized_person_2_last_name: string | null
          authorized_person_2_mobile: string | null
          authorized_person_2_other_phone: string | null
          authorized_person_2_relation: string | null
          caf_number: string | null
          child_age_group: Database["public"]["Enums"]["age_group"] | null
          child_birth_date: string
          child_class: string
          child_first_name: string
          child_gender: string
          child_last_name: string
          child_school: string
          created_at: string | null
          demande_specifique: string | null
          food_allergies_details: string | null
          has_allergies: boolean | null
          has_medication: boolean | null
          id: string
          is_first_inscription: boolean | null
          medication_details: string | null
          nombre_semaines_demandees: number | null
          paiement_date: string | null
          paiement_statut: string | null
          parent_address: string
          parent_authority: string
          parent_email: string
          parent_first_name: string
          parent_last_name: string
          parent_mobile: string
          parent_office_phone: string | null
          parent2_authority: string | null
          parent2_email: string | null
          parent2_first_name: string | null
          parent2_last_name: string | null
          parent2_mobile: string | null
          parent2_office_phone: string | null
          quotient_familial: number | null
          sejour_attribue_1: string | null
          sejour_attribue_2: string | null
          sejour_preference_1: string | null
          sejour_preference_1_alternatif: string | null
          sejour_preference_2: string | null
          sejour_preference_2_alternatif: string | null
          social_security_regime: string
          status: string | null
          stripe_payment_id: string | null
          updated_at: string | null
          urgency_contact_1_first_name: string | null
          urgency_contact_1_last_name: string | null
          urgency_contact_1_mobile: string | null
          urgency_contact_1_other_phone: string | null
          urgency_contact_1_relation: string | null
          urgency_contact_2_first_name: string | null
          urgency_contact_2_last_name: string | null
          urgency_contact_2_mobile: string | null
          urgency_contact_2_other_phone: string | null
          urgency_contact_2_relation: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          allergies_details?: string | null
          authorized_person_1_first_name?: string | null
          authorized_person_1_last_name?: string | null
          authorized_person_1_mobile?: string | null
          authorized_person_1_other_phone?: string | null
          authorized_person_1_relation?: string | null
          authorized_person_2_first_name?: string | null
          authorized_person_2_last_name?: string | null
          authorized_person_2_mobile?: string | null
          authorized_person_2_other_phone?: string | null
          authorized_person_2_relation?: string | null
          caf_number?: string | null
          child_age_group?: Database["public"]["Enums"]["age_group"] | null
          child_birth_date: string
          child_class: string
          child_first_name: string
          child_gender: string
          child_last_name: string
          child_school: string
          created_at?: string | null
          demande_specifique?: string | null
          food_allergies_details?: string | null
          has_allergies?: boolean | null
          has_medication?: boolean | null
          id?: string
          is_first_inscription?: boolean | null
          medication_details?: string | null
          nombre_semaines_demandees?: number | null
          paiement_date?: string | null
          paiement_statut?: string | null
          parent_address: string
          parent_authority: string
          parent_email: string
          parent_first_name: string
          parent_last_name: string
          parent_mobile: string
          parent_office_phone?: string | null
          parent2_authority?: string | null
          parent2_email?: string | null
          parent2_first_name?: string | null
          parent2_last_name?: string | null
          parent2_mobile?: string | null
          parent2_office_phone?: string | null
          quotient_familial?: number | null
          sejour_attribue_1?: string | null
          sejour_attribue_2?: string | null
          sejour_preference_1?: string | null
          sejour_preference_1_alternatif?: string | null
          sejour_preference_2?: string | null
          sejour_preference_2_alternatif?: string | null
          social_security_regime: string
          status?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
          urgency_contact_1_first_name?: string | null
          urgency_contact_1_last_name?: string | null
          urgency_contact_1_mobile?: string | null
          urgency_contact_1_other_phone?: string | null
          urgency_contact_1_relation?: string | null
          urgency_contact_2_first_name?: string | null
          urgency_contact_2_last_name?: string | null
          urgency_contact_2_mobile?: string | null
          urgency_contact_2_other_phone?: string | null
          urgency_contact_2_relation?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          allergies_details?: string | null
          authorized_person_1_first_name?: string | null
          authorized_person_1_last_name?: string | null
          authorized_person_1_mobile?: string | null
          authorized_person_1_other_phone?: string | null
          authorized_person_1_relation?: string | null
          authorized_person_2_first_name?: string | null
          authorized_person_2_last_name?: string | null
          authorized_person_2_mobile?: string | null
          authorized_person_2_other_phone?: string | null
          authorized_person_2_relation?: string | null
          caf_number?: string | null
          child_age_group?: Database["public"]["Enums"]["age_group"] | null
          child_birth_date?: string
          child_class?: string
          child_first_name?: string
          child_gender?: string
          child_last_name?: string
          child_school?: string
          created_at?: string | null
          demande_specifique?: string | null
          food_allergies_details?: string | null
          has_allergies?: boolean | null
          has_medication?: boolean | null
          id?: string
          is_first_inscription?: boolean | null
          medication_details?: string | null
          nombre_semaines_demandees?: number | null
          paiement_date?: string | null
          paiement_statut?: string | null
          parent_address?: string
          parent_authority?: string
          parent_email?: string
          parent_first_name?: string
          parent_last_name?: string
          parent_mobile?: string
          parent_office_phone?: string | null
          parent2_authority?: string | null
          parent2_email?: string | null
          parent2_first_name?: string | null
          parent2_last_name?: string | null
          parent2_mobile?: string | null
          parent2_office_phone?: string | null
          quotient_familial?: number | null
          sejour_attribue_1?: string | null
          sejour_attribue_2?: string | null
          sejour_preference_1?: string | null
          sejour_preference_1_alternatif?: string | null
          sejour_preference_2?: string | null
          sejour_preference_2_alternatif?: string | null
          social_security_regime?: string
          status?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
          urgency_contact_1_first_name?: string | null
          urgency_contact_1_last_name?: string | null
          urgency_contact_1_mobile?: string | null
          urgency_contact_1_other_phone?: string | null
          urgency_contact_1_relation?: string | null
          urgency_contact_2_first_name?: string | null
          urgency_contact_2_last_name?: string | null
          urgency_contact_2_mobile?: string | null
          urgency_contact_2_other_phone?: string | null
          urgency_contact_2_relation?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_sejour_attribue_1_fkey"
            columns: ["sejour_attribue_1"]
            isOneToOne: false
            referencedRelation: "sejours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_sejour_attribue_2_fkey"
            columns: ["sejour_attribue_2"]
            isOneToOne: false
            referencedRelation: "sejours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_sejour_preference_1_fkey"
            columns: ["sejour_preference_1"]
            isOneToOne: false
            referencedRelation: "sejours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_sejour_preference_2_fkey"
            columns: ["sejour_preference_2"]
            isOneToOne: false
            referencedRelation: "sejours"
            referencedColumns: ["id"]
          },
        ]
      }
      sejours: {
        Row: {
          created_at: string | null
          date_debut: string
          date_fin: string
          groupe_age: Database["public"]["Enums"]["age_group"]
          id: string
          lieu: string | null
          places_disponibles: number
          titre: string
          type: string
        }
        Insert: {
          created_at?: string | null
          date_debut: string
          date_fin: string
          groupe_age: Database["public"]["Enums"]["age_group"]
          id?: string
          lieu?: string | null
          places_disponibles: number
          titre: string
          type: string
        }
        Update: {
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          groupe_age?: Database["public"]["Enums"]["age_group"]
          id?: string
          lieu?: string | null
          places_disponibles?: number
          titre?: string
          type?: string
        }
        Relationships: []
      }
      smtp_config: {
        Row: {
          created_at: string
          from_email: string
          host: string
          id: string
          password: string
          port: number
          tls: boolean
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          from_email: string
          host: string
          id?: string
          password: string
          port?: number
          tls?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          from_email?: string
          host?: string
          id?: string
          password?: string
          port?: number
          tls?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      tarifs: {
        Row: {
          annee: number
          created_at: string
          id: string
          qf_max: number | null
          qf_min: number
          tarif_journee_centre_aere: number
          tarif_journee_sejour: number
          tarif_numero: number
          tarif_semaine_centre_aere: number
          tarif_semaine_sejour: number
          updated_at: string
        }
        Insert: {
          annee?: number
          created_at?: string
          id?: string
          qf_max?: number | null
          qf_min: number
          tarif_journee_centre_aere: number
          tarif_journee_sejour: number
          tarif_numero: number
          tarif_semaine_centre_aere: number
          tarif_semaine_sejour: number
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          id?: string
          qf_max?: number | null
          qf_min?: number
          tarif_journee_centre_aere?: number
          tarif_journee_sejour?: number
          tarif_numero?: number
          tarif_semaine_centre_aere?: number
          tarif_semaine_sejour?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_age_group: {
        Args: { birth_date: string; class_level: string }
        Returns: Database["public"]["Enums"]["age_group"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      age_group: "pitchouns" | "minots" | "mias"
      app_role: "admin" | "user"
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
    Enums: {
      age_group: ["pitchouns", "minots", "mias"],
      app_role: ["admin", "user"],
    },
  },
} as const
