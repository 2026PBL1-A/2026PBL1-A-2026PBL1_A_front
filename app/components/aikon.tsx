"use client";
import { useState } from "react";
import Link from "@/app/components/Link";

export default function Menu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4">
      {/* アイコン */}
      <button onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* メニュー */}
      {open && (
        <div className="absolute top-10 right-0 bg-white shadow p-4 flex gap-4 min-w-[120px]">
          <Link href="/login">
            ログアウト
          </Link>
        </div>
      )}
    </div>
  );
}