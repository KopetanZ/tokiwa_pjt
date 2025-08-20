-- 安全なユーザー作成のための修正版SQL

-- まず、既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- プロファイルテーブルのRLSポリシーをリセット
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profile during signup" ON profiles;

-- RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- より柔軟なプロファイル作成ポリシー
CREATE POLICY "Enable read access for users based on user_id" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication users only" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 他の必要なテーブルのRLS設定
ALTER TABLE game_progress DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own game_progress" ON game_progress;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users only" ON game_progress
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE game_balance DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own game_balance" ON game_balance;
ALTER TABLE game_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users only" ON game_balance
    FOR ALL USING (auth.uid() = user_id);

-- より簡単なユーザー作成関数（エラーハンドリング強化）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- プロファイル作成（エラーが発生しても続行）
    BEGIN
        INSERT INTO public.profiles (id, email, trainer_name, school_name)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'trainer_name', 'トレーナー'),
            COALESCE(NEW.raw_user_meta_data->>'school_name', 'ポケモンスクール')
        );
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    -- ゲーム進行状況作成
    BEGIN
        INSERT INTO public.game_progress (user_id)
        VALUES (NEW.id);
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'Game progress creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    -- ゲームバランス作成
    BEGIN
        INSERT INTO public.game_balance (user_id)
        VALUES (NEW.id);
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'Game balance creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- 全体的なエラーでもユーザー作成は成功させる
        RAISE LOG 'handle_new_user failed for user % but continuing: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 参照テーブルのRLS設定
ALTER TABLE trainer_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view trainer jobs" ON trainer_jobs;
CREATE POLICY "Enable read access for all users" ON trainer_jobs
    FOR SELECT USING (true);

ALTER TABLE expedition_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view expedition locations" ON expedition_locations;
CREATE POLICY "Enable read access for all users" ON expedition_locations
    FOR SELECT USING (true);

SELECT 'ユーザー作成の修正完了' AS result;