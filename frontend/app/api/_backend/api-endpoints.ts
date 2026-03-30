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

// ── Category ──
export const CATEGORY_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/categories`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/categories/${id}`),
  복사: (householdId: string) =>
    api(`/households/${householdId}/categories/copy`),
} as const;

// ── Room ──
export const ROOM_ENDPOINTS = {
  목록: (householdId: string) =>
    api(`/households/${householdId}/rooms`),
  동기화: (householdId: string) =>
    api(`/households/${householdId}/rooms/sync`),
} as const;

// ── House Structure ──
export const HOUSE_STRUCTURE_ENDPOINTS = {
  조회_및_저장: (householdId: string) =>
    api(`/households/${householdId}/house-structure`),
} as const;

// ── Furniture Placement ──
export const FURNITURE_PLACEMENT_ENDPOINTS = {
  목록_및_생성: (householdId: string, roomId: string) =>
    api(`/households/${householdId}/rooms/${roomId}/furniture-placements`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/furniture-placements/${id}`),
} as const;

// ── Storage Location ──
export const STORAGE_LOCATION_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/storage-locations`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/storage-locations/${id}`),
} as const;

// ── Unit ──
export const UNIT_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/units`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/units/${id}`),
  복사: (householdId: string) =>
    api(`/households/${householdId}/units/copy`),
} as const;

// ── Product ──
export const PRODUCT_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/products`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/products/${id}`),
  복사: (householdId: string) =>
    api(`/households/${householdId}/products/copy`),
} as const;

// ── Product Variant ──
export const PRODUCT_VARIANT_ENDPOINTS = {
  목록_및_생성: (householdId: string, productId: string) =>
    api(`/households/${householdId}/products/${productId}/variants`),
  단건: (householdId: string, productId: string, id: string) =>
    api(`/households/${householdId}/products/${productId}/variants/${id}`),
} as const;

// ── Inventory Item ──
export const INVENTORY_ITEM_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/inventory-items`),
  수량수정: (householdId: string, id: string) =>
    api(`/households/${householdId}/inventory-items/${id}/quantity`),
} as const;

// ── Purchase ──
export const PURCHASE_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/purchases`),
  재고연결: (householdId: string, id: string) =>
    api(`/households/${householdId}/purchases/${id}/link-inventory`),
} as const;

// ── Purchase Batch (Lot) ──
export const PURCHASE_BATCH_ENDPOINTS = {
  목록: (householdId: string) =>
    api(`/households/${householdId}/batches`),
  유통기한임박: (householdId: string) =>
    api(`/households/${householdId}/batches/expiring`),
  만료: (householdId: string) =>
    api(`/households/${householdId}/batches/expired`),
} as const;

// ── Inventory Log ──
export const INVENTORY_LOG_ENDPOINTS = {
  이력목록: (householdId: string, inventoryItemId: string) =>
    api(`/households/${householdId}/inventory-items/${inventoryItemId}/logs`),
  소비: (householdId: string, inventoryItemId: string) =>
    api(`/households/${householdId}/inventory-items/${inventoryItemId}/logs/consumption`),
  폐기: (householdId: string, inventoryItemId: string) =>
    api(`/households/${householdId}/inventory-items/${inventoryItemId}/logs/waste`),
  조정: (householdId: string, inventoryItemId: string) =>
    api(`/households/${householdId}/inventory-items/${inventoryItemId}/logs/adjustment`),
} as const;

// ── Shopping List Item ──
export const SHOPPING_LIST_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/shopping-list-items`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/shopping-list-items/${id}`),
  구매완료: (householdId: string, id: string) =>
    api(`/households/${householdId}/shopping-list-items/${id}/complete`),
} as const;

// ── Notification Preference ──
export const NOTIFICATION_PREFERENCE_ENDPOINTS = {
  목록_및_생성: api('/notification-preferences'),
  단건: dynamic('/notification-preferences/{id}'),
} as const;

// ── Notification ──
export const NOTIFICATION_ENDPOINTS = {
  목록: api('/notifications'),
  읽음: dynamic('/notifications/{id}/read'),
} as const;

// ── Expiration Alert Rule ──
export const EXPIRATION_ALERT_RULE_ENDPOINTS = {
  목록_및_생성: (householdId: string) =>
    api(`/households/${householdId}/expiration-alert-rules`),
  단건: (householdId: string, id: string) =>
    api(`/households/${householdId}/expiration-alert-rules/${id}`),
} as const;
