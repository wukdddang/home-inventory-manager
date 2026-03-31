# API 연결 현황 체크리스트

**최초 작성**: 2026-03-31
**기준**: feature-checklist.md v2.5

프론트엔드와 백엔드 API 연결 진행 상황을 추적합니다.
범례: ✅ 완료 | 🚧 프론트 UI 있음, API 미연결 | ⬜ UI 없음 (또는 개발 전)

---

## 인프라 / 공통

| 항목 | 상태 | 비고 |
|------|------|------|
| docker-compose PostgreSQL 구성 | ✅ | `him-postgres` 컨테이너, port 5432 |
| backend `.env` (JWT/Mail 시크릿) | ✅ | `backend/.env` 생성 |
| Next.js API 라우트 기반 구조 | ✅ | `app/api/_base/`, `app/api/_backend/` |
| accessToken 서버 메모리 캐시 | ✅ | `app/api/_base/index.ts` — Map 기반 |
| refreshToken httpOnly 쿠키 | ✅ | 쿠키명: `him_refresh_token` |
| 만료 60초 전 자동 토큰 갱신 | ✅ | `getAccessToken()` 내 자동 처리 |

---

## 사용자

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 회원가입 | `POST /api/auth/signup` | ✅ | 비밀번호 8자 이상 검증 포함 |
| 이메일 인증 요청 | — (백엔드 자동 발송) | ✅ | 가입 시 백엔드에서 메일 전송 |
| 이메일 인증 완료 | `GET /api/auth/verify-email` | ✅ | 토큰 쿼리 파라미터 |
| 로그인 | `POST /api/auth/login` | ✅ | 성공 시 토큰 캐시 + 쿠키 세팅 |
| 로그아웃 | `POST /api/auth/logout` | ✅ | 백엔드 차단 + 캐시 제거 + 쿠키 삭제 |
| 내 정보 조회 | `GET /api/auth/me` | ✅ | AuthGuard에서 마운트 시 호출 |
| 토큰 갱신 | `POST /api/auth/refresh` | ✅ | 자동 갱신 (클라이언트 직접 호출 없음) |
| 비밀번호 변경 | `PATCH /api/auth/password` | ✅ | 라우트 핸들러 존재, UI 연결 필요 확인 필요 |

---

## 거점

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 거점 목록 조회 | `GET /api/households` | ✅ | 멤버 목록도 병렬 fetch |
| 거점 생성 | `POST /api/households` | ✅ | `거점을_추가_한다` async 처리 |
| 거점 정보 수정 | `PUT /api/households/[id]` | ✅ | `거점_기본정보를_수정_한다` |
| 거점 삭제 | `DELETE /api/households/[id]` | ✅ | `거점을_삭제_한다` async |
| 거점 멤버 목록 조회 | `GET /api/households/[id]/members` | ✅ | 거점 목록 fetch 시 포함 |
| 거점 멤버 역할 변경 | `PATCH /api/households/[id]/members/[mid]/role` | ✅ | `멤버_역할을_변경_한다` |
| 거점 멤버 제거 | `DELETE /api/households/[id]/members/[mid]` | ✅ | `멤버를_제거_한다` |

---

## 거점 초대

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 초대 링크 생성 | `POST /api/households/[id]/invitations` | ✅ | `초대를_생성_한다` |
| 이메일 초대 전송 | `POST /api/households/[id]/invitations` | ✅ | `inviteeEmail` 파라미터 포함 |
| 초대 목록 조회 | `GET /api/households/[id]/invitations` | ✅ | `초대_목록을_불러온다` |
| 초대 취소(revoke) | `DELETE /api/households/[id]/invitations/[iid]` | ✅ | `초대를_취소_한다` |
| 초대 링크 수락 | `POST /api/invitations/[token]/accept` | ✅ | 라우트 핸들러 존재, 수락 UI 미구현 |
| 초대 토큰 조회 | `GET /api/invitations/[token]` | ✅ | 라우트 핸들러 존재 |

---

## 거점 유형 정의

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 거점 유형 목록 조회 | `GET /api/household-kind-definitions` | ✅ | 백엔드 실패 시 localStorage 폴백 |
| 거점 유형 저장 (추가/수정/삭제/정렬) | `PUT /api/household-kind-definitions` | ✅ | `거점_유형_정의를_교체_한다` |

---

## 카테고리

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 카테고리 목록 조회 | `GET /api/households/[id]/categories` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 카테고리 단건 조회 | `GET /api/households/[id]/categories/[cid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 카테고리 생성 | `POST /api/households/[id]/categories` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 카테고리 수정 | `PUT /api/households/[id]/categories/[cid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 카테고리 삭제 | `DELETE /api/households/[id]/categories/[cid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 다른 거점 카테고리 가져오기 | `POST /api/households/[id]/categories/copy` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 방 / 집 구조

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 방 목록 조회 | `GET /api/households/[id]/rooms` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 방 동기화 | `PUT /api/households/[id]/rooms/sync` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 집 구조 조회 | `GET /api/households/[id]/house-structure` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 집 구조 저장 | `PUT /api/households/[id]/house-structure` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 가구 배치

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 가구 목록 조회 | `GET /api/households/[id]/rooms/[rid]/furniture-placements` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 가구 생성 | `POST /api/households/[id]/rooms/[rid]/furniture-placements` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 가구 수정 | `PUT /api/households/[id]/furniture-placements/[fid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 가구 삭제 | `DELETE /api/households/[id]/furniture-placements/[fid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 보관 장소

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 보관장소 목록 조회 | `GET /api/households/[id]/storage-locations` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 보관장소 생성 | `POST /api/households/[id]/storage-locations` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 보관장소 수정 | `PUT /api/households/[id]/storage-locations/[sid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 보관장소 삭제 | `DELETE /api/households/[id]/storage-locations/[sid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 단위

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 단위 목록 조회 | `GET /api/households/[id]/units` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 단위 단건 조회 | `GET /api/households/[id]/units/[uid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 단위 생성 | `POST /api/households/[id]/units` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 단위 수정 | `PUT /api/households/[id]/units/[uid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 단위 삭제 | `DELETE /api/households/[id]/units/[uid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 다른 거점 단위 가져오기 | `POST /api/households/[id]/units/copy` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 상품 / 상품 용량·변형

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 상품 목록 조회 | `GET /api/households/[id]/products` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 단건 조회 | `GET /api/households/[id]/products/[pid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 생성 | `POST /api/households/[id]/products` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 수정 | `PUT /api/households/[id]/products/[pid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 삭제 | `DELETE /api/households/[id]/products/[pid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 다른 거점 상품 가져오기 | `POST /api/households/[id]/products/copy` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 변형 목록 조회 | `GET /api/households/[id]/products/[pid]/variants` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 변형 단건 조회 | `GET /api/households/[id]/products/[pid]/variants/[vid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 변형 생성 | `POST /api/households/[id]/products/[pid]/variants` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 변형 수정 | `PUT /api/households/[id]/products/[pid]/variants/[vid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 상품 변형 삭제 | `DELETE /api/households/[id]/products/[pid]/variants/[vid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 재고 품목

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 재고 품목 목록 조회 | `GET /api/households/[id]/inventory-items` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 재고 품목 등록 | `POST /api/households/[id]/inventory-items` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 재고 수량 수정 | `PATCH /api/households/[id]/inventory-items/[iid]/quantity` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 구매 기록

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 구매 목록 조회 | `GET /api/households/[id]/purchases` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 구매 등록 (로트 포함) | `POST /api/households/[id]/purchases` | ✅ | batches 배열로 유통기한 로트 입력, 재고 자동 증가 포함 |
| 재고 나중에 연결 | `PATCH /api/households/[id]/purchases/[pid]/link-inventory` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 로트

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 로트 목록 조회 | `GET /api/households/[id]/batches` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 유통기한 임박 목록 | `GET /api/households/[id]/batches/expiring` | ✅ | `days` 쿼리 파라미터 지원 |
| 만료된 목록 | `GET /api/households/[id]/batches/expired` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 재고 변경 이력

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 재고 변경 이력 조회 | `GET /api/households/[id]/inventory-items/[iid]/logs` | 🚧 | 라우트 핸들러 파일 없음 |
| 소비 기록 등록 | `POST /api/households/[id]/inventory-items/[iid]/logs/consumption` | 🚧 | 라우트 핸들러 파일 없음 |
| 폐기 기록 등록 | `POST /api/households/[id]/inventory-items/[iid]/logs/waste` | 🚧 | 라우트 핸들러 파일 없음 |
| 수량 수동 조정 | `POST /api/households/[id]/inventory-items/[iid]/logs/adjustment` | 🚧 | 라우트 핸들러 파일 없음 |

---

## 장보기 항목

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 장보기 항목 목록 조회 | `GET /api/households/[id]/shopping-list-items` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 장보기 항목 추가 | `POST /api/households/[id]/shopping-list-items` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 장보기 항목 수정 | `PUT /api/households/[id]/shopping-list-items/[sid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 장보기 항목 삭제 | `DELETE /api/households/[id]/shopping-list-items/[sid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 장보기 항목 구매 완료 처리 | `POST /api/households/[id]/shopping-list-items/[sid]/complete` | ✅ | 트랜잭션 포함 |
| 부족 품목 자동 제안 | — | ✅ | 프론트에서 재고 API 응답값 기준으로 토스트/모달 처리 (별도 API 불필요) |
| 유통기한 임박 품목 자동 제안 | — | ✅ | 프론트에서 배치 API 응답값 기준으로 토스트/모달 처리 (별도 API 불필요) |

---

## 알림 설정

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 알림 설정 목록 조회 | `GET /api/notification-preferences` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 알림 설정 저장 | `POST /api/notification-preferences` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 알림 설정 수정 | `PUT /api/notification-preferences/[id]` | ✅ | 마스터 토글 포함 |
| 알림 설정 삭제 | `DELETE /api/notification-preferences/[id]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 알림

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 유통기한 임박 알림 (스케줄러) | — | ⬜ | 백엔드 스케줄러 미구현 |
| 부족 재고 알림 (스케줄러) | — | ⬜ | 백엔드 스케줄러 미구현 |
| 알림 목록 조회 | `GET /api/notifications` | ✅ | `householdId` 쿼리 파라미터 지원 |
| 알림 읽음 처리 | `PATCH /api/notifications/[id]/read` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 만료 알림 설정

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 만료 알림 규칙 목록 조회 | `GET /api/households/[id]/expiration-alert-rules` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 만료 알림 규칙 저장 | `POST /api/households/[id]/expiration-alert-rules` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 만료 알림 규칙 수정 | `PUT /api/households/[id]/expiration-alert-rules/[rid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |
| 만료 알림 규칙 삭제 | `DELETE /api/households/[id]/expiration-alert-rules/[rid]` | ✅ | 라우트 핸들러 + 서비스 연결 완료 |

---

## 연결 제외 (P3)

| 기능 | 상태 | 비고 |
|------|------|------|
| 태그 CRUD / 상품 태그 | ⬜ | 1차 개발 범위 외 |
| 리포트 설정 CRUD | ⬜ | 1차 개발 범위 외 |

---

## 미연결 기능 요약

### 🚧 라우트 핸들러 없음 (구현 필요)

| 섹션 | 기능 | 필요한 라우트 |
|------|------|--------------|
| 재고 변경 이력 | 이력 조회 | `GET /api/households/[id]/inventory-items/[iid]/logs` |
| 재고 변경 이력 | 소비 기록 등록 | `POST .../logs/consumption` |
| 재고 변경 이력 | 폐기 기록 등록 | `POST .../logs/waste` |
| 재고 변경 이력 | 수량 수동 조정 | `POST .../logs/adjustment` |

### ⬜ 백엔드 미구현 (스케줄러)

| 섹션 | 기능 |
|------|------|
| 알림 | 유통기한 임박 알림 스케줄러 |
| 알림 | 부족 재고 알림 스케줄러 |

---

## 다음 연결 우선순위 (권장)

1. **재고 변경 이력** — 라우트 핸들러 4개 신규 생성 필요 (소비/폐기/조정/조회)
2. **알림 스케줄러** — 백엔드 구현 필요
3. **초대 수락 UI** — 초대 링크 수락 페이지 미구현

---

*본 문서는 API 연결 작업 진행에 따라 수동으로 업데이트합니다.*
