// ============================================================
// FICHIER GÉNÉRÉ AUTOMATIQUEMENT — NE PAS MODIFIER À LA MAIN
// Régénérer avec : npx supabase gen types typescript --project-id vjtyemgsttexjzkaqanu
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_company: boolean
          last_name: string | null
          notes: string | null
          organization_id: string
          payment_days: number
          phone: string | null
          postal_code: string | null
          siret: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_company?: boolean
          last_name?: string | null
          notes?: string | null
          organization_id: string
          payment_days?: number
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_company?: boolean
          last_name?: string | null
          notes?: string | null
          organization_id?: string
          payment_days?: number
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          position: number
          quantity: number
          title: string
          total_ht: number | null
          total_ttc: number | null
          total_vat: number | null
          unit: string | null
          unit_price_ht: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          position?: number
          quantity?: number
          title: string
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          title?: string
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "items_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: { last_number: number; organization_id: string; year: number }
        Insert: { last_number?: number; organization_id: string; year: number }
        Update: { last_number?: number; organization_id?: string; year?: number }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number
          client_id: string
          created_at: string
          deposit_amount: number
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          organization_id: string
          payment_terms: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string | null
          total_ht: number
          total_ttc: number
          total_vat: number
          updated_at: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number
          client_id: string
          created_at?: string
          deposit_amount?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          organization_id: string
          payment_terms?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subject?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number
          client_id?: string
          created_at?: string
          deposit_amount?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          organization_id?: string
          payment_terms?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subject?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      items_catalog: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          reference: string | null
          title: string
          unit: string | null
          unit_price_ht: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          reference?: string | null
          title: string
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          reference?: string | null
          title?: string
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bic: string | null
          city: string | null
          country: string | null
          created_at: string
          default_payment_days: number
          email: string | null
          iban: string | null
          id: string
          invoice_prefix: string
          late_penalty_flat: number | null
          late_penalty_rate: number | null
          legal_form: string | null
          legal_notice: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          postal_code: string | null
          quote_prefix: string
          siret: string | null
          updated_at: string
          website: string | null
          google_refresh_token: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_tier: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bic?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_payment_days?: number
          email?: string | null
          iban?: string | null
          id?: string
          invoice_prefix?: string
          late_penalty_flat?: number | null
          late_penalty_rate?: number | null
          legal_form?: string | null
          legal_notice?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          quote_prefix?: string
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
          google_refresh_token?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bic?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_payment_days?: number
          email?: string | null
          iban?: string | null
          id?: string
          invoice_prefix?: string
          late_penalty_flat?: number | null
          late_penalty_rate?: number | null
          legal_form?: string | null
          legal_notice?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          quote_prefix?: string
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
          google_refresh_token?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          payment_date: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id: string
          payment_date?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          payment_date?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          description: string | null
          id: string
          position: number
          quantity: number
          quote_id: string
          title: string
          total_ht: number | null
          total_ttc: number | null
          total_vat: number | null
          unit: string | null
          unit_price_ht: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          quantity?: number
          quote_id: string
          title: string
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          quantity?: number
          quote_id?: string
          title?: string
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          unit?: string | null
          unit_price_ht?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "items_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_sequences: {
        Row: { last_number: number; organization_id: string; year: number }
        Insert: { last_number?: number; organization_id: string; year: number }
        Update: { last_number?: number; organization_id?: string; year?: number }
        Relationships: [
          {
            foreignKeyName: "quote_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string
          converted_at: string | null
          converted_invoice_id: string | null
          created_at: string
          id: string
          issue_date: string
          notes: string | null
          number: string
          organization_id: string
          payment_days: number
          payment_terms: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subject: string | null
          total_ht: number
          total_ttc: number
          total_vat: number
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          client_id: string
          converted_at?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          organization_id: string
          payment_days?: number
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subject?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          client_id?: string
          converted_at?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          organization_id?: string
          payment_days?: number
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subject?: string | null
          total_ht?: number
          total_ttc?: number
          total_vat?: number
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_templates: {
        Row: {
          body: string
          created_at: string
          delay_days: number
          id: string
          is_default: boolean
          level: Database["public"]["Enums"]["reminder_level"]
          name: string
          organization_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          delay_days: number
          id?: string
          is_default?: boolean
          level: Database["public"]["Enums"]["reminder_level"]
          name: string
          organization_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          delay_days?: number
          id?: string
          is_default?: boolean
          level?: Database["public"]["Enums"]["reminder_level"]
          name?: string
          organization_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          body: string | null
          created_at: string
          id: string
          invoice_id: string
          level: Database["public"]["Enums"]["reminder_level"]
          notes: string | null
          organization_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          subject: string | null
          type: Database["public"]["Enums"]["reminder_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          level?: Database["public"]["Enums"]["reminder_level"]
          notes?: string | null
          organization_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          subject?: string | null
          type?: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          level?: Database["public"]["Enums"]["reminder_level"]
          notes?: string | null
          organization_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          subject?: string | null
          type?: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_quote_to_invoice: { Args: { p_quote_id: string }; Returns: string }
      generate_invoice_number: { Args: { p_org_id: string }; Returns: string }
      generate_quote_number: { Args: { p_org_id: string }; Returns: string }
      mark_overdue_invoices: { Args: Record<PropertyKey, never>; Returns: undefined }
      my_organization_id: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: {
      invoice_status: "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "canceled"
      payment_method: "bank_transfer" | "check" | "cash" | "card" | "direct_debit" | "other"
      quote_status: "draft" | "sent" | "accepted" | "rejected" | "expired"
      reminder_level: "level_1" | "level_2" | "level_3_formal"
      reminder_status: "scheduled" | "sent" | "canceled"
      reminder_type: "email" | "phone" | "mail"
      vat_rate: "0" | "5.5" | "10" | "20"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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

// Raccourcis pratiques pour les types les plus utilisés
export type DbClient = Tables<"clients">
export type DbQuote = Tables<"quotes">
export type DbQuoteItem = Tables<"quote_items">
export type DbInvoice = Tables<"invoices">
export type DbInvoiceItem = Tables<"invoice_items">
export type DbPayment = Tables<"payments">
export type DbReminder = Tables<"reminders">
export type DbReminderTemplate = Tables<"reminder_templates">
export type DbCatalogItem = Tables<"items_catalog">
export type DbOrganization = Tables<"organizations">
export type DbProfile = Tables<"profiles">

export type QuoteStatus = Database["public"]["Enums"]["quote_status"]
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"]
export type PaymentMethod = Database["public"]["Enums"]["payment_method"]
export type ReminderLevel = Database["public"]["Enums"]["reminder_level"]
export type ReminderType = Database["public"]["Enums"]["reminder_type"]
export type ReminderStatus = Database["public"]["Enums"]["reminder_status"]

export type QuoteWithItems = DbQuote & {
  items: DbQuoteItem[]
  client: DbClient
}

export type InvoiceWithItems = DbInvoice & {
  items: DbInvoiceItem[]
  client: DbClient
  payments: DbPayment[]
  reminders: DbReminder[]
}
