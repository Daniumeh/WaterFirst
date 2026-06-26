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
      challenges: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          slug: string
          target_days: number
          target_ml_per_day: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          slug: string
          target_days?: number
          target_ml_per_day?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          slug?: string
          target_days?: number
          target_ml_per_day?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          completed_goal: boolean
          compliance_score: number
          consumed_ml: number
          created_at: string
          drink_count: number
          id: string
          insights: string[]
          streak_day_count: number
          summary_date: string
          target_ml: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_goal?: boolean
          compliance_score?: number
          consumed_ml?: number
          created_at?: string
          drink_count?: number
          id?: string
          insights?: string[]
          streak_day_count?: number
          summary_date: string
          target_ml?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_goal?: boolean
          compliance_score?: number
          consumed_ml?: number
          created_at?: string
          drink_count?: number
          id?: string
          insights?: string[]
          streak_day_count?: number
          summary_date?: string
          target_ml?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hydration_checkpoints: {
        Row: {
          created_at: string
          due_minutes: number
          due_on: string
          goal_id: string
          id: string
          status: string
          target_ml: number
          time_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_minutes: number
          due_on?: string
          goal_id: string
          id?: string
          status?: string
          target_ml: number
          time_label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_minutes?: number
          due_on?: string
          goal_id?: string
          id?: string
          status?: string
          target_ml?: number
          time_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hydration_checkpoints_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "hydration_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_goals: {
        Row: {
          active_on: string
          created_at: string
          id: string
          is_active: boolean
          manual_override_ml: number | null
          target_ml: number
          unit_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_on?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manual_override_ml?: number | null
          target_ml: number
          unit_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_on?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manual_override_ml?: number | null
          target_ml?: number
          unit_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_description: string
          activity_level: string
          climate: string
          created_at: string
          display_name: string
          email: string
          first_name: string
          id: string
          last_name: string
          notification_consent: boolean
          onboarding_complete: boolean
          sleep_time: string
          soft_lock_consent: boolean
          unit_preference: string
          updated_at: string
          wake_time: string
          weight: number
        }
        Insert: {
          activity_description?: string
          activity_level?: string
          climate?: string
          created_at?: string
          display_name?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          notification_consent?: boolean
          onboarding_complete?: boolean
          sleep_time?: string
          soft_lock_consent?: boolean
          unit_preference?: string
          updated_at?: string
          wake_time?: string
          weight?: number
        }
        Update: {
          activity_description?: string
          activity_level?: string
          climate?: string
          created_at?: string
          display_name?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notification_consent?: boolean
          onboarding_complete?: boolean
          sleep_time?: string
          soft_lock_consent?: boolean
          unit_preference?: string
          updated_at?: string
          wake_time?: string
          weight?: number
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          active_end: string
          active_start: string
          created_at: string
          enabled: boolean
          notification_permission_status: string
          paused_until: string | null
          snooze_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_end?: string
          active_start?: string
          created_at?: string
          enabled?: boolean
          notification_permission_status?: string
          paused_until?: string | null
          snooze_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_end?: string
          active_start?: string
          created_at?: string
          enabled?: boolean
          notification_permission_status?: string
          paused_until?: string | null
          snooze_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soft_lock_events: {
        Row: {
          action_amount_ml: number | null
          checkpoint_id: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          user_id: string
        }
        Insert: {
          action_amount_ml?: number | null
          checkpoint_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          user_id: string
        }
        Update: {
          action_amount_ml?: number | null
          checkpoint_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soft_lock_events_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "hydration_checkpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      soft_lock_settings: {
        Row: {
          compliance_score: number
          consent_given: boolean
          created_at: string
          enabled: boolean
          next_enforcement_at: string | null
          override_count: number
          snoozed_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compliance_score?: number
          consent_given?: boolean
          created_at?: string
          enabled?: boolean
          next_enforcement_at?: string | null
          override_count?: number
          snoozed_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compliance_score?: number
          consent_given?: boolean
          created_at?: string
          enabled?: boolean
          next_enforcement_at?: string | null
          override_count?: number
          snoozed_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_streak: number
          joined_at: string
          progress_days: number
          status: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_streak?: number
          joined_at?: string
          progress_days?: number
          status?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_streak?: number
          joined_at?: string
          progress_days?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_at: string
          notes: string | null
          source: string
          unit: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          source?: string
          unit?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          source?: string
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
