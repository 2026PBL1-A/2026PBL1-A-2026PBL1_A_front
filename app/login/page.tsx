"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    // 仮の正解（あとでサーバーにする）
    if (mail === "test@test.com" && password === "1234") {
      router.push("/itiran"); // ← 一覧画面へ
    } else {
      setError("メールアドレスまたはパスワードが違います");
    }
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
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-2"
        >
          ログイン
        </button>


      </div>
    </div>
  );
}