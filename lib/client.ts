"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | undefined;
export function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Chưa cấu hình dịch vụ tài khoản. Xem hướng dẫn cài đặt trong README.",
    );
  return (client ??= createClient(url, key));
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await authClient().auth.getSession();
  if (!session)
    throw new Error("Phiên đăng nhập đã kết thúc. Hãy đăng nhập lại.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Không thể thực hiện. Vui lòng thử lại.");
  return data;
}
