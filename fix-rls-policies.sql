-- 不足しているRLSポリシーを修正するスクリプト

-- trainer_jobs テーブルにRLSを有効化（全員が読み取り可能）
ALTER TABLE trainer_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trainer jobs" ON trainer_jobs;
CREATE POLICY "Anyone can view trainer jobs" ON trainer_jobs FOR SELECT USING (true);

-- expedition_locations テーブルにRLSを有効化（全員が読み取り可能）
ALTER TABLE expedition_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view expedition locations" ON expedition_locations;
CREATE POLICY "Anyone can view expedition locations" ON expedition_locations FOR SELECT USING (true);

-- プロファイルのトリガー関数をより詳細にエラーハンドリング
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- プロファイル作成
    INSERT INTO profiles (id, email, trainer_name, school_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'trainer_name', 'トレーナー'),
        COALESCE(NEW.raw_user_meta_data->>'school_name', 'ポケモンスクール')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- ゲーム進行状況作成
    INSERT INTO game_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- ゲームバランス作成
    INSERT INTO game_balance (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- エラーログを出力してもトリガーは成功させる
        RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のプロファイルポリシーを強化（もし存在しない場合のため）
DO $$
BEGIN
    -- プロファイル挿入時のチェックを緩める（サインアップ時のため）
    DROP POLICY IF EXISTS "Anyone can insert profile during signup" ON profiles;
    CREATE POLICY "Anyone can insert profile during signup" ON profiles 
    FOR INSERT WITH CHECK (true);
    
    -- 既存のポリシーを維持
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON profiles 
        FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles 
        FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

SELECT 'RLSポリシー修正完了！' AS result;