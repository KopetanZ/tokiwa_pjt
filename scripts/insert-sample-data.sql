-- トキワシティ訓練所: サンプルデータ投入スクリプト
-- ユーザーID: e5651d93-2721-461f-b42a-3d6ba1a6944c

-- 1. ポケモンデータ
INSERT INTO pokemon (
  id, user_id, dex_number, name, level, hp, attack, defense, 
  special_attack, special_defense, speed, types, nature, 
  is_shiny, ivs, status, caught_at, created_at
) VALUES 
(
  'pokemon_pikachu_001',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  25, 'ピカチュウ', 15, 60, 55, 40, 50, 50, 90,
  '["electric"]'::jsonb,
  'がんばりや', false,
  '{"hp": 25, "attack": 20, "defense": 15, "specialAttack": 25, "specialDefense": 20, "speed": 31}'::jsonb,
  'available',
  '2024-01-15T10:30:00Z',
  NOW()
),
(
  'pokemon_charmander_002', 
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  4, 'ヒトカゲ', 12, 48, 52, 43, 60, 50, 65,
  '["fire"]'::jsonb,
  'ようき', false,
  '{"hp": 28, "attack": 30, "defense": 18, "specialAttack": 22, "specialDefense": 15, "speed": 25}'::jsonb,
  'available',
  '2024-01-20T14:15:00Z',
  NOW()
),
(
  'pokemon_squirtle_003',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c', 
  7, 'ゼニガメ', 18, 65, 48, 65, 50, 64, 43,
  '["water"]'::jsonb,
  'ひかえめ', false,
  '{"hp": 22, "attack": 15, "defense": 28, "specialAttack": 30, "specialDefense": 25, "speed": 20}'::jsonb,
  'available',
  '2024-01-25T09:45:00Z',
  NOW()
);

-- 2. トレーナーデータ
INSERT INTO trainers (
  id, user_id, name, level, experience, specialty, status,
  efficiency, salary, hired_at, created_at
) VALUES
(
  'trainer_akira_001',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'アキラ', 8, 2100, 'レンジャー', 'available',
  1.2, 3600, '2024-01-10T08:00:00Z', NOW()
),
(
  'trainer_misaki_002',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'ミサキ', 12, 3800, 'リサーチャー', 'available', 
  1.35, 4200, '2024-01-12T09:30:00Z', NOW()
),
(
  'trainer_hiroshi_003',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'ヒロシ', 6, 1500, 'ブリーダー', 'available',
  1.1, 3000, '2024-01-18T11:00:00Z', NOW()
);

-- 3. 派遣データ
INSERT INTO expeditions (
  id, user_id, location, trainer_ids, pokemon_ids, status,
  progress, estimated_duration, rewards, started_at, created_at
) VALUES
(
  'expedition_001',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'トキワの森', 
  '["trainer_akira_001"]'::jsonb,
  '["pokemon_pikachu_001"]'::jsonb,
  'active', 75, 120,
  '{"money": 2500, "items": ["きのみ", "モンスターボール"], "experience": 150}'::jsonb,
  '2024-01-26T10:00:00Z', NOW()
),
(
  'expedition_002', 
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'ハナダの洞窟',
  '["trainer_misaki_002"]'::jsonb,
  '["pokemon_squirtle_003"]'::jsonb,
  'completed', 100, 180,
  '{"money": 3200, "items": ["しんじゅ", "げんきのかけら"], "experience": 220}'::jsonb,
  '2024-01-24T14:30:00Z', NOW()
);

-- 4. 施設データ
INSERT INTO facilities (
  id, user_id, name, type, level, capacity, efficiency,
  maintenance_cost, status, created_at
) VALUES
(
  'facility_training_001',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'トレーニング施設', 'training', 3, 8, 1.15,
  2500, 'active', NOW()
),
(
  'facility_research_002',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c', 
  'リサーチセンター', 'research', 2, 4, 1.25,
  3200, 'active', NOW()
),
(
  'facility_medical_003',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'ポケモンセンター', 'medical', 4, 12, 1.3,
  1800, 'active', NOW()
);

-- 5. 取引データ
INSERT INTO transactions (
  id, user_id, type, category, amount, description,
  reference_id, created_at
) VALUES
(
  'trans_001', 'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'income', 'expedition', 3200, '派遣報酬: ハナダの洞窟',
  'expedition_002', '2024-01-26T16:00:00Z'
),
(
  'trans_002', 'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'expense', 'salary', 3600, '給与支払い: アキラ', 
  'trainer_akira_001', '2024-01-25T18:00:00Z'
),
(
  'trans_003', 'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'income', 'expedition', 1800, '派遣報酬: トキワの森（中間）',
  'expedition_001', '2024-01-26T12:00:00Z'
),
(
  'trans_004', 'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'expense', 'facility', 2500, '施設維持費: トレーニング施設',
  'facility_training_001', '2024-01-26T08:00:00Z'
),
(
  'trans_005', 'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'expense', 'pokemon', 1200, 'ポケモンケア費用',
  NULL, '2024-01-25T15:30:00Z'
);

-- 6. ゲーム進捗データ  
INSERT INTO game_progress (
  id, user_id, level, total_experience, unlocked_areas,
  achievements, statistics, created_at, updated_at
) VALUES
(
  'progress_001',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  5, 4500,
  '["トキワの森", "ハナダの洞窟", "シオンタウン"]'::jsonb,
  '["初回派遣完了", "トレーナー3名雇用", "ポケモン3匹捕獲"]'::jsonb,
  '{
    "expeditions_completed": 8,
    "pokemon_caught": 3, 
    "trainers_hired": 3,
    "total_earnings": 45000,
    "days_active": 16
  }'::jsonb,
  NOW(), NOW()
);

-- 7. AI分析データ
INSERT INTO ai_analysis (
  id, user_id, analysis_type, data, recommendations,
  predicted_outcomes, confidence_score, created_at
) VALUES
(
  'analysis_001',
  'e5651d93-2721-461f-b42a-3d6ba1a6944c',
  'monthly_performance', 
  '{
    "revenue": 25000,
    "expenses": 18000, 
    "pokemon_growth": 2.3,
    "trainer_efficiency": 1.25
  }'::jsonb,
  '[
    "トレーニング施設のアップグレードを推奨します", 
    "新しいエリア解放により収益が15%向上する見込み",
    "ポケモンの回復時間を最適化することで効率向上が期待できます"
  ]'::jsonb,
  '{
    "weekly_profit": 1800,
    "trainer_growth": 2,
    "pokemon_evolution": 1
  }'::jsonb,
  0.87, NOW()
);

-- データ投入完了のログ
DO $$
BEGIN
  RAISE NOTICE 'サンプルデータ投入完了: ユーザーID e5651d93-2721-461f-b42a-3d6ba1a6944c';
  RAISE NOTICE 'ポケモン: 3匹, トレーナー: 3名, 派遣: 2件, 施設: 3つ, 取引: 5件';
END $$;