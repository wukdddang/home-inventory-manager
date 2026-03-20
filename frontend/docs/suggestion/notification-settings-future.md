# 알림·설정 기능 제안 (백로그)

논리 설계(`docs/entity-logical-design.md`)와 현재 모의 설정 화면을 기준으로, 이후에 넣으면 좋은 확장 아이디어입니다.

## 1. 만료 알림 — 복수 임계일

**현재 ERD**: `ExpirationAlertRule`은 `(productId, householdId)` 또는 `(productId, userId)`당 **최대 1건**, `daysBefore`는 단일 정수.

**제안**: “7일 전 + 1일 전”처럼 두 번 알리려면 다음 중 하나가 필요합니다.

- `ExpirationAlertRule`에 `daysBefore` 배열 또는 자식 테이블 `ExpirationAlertThreshold(ruleId, daysBefore)`  
- 또는 규칙 행을 여러 개 허용하되 유니크 키를 `(productId, householdId, daysBefore)`로 변경

## 2. 조용한 시간 · 요약 다이제스트

푸시 정책에 **야간 묵음**, **하루 한 번 묶음 알림**이 있으면 거주 패턴이 다른 가구에 유리합니다.  
엔티티 §17에는 `channel`이 없으므로, 확장 시 `User` 또는 별도 `NotificationPreference`에 `quietHours`, `digestMode` 등을 두는 방안을 검토할 수 있습니다.

## 3. 채널 (이메일·웹훅)

문서상 기본은 모바일 푸시만 가정. 데스크톱·이메일을 쓰려면 `Notification` 또는 사용자 설정에 채널 필드가 필요합니다.

## 4. 품목별 규칙 UI

설정 페이지의 “기본 N일 전”은 템플릿일 뿐이므로, **상품 마스터·재고 상세**에서 `ExpirationAlertRule`을 편집하는 전용 UI가 있으면 운영이 수월합니다.

## 5. 장보기 알림 ↔ `refType` / `refId`

알림에서 장보기 줄로 점프하려면 §17의 `refType`, `refId`에 `ShoppingListItem` 등을 일관되게 넣는 규칙을 API 스펙에 명시하는 것이 좋습니다.

## 6. 가족 단위 “알림 받는 사람”

`Notification`은 `userId` 단위입니다. 같은 가족 규칙으로 발생한 이벤트를 **누구에게** 보낼지(HouseholdMember 전원 vs 담당자만)는 별도 정책·테이블이 없으므로, 필요 시 “알림 구독” 연관 테이블을 검토합니다.
