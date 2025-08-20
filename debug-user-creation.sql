-- デバッグ: ユーザー作成時の問題を特定するSQL

-- 1. 現在のRLS状態を確認
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'game_progress', 'game_balance', 'trainer_jobs', 'expedition_locations');

-- 2. 現在のポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'game_progress', 'game_balance', 'trainer_jobs', 'expedition_locations')
ORDER BY tablename, policyname;

-- 3. トリガー関数の存在確認
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
  AND trigger_name = 'on_auth_user_created';

-- 4. 関数の存在確認
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- 5. プロファイルテーブルの構造確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'デバッグ情報の取得完了' AS status;