import { dummyPosts } from "@/app/data/dummyPosts";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const post = dummyPosts.find((p) => p.id === resolvedParams.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="p-4 max-w-2xl mx-auto mt-6">
      <Link href="/itiran" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; 一覧へ戻る
      </Link>
      
      <div className="border rounded shadow p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        
        {/* 画像枠 */}
        <div className="w-full h-64 bg-gray-200 mb-6 flex items-center justify-center text-gray-500 rounded overflow-hidden">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            "画像なし"
          )}
        </div>
        
        {/* 本文 */}
        <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {post.content}
        </p>
      </div>
    </div>
  );
}
