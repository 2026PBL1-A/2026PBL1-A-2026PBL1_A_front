"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth, isUsingBackend } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";

export type CommentData = {
  id: string | number;
  content?: string;
  comment?: string;
  answer?: string;
  created_at: string;
  user_id?: any;
  userid?: any;
  username?: string;
};

export default function CommentSection({ 
  postType,
  postId,
  questionId
}: { 
  postType: "creation" | "question";
  postId: string;
  questionId?: string;
}) {
  const [showComment, setShowComment] = useState(false);
  const [inputText, setInputText] = useState("");
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 属性が質問の場合は「回答」、それ以外は「コメント」
  const label = postType === "question" ? "回答" : "コメント";
  const targetId = questionId ?? postId;
  
  // APIエンドポイントの定義
  // 制作物: /comment, 質問: /answer
  const getEndpoint = postType === "question" ? `/answer/question/${targetId}` : `/comment/post/${targetId}`;
  const postEndpoint = postType === "question" ? `/answer` : `/comment`;

  useEffect(() => {
    async function fetchComments() {
      if (!isUsingBackend()) {
        // ダミーデータ
        setComments([
          {
            id: 1,
            content: `これはダミーの${label}です。`,
            created_at: new Date().toISOString(),
            username: "ダミーユーザー",
          }
        ]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetchWithAuth(getEndpoint);
        if (response.ok) {
          const data = await response.json();
          setComments(Array.isArray(data) ? data : (data.comments || data.answers || []));
        } else {
          console.warn(`[CommentSection] 取得に失敗しました: ${response.status}`);
        }
      } catch (err) {
        console.error(`[CommentSection] 取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [getEndpoint, label]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    if (!isUsingBackend()) {
      // ダミー送信
      const newComment: CommentData = {
        id: Date.now().toString(),
        content: inputText,
        created_at: new Date().toISOString(),
        username: "あなた (ダミー)",
      };
      setComments([...comments, newComment]);
      setInputText("");
      setShowComment(false);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // JWTトークンからユーザーIDを取り出す処理
      let currentUserId = "1"; // デフォルト
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            // NestJSの一般的なJWT payload (sub または id)
            currentUserId = payload.sub || payload.id || payload.userId || "1";
          } catch (e) {
            console.error("Token decode error:", e);
          }
        }
      }

      // バックエンドのDTO（CreateAnswerDto / CreateCommentDto）に合わせてプロパティ名を変更
      // content -> comment
      // question_id -> questionid, post_id -> postid
      const payload = 
      postType === "question" 
        ? { 
          questionId: questionId ?? postId, 
          comment: inputText, 
          userId: currentUserId }
        : { 
          postId: postId, 
          comment: inputText, 
          userId: currentUserId 
        };
        
      const response = await fetchWithAuth(postEndpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 保存したコメントをそのままオブジェクトとして取得
        const savedComment = data;
        
        // 投稿直後はバックエンドからの返り値にユーザー名が含まれないことがあるため、
        // ログイン中のユーザー名を補完する
        if (!savedComment.username && !savedComment.userid?.username && typeof window !== "undefined") {
          savedComment.username = localStorage.getItem("user_name") || "あなた";
        }

        setComments([...comments, savedComment]);
        setInputText("");
        setShowComment(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `${label}の送信に失敗しました。`);
      }
    } catch (err) {
      console.error(`[CommentSection] 送信エラー:`, err);
      setError(`${label}の送信中にエラーが発生しました。`);
    } finally {
      setSubmitting(false);
    }
  };

  // コメント本文を取得するヘルパー関数
  // バックエンドのレスポンス形式に応じてよしなに表示
  const getDisplayContent = (c: CommentData) => {
    return c.content || c.comment || c.answer || "";
  };

  // ユーザー名を取得するヘルパー関数
  const getUsername = (c: CommentData & { userId?: any }) => {
    if (c.username) return c.username;
    if (c.userId && c.userId.username) return c.userId.username;
    if (c.userid && c.userid.username) return c.userid.username;
    if (c.user_id && c.user_id.username) return c.user_id.username;
    return "名無しユーザー";
  };

  return (
    <div className="mt-8 pt-4">
      {/* 既存のコメント/回答一覧 */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-sm mr-2 font-mono">
            {comments.length}
          </span>
          件の{label}
        </h3>
        
        {loading ? (
          <div className="text-gray-500 py-4 animate-pulse text-sm">読み込み中...</div>
        ) : comments.length > 0 ? (
          <ul className="space-y-4">
            {comments.map((c, index) => (
              <li key={c.id || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gray-800 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 font-bold text-sm border border-blue-100">
                      {getUsername(c)[0]}
                    </div>
                    {getUsername(c)}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{formatDate(c.created_at)}</div>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap ml-11 leading-relaxed">
                  {getDisplayContent(c)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            まだ{label}はありません。最初の{label}を書き込んでみましょう！
          </div>
        )}
      </div>

      <button
        onClick={() => setShowComment(!showComment)}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-gray-800 transition font-medium flex items-center focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
      >
        {showComment ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            キャンセル
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            {label}する
          </>
        )}
      </button>

      {/* 入力欄（条件付き表示） */}
      {showComment && (
        <div className="mt-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          {error && <div className="mb-3 text-red-500 text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>}
          <textarea
            placeholder={`${label}を書く...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            className="border border-gray-200 bg-gray-50 p-4 w-full mb-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent resize-y transition-colors"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button 
              onClick={handleSubmit}
              disabled={submitting || !inputText.trim()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  送信中...
                </>
              ) : "送信する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
