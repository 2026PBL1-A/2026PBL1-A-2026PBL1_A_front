"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/aikon";
import Image from "next/image";
import { isUsingBackend } from "@/lib/api";
import {
  getAllTags,
  createTag,
  updatePassword,
  updateProfile,
  uploadProfileAvatar,
} from "@/lib/profileApi";

export default function ProfileEditPage() {
  const router = useRouter();
  
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
  typeof window !== "undefined"
    ? localStorage.getItem("avatar_url")
    : null
);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState<string | null>("");
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  
  // 技術スタック選択用のステート
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: string; tag: string }[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const techStacks = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "Java",
    "C",
    "C++",
    "Docker",
    "AWS",
    "MySQL",
    "PostgreSQL",
    "TailwindCSS",
    "Figma",
  ];
  const skillCandidates = isUsingBackend()
    ? availableTags.map((tag) => tag.tag)
    : techStacks;

  // パスワード変更モーダル用のステート
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const icons = [
  "/icons/さくらんぼアイコン.png",
  "/icons/チューリップアイコン.png",
  "/icons/幾何学図形アイコン.png",
  "/icons/魚アイコン.png",
  "/icons/犬アイコン.png",
  "/icons/人食いザメアイコン.png",
  "/icons/闘牛アイコン.png",
  "/icons/狼アイコン.png",
  ];
  useEffect(() => {
    // 既存のユーザー情報を読み込む
    const storedName = localStorage.getItem("user_name");
    const storedBio = localStorage.getItem("user_bio");
    const storedSkills = localStorage.getItem("user_skills");

    if (storedSkills) {
      setSelectedSkills(JSON.parse(storedSkills));
    }

    if (storedName) setUserName(storedName);
    if (storedBio && storedBio !== "null") {
      setBio(storedBio);
    } else {
      setBio("");
    }

    // バックエンド使用モードならタグも読み込む
    const loadTags = async () => {
      // バックエンドを使用しないモードならタグの読み込みはスキップする
      if (!isUsingBackend()) {
        return;
      }

      try {
        // バックエンドからタグを取得して選択肢をセットする
        const tags = await getAllTags();
        const storedSkillIds = localStorage.getItem("user_skill_ids");

        // 取得したタグを選択肢としてセットする
        setAvailableTags(tags);

        // ローカルに保存されているタグIDを読み込んで選択状態を復元する
        if (storedSkillIds) {
          try {
            // 文字列から配列に変換して、タグIDの配列としてセットする
            const parsedIds = JSON.parse(storedSkillIds);
            if (Array.isArray(parsedIds)) {
              setSelectedTagIds(parsedIds.filter((id): id is string => typeof id === "string"));
            }
          } catch {
            // JSON.parse に失敗した場合は何もしない（選択状態は復元されないが、タグの表示自体はされる）
            localStorage.removeItem("user_skill_ids");
          }
        }
      } catch (error) {
        // タグの取得に失敗しても画面自体は表示できるようにエラーをキャッチする
        console.error("タグ読み込みエラー:", error);
      }
    };

    // タグを読み込む（バックエンド使用モードの場合）
    loadTags();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (skill: string) => {
    const tagId = availableTags.find((tag) => tag.tag === skill)?.id;

    setSelectedSkills((prev) => {
      const nextSkills = prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill];

      if (tagId) {
        setSelectedTagIds((current) =>
          prev.includes(skill)
            ? current.filter((id) => id !== tagId)
            : current.includes(tagId)
              ? current
              : [...current, tagId]
        );
      }

      return nextSkills;
    });
  };

  const addCustomSkill = () => {
    if (
      customSkill.trim() &&
      !selectedSkills.includes(customSkill)
    ) {
      const normalizedSkill = customSkill.trim();
      const matchedTagId = availableTags.find((tag) => tag.tag === normalizedSkill)?.id;

      setSelectedSkills((prev) => [
        ...prev,
        normalizedSkill,
      ]);

      if (matchedTagId) {
        setSelectedTagIds((current) =>
          current.includes(matchedTagId) ? current : [...current, matchedTagId]
        );
      }

      setCustomSkill("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalAvatarUrl = avatarUrl;

      if (isUsingBackend()) {
        // API 経由でプロフィールを更新する
        const payload: { username?: string; bio?: string; tag_ids?: string[] } = {};
        const uniqueSelectedSkills = Array.from(new Set(selectedSkills.map((skill) => skill.trim()).filter(Boolean)));
        const existingTagNames = new Set(availableTags.map((tag) => tag.tag));
        const missingTags = uniqueSelectedSkills.filter((skill) => !existingTagNames.has(skill));

        // バックエンドに存在しないタグは先に作成しておく
        if (missingTags.length > 0) {
          await Promise.all(missingTags.map((skill) => createTag({ tag: skill })));
        }

        // タグを再取得して最新のタグリストを得る（新規作成したタグのIDを取得するため）
        const refreshedTags = await getAllTags();
        setAvailableTags(refreshedTags);

        const resolvedTagIds = Array.from(
          new Set([
            ...selectedTagIds,
            ...uniqueSelectedSkills
              .map((skill) => refreshedTags.find((tag) => tag.tag === skill)?.id)
              .filter((tagId): tagId is string => Boolean(tagId)),
          ])
        );

        // username は空文字を送らず、入力があるときだけ更新する
        if (userName.trim()) {
          payload.username = userName.trim();
        }
        // 自己紹介は空でも送って、画面表示と保存内容を揃える
        payload.bio = bio ?? "";
        payload.tag_ids = resolvedTagIds;

        // API でプロフィールを更新して返ってきた内容をローカルに保存する
        const result = await updateProfile(payload);
        
        if (avatarFile) {
          const profileIdStr = result.profile?.id || localStorage.getItem("profile_id");
          if (profileIdStr) {
            const uploadResult = await uploadProfileAvatar(profileIdStr, avatarFile);
            if (uploadResult.avatar_url) {
              finalAvatarUrl = uploadResult.avatar_url;
            }
          }
        }

        // 以後のプロフィール取得に使うため、返却された ID を保存する
        if (result.user?.id) {
          localStorage.setItem("user_id", result.user.id);
        }
          if (result.user?.username) {
            localStorage.setItem("user_name", result.user.username);
          }
        if (result.profile?.id) {
          localStorage.setItem("profile_id", result.profile.id);
        }
        if (result.profile?.profileTags) {
          const updatedTagNames = result.profile.profileTags
            .map((profileTag) => profileTag.tag?.tag)
            .filter((tag): tag is string => Boolean(tag && tag.trim()));
          const updatedTagIds = result.profile.profileTags
            .map((profileTag) => profileTag.tag_id)
            .filter((tagId): tagId is string => Boolean(tagId));

          setSelectedSkills(updatedTagNames);
          setSelectedTagIds(updatedTagIds);
          localStorage.setItem("user_skills", JSON.stringify(updatedTagNames));
          localStorage.setItem("user_skill_ids", JSON.stringify(updatedTagIds));
        }
      }

      // localStorage も更新して既存画面の表示を即時反映
      localStorage.setItem("user_name", userName);
      if (finalAvatarUrl) {
        localStorage.setItem("avatar_url", finalAvatarUrl);
      }
      localStorage.setItem("user_bio", bio ?? "");

      router.push("/profile");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("プロフィールの保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
    localStorage.setItem(
      "user_skills",
      JSON.stringify(selectedSkills)
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("新しいパスワードと確認用パスワードが一致しません");
      return;
    }

    try {
      if (isUsingBackend()) {
        // バックエンドモード：パスワード変更APIを呼び出す
        // ※実際のエンドポイントやパラメータ名はバックエンドチームの仕様に合わせて変更してください
        await updatePassword({
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword
        });
      } else {
        // ローカルモード：ダミー検証（loginでのダミーパスワード 'pass1234' を正とする）
        if (currentPassword !== "pass1234") {
          throw new Error("現在のパスワードが間違っています（ダミー検証: pass1234を入力してください）");
        }
      }

      // 成功した場合
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("パスワード変更エラー:", error);
      const message = error instanceof Error ? error.message : "パスワードの変更に失敗しました";
      setPasswordError(message);
    }
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Menu />
      
      <div className="max-w-2xl mx-auto pt-24 px-4">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link href="/profile" className="text-gray-500 hover:text-gray-700 flex items-center transition w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            キャンセルして戻る
          </Link>
        </div>

        {/* 編集フォームカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8">
          <h1 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">
            プロフィール編集
          </h1>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* アイコン画像 */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0 mb-4 relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 font-bold text-3xl">?</span>
                )}
                
                {/* オーバーレイ */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageChange}
                />
              </div>
              <p className="text-xs text-gray-500">アイコンをクリックして画像を変更</p>
            </div>

            <div className="space-y-4">
      {/* 開くボタン */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        アイコンを選ぶ
      </button>

      {/* 選択中アイコン */}
      {avatarUrl && (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            選択中のアイコン
          </p>

          <Image
            src={avatarUrl}
            alt="selected icon"
            width={80}
            height={80}
            className="rounded-full object-cover"
          />
        </div>
      )}

      {/* アイコン一覧 */}
      {open && (
        <div className="flex gap-4 flex-wrap">
          {icons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={async () => {
                setAvatarUrl(icon);
                setOpen(false);
                try {
                  const response = await fetch(icon);
                  const blob = await response.blob();
                  const file = new File([blob], icon.split('/').pop() || 'icon.png', { type: blob.type });
                  setAvatarFile(file);
                } catch (e) {
                  console.error("デフォルトアイコンのファイル化に失敗しました:", e);
                }
              }}
              className={`p-1 rounded-full border-4 transition hover:scale-105 ${
                avatarUrl === icon
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
            >
              <Image
                src={icon}
                alt="icon"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>

            {/* 表示名 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                表示名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                placeholder="あなたの名前を入力"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            {/* 自己紹介 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                placeholder="自己紹介やスキルなどを入力してください"
                value={bio ?? ""}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* 技術スタック */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                技術スタック
              </label>

              {/* 選択中 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                  >
                    {skill} ×
                  </button>
                ))}
              </div>

              {/* 技術スタック候補 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {skillCandidates.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      selectedSkills.includes(skill)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              {/* 自由入力 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="技術を追加"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                />

                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  追加
                </button>
              </div>
            </div>

            {/* パスワード変更ボタン */}
            <div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 transition"
              >
                パスワードを変更する
              </button>
            </div>


            {/* ボタングループ */}
            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving || !userName.trim()}
                className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? "保存中..." : "変更を保存する"}
              </button>
            </div>
            
          </form>
        </div>
      </div>

      {/* パスワード変更モーダル */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              パスワード変更
            </h2>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  新しいパスワード (確認)
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="w-1/2 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  className="w-1/2 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  変更する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
