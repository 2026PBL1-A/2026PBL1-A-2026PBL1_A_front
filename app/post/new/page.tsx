"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { isUsingBackend, fetchWithAuth } from "@/lib/api";
import InappropriateWordWarningModal from "@/app/components/InappropriateWordWarningModal";
//import Image from "next/image";

// バックエンドの禁止ワード置換APIのレスポンス型
interface BannedWordsReplaceResponse {
  replacedContent: string;
}

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const [image, setImage] = useState<File | null>(null);

  // --- 不適切ワード警告モーダル用のステート ---
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isWarningSubmitting, setIsWarningSubmitting] = useState(false);
  const [detectedWords, setDetectedWords] = useState<string[]>([]);

  // 伏字置換済みのテキストを保持（モーダルで「伏字にして投稿」を選んだ時に使用）
  const replacedTitleRef = useRef("");
  const replacedContentRef = useRef("");

  /**
   * バックエンドの禁止ワード置換APIを呼び出す
   * テキストに禁止ワードが含まれていれば、伏字に置換されたテキストが返る
   */
  const checkBannedWords = async (
    text: string
  ): Promise<{ replaced: string; hasChanges: boolean }> => {
    try {
      const response = await fetchWithAuth("/banned-words/replace", {
        method: "PATCH",
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        // APIエラーの場合はチェックをスキップして元テキストをそのまま使う
        console.warn("[BannedWords] チェックAPIエラー:", response.status);
        return { replaced: text, hasChanges: false };
      }

      const data: BannedWordsReplaceResponse = await response.json();
      const hasChanges = data.replacedContent !== text;
      return { replaced: data.replacedContent, hasChanges };
    } catch (error) {
      console.warn("[BannedWords] チェック処理に失敗:", error);
      return { replaced: text, hasChanges: false };
    }
  };

  /**
   * 元テキストと置換済みテキストを比較して、置換された（＝検出された）ワードを抽出する
   */
  const extractDetectedWords = (
    original: string,
    replaced: string
  ): string[] => {
    const words: string[] = [];
    let i = 0;
    let j = 0;

    while (i < original.length && j < replaced.length) {
      if (original[i] === replaced[j]) {
        i++;
        j++;
      } else {
        // 不一致が見つかった → 元テキスト側の不適切ワードを抽出
        let wordEnd = i;
        let maskEnd = j;

        // 置換先（伏字）の * 部分をスキップ
        while (maskEnd < replaced.length && replaced[maskEnd] === "*") {
          maskEnd++;
        }

        // 元テキスト側で、置換先の末尾の次の文字と一致する位置まで進む
        if (maskEnd < replaced.length) {
          while (
            wordEnd < original.length &&
            original[wordEnd] !== replaced[maskEnd]
          ) {
            wordEnd++;
          }
        } else {
          // 置換がテキスト末尾まで続く場合
          wordEnd = original.length;
        }

        const detectedWord = original.substring(i, wordEnd);
        if (detectedWord.length > 0) {
          words.push(detectedWord);
        }

        i = wordEnd;
        j = maskEnd;
      }
    }

    // 残りの元テキスト部分も対象
    if (i < original.length) {
      const remaining = original.substring(i);
      if (remaining.length > 0) {
        words.push(remaining);
      }
    }

    // 重複を除去して返す
    return [...new Set(words)];
  };

  /**
   * 実際の投稿処理（禁止ワードチェック済みのテキストで送信）
   */
  const submitPost = async (
    submitTitle: string,
    submitContent: string
  ) => {
    setIsLoading(true);
    try {
      if (isUsingBackend()) {
        // バックエンドに投稿を送信
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: submitTitle,
            tag: category,
            content: submitContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `投稿に失敗しました (${response.status})`
          );
        }

        console.info("[Post] バックエンドに投稿を送信しました");
        alert("投稿しました");
      } else {
        // ローカルモード（ダミー処理）
        console.info("[Post] ローカルダミーで投稿を処理しました", {
          title: submitTitle,
          category,
          content: submitContent,
        });
        alert("投稿しました（ローカル）");
      }

      // 投稿後に一覧へ遷移
      router.push("/list");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "投稿に失敗しました";
      console.error("[Post] 投稿エラー:", message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * フォーム送信ハンドラー
   * 1. バリデーション
   * 2. 禁止ワードチェック（バックエンドAPI呼び出し）
   * 3. 禁止ワードがあればモーダル表示、なければそのまま投稿
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !content) {
      alert("すべてのフィールドを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      // タイトルと本文の両方を禁止ワードチェック
      const [titleResult, contentResult] = await Promise.all([
        checkBannedWords(title),
        checkBannedWords(content),
      ]);

      if (titleResult.hasChanges || contentResult.hasChanges) {
        // 禁止ワードが検出された → モーダルを表示
        replacedTitleRef.current = titleResult.replaced;
        replacedContentRef.current = contentResult.replaced;

        // 検出されたワードを抽出
        const titleWords = titleResult.hasChanges
          ? extractDetectedWords(title, titleResult.replaced)
          : [];
        const contentWords = contentResult.hasChanges
          ? extractDetectedWords(content, contentResult.replaced)
          : [];
        setDetectedWords([...new Set([...titleWords, ...contentWords])]);

        setIsWarningOpen(true);
        setIsLoading(false);
        return;
      }

      // 禁止ワードなし → そのまま投稿
      await submitPost(title, content);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "禁止ワードチェックに失敗しました";
      console.error("[Post] エラー:", message);
      alert(message);
      setIsLoading(false);
    }
  };

  /**
   * モーダルで「伏字にして投稿」を選んだ場合のハンドラー
   */
  const handleProceedWithCensored = async () => {
    setIsWarningSubmitting(true);
    try {
      await submitPost(replacedTitleRef.current, replacedContentRef.current);
    } finally {
      setIsWarningSubmitting(false);
      setIsWarningOpen(false);
    }
  };

  /**
   * モーダルで「修正に戻る」を選んだ場合のハンドラー
   */
  const handleCloseWarning = () => {
    setIsWarningOpen(false);
    setDetectedWords([]);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-10 border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            投稿作成
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="タイトルを入力"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">選択してください</option>
                <option value="creation">制作物</option>
                <option value="question">質問</option>
              </select>
            </div>

            {/* 本文 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                本文
              </label>
              <textarea
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-3 py-2 min-h-[140px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="本文を入力"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* 投稿・キャンセルボタン */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => router.push("/list")}
                disabled={isLoading}
                className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "投稿中..." : "投稿"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 不適切ワード警告モーダル */}
      <InappropriateWordWarningModal
        isOpen={isWarningOpen}
        detectedWords={detectedWords}
        onClose={handleCloseWarning}
        onProceed={handleProceedWithCensored}
        isSubmitting={isWarningSubmitting}
      />
    </>
  );
}