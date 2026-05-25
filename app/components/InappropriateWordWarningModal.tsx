"use client";

import React from "react";

// バックエンドから返却される警告の型定義の想定
// 例: APIが 400 Bad Request と共に下記のようなJSONを返すことを想定
export interface InappropriateWordWarningResponse {
  error: string;
  code: "INAPPROPRIATE_WORDS_DETECTED";
  detectedWords: string[]; // 検出された不適切なワードのリスト
}

interface InappropriateWordWarningModalProps {
  isOpen: boolean;
  detectedWords: string[];
  onClose: () => void; // 修正に戻る
  onProceed: () => void; // 伏字にして投稿する（続行）
  isSubmitting?: boolean; // 処理中かどうか
}

export default function InappropriateWordWarningModal({
  isOpen,
  detectedWords,
  onClose,
  onProceed,
  isSubmitting = false,
}: InappropriateWordWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg 
              className="w-6 h-6 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          <h3 
            id="modal-title" 
            className="text-lg font-bold text-center text-gray-900 mb-2"
          >
            不適切な表現が検出されました
          </h3>
          
          <p className="text-sm text-gray-600 text-center mb-6">
            投稿内容に以下の不適切な言葉が含まれている可能性があります。ガイドラインに沿った内容に修正するか、伏字（***）に置き換えて投稿を続けることができます。
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              検出されたワード
            </span>
            <ul className="flex flex-wrap gap-2">
              {detectedWords.map((word, index) => (
                <li 
                  key={index}
                  className="px-3 py-1 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-full shadow-sm"
                >
                  {word}
                </li>
              ))}
              {detectedWords.length === 0 && (
                <li className="text-sm text-gray-400">不明なワード</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
            >
              修正に戻る
            </button>
            <button
              type="button"
              onClick={onProceed}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </>
              ) : (
                '伏字にして投稿'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
