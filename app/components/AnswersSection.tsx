"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth, isUsingBackend } from "@/lib/api";
import { formatDate } from "@/lib/formatDate";
import AnswersScoreButton from "./AnswersScoreButton";
import Link from "next/link";

export type AnswerData = {
  id: string | number;
  content?: string;
  comment?: string;
  answer?: string;
  created_at: string;
  user_id?: any;
  userid?: any;
  userId?: any;
  username?: string;
  avatarUrl?: string;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 編集用のステート
  const [editingAnswer, setEditingAnswer] = useState<AnswerData | null>(null);
  const [editInputText, setEditInputText] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ドロップダウンメニュー開閉用のステート
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  // 属性が質問の場合は「回答」、それ以外は「コメント」
  const label = itemType === "question" ? "回答" : "コメント";
  const targetId = questionId ?? postId;

  // APIエンドポイントの定義
  // 制作物: /comments, 質問: /answers
  const getEndpoint = itemType === "question" ? `/answers/question/${targetId}` : `/comments/post/${targetId}`;
  const postEndpoint = itemType === "question" ? `/answers` : `/comments`;

  useEffect(() => {
    // ログインユーザーのIDを取得
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const id = payload.sub || payload.id || payload.userId;
          if (id) setCurrentUserId(String(id));
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    async function fetchAnswers() {
      if (!isUsingBackend()) {
        // ダミーデータ
        if (itemType === "question") {
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

          if (isUsingBackend()) {
            try {
              const { getAllProfiles } = await import("@/lib/profileApi");
              const profiles = await getAllProfiles().catch(() => []);
              fetchedAnswers = fetchedAnswers.map((c: any) => {
                const uId = c.user_id?.id || c.user_id || c.userId?.id || c.userId || c.userid?.id || c.userid;
                if (uId && profiles.length > 0) {
                  const p = profiles.find((pr) => pr.user && pr.user.id === uId);
                  if (p) {
                    c.username = p.user?.username || c.username;
                    c.avatarUrl = p.profile?.avatarUrl || (p.profile as any)?.avatar_url;
                  }
                }
                return c;
              });
            } catch (e) {
              console.error("[AnswersSection] プロフィール情報取得エラー:", e);
            }
          }

          if (isUsingBackend() && itemType === "question") {
            fetchedAnswers = await Promise.all(fetchedAnswers.map(async (c: any) => {
              try {
                const scoreRes = await fetchWithAuth(`/answers/score/${c.id}`);
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
      const userIdToUse = currentUserId || "1";

      // バックエンドのDTO（CreateAnswerDto / CreateCommentDto）に合わせてプロパティ名を変更
      // content -> comment
      // question_id -> questionid, post_id -> postid
      const payload =
        itemType === "question"
          ? {
            questionId: questionId ?? postId,
            comment: inputText,
            userId: userIdToUse
          }
          : {
            postId: postId,
            comment: inputText,
            userId: userIdToUse
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
        if (!savedAnswer.username && !savedAnswer.userId?.username && !savedAnswer.userid?.username && typeof window !== "undefined") {
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

  // 自分のコメントかどうか判定するヘルパー関数
  const isMyComment = (c: AnswerData) => {
    if (!currentUserId) return false;
    const commentUserId = c.userId?.id ?? c.userId ?? c.userid?.id ?? c.userid ?? c.user_id?.id ?? c.user_id;
    return String(commentUserId) === String(currentUserId);
  };

  // 編集送信の処理
  const handleEditSubmit = async () => {
    if (!editingAnswer || !editInputText.trim()) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      if (isUsingBackend()) {
        if (itemType === "creation") {
          // コメントの編集APIとの疎通
          const editEndpoint = `/comments/update/${editingAnswer.id}`;

          const response = await fetchWithAuth(editEndpoint, {
            method: "PATCH",
            body: JSON.stringify({
              comment: editInputText,
              postId: postId,
              userId: currentUserId || "1"
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "編集に失敗しました");
          }
        } else {
          // 回答の編集APIとの疎通
          const editEndpoint = `/answers/update/${editingAnswer.id}`;

          const response = await fetchWithAuth(editEndpoint, {
            method: "PATCH",
            body: JSON.stringify({
              comment: editInputText,
              questionId: questionId ?? postId,
              userId: currentUserId || "1"
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "編集に失敗しました");
          }
        }
      }

      // API通信成功（またはAPI未使用/未実装）後、フロント側の状態を更新する
      setAnswers(prevAnswers => prevAnswers.map(ans => {
        if (ans.id === editingAnswer.id) {
          // 元のデータ構造を維持しつつ、テキスト部分を更新
          const updated = { ...ans };
          if (updated.content !== undefined) updated.content = editInputText;
          if (updated.comment !== undefined) updated.comment = editInputText;
          if (updated.answer !== undefined) updated.answer = editInputText;
          // どれにも該当しない場合は新しくプロパティをセットしないが、念のため
          if (updated.content === undefined && updated.comment === undefined && updated.answer === undefined) {
            updated.comment = editInputText;
          }
          return updated;
        }
        return ans;
      }));

      setEditingAnswer(null);
      alert("編集が完了しました");
    } catch (err) {
      console.error(`[AnswersSection] 編集エラー:`, err);
      setEditError(`${label}の編集に失敗しました。`);
    } finally {
      setEditSubmitting(false);
    }
  };

  // 削除の処理
  const handleDeleteAnswer = async (id: string | number) => {
    if (!window.confirm("本当に削除しますか？")) return;

    try {
      if (isUsingBackend()) {
        if (itemType === "creation") {
          // コメントの削除API
          const deleteEndpoint = `/comments/delete/${id}`;
          const response = await fetchWithAuth(deleteEndpoint, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "削除に失敗しました");
          }
        } else {
          // 回答の削除API
          const deleteEndpoint = `/answers/delete/${id}`;
          const response = await fetchWithAuth(deleteEndpoint, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "削除に失敗しました");
          }
        }
      }

      // 成功したら画面上から消す
      setAnswers(prevAnswers => prevAnswers.filter(ans => ans.id !== id));
      setOpenMenuId(null);
      alert("削除が完了しました");
    } catch (err) {
      console.error(`[AnswersSection] 削除エラー:`, err);
      alert(`${label}の削除に失敗しました。`);
    }
  };

  // ユーザー名を取得するヘルパー関数
  const getUsername = (c: AnswerData) => {
    if (c.username) return c.username;
    if (c.userId && c.userId.username) return c.userId.username;
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
                    <Link href={`/profile?userId=${c.user_id?.id || c.user_id || c.userId?.id || c.userId || c.userid?.id || c.userid || ''}`} className="flex items-center hover:text-blue-600 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 font-bold text-sm border border-blue-100 overflow-hidden">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl.startsWith('http') ? c.avatarUrl : `${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}${c.avatarUrl}`} alt={getUsername(c)} className="w-full h-full object-cover" />
                        ) : (
                          getUsername(c)[0]
                        )}
                      </div>
                      {getUsername(c)}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-400 font-medium">{formatDate(c.created_at)}</div>
                    {itemType === "question" && <AnswersScoreButton initialCount={c.score || 0} answerId={c.id} />}
                    {isMyComment(c) && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition focus:outline-none"
                          aria-label="メニューを開く"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {openMenuId === c.id && (
                          <>
                            {/* バックドロップ：画面全体を覆い、クリックでメニューを閉じる */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            ></div>

                            {/* ドロップダウンメニュー */}
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-100">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setEditingAnswer(c);
                                  setEditInputText(getDisplayContent(c));
                                  setEditError(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition flex items-center font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteAnswer(c.id)}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                削除
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
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

      {/* 編集モーダル */}
      {editingAnswer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">{label}の編集</h3>
            {editError && (
              <div className="mb-3 text-red-500 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {editError}
              </div>
            )}
            <textarea
              value={editInputText}
              onChange={(e) => setEditInputText(e.target.value)}
              rows={5}
              className="border border-gray-200 bg-gray-50 p-4 w-full mb-5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent resize-y transition-colors"
              disabled={editSubmitting}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingAnswer(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition"
                disabled={editSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editSubmitting || !editInputText.trim()}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center"
              >
                {editSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    保存中...
                  </>
                ) : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
