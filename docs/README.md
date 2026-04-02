# 공통 문서 (`docs/`)

백엔드·프론트엔드가 **같이 참조하는** 도메인·배포·정책 문서를 둡니다.

## 설계 (`design/`)

| 문서 | 설명 |
|------|------|
| [er-diagram.md](./design/er-diagram.md) | 엔티티 목록·관계 요약·Mermaid ER 개념도 |
| [entity-conceptual-design.md](./design/entity-conceptual-design.md) | 개념적 설계 — 엔티티·속성(타입·PK 미포함) |
| [entity-logical-design.md](./design/entity-logical-design.md) | 논리적 설계 — PK/FK·타입·제약·Mermaid 속성 요약 |
| [v1/](./design/v1/) | 설계 v1 원본 보존 |
| [v2/](./design/v2/) | 설계 v2 (프론트 피드백 반영) |

## 기능 (`feature/`)

| 문서 | 설명 |
|------|------|
| [feature-checklist.md](./feature/feature-checklist.md) | 기능 체크리스트(ERD와 동기화) |
| [house-structure-3d-feature.md](./feature/house-structure-3d-feature.md) | 집 구조도 백엔드 명세(HouseStructure·API) |

## 정합성 (`alignment/`)

| 문서 | 설명 |
|------|------|
| [frontend-backend-alignment.md](./alignment/frontend-backend-alignment.md) | 프론트-백엔드 정합성 정리 및 백엔드 할 일 |
| [backend-dev-review.md](./alignment/backend-dev-review.md) | 백엔드 개발 전 검토 사항 (스키마 누락·불일치 12건) |
| [CHANGELOG.md](./alignment/CHANGELOG.md) | alignment 문서 버전별 변경 내역 |

## 인프라 (`infra/`)

| 문서 | 설명 |
|------|------|
| [monorepo-and-deployment.md](./infra/monorepo-and-deployment.md) | 모노레포·배포 가이드 |

## 추가 예정 (`upcoming/`)

| 문서 | 설명 |
|------|------|
| [entity-conceptual-design.md](./upcoming/entity-conceptual-design.md) | 가계부·투자 포트폴리오 개념적 설계 — 엔티티·속성 |
| [entity-logical-design.md](./upcoming/entity-logical-design.md) | 가계부·투자 포트폴리오 논리적 설계 — PK/FK·타입·제약 |
| [reference.md](./upcoming/reference.md) | 참고 내용 (실시간 협업, 자산 API, 스케줄링, 감사 로그 등) |

## 정책 (`policy/`)

| 문서 | 설명 |
|------|------|
| [considerations.md](./policy/considerations.md) | 추가 기능 후보 |
| [ledger-and-subscription.md](./policy/ledger-and-subscription.md) | 가계부·구독 범위 외 안내 |

---

**프론트엔드**에서 화면·타입·쿼리를 설계할 때는 [frontend/docs/domain-data-model.md](../frontend/docs/domain-data-model.md)를 먼저 보고, 위 문서로 링크 이동하면 됩니다.

**백엔드** 개발 진입점: [backend/README.md](../backend/README.md).
