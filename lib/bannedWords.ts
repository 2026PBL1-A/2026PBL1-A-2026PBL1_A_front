import { fetchWithAuth } from "./api";
import { BannedWordsReplaceResponse } from "@/app/components/InappropriateWordWarningModal";

/**
 * バックエンドの禁止ワード置換APIを呼び出す
 * テキストに禁止ワードが含まれていれば、伏字に置換されたテキストが返る
 */
export async function checkBannedWords(
  text: string
): Promise<{ replaced: string; hasChanges: boolean }> {
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
}

/**
 * 元テキストと置換済みテキストを比較して、置換された（＝検出された）ワードを抽出する
 */
export function extractDetectedWords(
  original: string,
  replaced: string
): string[] {
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
}
