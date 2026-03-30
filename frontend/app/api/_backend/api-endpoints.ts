const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4200';

const api = (path: string) => `${BASE_URL}/api${path}`;
const dynamic = (path: string) => (id: string) =>
  api(path.replace('{id}', id));

// ── Auth ──
export const AUTH_ENDPOINTS = {
  회원가입: api('/auth/signup'),
  로그인: api('/auth/login'),
  토큰갱신: api('/auth/refresh'),
  로그아웃: api('/auth/logout'),
  이메일인증: api('/auth/verify-email'),
  내정보: api('/auth/me'),
  비밀번호변경: api('/auth/password'),
} as const;

// ── Household ──
export const HOUSEHOLD_ENDPOINTS = {
  목록_및_생성: api('/households'),
  단건: dynamic('/households/{id}'),
} as const;

// ── Household Members ──
export const MEMBER_ENDPOINTS = {
  목록_및_추가: (householdId: string) =>
    api(`/households/${householdId}/members`),
  역할변경: (householdId: string, memberId: string) =>
    api(`/households/${householdId}/members/${memberId}/role`),
  제거: (householdId: string, memberId: string) =>
    api(`/households/${householdId}/members/${memberId}`),
} as const;

// ── Invitation ──
export const INVITATION_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/invitations`),
  취소: (householdId: string, invitationId: string) =>
    api(`/households/${householdId}/invitations/${invitationId}`),
  토큰조회: dynamic('/invitations/{id}'),
  토큰수락: (token: string) => api(`/invitations/${token}/accept`),
} as const;

// ── Household Kind Definition ──
export const HOUSEHOLD_KIND_ENDPOINTS = {
  목록_및_저장: api('/household-kind-definitions'),
} as const;
