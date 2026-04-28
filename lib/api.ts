// ブラウザからは常に同一オリジンの /api を呼び、next.config.ts の rewrite で
// バックエンドへ転送する構成にして CORS トラブルを減らす。
const API_BASE_URL = "/api";

/**
 * バックエンドを使用するかどうかを判定
 * 環境変数 NEXT_PUBLIC_USE_BACKEND が false の場合、ローカルデータのみを使用
 */
export function isUsingBackend(): boolean {
  if (typeof window === "undefined") {
    // サーバーサイド
    return process.env.NEXT_PUBLIC_USE_BACKEND !== "false";
  }
  // クライアントサイド
  return process.env.NEXT_PUBLIC_USE_BACKEND !== "false";
}

/**
 * 認証付きで API をコール
 * - localStorage から access_token を取得
 * - Authorization: Bearer <token> を自動付加
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // localStorage はブラウザ環境でのみ利用できるため window 有無を確認
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // HeadersInit は union 型のため、Headers オブジェクトへ正規化して扱う
  const headers = new Headers(options.headers);

  // JSON API を前提としたデフォルトヘッダー
  headers.set("Content-Type", "application/json");

  if (token) {
    // JWT を付けて保護APIへアクセス
    headers.set("Authorization", `Bearer ${token}`);
  }

  // endpoint には "/auth/login" や "/posts" などを渡す
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 Unauthorized の場合はログアウト処理
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      // 期限切れ/無効tokenの状態を残さないように削除してログイン画面へ戻す
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  }

  return response;
}

/**
 * JSON レスポンスを取得し、エラーハンドリング
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 認証ヘッダー付与・401処理込みの低レベル関数を利用
  const response = await fetchWithAuth(endpoint, options);

  if (!response.ok) {
    // APIごとのエラーメッセージを優先し、なければHTTPステータスを表示
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // 呼び出し側で型を指定して受け取る
  return response.json();
}
