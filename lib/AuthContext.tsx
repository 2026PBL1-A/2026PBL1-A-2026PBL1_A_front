"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface AuthContextType {
  // localStorage に保存した access_token
  token: string | null;
  // token の有無を boolean で扱いやすくした値
  isLoggedIn: boolean;
  // token 削除 + 状態更新をまとめたログアウト関数
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  // hydration 前後で UI がずれないよう、初期化完了フラグを持つ
  const [isHydrated, setIsHydrated] = useState(false);

  // クライアント側でのみ localStorage にアクセス
  useEffect(() => {
    // ページ再読み込み時もログイン状態を復元
    const storedToken = localStorage.getItem("access_token");
    setToken(storedToken);
    setIsHydrated(true);
  }, []);

  const logout = () => {
    // 明示ログアウト時は保存値とメモリ上の状態を両方クリア
    localStorage.removeItem("access_token");
    setToken(null);
  };

  if (!isHydrated) {
    // 初期化完了前に子を描画するとログイン判定が一瞬ずれるため待機
    return null; // hydration の完了を待つ
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoggedIn: !!token,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
