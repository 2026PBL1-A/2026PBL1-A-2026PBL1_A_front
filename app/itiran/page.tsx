import Menu from "@/app/components/aikon";
import PostCard from "../components/PostCard";

const test_data = [
  {id: 1, title: "C言語の開発について", datetime: new Date()},
  {id: 2, title: "初めてのWeb個人開発", datetime: new Date()},
  {id: 3, title: "【質問】Markdownの書き方について", datetime: new Date()},
  {id:4, title: "自分で作ったWebアプリをデプロイしたい", datetime: new Date()}
]

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="m-10 space-y-6">
        <ul className="grid gap-4">
          {test_data.map((post, index) => (
            <li key={index}><PostCard id={post.id} title={post.title} datetime={post.datetime}/></li>
          ))}
        </ul>
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