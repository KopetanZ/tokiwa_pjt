@echo off
chcp 65001 >nul
echo 🚀 トキワシティ訓練所 開発サーバーを起動中...
echo.

REM 現在のディレクトリを確認
echo 📁 現在のディレクトリ: %CD%
echo.

REM package.jsonの存在確認
if not exist "package.json" (
    echo ❌ package.json が見つかりません
    echo 正しいディレクトリにいることを確認してください
    pause
    exit /b 1
)

echo ✅ package.json が見つかりました
echo.

REM node_modulesの存在確認
if not exist "node_modules" (
    echo ⚠️ node_modules が見つかりません。npm install を実行します...
    npm install
    echo.
)

echo ✅ node_modules が存在します
echo.

REM 環境変数ファイルの確認
if not exist ".env.local" (
    echo ⚠️ .env.local が見つかりません
    echo 環境変数の設定が必要かもしれません
    echo.
)

echo 🌐 開発サーバーを起動中...
echo ブラウザで http://localhost:3000 を開いてください
echo 停止するには Ctrl+C を押してください
echo.

npm run dev

pause
