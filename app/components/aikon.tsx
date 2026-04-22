"use client";
import { useState } from "react";

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
        <div className="absolute top-10 right-0 bg-white shadow p-4 flex gap-4">
            <button className="px-4 py-2 whitespace-nowrap">
                ログアウト
            </button>
        </div>
      )}
    </div>
  );
}