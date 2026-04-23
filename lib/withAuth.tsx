"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/**
 * 保護ページ用HOC
 * - ログイン状態を確認
 * - トークンがない場合はログインページへ遷移
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  // HOC が返す実体コンポーネント
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    useEffect(() => {
      // 未ログインなら閲覧不可ページからログイン画面へ誘導
      if (!isLoggedIn) {
        router.push("/login");
      }
    }, [isLoggedIn, router]);

    if (!isLoggedIn) {
      // リダイレクトが完了するまで内容を描画しない
      return null; // ローディング中は何も表示しない
    }

    return <Component {...props} />;
  };
}
