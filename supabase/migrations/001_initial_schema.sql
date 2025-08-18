-- ユーザー管理テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name VARCHAR(50) NOT NULL,
  school_name VARCHAR(100) NOT NULL,
  current_money INTEGER DEFAULT 50000,
  total_reputation INTEGER DEFAULT 0,
  ui_theme VARCHAR(20) DEFAULT 'gameboy_green',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (id = auth.uid());

-- トレーナー職業定義テーブル
CREATE TABLE trainer_jobs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(50) UNIQUE NOT NULL,
  job_name_ja VARCHAR(50) NOT NULL,
  description TEXT,
  max_level INTEGER DEFAULT 10,
  specializations JSONB NOT NULL,
  unlock_cost INTEGER DEFAULT 0,
  sprite_path VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期トレーナー職業データ
INSERT INTO trainer_jobs (job_name, job_name_ja, specializations, sprite_path) VALUES
('ranger', 'レンジャー', '{"capture": 1.25, "exploration": 1.15, "battle": 0.95}', '/sprites/jobs/ranger.png'),
('breeder', 'ブリーダー', '{"breeding": 1.30, "healing": 1.20, "capture": 1.05}', '/sprites/jobs/breeder.png'),
('battler', 'バトラー', '{"battle": 1.25, "strategy": 1.15, "capture": 0.90}', '/sprites/jobs/battler.png'),
('researcher', 'リサーチャー', '{"discovery": 1.25, "rare_find": 1.30, "analysis": 1.20}', '/sprites/jobs/researcher.png'),
('medic', 'メディック', '{"healing": 1.35, "safety": 1.25, "emergency": 1.40}', '/sprites/jobs/medic.png');

-- トレーナーテーブル
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_status ON trainers(status);

-- RLS Policy for trainers
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own trainers" ON trainers
  FOR ALL USING (user_id = auth.uid());

-- ポケモン種族テーブル（PokeAPI同期データ）
CREATE TABLE pokemon_species (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_ja VARCHAR(50),
  types TEXT[] NOT NULL,
  base_stats JSONB NOT NULL,
  height INTEGER,
  weight INTEGER,
  catch_rate INTEGER DEFAULT 45,
  rarity_tier INTEGER DEFAULT 1,
  
  -- ドット絵アセット
  sprite_front VARCHAR(200),
  sprite_back VARCHAR(200),
  sprite_icon VARCHAR(200),
  sprite_retro VARCHAR(200),
  
  pokeapi_url VARCHAR(200),
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pokemon_species_types ON pokemon_species USING GIN(types);
CREATE INDEX idx_pokemon_species_rarity ON pokemon_species(rarity_tier);

-- 公開読み取り可能
ALTER TABLE pokemon_species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON pokemon_species FOR SELECT USING (true);

-- ポケモン個体テーブル
CREATE TABLE pokemon_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  species_id INTEGER REFERENCES pokemon_species(id),
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  
  nickname VARCHAR(50),
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  individual_values JSONB DEFAULT '{}',
  
  current_hp INTEGER,
  max_hp INTEGER,
  status_condition VARCHAR(20) DEFAULT 'healthy',
  
  party_position INTEGER CHECK (party_position BETWEEN 1 AND 6),
  
  moves JSONB DEFAULT '[]',
  
  caught_at TIMESTAMPTZ DEFAULT NOW(),
  caught_location VARCHAR(100),
  caught_by_trainer UUID REFERENCES trainers(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pokemon_instances_user ON pokemon_instances(user_id);
CREATE INDEX idx_pokemon_instances_trainer ON pokemon_instances(trainer_id);
CREATE INDEX idx_pokemon_instances_party ON pokemon_instances(trainer_id, party_position);

-- RLS Policy for pokemon_instances
ALTER TABLE pokemon_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own pokemon" ON pokemon_instances
  FOR ALL USING (user_id = auth.uid());

-- 派遣先定義テーブル
CREATE TABLE expedition_locations (
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
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期派遣先データ
INSERT INTO expedition_locations (location_name, location_name_ja, distance_level, travel_cost, travel_time_hours, is_unlocked_by_default) VALUES
('viridian_forest', 'トキワの森', 1, 500, 2, true),
('route_22', '22番道路', 1, 300, 1, true),
('pewter_gym', 'ニビジム', 2, 1200, 4, false),
('mt_moon', 'お月見山', 3, 2000, 8, false),
('cerulean_cave', 'ハナダの洞窟', 5, 5000, 24, false);

-- 公開読み取り可能
ALTER TABLE expedition_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON expedition_locations FOR SELECT USING (true);

-- 派遣履歴・進行中テーブル
CREATE TABLE expeditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_expeditions_user ON expeditions(user_id);
CREATE INDEX idx_expeditions_trainer ON expeditions(trainer_id);
CREATE INDEX idx_expeditions_status ON expeditions(status);
CREATE INDEX idx_expeditions_active ON expeditions(status) WHERE status = 'active';

-- RLS Policy for expeditions
ALTER TABLE expeditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own expeditions" ON expeditions
  FOR ALL USING (user_id = auth.uid());

-- 施設管理テーブル
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_facilities_user ON facilities(user_id);
CREATE INDEX idx_facilities_type ON facilities(facility_type);

-- RLS Policy for facilities
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own facilities" ON facilities
  FOR ALL USING (user_id = auth.uid());

-- 経済取引テーブル
CREATE TABLE economic_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(30) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  
  related_expedition_id UUID REFERENCES expeditions(id),
  related_trainer_id UUID REFERENCES trainers(id),
  related_facility_id UUID REFERENCES facilities(id),
  
  balance_after INTEGER NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON economic_transactions(user_id);
CREATE INDEX idx_transactions_type ON economic_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON economic_transactions(transaction_date);

-- RLS Policy for economic_transactions
ALTER TABLE economic_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own transactions" ON economic_transactions
  FOR ALL USING (user_id = auth.uid());

-- 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時トリガーの設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pokemon_instances_updated_at BEFORE UPDATE ON pokemon_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expeditions_updated_at BEFORE UPDATE ON expeditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();