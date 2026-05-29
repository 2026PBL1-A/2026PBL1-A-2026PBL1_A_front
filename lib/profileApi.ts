import { apiCall } from "@/lib/api";

export interface CreateProfileRequest {
  bio?: string;
}

// タグデータの型定義
export interface TagData {
  id: string;
  tag: string;
}

// プロフィールとタグの関連を表す型定義
export interface ProfileTagData {
  profile_id: string;
  tag_id: string;
  tag: TagData;
}

export interface ProfileData {
  id: string;
  user_id: string;
  bio?: string;
  profileTags?: ProfileTagData[];
  avatarUrl?: string;
}

export interface UserData {
  id: string;
  username?: string;
  email?: string;
}

export interface ProfileResponse {
  profile: ProfileData;
  user: UserData | null;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  tag_ids?: string[];
}

export interface UpdateProfileResponse {
  user: {
    id: string;
    username: string;
  };
  profile: {
    id: string;
    user_id: string;
    bio?: string;
    profileTags?: ProfileTagData[];
    avatarUrl?: string;
  };
}

export interface ProfilePostData {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  score?: number;
}

// プロフィール関連 API をまとめた専用モジュール
export async function createProfile(payload: CreateProfileRequest): Promise<ProfileData> {
  return apiCall<ProfileData>("/profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  return apiCall<UpdateProfileResponse>("/profiles", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// プロフィールの一覧を取得する API 呼び出し関数
export interface CreateTagRequest {
  tag: string;
}

export interface UpdatePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// パスワード更新 API 呼び出し関数
export async function updatePassword(payload: UpdatePasswordRequest): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // バックエンドのパスワード更新 API を呼び出す
  const response = await fetch("/api/profiles/password", {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  // 4xx/5xx は成功レスポンスではないのでエラーハンドリングへ移す
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // 401エラー（現在のパスワード間違い）の場合でもログアウトさせず、エラーとして投げる
    throw new Error(errorData.message || "現在のパスワードが間違っています");
  }
}

// プロフィールの一覧を取得する API 呼び出し関数
export async function getAllProfiles(): Promise<ProfileResponse[]> {
  return apiCall<ProfileResponse[]>("/profiles", { method: "GET" });
}

// タグの一覧を取得する API 呼び出し関数
export async function getAllTags(): Promise<TagData[]> {
  return apiCall<TagData[]>("/tags", { method: "GET" });
}

// タグを新規作成する API 呼び出し関数
export async function createTag(payload: CreateTagRequest): Promise<TagData> {
  return apiCall<TagData>("/tags", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// profileId を基点に詳細と所有投稿を取得する
export async function getProfile(profileId: string): Promise<ProfileResponse> {
  return apiCall<ProfileResponse>(`/profiles/${encodeURIComponent(profileId)}`, { method: "GET" });
}

// プロフィール所有者の投稿一覧を取得
export async function getProfilePosts(profileId: string): Promise<ProfilePostData[]> {
  return apiCall<ProfilePostData[]>(`/profiles/${encodeURIComponent(profileId)}/posts`, {
    method: "GET",
  });
}

// プロフィール所有者の質問一覧を取得
export async function getProfileQuestions(profileId: string): Promise<ProfilePostData[]> {
  return apiCall<ProfilePostData[]>(`/profiles/${encodeURIComponent(profileId)}/questions`, {
    method: "GET",
  });
}

// プロフィール画像をアップロードする API 呼び出し関数
export async function uploadProfileAvatar(profileId: string, file: File): Promise<{ message: string; avatar_url: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/profiles/avatar/upload/${encodeURIComponent(profileId)}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "画像のアップロードに失敗しました");
  }

  return response.json();
}