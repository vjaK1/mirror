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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          apy: number | null
          created_at: string
          currency: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          apy?: number | null
          created_at?: string
          currency?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          apy?: number | null
          created_at?: string
          currency?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      balance_events: {
        Row: {
          account_id: string
          balance: number
          created_at: string
          id: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          balance: number
          created_at?: string
          id?: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          balance?: number
          created_at?: string
          id?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_phases: {
        Row: {
          carbs_target_g: number
          created_at: string
          end_date: string | null
          fat_target_g: number
          fibre_target_g: number
          id: string
          kcal_target: number
          phase: string
          protein_target_g: number
          start_date: string
          user_id: string
        }
        Insert: {
          carbs_target_g: number
          created_at?: string
          end_date?: string | null
          fat_target_g: number
          fibre_target_g: number
          id?: string
          kcal_target: number
          phase: string
          protein_target_g: number
          start_date?: string
          user_id: string
        }
        Update: {
          carbs_target_g?: number
          created_at?: string
          end_date?: string | null
          fat_target_g?: number
          fibre_target_g?: number
          id?: string
          kcal_target?: number
          phase?: string
          protein_target_g?: number
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          id: string
          is_custom: boolean
          muscle_group: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_custom?: boolean
          muscle_group: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_custom?: boolean
          muscle_group?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          carbs_g: number
          created_at: string
          fat_g: number
          fibre_g: number
          food_id: string | null
          grams: number | null
          id: string
          kcal: number
          logged_at: string
          micros: Json
          protein_g: number
          raw_text: string | null
          source: string
          user_id: string
        }
        Insert: {
          carbs_g: number
          created_at?: string
          fat_g: number
          fibre_g?: number
          food_id?: string | null
          grams?: number | null
          id?: string
          kcal: number
          logged_at?: string
          micros?: Json
          protein_g: number
          raw_text?: string | null
          source: string
          user_id: string
        }
        Update: {
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fibre_g?: number
          food_id?: string | null
          grams?: number | null
          id?: string
          kcal?: number
          logged_at?: string
          micros?: Json
          protein_g?: number
          raw_text?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          brand: string | null
          calcium_mg: number | null
          carbs_g: number
          created_at: string
          fat_g: number
          fibre_g: number
          id: string
          iron_mg: number | null
          kcal: number
          name: string
          portion_grams: number | null
          portion_name: string | null
          potassium_mg: number | null
          protein_g: number
          sodium_mg: number | null
          source: string
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          calcium_mg?: number | null
          carbs_g: number
          created_at?: string
          fat_g: number
          fibre_g?: number
          id?: string
          iron_mg?: number | null
          kcal: number
          name: string
          portion_grams?: number | null
          portion_name?: string | null
          potassium_mg?: number | null
          protein_g: number
          sodium_mg?: number | null
          source: string
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          calcium_mg?: number | null
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fibre_g?: number
          id?: string
          iron_mg?: number | null
          kcal?: number
          name?: string
          portion_grams?: number | null
          portion_name?: string | null
          potassium_mg?: number | null
          protein_g?: number
          sodium_mg?: number | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fx_snapshots: {
        Row: {
          created_at: string
          date: string
          id: string
          pair: string
          rate: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          pair?: string
          rate: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          pair?: string
          rate?: number
        }
        Relationships: []
      }
      holdings: {
        Row: {
          created_at: string
          currency: string
          id: string
          shares: number
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          shares: number
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          shares?: number
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      income_events: {
        Row: {
          amount: number
          created_at: string
          currency: string
          from_recurring: boolean
          id: string
          received_at: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          from_recurring?: boolean
          id?: string
          received_at?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          from_recurring?: boolean
          id?: string
          received_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      price_snapshots: {
        Row: {
          close_price: number
          created_at: string
          currency: string
          date: string
          id: string
          symbol: string
        }
        Insert: {
          close_price: number
          created_at?: string
          currency?: string
          date: string
          id?: string
          symbol: string
        }
        Update: {
          close_price?: number
          created_at?: string
          currency?: string
          date?: string
          id?: string
          symbol?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          created_at: string
          height_cm: number | null
          id: string
          user_id: string
          weekly_session_target: number
        }
        Insert: {
          created_at?: string
          height_cm?: number | null
          id?: string
          user_id: string
          weekly_session_target?: number
        }
        Update: {
          created_at?: string
          height_cm?: number | null
          id?: string
          user_id?: string
          weekly_session_target?: number
        }
        Relationships: []
      }
      recurring_income: {
        Row: {
          amount: number
          cadence: string
          created_at: string
          currency: string
          id: string
          next_date: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          cadence: string
          created_at?: string
          currency?: string
          id?: string
          next_date: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          cadence?: string
          created_at?: string
          currency?: string
          id?: string
          next_date?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          created_at: string
          id: string
          items: Json
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          reps: number
          rpe: number | null
          session_id: string
          set_number: number
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          reps: number
          rpe?: number | null
          session_id: string
          set_number: number
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          reps?: number
          rpe?: number | null
          session_id?: string
          set_number?: number
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      weigh_ins: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          session_type: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          session_type: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          session_type?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      macros_daily: {
        Row: {
          carbs_g: number | null
          day: string | null
          entries: number | null
          fat_g: number | null
          fibre_g: number | null
          kcal: number | null
          protein_g: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      logical_day: { Args: { ts: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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

export type FoodRow = Database["public"]["Tables"]["foods"]["Row"]
export type FoodLogRow = Database["public"]["Tables"]["food_logs"]["Row"]
export type FoodLogInsert = Database["public"]["Tables"]["food_logs"]["Insert"]
export type SavedMealRow = Database["public"]["Tables"]["saved_meals"]["Row"]
export type DietPhaseRow = Database["public"]["Tables"]["diet_phases"]["Row"]
export type WeighInRow = Database["public"]["Tables"]["weigh_ins"]["Row"]
export type MacrosDailyRow = Database["public"]["Views"]["macros_daily"]["Row"]
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"]
export type WorkoutSessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"]
export type SetRow = Database["public"]["Tables"]["sets"]["Row"]
export type SetInsert = Database["public"]["Tables"]["sets"]["Insert"]
export type ProfileRow = Database["public"]["Tables"]["profile"]["Row"]
export type AccountRow = Database["public"]["Tables"]["accounts"]["Row"]
export type BalanceEventRow = Database["public"]["Tables"]["balance_events"]["Row"]
export type IncomeEventRow = Database["public"]["Tables"]["income_events"]["Row"]
export type RecurringIncomeRow = Database["public"]["Tables"]["recurring_income"]["Row"]
export type HoldingRow = Database["public"]["Tables"]["holdings"]["Row"]
export type PriceSnapshotRow = Database["public"]["Tables"]["price_snapshots"]["Row"]
export type FxSnapshotRow = Database["public"]["Tables"]["fx_snapshots"]["Row"]
