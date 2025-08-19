# トキワシティ訓練所 開発サーバー起動スクリプト
# PowerShell用

Write-Host "🚀 トキワシティ訓練所 開発サーバーを起動中..." -ForegroundColor Green

# 現在のディレクトリを確認
Write-Host "📁 現在のディレクトリ: $(Get-Location)" -ForegroundColor Yellow

# パッケージの依存関係を確認
if (Test-Path "package.json") {
    Write-Host "✅ package.json が見つかりました" -ForegroundColor Green
} else {
    Write-Host "❌ package.json が見つかりません" -ForegroundColor Red
    Write-Host "正しいディレクトリにいることを確認してください" -ForegroundColor Yellow
    exit 1
}

# node_modulesの存在確認
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules が存在します" -ForegroundColor Green
} else {
    Write-Host "⚠️ node_modules が見つかりません。npm install を実行します..." -ForegroundColor Yellow
    npm install
}

# 環境変数ファイルの確認
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local が存在します" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env.local が見つかりません" -ForegroundColor Yellow
    Write-Host "環境変数の設定が必要かもしれません" -ForegroundColor Yellow
}

# 開発サーバーを起動
Write-Host "🌐 開発サーバーを起動中..." -ForegroundColor Green
Write-Host "ブラウザで http://localhost:3000 を開いてください" -ForegroundColor Cyan
Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Yellow

npm run dev
