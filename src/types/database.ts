export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          trainer_name: string
          school_name: string
          current_money: number
          total_reputation: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          trainer_name: string
          school_name: string
          current_money?: number
          total_reputation?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          trainer_name?: string
          school_name?: string
          current_money?: number
          total_reputation?: number
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
      pokemon: {
        Row: {
          id: string
          user_id: string
          dex_number: number
          name: string
          level: number
          hp: number
          attack: number
          defense: number
          special_attack: number
          special_defense: number
          speed: number
          types: string[]
          nature: string | null
          is_shiny: boolean
          ivs: Record<string, any>
          status: string
          friendship: number
          moves: string[]
          caught_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dex_number: number
          name: string
          level?: number
          hp: number
          attack: number
          defense: number
          special_attack: number
          special_defense: number
          speed: number
          types: string[]
          nature?: string | null
          is_shiny?: boolean
          ivs?: Record<string, any>
          status?: string
          friendship?: number
          moves?: string[]
          caught_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dex_number?: number
          name?: string
          level?: number
          hp?: number
          attack?: number
          defense?: number
          special_attack?: number
          special_defense?: number
          speed?: number
          types?: string[]
          nature?: string | null
          is_shiny?: boolean
          ivs?: Record<string, any>
          status?: string
          friendship?: number
          moves?: string[]
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
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          category: string
          amount: number
          description: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          category: string
          amount: number
          description: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          category?: string
          amount?: number
          description?: string
          reference_id?: string | null
        }
      }
      game_progress: {
        Row: {
          id: string
          user_id: string
          level: number
          experience: number
          next_level_exp: number
          total_play_time: number
          achievement_points: number
          unlocked_features: string[]
          difficulty: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level?: number
          experience?: number
          next_level_exp?: number
          total_play_time?: number
          achievement_points?: number
          unlocked_features?: string[]
          difficulty?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: number
          experience?: number
          next_level_exp?: number
          total_play_time?: number
          achievement_points?: number
          unlocked_features?: string[]
          difficulty?: string
          updated_at?: string
        }
      }
      game_balance: {
        Row: {
          id: string
          user_id: string
          trainer_growth_rate: number
          pokemon_growth_rate: number
          expedition_difficulty: number
          economy_inflation: number
          research_speed: number
          facility_efficiency: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trainer_growth_rate?: number
          pokemon_growth_rate?: number
          expedition_difficulty?: number
          economy_inflation?: number
          research_speed?: number
          facility_efficiency?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trainer_growth_rate?: number
          pokemon_growth_rate?: number
          expedition_difficulty?: number
          economy_inflation?: number
          research_speed?: number
          facility_efficiency?: number
          updated_at?: string
        }
      }
      research_projects: {
        Row: {
          id: string
          user_id: string
          project_id: string
          research_points: number
          status: string
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          research_points?: number
          status?: string
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          research_points?: number
          status?: string
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      ai_analysis: {
        Row: {
          id: string
          user_id: string
          analysis_type: string
          game_level: number
          efficiency_score: number
          profit_score: number
          recommendations: string[]
          predicted_outcomes: Record<string, any>
          optimization_suggestions: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_type: string
          game_level: number
          efficiency_score: number
          profit_score: number
          recommendations?: string[]
          predicted_outcomes?: Record<string, any>
          optimization_suggestions?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_type?: string
          game_level?: number
          efficiency_score?: number
          profit_score?: number
          recommendations?: string[]
          predicted_outcomes?: Record<string, any>
          optimization_suggestions?: Record<string, any>
        }
      }
      interventions: {
        Row: {
          id: string
          user_id: string
          expedition_id: string
          event_type: string
          decision: string
          outcome: string
          rewards: Record<string, any>
          resolved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expedition_id: string
          event_type: string
          decision: string
          outcome: string
          rewards?: Record<string, any>
          resolved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expedition_id?: string
          event_type?: string
          decision?: string
          outcome?: string
          rewards?: Record<string, any>
          resolved_at?: string
        }
      }
      backups: {
        Row: {
          id: string
          user_id: string
          backup_data: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          backup_data: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          backup_data?: Record<string, any>
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