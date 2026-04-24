import Menu from "@/app/components/aikon";
import Link from "next/link";
import { dummyPosts } from "@/app/data/dummyPosts";

export default function Page() {
  const currentUserName = "テスト";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダーエリア */}
      <div className="fixed top-4 left-4 z-10">
        <span className="font-semibold text-gray-700 bg-white/70 px-4 py-2 rounded-full shadow-sm border border-white/50 backdrop-blur-md">
          {currentUserName}
        </span>
      </div>
      <Menu />

      {/* 投稿一覧エリア */}
      <div className="pt-24 space-y-5 px-4 max-w-2xl mx-auto">

        {dummyPosts.map((post) => (
          <Link 
            href={`/post/${post.id}`} 
            key={post.id} 
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* 見出し */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${post.type === 'creation' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                {post.type === 'creation' ? '制作物' : '質問'}
              </span>
              <h2 className="text-lg font-bold text-gray-800">
                {post.title}
              </h2>
            </div>
            
            {/* 画像枠 */}
            <div className="w-full h-40 bg-gray-100 mb-4 flex items-center justify-center text-gray-400 rounded-xl overflow-hidden border border-gray-50">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">No Image</span>
              )}
            </div>

            {/* 本文 */}
            <p className="line-clamp-2 text-gray-600 text-sm leading-relaxed">
              {post.content}
            </p>
          </Link>
        ))}

      </div>

      {/* 投稿ボタン */}
      <Link href="/post/new">
        <button className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold">
          投稿
        </button>
      </Link>
    </div>
  );
}