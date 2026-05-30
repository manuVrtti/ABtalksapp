import { cookies } from "next/headers";

export const REF_COOKIE_NAME = "abtalks_ref";
const REF_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/** Only callable from Server Actions or Route Handlers — not from RSC pages. */
export async function setRefCookie(code: string) {
  if (!code || code.length > 32) return;
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) return;

  const store = await cookies();
  store.set(REF_COOKIE_NAME, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REF_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getRefCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(REF_COOKIE_NAME)?.value ?? null;
}

export async function clearRefCookie() {
  const store = await cookies();
  store.delete(REF_COOKIE_NAME);
}
