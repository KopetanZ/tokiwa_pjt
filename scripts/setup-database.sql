-- トキワシティ訓練所 データベースセットアップ
-- Supabase SQL Editor で実行してください

-- 1. 認証とユーザープロファイル
-- プロファイルテーブル（認証ユーザーの拡張情報）
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

-- 2. ポケモンテーブル
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

-- 3. 取引テーブル
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

-- 4. ゲーム進行状況テーブル  
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

-- 5. ゲームバランステーブル
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

-- 6. 研究プロジェクトテーブル
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

-- 7. AI分析テーブル
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

-- 8. 介入ログテーブル
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

-- 9. バックアップテーブル
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    backup_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- プロファイル用ポリシー
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 基本的なRLSポリシー（全テーブル共通パターン）
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['pokemon', 'trainers', 'expeditions', 'facilities', 'transactions', 'game_progress', 'game_balance', 'research_projects', 'ai_analysis', 'interventions', 'backups']) LOOP
        EXECUTE format('CREATE POLICY "Users can manage own %I" ON %I FOR ALL USING (auth.uid() = user_id)', table_name, table_name);
    END LOOP;
END $$;

-- プロファイル自動作成トリガー
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_pokemon_user_id ON pokemon(user_id);
CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_expeditions_user_id ON expeditions(user_id);
CREATE INDEX IF NOT EXISTS idx_facilities_user_id ON facilities(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON game_progress(user_id);

-- 完了メッセージ
SELECT 'データベースセットアップ完了！認証設定も確認してください。' AS message;