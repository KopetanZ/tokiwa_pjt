-- トキワシティ訓練所 データベースセットアップ
-- 実行用スクリプト（即座に実行可能バージョン）

-- 存在しないテーブルのみを作成

-- 1. プロファイルテーブル（認証ユーザーの拡張情報）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    trainer_name TEXT NOT NULL,
    school_name TEXT NOT NULL,
    current_money BIGINT DEFAULT 50000,
    total_reputation INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. トレーナー職業定義テーブル
CREATE TABLE IF NOT EXISTS trainer_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(50) NOT NULL,
    job_name_ja VARCHAR(50) NOT NULL,
    description TEXT,
    max_level INTEGER DEFAULT 10,
    specializations JSONB NOT NULL,
    unlock_cost INTEGER DEFAULT 0,
    sprite_path VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_name)
);

-- 3. トレーナーテーブル
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    job_id INTEGER REFERENCES trainer_jobs(id),
    job_level INTEGER DEFAULT 1,
    job_experience INTEGER DEFAULT 0,
    
    -- 嗜好システム
    preferences JSONB NOT NULL DEFAULT '{}',
    compliance_rate INTEGER DEFAULT 50,
    trust_level INTEGER DEFAULT 0,
    personality VARCHAR(50) DEFAULT 'balanced',
    
    -- 派遣状態
    status VARCHAR(20) DEFAULT 'available',
    current_expedition_id UUID,
    
    -- 経済
    salary INTEGER NOT NULL DEFAULT 3000,
    total_earned INTEGER DEFAULT 0,
    
    sprite_path VARCHAR(200),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 派遣先定義テーブル
CREATE TABLE IF NOT EXISTS expedition_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL,
    location_name_ja VARCHAR(100) NOT NULL,
    region VARCHAR(50) DEFAULT 'kanto',
    
    distance_level INTEGER NOT NULL,
    travel_cost INTEGER NOT NULL,
    travel_time_hours INTEGER NOT NULL,
    risk_level DECIMAL(3,2) DEFAULT 1.0,
    
    base_reward_money INTEGER DEFAULT 1000,
    reward_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    encounter_species INTEGER[] DEFAULT '{}',
    encounter_rates JSONB DEFAULT '{}',
    
    background_image VARCHAR(200),
    map_icon VARCHAR(200),
    
    unlock_requirements JSONB DEFAULT '{}',
    is_unlocked_by_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_name)
);

-- 5. 派遣履歴・進行中テーブル
CREATE TABLE IF NOT EXISTS expeditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES expedition_locations(id),
    
    expedition_mode VARCHAR(20) DEFAULT 'balanced',
    target_duration_hours INTEGER NOT NULL,
    advice_given JSONB DEFAULT '{}',
    
    status VARCHAR(20) DEFAULT 'preparing',
    started_at TIMESTAMPTZ,
    expected_return TIMESTAMPTZ,
    actual_return TIMESTAMPTZ,
    current_progress DECIMAL(3,2) DEFAULT 0.0,
    
    intervention_opportunities JSONB DEFAULT '[]',
    intervention_responses JSONB DEFAULT '{}',
    
    result_summary JSONB DEFAULT '{}',
    success_rate DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 施設管理テーブル
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_type VARCHAR(50) NOT NULL,
    
    level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 5,
    upgrade_cost INTEGER NOT NULL,
    
    effects JSONB NOT NULL DEFAULT '{}',
    
    maintenance_cost INTEGER DEFAULT 0,
    construction_cost INTEGER NOT NULL,
    
    sprite_path VARCHAR(200),
    
    status VARCHAR(20) DEFAULT 'active',
    construction_started TIMESTAMPTZ,
    construction_completed TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ポケモンテーブル
CREATE TABLE IF NOT EXISTS pokemon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dex_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    special_attack INTEGER NOT NULL,
    special_defense INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    types TEXT[] NOT NULL,
    nature TEXT,
    is_shiny BOOLEAN DEFAULT FALSE,
    ivs JSONB DEFAULT '{}',
    status TEXT DEFAULT 'available',
    friendship INTEGER DEFAULT 70,
    moves TEXT[] DEFAULT '{}',
    caught_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 取引テーブル
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ゲーム進行状況テーブル  
CREATE TABLE IF NOT EXISTS game_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    experience BIGINT DEFAULT 0,
    next_level_exp BIGINT DEFAULT 1000,
    total_play_time INTEGER DEFAULT 0, -- 分
    achievement_points INTEGER DEFAULT 0,
    unlocked_features TEXT[] DEFAULT '{"basic_training", "pokemon_management", "simple_expeditions"}',
    difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard', 'expert')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ゲームバランステーブル
CREATE TABLE IF NOT EXISTS game_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    trainer_growth_rate DECIMAL DEFAULT 1.0,
    pokemon_growth_rate DECIMAL DEFAULT 1.0,
    expedition_difficulty DECIMAL DEFAULT 1.0,
    economy_inflation DECIMAL DEFAULT 1.0,
    research_speed DECIMAL DEFAULT 1.0,
    facility_efficiency DECIMAL DEFAULT 1.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 研究プロジェクトテーブル
CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id TEXT NOT NULL,
    research_points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'researching', 'completed', 'locked')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- 12. AI分析テーブル
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_type TEXT NOT NULL,
    game_level INTEGER NOT NULL,
    efficiency_score DECIMAL NOT NULL,
    profit_score BIGINT NOT NULL,
    recommendations TEXT[] DEFAULT '{}',
    predicted_outcomes JSONB DEFAULT '{}',
    optimization_suggestions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 介入ログテーブル
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    expedition_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    decision TEXT NOT NULL,
    outcome TEXT NOT NULL,
    rewards JSONB DEFAULT '{}',
    resolved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. バックアップテーブル
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    backup_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データの挿入（重複回避）
INSERT INTO trainer_jobs (job_name, job_name_ja, specializations, sprite_path) 
SELECT * FROM (VALUES
    ('ranger', 'レンジャー', '{"capture": 1.25, "exploration": 1.15, "battle": 0.95}'::jsonb, '/sprites/jobs/ranger.png'),
    ('breeder', 'ブリーダー', '{"breeding": 1.30, "healing": 1.20, "capture": 1.05}'::jsonb, '/sprites/jobs/breeder.png'),
    ('battler', 'バトラー', '{"battle": 1.25, "strategy": 1.15, "capture": 0.90}'::jsonb, '/sprites/jobs/battler.png'),
    ('researcher', 'リサーチャー', '{"discovery": 1.25, "rare_find": 1.30, "analysis": 1.20}'::jsonb, '/sprites/jobs/researcher.png'),
    ('medic', 'メディック', '{"healing": 1.35, "safety": 1.25, "emergency": 1.40}'::jsonb, '/sprites/jobs/medic.png')
) AS v(job_name, job_name_ja, specializations, sprite_path)
WHERE NOT EXISTS (SELECT 1 FROM trainer_jobs WHERE job_name = v.job_name);

INSERT INTO expedition_locations (location_name, location_name_ja, distance_level, travel_cost, travel_time_hours, is_unlocked_by_default)
SELECT * FROM (VALUES
    ('viridian_forest', 'トキワの森', 1, 500, 2, true),
    ('route_22', '22番道路', 1, 300, 1, true),
    ('pewter_gym', 'ニビジム', 2, 1200, 4, false),
    ('mt_moon', 'お月見山', 3, 2000, 8, false),
    ('cerulean_cave', 'ハナダの洞窟', 5, 5000, 24, false)
) AS v(location_name, location_name_ja, distance_level, travel_cost, travel_time_hours, is_unlocked_by_default)
WHERE NOT EXISTS (SELECT 1 FROM expedition_locations WHERE location_name = v.location_name);

-- Row Level Security (RLS) ポリシー設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- プロファイル用ポリシー（重複回避）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 基本的なRLSポリシー（重複回避）
DO $$
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['pokemon', 'trainers', 'expeditions', 'facilities', 'transactions', 'game_progress', 'game_balance', 'research_projects', 'ai_analysis', 'interventions', 'backups']) LOOP
        policy_name := format('Users can manage own %s', table_name);
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "%s" ON %I', policy_name, table_name);
            EXECUTE format('CREATE POLICY "%s" ON %I FOR ALL USING (auth.uid() = user_id)', policy_name, table_name);
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Policy creation failed for table %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- プロファイル自動作成トリガー（重複回避）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, trainer_name, school_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'trainer_name', 'トレーナー'),
        COALESCE(NEW.raw_user_meta_data->>'school_name', 'ポケモンスクール')
    );
    
    INSERT INTO game_progress (user_id)
    VALUES (NEW.id);
    
    INSERT INTO game_balance (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー設定
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- インデックス作成（重複回避）
CREATE INDEX IF NOT EXISTS idx_pokemon_user_id ON pokemon(user_id);
CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_expeditions_user_id ON expeditions(user_id);
CREATE INDEX IF NOT EXISTS idx_facilities_user_id ON facilities(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON game_progress(user_id);

-- 完了メッセージ
SELECT 'データベースセットアップ完了！' AS setup_result;