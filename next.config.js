/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'raw.githubusercontent.com', // PokeAPI sprites
      'localhost',
      'tokiwa-trainer-school.vercel.app'
    ],
    // ドット絵のための画像設定
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // レトロゲーム風のパフォーマンス設定
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Vercelデプロイ用設定
  env: {
    CUSTOM_KEY: 'retro-pokemon-game',
  },
  // SSRとプリレンダリングの設定
  experimental: {
    // サーバーサイドでのプリレンダリングを制御
    serverComponentsExternalPackages: [],
  },
  // 特定のページでSSRを無効化
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig