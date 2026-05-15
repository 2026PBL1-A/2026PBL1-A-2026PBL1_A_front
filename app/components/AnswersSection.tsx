"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth, isUsingBackend } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import AnswersScoreButton from "./AnswersScoreButton";

export type AnswerData = {
  id: string | number;
  content?: string;
  comment?: string;
  answer?: string;
  created_at: string;
  user_id?: any;
  userid?: any;
  username?: string;
  score?: number;
};

export default function AnswersSection({ 
  itemType,
  postId,
  questionId
}: { 
  itemType: "creation" | "question";
  postId: string;
  questionId?: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputText, setInputText] = useState("");
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<"newest" | "evaluation">("newest");

  // 属性が質問の場合は「回答」、それ以外は「コメント」
  const label = itemType === "question" ? "回答" : "コメント";
  const targetId = questionId ?? postId;
  
  // APIエンドポイントの定義
  // 制作物: /comments, 質問: /answers
  const getEndpoint = itemType === "question" ? `/answers/question/${targetId}` : `/comments/post/${targetId}`;
  const postEndpoint = itemType === "question" ? `/answers` : `/comments`;

  useEffect(() => {
    async function fetchAnswers() {
      if (!isUsingBackend()) {
        // ダミーデータ
        if(itemType === "question") {
          setAnswers([
            {
              id: 1,
              answer: `これはダミーの${label}です。`,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              username: "ダミーユーザー",
              score: 2,
            },
            {
              id: 2,
              answer: `新着で高評価のダミー${label}です。`,
              created_at: new Date().toISOString(),
              username: "ダミーユーザー2",
              score: 5,
            }
          ]);
        }
        else {
          setAnswers([
            {
              id: 1,
              comment: `これはダミーの${label}です。`,
              created_at: new Date().toISOString(),
              username: "ダミーユーザー",
            }
          ]);
        }
        
        return;
      }

      setLoading(true);
      try {
        const response = await fetchWithAuth(getEndpoint);
        if (response.ok) {
          const data = await response.json();
          let fetchedAnswers = Array.isArray(data) ? data : (data.comments || data.answers || []);
          
          if (isUsingBackend() && itemType === "question") {
            fetchedAnswers = await Promise.all(fetchedAnswers.map(async (c: any) => {
              try {
                const scoreRes = await fetchWithAuth(`/answers/scores/${c.id}`);
                if (scoreRes.ok) {
                  const text = await scoreRes.text();
                  if (text) {
                    const scoreData = JSON.parse(text);
                    let scoreCount = 0;
                    if (typeof scoreData === 'number') scoreCount = scoreData;
                    else if (Array.isArray(scoreData)) scoreCount = scoreData.length;
                    else if (scoreData && typeof scoreData === 'object') scoreCount = 1;
                    return { ...c, score: scoreCount };
                  }
                }
              } catch (e) {
                console.error("[AnswersSection] スコア取得エラー:", e);
              }
              return { ...c, score: 0 };
            }));
          }
          
          setAnswers(fetchedAnswers);
        } else {
          console.warn(`[AnswersSection] 取得に失敗しました: ${response.status}`);
        }
      } catch (err) {
        console.error(`[AnswersSection] 取得エラー:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnswers();
  }, [getEndpoint, label]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    if (!isUsingBackend()) {
      // ダミー送信
      const newAnswer: AnswerData = {
        id: Date.now().toString(),
        content: inputText,
        created_at: new Date().toISOString(),
        username: "あなた (ダミー)",
      };
      setAnswers([...answers, newAnswer]);
      setInputText("");
      setShowAnswer(false);
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
      itemType === "question" 
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
        const savedAnswer = data;
        
        // 投稿直後はバックエンドからの返り値にユーザー名が含まれないことがあるため、
        // ログイン中のユーザー名を補完する
        if (!savedAnswer.username && !savedAnswer.userid?.username && typeof window !== "undefined") {
          savedAnswer.username = localStorage.getItem("user_name") || "あなた";
        }

        setAnswers([...answers, savedAnswer]);
        setInputText("");
        setShowAnswer(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `${label}の送信に失敗しました。`);
      }
    } catch (err) {
      console.error(`[AnswersSection] 送信エラー:`, err);
      setError(`${label}の送信中にエラーが発生しました。`);
    } finally {
      setSubmitting(false);
    }
  };

  // 本文を取得するヘルパー関数
  // バックエンドのレスポンス形式に応じてよしなに表示
  const getDisplayContent = (c: AnswerData) => {
    return c.content || c.comment || c.answer || "";
  };

  // ユーザー名を取得するヘルパー関数
  const getUsername = (c: AnswerData) => {
    if (c.username) return c.username;
    if (c.userid && c.userid.username) return c.userid.username;
    if (c.user_id && c.user_id.username) return c.user_id.username;
    return "名無しユーザー";
  };

  // ソート
  const sortedAnswers = [...answers].sort((a, b) => {
    if (sortType === "newest") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    } else {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
  });

  return (
    <div className="mt-8 pt-4">
      {/* 既存のコメント/回答一覧 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold flex items-center">
            <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-sm mr-2 font-mono">
              {answers.length}
            </span>
            件の{label}
          </h3>
          
          {answers.length > 0 && itemType === "question" && (
            <div className="flex gap-4 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="answerSortOrder"
                  checked={sortType === "newest"}
                  onChange={() => setSortType("newest")}
                  className="accent-blue-600"
                />
                <span className={sortType === "newest" ? "font-bold text-gray-800" : "text-gray-600"}>新着順</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="answerSortOrder"
                  checked={sortType === "evaluation"}
                  onChange={() => setSortType("evaluation")}
                  className="accent-blue-600"
                />
                <span className={sortType === "evaluation" ? "font-bold text-gray-800" : "text-gray-600"}>評価順</span>
              </label>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-gray-500 py-4 animate-pulse text-sm">読み込み中...</div>
        ) : answers.length > 0 ? (
          <ul className="space-y-4">
            {sortedAnswers.map((c, index) => (
              <li key={c.id || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gray-800 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 font-bold text-sm border border-blue-100">
                      {getUsername(c)[0]}
                    </div>
                    {getUsername(c)}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-400 font-medium">{formatDate(c.created_at)}</div>
                    {itemType === "question" && <AnswersScoreButton initialCount={c.score || 0} answerId={c.id} />}
                  </div>
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
        onClick={() => setShowAnswer(!showAnswer)}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-gray-800 transition font-medium flex items-center focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
      >
        {showAnswer ? (
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
      {showAnswer && (
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
