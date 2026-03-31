import { cookies } from 'next/headers';
import { AUTH_ENDPOINTS } from '../_backend/api-endpoints';

const REFRESH_TOKEN_COOKIE = 'him_refresh_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7일 (refreshToken 수명과 동일)

// ── 서버 메모리 토큰 캐시 (refreshToken → accessToken) ──
const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

/** JWT payload에서 만료 시각을 추출한다 */
function getJwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    );
    return (payload.exp ?? 0) * 1000; // ms
  } catch {
    return 0;
  }
}

/** 쿠키에서 refreshToken을 읽는다 */
export async function getRefreshToken(): Promise<string> {
  try {
    const store = await cookies();
    return store.get(REFRESH_TOKEN_COOKIE)?.value ?? '';
  } catch {
    return '';
  }
}

/** refreshToken 쿠키를 설정한다 (응답에 Set-Cookie 추가) */
export async function setRefreshTokenCookie(refreshToken: string) {
  const store = await cookies();
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

/** refreshToken 쿠키를 삭제한다 */
export async function clearRefreshTokenCookie() {
  const store = await cookies();
  store.delete(REFRESH_TOKEN_COOKIE);
}

/** 토큰 쌍을 메모리에 저장한다 */
export function cacheTokens(refreshToken: string, accessToken: string) {
  tokenCache.set(refreshToken, {
    accessToken,
    expiresAt: getJwtExpiry(accessToken),
  });
}

/** 메모리 캐시에서 토큰을 제거한다 */
export function evictTokens(refreshToken: string) {
  tokenCache.delete(refreshToken);
}

/**
 * 유효한 accessToken을 반환한다.
 * 메모리에 있으면 반환, 만료됐거나 없으면 refreshToken으로 갱신한다.
 * 갱신 실패 시 빈 문자열을 반환한다.
 */
export async function getAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return '';

  // 메모리 캐시 확인 — 만료 60초 전부터 갱신
  const cached = tokenCache.get(refreshToken);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  // refreshToken으로 갱신
  try {
    const res = await fetch(AUTH_ENDPOINTS.토큰갱신, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // refresh 실패 — 캐시 제거
      tokenCache.delete(refreshToken);
      return '';
    }

    const data: { accessToken: string; refreshToken: string } =
      await res.json();

    // 이전 캐시 제거
    tokenCache.delete(refreshToken);

    // 새 토큰 캐시 및 쿠키 갱신
    cacheTokens(data.refreshToken, data.accessToken);
    await setRefreshTokenCookie(data.refreshToken);

    return data.accessToken;
  } catch {
    return '';
  }
}
