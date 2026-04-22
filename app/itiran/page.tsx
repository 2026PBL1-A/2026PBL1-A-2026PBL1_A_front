import Menu from "@/app/components/aikon";

export default function Page() {
  return (
    <div>
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="mt-10 space-y-6">
        
        {/* 投稿カード */}
        <div className="border rounded shadow p-4">
          
          {/* 見出し */}
          <h2 className="text-lg font-bold mb-2">
            タイトルが入ります
          </h2>

          {/* 画像枠 */}
          <div className="w-full h-40 bg-gray-200 mb-2 flex items-center justify-center">
            画像エリア
          </div>

          {/* 本文 */}
          <p>
            ここに投稿の内容が入ります
          </p>

        </div>

      </div>

      {/* 投稿ボタン */}
      {/*import Link from "next/link";(遷移の際に使う予定)*/}

      {/*<Link href="/○○（投稿ページの名前）">(遷移の際に使う予定)*/}
        <button className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow">
          投稿
        </button>
      {/*</Link>(遷移の際に使う予定)*/}
    </div>
  );
}