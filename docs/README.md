# 공통 문서 (`docs/`)

백엔드·프론트엔드가 **같이 참조하는** 도메인·배포·정책 문서를 둡니다.

| 문서 | 설명 |
|------|------|
| [er-diagram.md](./er-diagram.md) | 엔티티 목록·관계 요약·Mermaid ER 개념도 |
| [entity-conceptual-design.md](./entity-conceptual-design.md) | 개념적 설계 — 엔티티·속성(타입·PK 미포함) |
| [entity-logical-design.md](./entity-logical-design.md) | 논리적 설계 — PK/FK·타입·제약·Mermaid 속성 요약 |
| [feature-checklist.md](./feature-checklist.md) | 기능 체크리스트(ERD와 동기화) |
| [house-structure-3d-feature.md](./house-structure-3d-feature.md) | 집 구조도 백엔드 명세(HouseStructure·API) |
| [monorepo-and-deployment.md](./monorepo-and-deployment.md) | 모노레포·배포 가이드 |
| [policy/considerations.md](./policy/considerations.md) | 추가 기능 후보 |
| [policy/ledger-and-subscription.md](./policy/ledger-and-subscription.md) | 가계부·구독 범위 외 안내 |

**프론트엔드**에서 화면·타입·쿼리를 설계할 때는 [frontend/docs/domain-data-model.md](../frontend/docs/domain-data-model.md)를 먼저 보고, 위 문서로 링크 이동하면 됩니다.

**백엔드** 개발 진입점: [backend/README.md](../backend/README.md).
