"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("登録中...");

  const handleRegister = async () => {
    // 入力チェック
    if (!name || !mail || !password || !confirmPassword) {
      setPopup({ message: "すべての項目を入力してください", type: "error" });
      setTimeout(() => setPopup(null), 3000);
      return;
    }

    // メールアドレスの簡易チェック
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(mail)) {
      setPopup({ message: "正しいメールアドレスを入力してください", type: "error" });
      setTimeout(() => setPopup(null), 3000);
      return;
    }

    // パスワードの最低文字数チェック(仮)
    if (password.length < 8) {
      setPopup({ message: "パスワードは8文字以上で入力してください", type: "error" });
      setTimeout(() => setPopup(null), 3000);
      return;
    }

    if (password !== confirmPassword) {
      setPopup({ message: "パスワードが一致しません", type: "error" });
      setTimeout(() => setPopup(null), 3000);
      return;
    }

    setIsLoading(true);
    setLoadingLabel("登録中...");
    try {
      // /api は next.config.ts の rewrite を通って http://localhost:5000/user へ転送される
      const registerResponse = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: mail,
          password,
        }),
      });

      // 4xx/5xx は成功レスポンスではないのでエラーハンドリングへ移す
      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "新規登録に失敗しました");
      }

      setLoadingLabel("ログイン中...");

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: mail, password }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "ログインに失敗しました");
      }

      const loginData = await loginResponse.json();

      const receivedUserName =
        typeof loginData?.name === "string"
          ? loginData.name
          : typeof loginData?.username === "string"
            ? loginData.username
            : typeof loginData?.user?.name === "string"
              ? loginData.user.name
              : name;

      // 受け取ったユーザーIDを可能なキーから取得して保存
      const receivedUserId =
        typeof loginData?.user?.id === "string"
          ? loginData.user.id
          : typeof loginData?.id === "string"
            ? loginData.id
            : "";

      localStorage.setItem("access_token", loginData.access_token);
      localStorage.setItem("user_name", receivedUserName);
      // ログイン後にプロフィール画面へつなぐため、取得できた場合だけ user_id を保存する
      if (receivedUserId) {
        localStorage.setItem("user_id", receivedUserId);
      }

      setPopup({ message: "登録とログインに成功しました", type: "success" });
      setTimeout(() => {
        router.push("/itiran");
      }, 1200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "新規登録またはログインに失敗しました";
      setPopup({ message, type: "error" });
      setTimeout(() => setPopup(null), 3000);
    } finally {
      setIsLoading(false);
      setLoadingLabel("登録中...");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
      {/* ポップアップ */}
      {popup && (
        <div
          className={`absolute top-10 px-6 py-3 rounded-md shadow-lg text-white font-bold z-50 transition-opacity ${
            popup.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {popup.message}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow w-80">
        <h1 className="text-xl font-bold mb-4 text-center">新規登録</h1>

        {/* 名前 */}
        <input
          type="text"
          placeholder="ユーザー名"
          className="w-full border p-2 mb-3 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          className="w-full border p-2 mb-3 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* パスワード（確認用） */}
        <input
          type="password"
          placeholder="パスワード（確認用）"
          className="w-full border p-2 mb-4 rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* ボタン */}
        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          {isLoading ? loadingLabel : "登録する"}
        </button>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">すでにアカウントをお持ちですか？ </span>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-blue-500 hover:underline"
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}
