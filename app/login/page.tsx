"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 二重送信防止とボタン表示切り替え用
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // 空入力のまま送信させない
    if (!mail || !password) {
      setPopup({ message: "メールアドレスとパスワードを入力してください", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      // バックエンド使用モード
      if (isUsingBackend()) {
        // /api は next.config.ts の rewrite を通ってバックエンドへ転送される
        // (ブラウザからは同一オリジンアクセスになるため CORS エラーを回避しやすい)
        const response = await fetch(`/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // バックエンド仕様: { email, password }
          body: JSON.stringify({ email: mail, password }),
        });

        // 4xx/5xx は成功レスポンスではないのでエラーハンドリングへ移す
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "メールアドレスまたはパスワードが違います"
          );
        }

        // 成功レスポンス仕様: { access_token: "..." }
        const data = await response.json();

        // 受け取ったユーザー名を可能なキーから取得して保存
        const receivedUserName =
          typeof data?.name === "string"
            ? data.name
            : typeof data?.username === "string"
              ? data.username
              : typeof data?.user?.name === "string"
                ? data.user.name
                : "";

        // 以降の認証付きAPI呼び出しに使う token をブラウザへ保存
        localStorage.setItem("access_token", data.access_token);
        if (receivedUserName) {
          localStorage.setItem("user_name", receivedUserName);
        }

        // DevTools でログイン成功地点を確認するためのログ
        console.info("[Auth] ログイン成功（バックエンド）", {
          email: mail,
          tokenSaved: Boolean(localStorage.getItem("access_token")),
          userNameSaved: Boolean(localStorage.getItem("user_name")),
        });
      } else {
        // ローカルモード（ダミー認証）
        if (mail === "test@test.com" && password === "pass1234") {
          const dummyToken = "dummy_token_" + Date.now();
          localStorage.setItem("access_token", dummyToken);
          localStorage.setItem("user_name", "テストユーザー");

          console.info("[Auth] ログイン成功（ローカル）", {
            email: mail,
            tokenSaved: Boolean(localStorage.getItem("access_token")),
            userNameSaved: Boolean(localStorage.getItem("user_name")),
          });
        } else {
          throw new Error("メールアドレスまたはパスワードが違います");
        }
      }
      
      setPopup({ message: "ログインに成功しました", type: "success" });
      setTimeout(() => {
        // ログイン完了後に一覧ページへ移動
        router.push("/itiran"); // ← 一覧画面へ
      }, 1500); // 1.5秒後に遷移
    } catch (error) {
      // fetch失敗 / 認証失敗 / 想定外エラーをここでまとめて扱う
      const message =
        error instanceof Error ? error.message : "ログインに失敗しました";
      console.error("[Auth] ログイン失敗", { email: mail, message });
      setPopup({ message, type: "error" });
      setTimeout(() => {
        setPopup(null);
      }, 3000); // 3秒後に非表示
    } finally {
      // 成功・失敗どちらでもボタン状態を元に戻す
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
      {/* ポップアップ */}
      {popup && (
        <div
          className={`absolute top-10 px-6 py-3 rounded-md shadow-lg text-white font-bold z-50 transition-opacity ${popup.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
        >
          {popup.message}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow w-80">

        <h1 className="text-xl font-bold mb-4 text-center">
          ログイン
        </h1>

        {/* メール */}
        <input
          type="mail"
          placeholder="メールアドレス"
          className="w-full border p-2 mb-3 rounded"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
        />

        {/* パスワード */}
        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-2 mb-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ボタン */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">アカウントをお持ちでないですか？ </span>
          <button
            onClick={() => router.push("/register")}
            className="text-sm text-blue-500 hover:underline"
          >
            新規登録
          </button>
        </div>

      </div>
    </div>
  );
}