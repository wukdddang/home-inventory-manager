# 모바일/태블릿 UI 개발 계획

> **버전**: v1.0
> **작성일**: 2026-03-29
> **상태**: 계획 단계

---

## 1. 목표

데스크탑 전용으로 구현된 mock 화면을 기반으로, 모바일/태블릿에서도 웹 앱으로 동작하는 UI를 구축한다.

**핵심 원칙:**
- 모바일/태블릿은 **소비 중심 인터페이스** — 클릭만으로 완료되는 단순 동작에 집중
- 복잡한 입력(구조 편집, 카탈로그 관리, 구매 기록 등)은 데스크탑에서 수행
- FCM 토큰 등록으로 푸시 알림 수신 가능

---

## 2. 폴더 구조 전략

### 선택: 동일 라우트 + 반응형 컴포넌트 분기

별도 라우트 그룹(`app/(mobile)/`)을 만들지 않고, **기존 라우트 내에서 디바이스별 레이아웃을 분기**한다.

**이유:**
- URL 통일 — 같은 URL을 모바일에서 열어도 적절한 UI가 렌더링됨
- Context, hooks, mock 데이터를 공유하여 코드 중복 최소화
- Next.js 라우트 그룹은 레이아웃 분리용이지 디바이스 분리용이 아님

### 디렉토리 구조

```
frontend/
├── app/
│   ├── _ui/
│   │   ├── mobile/                          # 모바일/태블릿 공통 UI 컴포넌트
│   │   │   ├── MobileShell.component.tsx    # 모바일 앱 쉘 (하단 탭 내비게이션)
│   │   │   ├── MobileHeader.component.tsx   # 간결한 상단 헤더
│   │   │   ├── BottomNav.component.tsx      # 하단 탭 바
│   │   │   ├── QuickActionSheet.component.tsx  # 바텀 시트 (사용/폐기 등)
│   │   │   ├── SwipeableCard.component.tsx  # 스와이프 동작 카드
│   │   │   └── PullToRefresh.component.tsx  # 당겨서 새로고침
│   │   └── ... (기존 공유 컴포넌트)
│   │
│   ├── (mock)/mock/
│   │   ├── dashboard/
│   │   │   ├── _ui/
│   │   │   │   ├── DashboardPage.panel/         # 기존 데스크탑 레이아웃
│   │   │   │   └── DashboardMobile.panel/       # 모바일/태블릿 레이아웃
│   │   │   │       ├── index.tsx
│   │   │   │       ├── InventoryCardList.section.tsx   # 카드형 재고 목록
│   │   │   │       ├── QuickActions.section.tsx        # 빠른 동작 버튼
│   │   │   │       └── ExpiryAlerts.section.tsx        # 유통기한 임박 알림
│   │   │   └── page.tsx                         # 디바이스 분기 렌더링
│   │   │
│   │   ├── inventory-history/
│   │   │   └── _ui/
│   │   │       └── InventoryHistoryMobile.panel/  # 모바일 이력 뷰
│   │   │
│   │   └── settings/
│   │       └── _ui/
│   │           └── SettingsMobile.panel/          # 모바일 설정 (알림, FCM)
│   │
│   └── (current)/
│       └── ... (동일 구조로 확장 예정)
│
├── hooks/
│   └── useDeviceLayout.ts          # 디바이스 타입 감지 훅
│
└── lib/
    └── fcm.ts                      # FCM 토큰 등록/관리 유틸
```

### 디바이스 분기 패턴

```tsx
// page.tsx 예시
'use client';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { DashboardPage } from './_ui/DashboardPage.panel';
import { DashboardMobile } from './_ui/DashboardMobile.panel';

export default function Page() {
  const { isMobile } = useDeviceLayout();
  return isMobile ? <DashboardMobile /> : <DashboardPage />;
}
```

```tsx
// hooks/useDeviceLayout.ts
// - CSS 미디어 쿼리 기반 (matchMedia)
// - breakpoint: 1024px 미만 = 모바일/태블릿
// - SSR 시 기본값: desktop (hydration mismatch 방지)
// - 태블릿(768px~1024px)과 모바일(~768px) 추가 분기 가능
```

---

## 3. 모바일/태블릿 화면 명세

### 3.1 모바일 앱 쉘 (MobileShell)

| 요소 | 설명 |
|------|------|
| 상단 헤더 | 가구 이름 + 알림 아이콘(뱃지) + 가구 전환 드롭다운 |
| 하단 탭 바 | 홈(재고), 이력, 설정 (3탭) |
| 알림 센터 | 헤더 알림 아이콘 탭 → 슬라이드 다운 패널 |

구매(`/purchases`)는 데스크탑 전용이므로 모바일 탭에 포함하지 않는다.

### 3.2 대시보드 (홈 탭)

**모바일에서 지원하는 동작:**

| 동작 | UI 패턴 | 설명 |
|------|---------|------|
| 재고 목록 조회 | 카드 리스트 | 방/수납별 그룹핑, 검색 필터 |
| 재고 사용 (소비) | 스와이프 좌 → "사용" 버튼 | 수량 -1 (길게 누르면 수량 선택) |
| 재고 폐기 | 스와이프 좌 → "폐기" 버튼 | 수량 입력 후 폐기 처리 |
| 유통기한 임박 확인 | 상단 알림 카드 | 임박/만료 항목 하이라이트 |
| 장보기 목록 확인 | 플로팅 버튼 → 바텀시트 | 장보기 항목 체크 |
| 장보기 완료 처리 | 체크박스 탭 | 항목별 완료 표시 |
| 재고 상세 조회 | 카드 탭 | 로트/배치, 수납 위치, 최근 이력 |

**모바일에서 지원하지 않는 동작 (데스크탑 유도):**

| 동작 | 모바일 표시 |
|------|-------------|
| 방/가구/수납 구조 편집 | "데스크탑에서 편집하세요" 안내 |
| 재고 신규 등록 | 미노출 |
| 카탈로그(제품/카테고리/단위) 관리 | 미노출 |
| 구매 기록 등록 | 미노출 (탭 자체 없음) |
| 가구 구조 다이어그램 | 미노출 |

### 3.3 재고 이력 (이력 탭)

| 요소 | 설명 |
|------|------|
| 타임라인 뷰 | 날짜별 그룹핑된 세로 타임라인 |
| 필터 | 기간(오늘/이번주/이번달), 유형(입고/소비/폐기) |
| 카드 형태 | 항목명, 수량 변화, 시간, 유형 뱃지 |

데스크탑의 테이블 형태 대신 **타임라인 카드 형태**로 표시한다.

### 3.4 설정 (설정 탭)

**모바일에서 접근 가능한 설정:**

| 항목 | 설명 |
|------|------|
| 알림 설정 | 푸시 알림 on/off, 유통기한/장보기/재고부족 토글 |
| FCM 토큰 등록 | 알림 권한 요청 → 토큰 등록 |
| 계정 정보 | 이름, 이메일 (읽기 전용) |
| 가구 전환 | 소속 가구 목록에서 선택 |
| 로그아웃 | 로그아웃 버튼 |

**모바일에서 접근 불가 (데스크탑 유도):**

| 항목 | 사유 |
|------|------|
| 카탈로그 관리 | 복잡한 CRUD |
| 가구 종류 정의 관리 | 복잡한 입력 |
| 멤버 초대/역할 변경 | 민감 동작 |
| 비밀번호 변경 | 보안상 데스크탑 권장 |

---

## 4. FCM 푸시 알림

### 4.1 구현 흐름

```
[모바일 브라우저]
  1. 설정 화면에서 "알림 받기" 토글 ON
  2. 브라우저 Notification 권한 요청
  3. Firebase SDK → FCM 토큰 발급
  4. 토큰을 백엔드 API로 전송 (POST /api/users/me/fcm-tokens)
  5. 백엔드에서 토큰 저장
  6. 이벤트 발생 시 백엔드 → FCM → 디바이스 푸시 알림
```

### 4.2 필요 파일

| 파일 | 설명 |
|------|------|
| `public/firebase-messaging-sw.js` | Service Worker (백그라운드 알림 수신) |
| `lib/firebase.ts` | Firebase 앱 초기화 |
| `lib/fcm.ts` | FCM 토큰 발급/등록/갱신 로직 |
| `hooks/useFcmToken.ts` | FCM 토큰 관리 훅 |
| `hooks/usePushNotification.ts` | 포그라운드 알림 표시 훅 |

### 4.3 Mock 단계 구현

백엔드가 없으므로 mock 단계에서는:
- FCM 토큰 발급까지만 실제 동작 (Firebase 프로젝트 필요)
- 토큰 등록 API 호출은 `console.log`로 대체
- 알림 수신 테스트는 Firebase Console에서 수동 전송으로 확인
- 또는 FCM 없이 **브라우저 Notification API mock**으로 UI만 구현

---

## 5. PWA 설정 (선택)

모바일 웹 앱 경험을 높이기 위해 PWA 설정을 권장한다.

| 항목 | 설명 |
|------|------|
| `manifest.json` | 앱 이름, 아이콘, 테마 색상, `display: standalone` |
| Service Worker | FCM 수신 + 오프라인 기본 페이지 |
| 메타 태그 | `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">` |
| 홈 화면 추가 | 안내 배너 표시 (선택) |

---

## 6. 기술 스택 추가 사항

| 항목 | 라이브러리/기술 | 용도 |
|------|----------------|------|
| 스와이프 제스처 | framer-motion (기존) | 카드 스와이프, 바텀시트 드래그 |
| 바텀 시트 | framer-motion `AnimatePresence` + `useDragControls` | 장보기 목록, 빠른 동작 |
| 풀 투 리프레시 | 커스텀 구현 (touch events) | 재고 목록 새로고침 |
| 햅틱 피드백 | `navigator.vibrate()` | 사용/폐기 확인 시 진동 |
| FCM | `firebase` SDK | 푸시 알림 |

기존에 사용 중인 framer-motion으로 대부분의 모바일 인터랙션을 구현할 수 있다.

---

## 7. 구현 순서

### Phase 1: 기반 구축
1. `useDeviceLayout` 훅 구현
2. `MobileShell` (하단 탭 내비게이션) 구현
3. 기존 `page.tsx`에 디바이스 분기 로직 추가
4. 모바일 공통 컴포넌트 (`SwipeableCard`, `QuickActionSheet`, `BottomNav`)

### Phase 2: 핵심 화면
5. 대시보드 모바일 — 재고 카드 리스트 + 검색/필터
6. 대시보드 모바일 — 사용/폐기 스와이프 동작
7. 대시보드 모바일 — 유통기한 임박 알림 카드
8. 대시보드 모바일 — 장보기 목록 바텀시트

### Phase 3: 보조 화면
9. 재고 이력 모바일 — 타임라인 카드 뷰
10. 설정 모바일 — 알림 토글, 계정 정보, 로그아웃

### Phase 4: 알림
11. FCM 설정 (Firebase 프로젝트, Service Worker)
12. FCM 토큰 등록 UI + 훅
13. 포그라운드 알림 표시
14. (백엔드 연동 후) 실제 푸시 알림 테스트

### Phase 5: 마무리
15. PWA manifest + 메타 태그
16. 디바이스별 QA 및 반응형 미세 조정
17. "데스크탑에서 편집하세요" 안내 UI

---

## 8. Mock 데이터 전략

기존 mock 데스크탑 환경과 **동일한 mock 데이터 소스를 공유**한다.

- `sessionStorage` 기반 mock 데이터 (기존 방식 유지)
- 모바일 컴포넌트도 동일한 Context/Service를 통해 데이터 접근
- 사용/폐기 동작 시 `sessionStorage` 업데이트 → UI 반영
- 별도의 mock 데이터 생성 불필요

---

## 9. 디자인 가이드라인

### 색상/테마
기존 다크 테마(zinc-950 배경, teal 액센트) 그대로 유지

### 타이포그래피
- 모바일 기본 폰트 사이즈: `16px` (iOS 줌 방지)
- 카드 제목: `text-base font-medium`
- 카드 부제: `text-sm text-zinc-400`
- 뱃지/라벨: `text-xs`

### 터치 타겟
- 최소 터치 영역: `44px × 44px` (Apple HIG 기준)
- 버튼 패딩: `py-3 px-4` 이상
- 리스트 항목 높이: `min-h-[3.5rem]`

### 간격
- 카드 간 간격: `gap-3`
- 섹션 간 간격: `gap-6`
- 화면 좌우 패딩: `px-4`

### 애니메이션
- 스와이프: `spring` (stiffness: 300, damping: 30)
- 바텀시트: `tween` (duration: 0.25s)
- 페이지 전환: 기존 `app-view-transition` 활용
