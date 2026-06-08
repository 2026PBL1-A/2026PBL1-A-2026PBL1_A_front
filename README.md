# 2026PBL1 A Frontend

このリポジトリは、Next.js ベースのフロントエンドアプリです。
現在は認証、投稿一覧・詳細、投稿作成、プロフィール編集、フォロー機能を中心に実装しています。

## 技術スタック

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- ESLint 9

## セットアップ

### 1. 依存関係をインストール

```bash
npm install
```

### 2. 環境変数を設定

プロジェクトルートに `.env.local` を作成し、以下を設定してください。

```env
# サーバーサイドの fetch / rewrite 用
BACKEND_API_URL=http://localhost:5000

# クライアントサイドでバックエンドURLを参照する処理用
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000

# false のときはローカルモード（ダミーデータ中心）
# 未設定または true のときはバックエンド接続モード
NEXT_PUBLIC_USE_BACKEND=true
```

補足:

- `BACKEND_API_URL` は `next.config.ts` の rewrite と一部サーバーコンポーネントの `fetch` で使用します。
- `NEXT_PUBLIC_BACKEND_API_URL` はクライアントコンポーネントでの画像・プロフィール・フォロー関連 API 参照に使用します。
- `NEXT_PUBLIC_USE_BACKEND=false` にすると、画面によってはダミーデータ表示やローカル処理に切り替わります。

### 3. 開発サーバー起動

```bash
npm run dev
```

起動後、http://localhost:3000 にアクセスしてください。

## 利用可能なスクリプト

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 画面構成（現行）

- `/` : `/login` へリダイレクト
- `/login` : ログイン画面
- `/register` : 新規登録画面
- `/list` : 投稿一覧画面（制作物/質問の統合一覧、検索・タグ・並び替え対応）
- `/post/[id]` : 投稿詳細画面（制作物/質問の両対応）
- `/post/new` : 投稿作成画面（共通フォーム）
- `/post/new/creation` : 制作物投稿作成画面
- `/post/new/question` : 質問投稿作成画面
- `/profile` : プロフィール画面（クエリ `userId` 指定で他ユーザー表示にも対応）
- `/profile/edit` : プロフィール編集画面

## 主な実装内容

- 認証付きログイン（`/api/auth/login`）
- 新規登録後の自動ログイン
- 投稿一覧の取得（制作物・質問を統合表示）
- 投稿詳細表示（画像、評価、回答、フォロー導線）
- 投稿作成（制作物/質問、タグ選択、画像アップロード対応）
- プロフィール表示・編集（自己紹介、アイコン、スキルタグ）
- フォロー/フォロー解除
- 不適切ワードチェック（登録名、投稿タイトル/本文、タグ）

## 認証まわりの実装方針

- ログイン成功時に `access_token` を `localStorage` へ保存
- 必要に応じて `user_name` / `user_id` / `avatar_url` などを `localStorage` に保存
- `AuthProvider` でログイン状態を管理
- `fetchWithAuth` / `apiCall` で `Authorization: Bearer` を自動付加
- 401 応答時はトークンを削除して `/login` へ遷移

## API 接続のしくみ

フロントエンドは主に `/api/*` を呼び出し、Next.js の rewrite でバックエンドへ透過転送します。

例:

- フロントからの呼び出し: `/api/auth/login`
- 転送先: `http://localhost:5000/auth/login`

一部のクライアント処理（画像 URL 構築など）は `NEXT_PUBLIC_BACKEND_API_URL` を直接参照します。

## 関連ドキュメント

- `IMPLEMENTATION_GUIDE.md`
- `SECURITY_CHECKLIST.md`

## 注意事項

- バックエンド API を先に起動してください
- CORS 回避のため、フロント側は基本的に `/api` 経由でアクセスしてください
- 本番運用では `localStorage` 運用の見直し（HttpOnly Cookie など）を検討してください
