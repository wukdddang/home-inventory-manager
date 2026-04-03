# 확장 도메인 — 참고 내용

**버전**: v1.1 — 가전 관리·집안일·식단 도메인 추가 (2026-04-03)

**관련 문서**:
- [개념적 설계](./entity-conceptual-design.md)
- [논리적 설계](./entity-logical-design.md)
- [집비치기 기능 체크리스트](../feature/feature-checklist.md)

---

> **가전/설비 관리**는 `docs/design/v2/` (v2.7) + `docs/feature/feature-checklist.md`로 이동했습니다.

## 목차

1. [프로젝트 구조 — 모듈 배치 계획](#1-프로젝트-구조--모듈-배치-계획)
2. [실시간 협업 — 그룹 가계부](#2-실시간-협업--그룹-가계부)
3. [자산 시세 API — 투자 포트폴리오](#3-자산-시세-api--투자-포트폴리오)
4. [알림 시스템](#4-알림-시스템)
5. [정기 거래 스케줄링](#5-정기-거래-스케줄링)
6. [감사 로그와 롤백](#6-감사-로그와-롤백)
7. [집안일 관리 — 구현 참고](#7-집안일-관리--구현-참고)
8. [식단/레시피 관리 — 구현 참고](#8-식단레시피-관리--구현-참고)
9. [통합 스케줄링 — recurrenceRule 공유](#9-통합-스케줄링--recurrencerule-공유)
10. [향후 확장 후보](#10-향후-확장-후보)

---

## 1. 프로젝트 구조 — 모듈 배치 계획

모듈러 모놀리스 구조를 유지하며, 기존 집비치기 백엔드에 가계부 도메인을 추가한다.

```
backend/src/
├── domain/
│   ├── user/                          # 기존 (공유)
│   ├── household/                     # 기존
│   ├── ...                            # 기존 재고 도메인
│   ├── ledger/                        # 신규 — 가계부
│   ├── ledger-member/                 # 신규
│   ├── ledger-invitation/             # 신규
│   ├── transaction-category/          # 신규
│   ├── transaction/                   # 신규
│   ├── recurring-transaction/         # 신규
│   ├── portfolio/                     # 신규 — 투자 포트폴리오
│   ├── portfolio-member/              # 신규
│   ├── portfolio-invitation/          # 신규
│   ├── asset/                         # 신규
│   ├── asset-price-cache/             # 신규
│   ├── portfolio-holding/             # 신규
│   ├── portfolio-transaction/         # 신규
│   ├── audit-log/                     # 신규 — 공용 감사 로그
│   ├── appliance/                     # 신규 — 가전/설비 (v2.7, design/v2 소속)
│   ├── maintenance-schedule/          # 신규 (v2.7)
│   ├── maintenance-log/              # 신규 (v2.7)
│   ├── chore/                         # 신규 — 집안일
│   ├── chore-assignment/              # 신규
│   ├── chore-log/                     # 신규
│   ├── recipe/                        # 신규 — 식단/레시피
│   ├── recipe-ingredient/             # 신규
│   ├── meal-plan/                     # 신규
│   └── meal-plan-entry/               # 신규
├── context/
│   ├── ledger-context/                # 가계부 CQRS 핸들러
│   ├── portfolio-context/             # 포트폴리오 CQRS 핸들러
│   ├── appliance-context/             # 가전 관리 CQRS 핸들러 (v2.7)
│   ├── chore-context/                 # 집안일 CQRS 핸들러
│   ├── meal-context/                  # 식단/레시피 CQRS 핸들러
│   └── ...
├── business/
│   ├── ledger-business/
│   ├── portfolio-business/
│   ├── appliance-business/            # (v2.7)
│   ├── chore-business/
│   ├── meal-business/
│   └── ...
├── interface/
│   ├── ledger/                        # /api/ledgers/**
│   ├── portfolio/                     # /api/portfolios/**
│   ├── appliance/                     # /api/appliances/** (v2.7)
│   ├── chore/                         # /api/chores/**
│   ├── meal/                          # /api/meals/** (recipe, meal-plan)
│   └── ...
└── common/
    ├── gateway/                       # 신규 — WebSocket 게이트웨이
    └── ...
```

> 기존 4계층 아키텍처(Interface → Business → Context → Domain)와 CQRS 패턴을 그대로 따른다.

---

## 2. 실시간 협업 — 그룹 가계부

### 요구사항

- 그룹 가계부에서 한 멤버가 거래를 추가/수정/삭제하면 다른 멤버 화면에 즉시 반영
- 과금 없이 자체 구현 가능해야 함

### 라이브러리/기술 비교

#### 자체 구현 가능 (무료·오픈소스)

| 기술 | 설명 | 장단점 |
|------|------|--------|
| **NestJS WebSocket Gateway + Socket.IO** | NestJS 내장 WebSocket 지원, Socket.IO 어댑터 | **추천**. 추가 인프라 불필요, NestJS 생태계 내 자연스러운 통합. Room 기반으로 가계부별 채널 분리 용이 |
| **ws (raw WebSocket)** | 경량 WebSocket 라이브러리 | Socket.IO보다 가볍지만 재연결·Room 등 직접 구현 필요 |
| **Yjs + y-websocket** | CRDT 기반 실시간 협업 | 텍스트/문서 동시 편집에 최적화. 구조화된 데이터(거래 목록 CRUD)에는 오버스펙 |
| **Automerge** | CRDT 라이브러리 | Yjs와 유사. 문서 협업용, 가계부에는 과도 |
| **ShareDB** | Operational Transform 기반 | 역시 문서 협업용. 구조화된 데이터에는 부적합 |

#### 유료/과금 모델 (참고용)

| 서비스 | 과금 | 비고 |
|--------|------|------|
| **Liveblocks** | 무료 티어 제한적, 이후 유료 | React 친화적이지만 벤더 종속 |
| **Ably** | 연결 수 기반 과금 | Pub/Sub 특화, 자체 호스팅 불가 |
| **Pusher** | 연결 수 기반 과금 | 간편하지만 자체 호스팅 불가 |
| **Supabase Realtime** | Supabase 종속 | PostgreSQL 변경 감지 기반, 단독 사용 불가 |
| **Firebase Realtime DB** | Google Cloud 종속 | NoSQL 기반, 기존 PostgreSQL과 이중 관리 필요 |

### 권장 구현 방식

**NestJS WebSocket Gateway + Socket.IO** — 추가 비용 없이 기존 NestJS 프로젝트에 자연스럽게 통합.

```
[Browser A] ←→ [Socket.IO] ←→ [NestJS Gateway] ←→ [Browser B]
                                      ↕
                               [PostgreSQL]
```

**구현 흐름**:
1. 그룹 가계부 접속 시 Socket.IO room 가입 (`ledger:{ledgerId}`)
2. 거래 CRUD API 호출 → DB 반영 → 같은 room의 다른 클라이언트에 이벤트 브로드캐스트
3. 클라이언트는 이벤트 수신 시 로컬 상태 갱신 (React Query invalidation 또는 직접 업데이트)

**필요 패키지**:
```bash
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
# 프론트엔드
pnpm add socket.io-client
```

**스케일 아웃 시**: Redis Adapter(`@socket.io/redis-adapter`)로 다중 서버 간 이벤트 공유 가능.

> CRDT(Yjs, Automerge)는 텍스트 동시 편집 문제를 해결하기 위한 기술이다. 가계부는 "거래 목록에 대한 CRUD"이므로 충돌 해결보다는 **이벤트 브로드캐스트** 방식이 적합하다. 두 사용자가 동시에 같은 거래를 수정하는 경우는 last-write-wins 또는 낙관적 잠금(optimistic locking, `version` 컬럼)으로 처리하면 충분하다.

---

## 3. 자산 시세 API — 투자 포트폴리오

### 요구사항

- ETF, 코인, 주식, 리츠 등 **전세계 모든 자산** 정보 조회
- 심볼 검색, 현재가, 일일 변동률

### API 비교

#### 무료/프리미엄 (추천 조합)

| API | 커버리지 | 무료 한도 | 비고 |
|-----|---------|----------|------|
| **Yahoo Finance (비공식)** | 주식, ETF, 리츠, 지수 — 전세계 | 비공식 API, 제한 없으나 불안정 가능 | `yahoo-finance2` npm 패키지. 한국 주식(005930.KS) 포함 |
| **CoinGecko** | 암호화폐 전체 | 무료: 30 calls/min | 코인 시세 최적. 무료 티어 충분 |
| **Alpha Vantage** | 주식, ETF, 외환, 코인 | 무료: 25 calls/day | 무료 한도 매우 적음. 보조용 |
| **Finnhub** | 미국 주식, ETF, 코인, 외환 | 무료: 60 calls/min | 미국 시장 중심, 한국 주식 미지원 |
| **Twelve Data** | 주식, ETF, 외환, 코인 | 무료: 800 calls/day, 8/min | 한국 주식 일부 지원 |
| **KRX 공공데이터** | 한국 주식, ETF, 리츠 | 무료 | 공공데이터포털 OpenAPI. 한국 시장 정본 |

#### 유료 (참고)

| API | 특징 | 비용 |
|-----|------|------|
| **Polygon.io** | 미국 주식 실시간 | $29/월~ |
| **IEX Cloud** | 미국 주식 | $9/월~ |
| **Bloomberg API** | 전세계 전체 | 기업용, 매우 고가 |

### 권장 구현 전략

**멀티 소스 + 캐시 계층**:

```
[사용자 요청]
    ↓
[AssetPriceCache 조회] → 캐시 유효 → 즉시 반환
    ↓ (캐시 만료)
[Asset.assetType에 따라 API 라우팅]
    ├── crypto → CoinGecko API
    ├── stock/etf/reit (KR) → KRX 공공데이터 또는 Yahoo Finance
    └── stock/etf/reit (해외) → Yahoo Finance
    ↓
[AssetPriceCache 갱신] → 반환
```

**캐시 TTL 기준**:

| 자산 유형 | TTL | 근거 |
|-----------|-----|------|
| 코인 | 5분 | 24시간 거래, 변동성 높음 |
| 주식/ETF (장중) | 15분 | 지연 시세 기준 |
| 주식/ETF (장외) | 1시간 | 변동 없음 |
| 리츠/펀드 | 1시간 | 변동성 낮음 |

**심볼 검색**: Yahoo Finance의 `search` 엔드포인트로 통합 검색 → 결과를 Asset 테이블에 캐싱.

**필요 패키지**:
```bash
pnpm add yahoo-finance2   # 주식/ETF/리츠
# CoinGecko, KRX는 REST API 직접 호출 (axios/fetch)
```

---

## 4. 알림 시스템

기존 집비치기의 `Notification` + `NotificationPreference` 엔티티를 재활용한다.

### 가계부 알림 유형

| type | 트리거 | 대상 |
|------|--------|------|
| `ledger_transaction_created` | 그룹 가계부에 거래 추가 | 작성자 제외 그룹 멤버 전원 |
| `ledger_transaction_updated` | 그룹 가계부 거래 수정 | 작성자 제외 그룹 멤버 전원 |
| `ledger_transaction_deleted` | 그룹 가계부 거래 삭제 | 작성자 제외 그룹 멤버 전원 |
| `ledger_member_joined` | 새 멤버 가입 | 기존 그룹 멤버 전원 |
| `ledger_admin_transferred` | 관리자 양도 | 그룹 멤버 전원 |
| `ledger_rollback` | 관리자가 작업 롤백 | 원래 작업 수행자 |
| `recurring_transaction_executed` | 정기 거래 자동 실행 | 가계부 소유자 (또는 그룹 멤버 전원) |

### 가전 관리 알림 유형 (v2.7 — `docs/feature/feature-checklist.md` 참조)

| type | 트리거 | 대상 |
|------|--------|------|
| `warranty_expiring_soon` | 보증 만료 30일/7일 전 | 가구 관리자 |
| `warranty_expired` | 보증 만료일 도래 | 가구 관리자 |
| `maintenance_due` | 유지보수 예정일 도래 | 가구 멤버 전원 |
| `maintenance_overdue` | 유지보수 예정일 초과 | 가구 관리자 |

### 집안일 알림 유형

| type | 트리거 | 대상 |
|------|--------|------|
| `chore_due` | 가사 예정일 도래 | 할당된 담당자 |
| `chore_overdue` | 가사 예정일 초과 (미완료) | 할당된 담당자 |
| `chore_completed` | 다른 구성원이 가사 완료 | 할당된 다른 담당자 |

> WebSocket이 연결된 상태면 실시간 푸시, 아니면 기존 Notification 테이블에 저장 후 다음 접속 시 표시.

---

## 5. 정기 거래 스케줄링

### 구현 방식

`@nestjs/schedule`의 `@Cron` 데코레이터를 활용하여 매일 자정(또는 설정 시각)에 실행.

```typescript
@Cron('0 0 * * *') // 매일 00:00
async 정기_거래를_실행한다() {
  // 1. nextOccurrenceAt <= today && isActive === true 인 RecurringTransaction 조회
  // 2. 각각에 대해 Transaction 자동 생성
  // 3. nextOccurrenceAt을 recurrenceRule에 따라 다음 날짜로 갱신
  // 4. endDate가 지난 경우 isActive = false 처리
}
```

### 다음 발생일 계산 로직

```
frequency=daily, interval=N    → 현재일 + N일
frequency=weekly, interval=N   → 현재일 + (N × 7)일, dayOfWeek 맞춤
frequency=monthly, interval=N  → 현재월 + N월, dayOfMonth 맞춤 (말일 초과 시 말일)
frequency=yearly, interval=N   → 현재년 + N년, monthOfYear + dayOfMonth 맞춤
```

> 월말 처리: dayOfMonth=31인데 해당 월이 30일까지면 30일로 조정 (예: 2월 → 28일/29일).

---

## 6. 감사 로그와 롤백

### 기록 시점

모든 그룹 가계부/포트폴리오의 CRUD 작업에 대해 AuditLog를 자동 기록한다.

**기록 방식**: Context 계층의 Command Handler에서 비즈니스 로직 실행 후 AuditLog 저장.

```
[Command Handler]
  1. 엔티티 변경 전 상태 조회 (update/delete 시) → beforeSnapshot
  2. 엔티티 변경 실행
  3. 변경 후 상태 → afterSnapshot
  4. AuditLog 저장 (같은 트랜잭션 내)
```

### 롤백 흐름

```
[관리자 → 롤백 요청]
  1. AuditLog 조회 (id로)
  2. beforeSnapshot 기반으로 엔티티 복원
     - create 작업의 롤백 → 해당 엔티티 삭제
     - update 작업의 롤백 → beforeSnapshot으로 덮어쓰기
     - delete 작업의 롤백 → beforeSnapshot으로 재생성
  3. 원본 AuditLog의 isRolledBack = true 갱신
  4. 롤백 작업 자체를 새 AuditLog로 기록
```

> 롤백 제한: 이미 롤백된 로그는 재롤백 불가. 연쇄 의존 관계(예: 삭제된 카테고리에 속한 거래)는 경고 후 사용자 확인.

---

## 7. 집안일 관리 — 구현 참고

### 가사 스케줄링

RecurringTransaction과 동일한 패턴:

```typescript
@Cron('0 0 * * *') // 매일 00:00
async 가사_예정을_확인한다() {
  // 1. nextOccurrenceAt <= today && isActive인 Chore 조회
  // 2. ChoreAssignment에 할당된 HouseholdMember에게 chore_due 알림
  // 3. ChoreLog 생성(완료) 시 nextOccurrenceAt을 recurrenceRule에 따라 갱신
}
```

### 소모품 연동 (향후 확장)

가사 완료 시 관련 소모품 재고 차감을 연동할 수 있다:
- Chore에 `relatedInventoryItemIds` JSONB 필드 추가
- ChoreLog 생성 시 해당 InventoryItem의 수량 자동 차감
- 현재 설계에서는 포함하지 않으나, 필드 추가만으로 확장 가능

---

## 8. 식단/레시피 관리 — 구현 참고

### 재고 연동 — 장보기 목록 자동 생성

MealPlan 확정 시 필요 재료를 자동 산출하여 장보기 목록에 추가하는 흐름:

```
[MealPlan 확정]
    ↓
[MealPlanEntry별 Recipe 조회]
    ↓
[RecipeIngredient에서 총 필요 재료 집계 (servings 비율 적용)]
    ↓
[productId가 있는 재료 → InventoryItem 재고 비교]
    ↓
[부족분 → ShoppingListItem 자동 생성]
```

> 현재는 설계만 수립. 실제 구현은 재고 시스템 연동 이후.

### 레시피 공유 (향후 확장)

- 현재: Household 스코프 (가구 내에서만 사용)
- 향후: 공개 레시피 마켓플레이스 또는 레시피 복사(import) 기능 검토 가능

---

## 9. 통합 스케줄링 — recurrenceRule 공유

아래 도메인들이 동일한 `recurrenceRule` JSONB 구조를 사용한다:

| 도메인 | 엔티티 | 용도 |
|--------|--------|------|
| 가계부 | RecurringTransaction | 정기 거래 자동 생성 |
| 가전 관리 | MaintenanceSchedule (v2.7) | 유지보수 알림 |
| 집안일 | Chore | 가사 알림 |

**공통 스케줄러 설계**:

기존 `@nestjs/schedule` 기반으로, 각 도메인의 스케줄링 로직을 개별 서비스로 분리하되 `recurrenceRule` 파싱·다음 발생일 계산 로직은 `common/` 유틸로 공유한다.

```
backend/src/common/
├── util/
│   └── recurrence.util.ts   # 다음 발생일 계산, 반복 규칙 파싱
└── scheduler/
    └── daily-scheduler.service.ts  # 매일 실행, 각 도메인 서비스 호출
```

---

## 10. 향후 확장 후보

아래 항목은 현재 설계 범위에 포함하지 않으나, 추후 필요 시 추가 가능한 기능이다.

| 항목 | 설명 | 관련 엔티티 영향 |
|------|------|-----------------|
| 예산 관리 (Budget) | 월별·카테고리별 예산 설정 및 초과 알림 | Budget 신규 엔티티 |
| 거래 태그 | 거래에 복수 태그 부여 (예: #여행, #선물) | Tag, TransactionTag 신규 |
| 거래 첨부파일 | 영수증 사진 등 파일 첨부 | TransactionAttachment 신규, S3 연동 |
| 자산 가격 이력 | 과거 시세 저장 및 차트 | AssetPriceHistory 신규 |
| 포트폴리오 수익률 분석 | 기간별 수익률, 벤치마크 대비 | 계산 로직 추가 (엔티티 변경 없음) |
| 가계부-재고 연동 | 재고 구매 시 자동으로 가계부 지출 등록 | Transaction.refType/refId 추가 |
| 환율 관리 | 다중 통화 지원 시 환율 변환 | ExchangeRate 신규 |
| 공유 카테고리 템플릿 | 사전 정의 카테고리 세트 제공 | CategoryTemplate 신규 |
| 가사-소모품 연동 | 가사 완료 시 소모품 재고 자동 차감 | Chore에 relatedInventoryItemIds 추가 |
| 식단-장보기 자동 생성 | MealPlan 확정 시 부족 재료 → ShoppingListItem 자동 생성 | 로직 추가 (엔티티 변경 없음) |
| 레시피 공유 마켓 | 공개 레시피 검색·복사 | RecipeVisibility 필드 추가 또는 PublicRecipe 신규 |
| 가전-가계부 연동 | MaintenanceLog 비용 → 가계부 지출 자동 등록 | Transaction.refType/refId 활용 |
| IoT 디바이스 연동 | Appliance에 IoT 센서 매핑, 실시간 데이터 수집 | DeviceSensor 신규, MQTT 연동 |

---

## 부록: 기술 스택 요약

| 영역 | 기술 | 비고 |
|------|------|------|
| 실시간 | NestJS WebSocket Gateway + Socket.IO | 자체 구현, 무료 |
| 주식/ETF 시세 | yahoo-finance2 (npm) | 비공식이나 안정적, 전세계 지원 |
| 한국 주식 시세 | KRX 공공데이터 OpenAPI | 공식, 무료 |
| 코인 시세 | CoinGecko API | 무료 30 calls/min |
| 정기 실행 | @nestjs/schedule (기존 설치됨) | Cron 기반 |
| 알림 | 기존 Notification 시스템 재활용 | WebSocket + DB 알림 병행 |
| 감사 로그 | AuditLog + JSONB 스냅샷 | 롤백 기능 포함 |
| 반복 규칙 | recurrenceRule JSONB 공유 유틸 | 가계부·가전·집안일 공용 |
| 보증 알림 | @nestjs/schedule + Notification | 30일/7일 전 + 만료일 |
