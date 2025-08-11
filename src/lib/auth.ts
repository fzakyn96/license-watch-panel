import { deleteCookie, getCookie } from "./cookies";

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_NAME_KEY = "auth_name";
export const AUTH_GROUP_KEY = "auth_group";
export const AUTH_EXPIRES_AT_KEY = "auth_expires_at"; // epoch ms

export function isAuthenticated(): boolean {
  const token = getCookie(AUTH_TOKEN_KEY);
  const expStr = getCookie(AUTH_EXPIRES_AT_KEY);
  const exp = expStr ? parseInt(expStr, 10) : 0;
  
  console.log("isAuthenticated() check:");
  console.log("- token:", token ? "exists" : "null");
  console.log("- expStr:", expStr);
  console.log("- exp:", exp);
  console.log("- Date.now():", Date.now());
  console.log("- exp > Date.now():", exp > Date.now());
  
  const result = Boolean(token && exp && exp > Date.now());
  console.log("- final result:", result);
  
  return result;
}

export function logout() {
  [AUTH_TOKEN_KEY, AUTH_NAME_KEY, AUTH_GROUP_KEY, AUTH_EXPIRES_AT_KEY].forEach((k) =>
    deleteCookie(k)
  );
}

export function getAuth() {
  const token = getCookie(AUTH_TOKEN_KEY);
  const name = getCookie(AUTH_NAME_KEY);
  const group = getCookie(AUTH_GROUP_KEY);
  const expiresAt = Number(getCookie(AUTH_EXPIRES_AT_KEY) || 0);
  return { token, name, group, expiresAt };
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const { token } = getAuth();

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  // If token invalid/expired on server, clean up client state
  if (res.status === 401) {
    logout();
  }

  return res;
}
