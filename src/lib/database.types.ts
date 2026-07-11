// Database types matching supabase/migrations. Hand-authored to unblock the
// build; regenerated via `supabase gen types typescript` once the migration
// is applied remotely (Session 2 verification step).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      foods: {
        Row: {
          id: string
          user_id: string | null
          created_at: string
          name: string
          brand: string | null
          source: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fibre_g: number
          sodium_mg: number | null
          potassium_mg: number | null
          iron_mg: number | null
          calcium_mg: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          created_at?: string
          name: string
          brand?: string | null
          source: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fibre_g?: number
          sodium_mg?: number | null
          potassium_mg?: number | null
          iron_mg?: number | null
          calcium_mg?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["foods"]["Insert"]>
        Relationships: []
      }
      saved_meals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          items: Json
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          items: Json
        }
        Update: Partial<Database["public"]["Tables"]["saved_meals"]["Insert"]>
        Relationships: []
      }
      food_logs: {
        Row: {
          id: string
          user_id: string
          created_at: string
          logged_at: string
          food_id: string | null
          grams: number | null
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fibre_g: number
          micros: Json
          source: string
          raw_text: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          logged_at?: string
          food_id?: string | null
          grams?: number | null
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fibre_g?: number
          micros?: Json
          source: string
          raw_text?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["food_logs"]["Insert"]>
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
      diet_phases: {
        Row: {
          id: string
          user_id: string
          created_at: string
          phase: string
          start_date: string
          end_date: string | null
          kcal_target: number
          protein_target_g: number
          carbs_target_g: number
          fat_target_g: number
          fibre_target_g: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          phase: string
          start_date?: string
          end_date?: string | null
          kcal_target: number
          protein_target_g: number
          carbs_target_g: number
          fat_target_g: number
          fibre_target_g: number
        }
        Update: Partial<Database["public"]["Tables"]["diet_phases"]["Insert"]>
        Relationships: []
      }
      weigh_ins: {
        Row: {
          id: string
          user_id: string
          created_at: string
          measured_at: string
          weight_kg: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          measured_at?: string
          weight_kg: number
        }
        Update: Partial<Database["public"]["Tables"]["weigh_ins"]["Insert"]>
        Relationships: []
      }
      profile: {
        Row: {
          id: string
          user_id: string
          created_at: string
          height_cm: number | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          height_cm?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["profile"]["Insert"]>
        Relationships: []
      }
    }
    Views: {
      macros_daily: {
        Row: {
          user_id: string | null
          day: string | null
          kcal: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          fibre_g: number | null
          entries: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      logical_day: {
        Args: { ts: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type FoodRow = Database["public"]["Tables"]["foods"]["Row"]
export type FoodLogRow = Database["public"]["Tables"]["food_logs"]["Row"]
export type FoodLogInsert = Database["public"]["Tables"]["food_logs"]["Insert"]
export type SavedMealRow = Database["public"]["Tables"]["saved_meals"]["Row"]
export type DietPhaseRow = Database["public"]["Tables"]["diet_phases"]["Row"]
export type WeighInRow = Database["public"]["Tables"]["weigh_ins"]["Row"]
export type MacrosDailyRow = Database["public"]["Views"]["macros_daily"]["Row"]
