export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          guest_name: string
          school_name: string
          current_money: number
          total_reputation: number
          ui_theme: string
          settings: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guest_name: string
          school_name: string
          current_money?: number
          total_reputation?: number
          ui_theme?: string
          settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guest_name?: string
          school_name?: string
          current_money?: number
          total_reputation?: number
          ui_theme?: string
          settings?: Record<string, any> | null
          updated_at?: string
        }
      }
      trainer_jobs: {
        Row: {
          id: number
          job_name: string
          job_name_ja: string
          description: string | null
          max_level: number
          specializations: Record<string, number>
          unlock_cost: number
          sprite_path: string | null
          created_at: string
        }
        Insert: {
          id?: number
          job_name: string
          job_name_ja: string
          description?: string | null
          max_level?: number
          specializations: Record<string, number>
          unlock_cost?: number
          sprite_path?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          job_name?: string
          job_name_ja?: string
          description?: string | null
          max_level?: number
          specializations?: Record<string, number>
          unlock_cost?: number
          sprite_path?: string | null
        }
      }
      trainers: {
        Row: {
          id: string
          user_id: string
          name: string
          job_id: number | null
          job_level: number
          job_experience: number
          preferences: Record<string, number>
          compliance_rate: number
          trust_level: number
          personality: string
          status: string
          current_expedition_id: string | null
          salary: number
          total_earned: number
          sprite_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          job_id?: number | null
          job_level?: number
          job_experience?: number
          preferences?: Record<string, number>
          compliance_rate?: number
          trust_level?: number
          personality?: string
          status?: string
          current_expedition_id?: string | null
          salary?: number
          total_earned?: number
          sprite_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          job_id?: number | null
          job_level?: number
          job_experience?: number
          preferences?: Record<string, number>
          compliance_rate?: number
          trust_level?: number
          personality?: string
          status?: string
          current_expedition_id?: string | null
          salary?: number
          total_earned?: number
          sprite_path?: string | null
          updated_at?: string
        }
      }
      pokemon_species: {
        Row: {
          id: number
          name: string
          name_ja: string | null
          types: string[]
          base_stats: Record<string, number>
          height: number | null
          weight: number | null
          catch_rate: number
          rarity_tier: number
          sprite_front: string | null
          sprite_back: string | null
          sprite_icon: string | null
          sprite_retro: string | null
          pokeapi_url: string | null
          last_sync: string
          created_at: string
        }
        Insert: {
          id: number
          name: string
          name_ja?: string | null
          types: string[]
          base_stats: Record<string, number>
          height?: number | null
          weight?: number | null
          catch_rate?: number
          rarity_tier?: number
          sprite_front?: string | null
          sprite_back?: string | null
          sprite_icon?: string | null
          sprite_retro?: string | null
          pokeapi_url?: string | null
          last_sync?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          name_ja?: string | null
          types?: string[]
          base_stats?: Record<string, number>
          height?: number | null
          weight?: number | null
          catch_rate?: number
          rarity_tier?: number
          sprite_front?: string | null
          sprite_back?: string | null
          sprite_icon?: string | null
          sprite_retro?: string | null
          pokeapi_url?: string | null
          last_sync?: string
        }
      }
      pokemon_instances: {
        Row: {
          id: string
          user_id: string
          species_id: number
          trainer_id: string | null
          nickname: string | null
          level: number
          experience: number
          individual_values: Record<string, number>
          current_hp: number | null
          max_hp: number | null
          status_condition: string
          party_position: number | null
          moves: any[]
          caught_at: string
          caught_location: string | null
          caught_by_trainer: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          species_id: number
          trainer_id?: string | null
          nickname?: string | null
          level?: number
          experience?: number
          individual_values?: Record<string, number>
          current_hp?: number | null
          max_hp?: number | null
          status_condition?: string
          party_position?: number | null
          moves?: any[]
          caught_at?: string
          caught_location?: string | null
          caught_by_trainer?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          species_id?: number
          trainer_id?: string | null
          nickname?: string | null
          level?: number
          experience?: number
          individual_values?: Record<string, number>
          current_hp?: number | null
          max_hp?: number | null
          status_condition?: string
          party_position?: number | null
          moves?: any[]
          caught_location?: string | null
          caught_by_trainer?: string | null
          updated_at?: string
        }
      }
      expeditions: {
        Row: {
          id: string
          user_id: string
          trainer_id: string
          location_id: number
          expedition_mode: string
          target_duration_hours: number
          advice_given: Record<string, any>
          status: string
          started_at: string | null
          expected_return: string | null
          actual_return: string | null
          current_progress: number
          intervention_opportunities: any[]
          intervention_responses: Record<string, any>
          result_summary: Record<string, any>
          success_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trainer_id: string
          location_id: number
          expedition_mode?: string
          target_duration_hours: number
          advice_given?: Record<string, any>
          status?: string
          started_at?: string | null
          expected_return?: string | null
          actual_return?: string | null
          current_progress?: number
          intervention_opportunities?: any[]
          intervention_responses?: Record<string, any>
          result_summary?: Record<string, any>
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trainer_id?: string
          location_id?: number
          expedition_mode?: string
          target_duration_hours?: number
          advice_given?: Record<string, any>
          status?: string
          started_at?: string | null
          expected_return?: string | null
          actual_return?: string | null
          current_progress?: number
          intervention_opportunities?: any[]
          intervention_responses?: Record<string, any>
          result_summary?: Record<string, any>
          success_rate?: number | null
          updated_at?: string
        }
      }
      expedition_locations: {
        Row: {
          id: number
          location_name: string
          location_name_ja: string
          region: string
          distance_level: number
          travel_cost: number
          travel_time_hours: number
          risk_level: number
          base_reward_money: number
          reward_multiplier: number
          encounter_species: number[]
          encounter_rates: Record<string, number>
          background_image: string | null
          map_icon: string | null
          unlock_requirements: Record<string, any>
          is_unlocked_by_default: boolean
          created_at: string
        }
        Insert: {
          id?: number
          location_name: string
          location_name_ja: string
          region?: string
          distance_level: number
          travel_cost: number
          travel_time_hours: number
          risk_level?: number
          base_reward_money?: number
          reward_multiplier?: number
          encounter_species?: number[]
          encounter_rates?: Record<string, number>
          background_image?: string | null
          map_icon?: string | null
          unlock_requirements?: Record<string, any>
          is_unlocked_by_default?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          location_name?: string
          location_name_ja?: string
          region?: string
          distance_level?: number
          travel_cost?: number
          travel_time_hours?: number
          risk_level?: number
          base_reward_money?: number
          reward_multiplier?: number
          encounter_species?: number[]
          encounter_rates?: Record<string, number>
          background_image?: string | null
          map_icon?: string | null
          unlock_requirements?: Record<string, any>
          is_unlocked_by_default?: boolean
        }
      }
      facilities: {
        Row: {
          id: string
          user_id: string
          facility_type: string
          level: number
          max_level: number
          upgrade_cost: number
          effects: Record<string, number>
          maintenance_cost: number
          construction_cost: number
          sprite_path: string | null
          status: string
          construction_started: string | null
          construction_completed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          facility_type: string
          level?: number
          max_level?: number
          upgrade_cost: number
          effects?: Record<string, number>
          maintenance_cost?: number
          construction_cost: number
          sprite_path?: string | null
          status?: string
          construction_started?: string | null
          construction_completed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          facility_type?: string
          level?: number
          max_level?: number
          upgrade_cost?: number
          effects?: Record<string, number>
          maintenance_cost?: number
          construction_cost?: number
          sprite_path?: string | null
          status?: string
          construction_started?: string | null
          construction_completed?: string | null
          updated_at?: string
        }
      }
      economic_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          amount: number
          description: string | null
          related_expedition_id: string | null
          related_trainer_id: string | null
          related_facility_id: string | null
          balance_after: number
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          amount: number
          description?: string | null
          related_expedition_id?: string | null
          related_trainer_id?: string | null
          related_facility_id?: string | null
          balance_after: number
          transaction_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          amount?: number
          description?: string | null
          related_expedition_id?: string | null
          related_trainer_id?: string | null
          related_facility_id?: string | null
          balance_after?: number
          transaction_date?: string
        }
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
  }
}