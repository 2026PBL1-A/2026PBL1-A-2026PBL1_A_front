import Menu from "@/app/components/aikon";
import Link from "next/link";
import { dummyPosts } from "@/app/data/dummyPosts";

export default function Page() {
  return (
    <div>
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="mt-10 space-y-6 px-4 pb-20 max-w-2xl mx-auto">
        
        {dummyPosts.map((post) => (
          <Link href={`/post/${post.id}`} key={post.id} className="block border rounded shadow p-4 hover:bg-gray-50 transition">
            {/* 見出し */}
            <h2 className="text-lg font-bold mb-2">
              {post.title}
            </h2>

            {/* 画像枠 */}
            <div className="w-full h-40 bg-gray-200 mb-2 flex items-center justify-center text-gray-500 rounded">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover rounded" />
              ) : (
                "画像エリア"
              )}
            </div>

            {/* 本文 */}
            <p className="line-clamp-2 text-gray-700">
              {post.content}
            </p>
          </Link>
        ))}

      </div>

      {/* 投稿ボタン */}
      <Link href="/post/new">
        <button className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition">
          投稿
        </button>
      </Link>
    </div>
  );
}