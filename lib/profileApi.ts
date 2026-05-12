import { apiCall } from "@/lib/api";

export interface CreateProfileRequest {
  bio?: string;
  tag?: string;
}

export interface ProfileData {
  id: string;
  user_id: string;
  bio?: string;
  tag?: string;
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
    tag?: string;
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

export interface UpdatePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export async function updatePassword(payload: UpdatePasswordRequest): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch("/api/profiles/password", {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // 401エラー（現在のパスワード間違い）の場合でもログアウトさせず、エラーとして投げる
    throw new Error(errorData.message || "現在のパスワードが間違っています");
  }
}

export async function getAllProfiles(): Promise<ProfileResponse[]> {
  return apiCall<ProfileResponse[]>("/profiles", { method: "GET" });
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