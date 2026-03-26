# 도메인·ERD 참조 (프론트엔드 설계용)

프론트에서 **화면 구조, API 연동, 타입 정의, React Query 키** 등을 잡을 때는 백엔드와 동일한 **최신 도메인 모델**을 기준으로 합니다.  
원본 문서는 모두 **저장소 루트 `docs/`** 에 있습니다.

## 읽는 순서 (권장)

1. **[ER 다이어그램·엔티티 목록](../../docs/er-diagram.md)** — 전체 그림과 엔티티 리스트
2. **[개념적 설계](../../docs/entity-conceptual-design.md)** — 엔티티 이름·속성(비즈니스 관점)
3. **[논리적 설계](../../docs/entity-logical-design.md)** — PK/FK·타입·제약·Mermaid 속성 요약(구현·폼 필드의 정본)

기능 단위로 볼 때는 **[기능 체크리스트](../../docs/feature-checklist.md)** 와 논리 설계를 같이 두고 보면 됩니다.

## 프론트 구현과 자주 맞닿는 부분

| 주제 | 문서 |
|------|------|
| 메인에서 재고 넣기 vs 구매·로트만 먼저 적기 | 프론트: [screens-overview.md](./screens-overview.md) 「재고·구매 등록」절 |
| 장보기 줄 = `categoryId` 필수, 품목/Variant/재고는 힌트 | 논리 설계 §16 `ShoppingListItem` |
| 알림 → 장보기 → 재고 등록 플로우 | 개념 설계 `ShoppingListItem`·메모, 논리 §16 |
| 집 구조 2D/3D·StorageLocation 연동 | 프론트: [house-structure-feature.md](./house-structure-feature.md) / 백엔드: [house-structure-3d-feature.md](../../docs/house-structure-3d-feature.md) |
| 확장 아이디어만 (Recipe, Brand 등) | [policy/considerations.md](../../docs/policy/considerations.md) |

## 모노레포·배포

- [monorepo-and-deployment.md](../../docs/monorepo-and-deployment.md)

---

문서가 갱신되면 **이 파일의 링크는 그대로** 두고, 내용은 루트 `docs/` 쪽이 항상 최신입니다.  
ERD를 바꾼 뒤에는 `er-diagram.md`와 `entity-logical-design.md`를 함께 수정하는지 확인하세요.
