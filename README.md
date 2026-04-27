# 2026PBL1 A Frontend

このリポジトリは、Next.js ベースのフロントエンドアプリです。
現在は以下を中心に実装しています。

- 認証付きログイン
- 新規登録
- 投稿一覧（ダミーデータ）
- 投稿詳細
- 投稿作成（ダミー送信）

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

プロジェクトルートに .env.local を作成し、以下を設定してください。

```env
BACKEND_API_URL=http://localhost:5000
```

この値は next.config.ts の rewrite で使用され、
フロントの /api/* へのアクセスをバックエンドへ転送します。

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

## 画面構成

- / : /login へリダイレクト
- /login : ログイン画面
- /register : 新規登録画面
- /itiran : 投稿一覧画面（ダミーデータ）
- /post/new : 投稿作成画面（ダミー送信）
- /post/[id] : 投稿詳細画面

## 認証まわりの実装方針

- ログイン成功時に access_token を localStorage へ保存
- 必要に応じて user_name も localStorage へ保存
- AuthProvider でログイン状態を管理
- API 呼び出し時は Authorization: Bearer を自動付加
- 401 応答時は token を破棄して /login へ遷移

実装ファイルの主な場所:

- lib/AuthContext.tsx
- lib/api.ts
- lib/withAuth.tsx

## API 接続のしくみ

フロントエンドは常に /api/* を呼び出します。
Next.js の rewrite により、実際のバックエンド URL へ透過転送されます。

例:

- フロントからの呼び出し: /api/auth/login
- 転送先: http://localhost:5000/auth/login

## 現在の仕様メモ

- /itiran は現時点ではダミーデータ表示が中心です
- /post/new は UI 入力後にダミー送信として扱います
- 認証トークン保存は localStorage を利用しています

## 関連ドキュメント

- IMPLEMENTATION_GUIDE.md
- SECURITY_CHECKLIST.md

## 注意事項

- バックエンド API を先に起動してください
- CORS 回避のため、フロント側からは /api 経由でアクセスしてください
- 本番運用では localStorage 運用の見直し（HttpOnly Cookie など）を検討してください
