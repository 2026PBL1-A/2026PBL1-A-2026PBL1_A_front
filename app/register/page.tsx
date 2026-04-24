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

  const handleRegister = () => {
    // 入力チェック
    if (!name || !mail || !password || !confirmPassword) {
      setPopup({ message: "すべての項目を入力してください", type: "error" });
      setTimeout(() => setPopup(null), 3000);
      return;
    }

    if (password !== confirmPassword) {
      setPopup({ message: "パスワードが一致しません", type: "error" });
      setTimeout(() => setPopup(null), 3000);
      return;
    }

    // 仮の登録処理（バックエンドとの通信は後で追加）
    // 成功した場合
    setPopup({ message: "新規登録に成功しました", type: "success" });
    setTimeout(() => {
      router.push("/login"); // 登録完了後はログイン画面へ遷移
    }, 1500);
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
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
        >
          登録する
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
