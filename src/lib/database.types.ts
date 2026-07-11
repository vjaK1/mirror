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
          potassium_mg?: number | null
          protein_g?: number
          sodium_mg?: number | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          created_at: string
          height_cm: number | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          height_cm?: number | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          height_cm?: number | null
          id?: string
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
