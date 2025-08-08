// Lightweight cookie utilities without external deps
export type CookieOptions = {
  expires?: Date | number; // Date or seconds from now
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};`;

  if (options.expires) {
    const expiresDate =
      typeof options.expires === "number"
        ? new Date(Date.now() + options.expires * 1000)
        : options.expires;
    cookie += `expires=${expiresDate.toUTCString()};`;
  }

  cookie += `path=${options.path ?? "/"};`;
  cookie += `SameSite=${options.sameSite ?? "Lax"};`;
  if (options.secure) cookie += "Secure;";

  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split("; ");
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i];
    if (c.startsWith(nameEQ)) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

export function deleteCookie(name: string, path: string = "/") {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax;`;
}
