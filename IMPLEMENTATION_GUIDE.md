# ログイン機能の実装ガイド

## 概要

このドキュメントでは、JWT ベースの認証をフロントエンドに実装する手順を説明します。

---

## 1. コンポーネント一覧

### 修正済みファイル
- **[app/login/page.tsx](app/login/page.tsx)**: ハードコード認証 → API 呼び出しに変更

### 新規作成ファイル
- **[lib/api.ts](lib/api.ts)**: API ユーティリティ（自動 Bearer token 付加）
- **[lib/AuthContext.tsx](lib/AuthContext.tsx)**: 認証状態管理（Context API）
- **[lib/withAuth.tsx](lib/withAuth.tsx)**: 保護ページ用 HOC
- **[lib/ProtectedPostListPage.tsx](lib/ProtectedPostListPage.tsx)**: API 呼び出し例
- **[.env.local](.env.local)**: 環境変数設定

### 修正したファイル
- **[app/layout.tsx](app/layout.tsx)**: `AuthProvider` をラップ

---

## 2. ログイン流れ

```
ユーザー入力
    ↓
POST /auth/login（email, password）
    ↓
レスポンス: { access_token: "eyJhbGc..." }
    ↓
localStorage に保存
    ↓
/itiran へ遷移
```

---

## 3. token の保存方法（セキュリティの考慮）

### 現在の実装: localStorage

**メリット**:
- 実装が簡単
- XSS 対策が必要だが、一般的

**デメリット**:
- XSS 攻撃で盗まれる可能性

**推奨事項**:
- 本番環境では Content Security Policy (CSP) を設定する
- HttpOnly Cookie の使用も検討（ただし CSRF 対策が必要）

### 代替案: HttpOnly Cookie

```typescript
// バックエンド（NestJS）での設定例
res.cookie('access_token', token, {
  httpOnly: true,
  secure: true,  // HTTPS 必須
  sameSite: 'strict',
  maxAge: 3600000  // 1時間
});
```

**フロントエンド側は自動的に Cookie を送信**するため、API ユーティリティの修正不要。

---

## 4. API ユーティリティの使用方法

### 基本的な使用例

```typescript
import { apiCall } from "@/lib/api";

// GET リクエスト
const posts = await apiCall<Post[]>("/posts");

// POST リクエスト
const newPost = await apiCall<Post>("/posts", {
  method: "POST",
  body: JSON.stringify({ title: "...", content: "..." }),
});

// DELETE リクエスト
await apiCall("/posts/123", {
  method: "DELETE",
});
```

### エラーハンドリング

```typescript
try {
  const data = await apiCall<Data>("/endpoint");
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
}
```

---

## 5. 保護ページの実装方法

### 方法1: useAuth フック（推奨）

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Page() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return <div>保護されたコンテンツ</div>;
}
```

### 方法2: withAuth HOC

```typescript
import { withAuth } from "@/lib/withAuth";

function MyPage() {
  return <div>保護されたコンテンツ</div>;
}

export default withAuth(MyPage);
```

---

## 6. ログアウト機能

### 実装例

```typescript
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();  // localStorage から token を削除
    router.push("/login");
  };

  return <button onClick={handleLogout}>ログアウト</button>;
}
```

### バックエンド側（オプション）

token を ブラックリストに追加するか、JWT の有効期限で対応。

---

## 7. セキュリティ上の注意点

### ⚠️ 実装時の必須項目

| 項目 | 対策 |
|------|------|
| **XSS 対策** | Content Security Policy (CSP) を設定 |
| **HTTPS** | 本番環境では HTTPS 通信を必須に |
| **CORS** | バックエンド側で適切なオリジンのみ許可 |
| **Token 有効期限** | 短い有効期限（1-2時間）を設定 |
| **Refresh Token** | 新しい token を自動更新する仕組み |
| **HttpOnly Cookie** | localStorage の代替案として検討 |
| **CSRF トークン** | Cookie 使用時は CSRF 対策が必須 |

### 実装例: Refresh Token（オプション）

```typescript
// lib/api.ts に追加
async function refreshToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",  // Cookie を送信
  });

  if (!response.ok) throw new Error("Refresh failed");

  const { access_token } = await response.json();
  localStorage.setItem("access_token", access_token);
  return access_token;
}
```

---

## 8. トラブルシューティング

### 401 Unauthorized エラーが出る場合

1. token が localStorage に保存されているか確認
   ```javascript
   localStorage.getItem("access_token")
   ```

2. API リクエストのヘッダーを確認
   ```
   Authorization: Bearer <token>
   ```

3. トークンの有効期限を確認

### CORS エラーが出る場合

バックエンド（NestJS）側で CORS を設定：

```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### localStorage が動作しない場合

- プライベートモード（Incognito）では動作しない可能性
- document.domain の制限がないか確認

---

## 9. 次のステップ

1. ✅ ログイン機能の実装
2. ⏳ Refresh Token の実装
3. ⏳ ログアウト API の実装（バックエンド側）
4. ⏳ ユーザー情報取得 API の実装
5. ⏳ パスワード変更機能の実装

---

## 10. 参考資料

- [Next.js 環境変数](https://nextjs.org/docs/basic-features/environment-variables)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [JWT.io](https://jwt.io/)
- [OWASP セッション管理チートシート](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
