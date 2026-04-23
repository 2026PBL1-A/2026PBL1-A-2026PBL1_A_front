"use client";
import { useState } from "react";
import Link from "@/app/components/Link";

export default function LoginPage() {
  const [mail, setMail] = useState("");             {/*入力値を保存する*/}
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {                       {/*どっちか空ならエラー*/}
    if (!mail || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setError("");
    alert("ログイン処理（仮）");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        
        <h1 className="text-xl font-bold mb-4 text-center">
          ログイン
        </h1>

        {/* エラーメッセージ */}
        {error && (
          <p className="text-red-500 mb-3">{error}</p>
        )}

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
        <Link href="/itiran"
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          ログイン
        </Link>

      </div>
    </div>
  );
}