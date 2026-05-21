import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // 開発/本番でバックエンドURLを切り替えるため環境変数から取得
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000";

    return [
      {
        // フロントからは /api/* を呼ぶ
        source: "/api/:path*",

        // 実際にはバックエンドへ透過転送する
        // 例: /api/auth/login -> http://localhost:5000/auth/login
        destination: `${backendUrl}/:path*`,
      },
      {
        // バックエンドのアップロード画像ディレクトリを転送する
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
