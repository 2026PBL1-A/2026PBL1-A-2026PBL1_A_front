"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleLogin = () => {
    // 仮の正解（あとでサーバーにする）
    if (mail === "test@test.com" && password === "1234") {
      setPopup({ message: "ログインに成功しました", type: "success" });
      setTimeout(() => {
        router.push("/itiran"); // ← 一覧画面へ
      }, 1500); // 1.5秒後に遷移
    } else {
      setPopup({ message: "メールアドレスまたはパスワードが違います", type: "error" });
      setTimeout(() => {
        setPopup(null);
      }, 3000); // 3秒後に非表示
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
          className="w-full bg-blue-500 text-white p-2"
        >
          ログイン
        </button>


      </div>
    </div>
  );
}