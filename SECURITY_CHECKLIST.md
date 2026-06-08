# セキュリティ&実装チェックリスト

## ✅ 実装済みの機能

### ログイン機能
- [x] API 呼び出し（POST /api/auth/login）
- [x] access_token の localStorage 保存
- [x] エラーハンドリング
- [x] ローディング状態の管理
- [x] 入力値検証（空文字列チェック）

### 認証状態管理
- [x] AuthContext による global state
- [x] useAuth Hook
- [x] withAuth HOC（ページ保護用）

### 入力検証・不適切ワード対策
- [x] 登録名の不適切ワードチェック
- [x] 投稿タイトル/本文の不適切ワードチェック
- [x] タグ入力時の不適切ワードチェック

### API ユーティリティ
- [x] 自動 Bearer token 付加
- [x] 401 エラー時の自動ログアウト
- [x] JSON エラーハンドリング

---

## 🔒 セキュリティ対策状況

### 実装済み
- ✅ Bearer token を Authorization ヘッダーで送信
- ✅ 401 Unauthorized 時に自動ログアウト
- ✅ パスワードは入力フィールドで隠蔽
- ✅ エラーメッセージに詳細情報を含めない（本番環境では）

### 推奨実装項目（優先順）

**優先度 HIGH:**
1. Content Security Policy (CSP) ヘッダーの設定
2. HTTPS の強制（本番環境）
3. バックエンド側での CORS 設定確認

**優先度 MEDIUM:**
1. Token 有効期限の実装（現在は無期限）
2. Refresh Token の実装
3. ログアウト API の実装
4. Token ローテーションの実装

**優先度 LOW:**
1. HttpOnly Cookie への移行（localStorage の代替）
2. CSRF トークンの実装（Cookie 使用時）
3. Rate limiting（ログイン試行回数制限）

---

## 🚀 クイックスタート

### 1. ログイン機能をテストする

```bash
# 開発サーバー起動
npm run dev

# http://localhost:3000/login にアクセス
# バックエンドが起動していることを確認してからログイン
```

`.env.local` で `NEXT_PUBLIC_USE_BACKEND=true` を指定していることも確認してください。

### 2. API ユーティリティをテストする

```typescript
// ブラウザコンソール
const token = localStorage.getItem("access_token");
console.log(token);
```

### 3. 保護ページの動作確認

```
- ログアウト → /login へ自動遷移されるか確認
- token を削除 → 保護ページにアクセスできないか確認
```

---

## 📋 実装時の注意点

### localStorage vs HttpOnly Cookie

| 方式 | localStorage | HttpOnly Cookie |
|------|------------|-----------------|
| XSS 対策 | 要 CSP | 自動保護 |
| CSRF 対策 | 不要 | 必須 |
| 実装難度 | 簡単 | やや複雑 |
| 推奨用途 | 開発環境 | 本番環境 |

**現在は localStorage を使用しており、開発環境向けです。本番環境では HttpOnly Cookie への移行を検討してください。**

---

## 🔧 バックエンド確認項目

### NestJS 側での確認事項

1. CORS 設定確認
   ```typescript
   app.enableCors({
     origin: 'http://localhost:3000',
     credentials: true,
   });
   ```

2. /auth/login エンドポイント
   - リクエスト: { email, password }
   - レスポンス: { access_token: "..." }

3. 保護 API での Bearer token 検証
   - Authorization ヘッダーから token を抽出
   - JWT 検証とペイロード取得

---

## 📝 実装例: 実際のページで使用

### 例1: ログアウトボタン付きページ

```typescript
// app/list/page.tsx
"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function Page() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <button onClick={handleLogout}>ログアウト</button>
      {/* 他のコンテンツ */}
    </>
  );
}
```

### 例2: API データ取得

```typescript
import { apiCall } from "@/lib/api";

const data = await apiCall<UserProfile>("/user/profile");
```

---

## ❓ よくある質問

**Q: token の有効期限が切れたときはどうする？**
A: 現在は 401 エラーで自動ログアウトします。Refresh Token 実装で対応可能。

**Q: 複数タブで同時にログインできるか？**
A: できます。localStorage は同じオリジン内で共有されます。

**Q: バックエンドが起動していない場合は？**
A: ログイン画面でエラーメッセージが表示されます。

**Q: token を手動で削除したら？**
A: 保護ページにアクセスしたときにログインページへ遷移します。

**Q: ローカルモードで動かすには？**
A: `.env.local` で `NEXT_PUBLIC_USE_BACKEND=false` を設定してください。機能によってはダミーデータ表示に切り替わります。

---

## 📞 サポート

実装に問題が発生した場合：

1. ブラウザの Developer Tools で console.log を確認
2. Network タブで API リクエスト/レスポンスを確認
3. localStorage に token が保存されているか確認
4. バックエンド側の CORS 設定を確認
