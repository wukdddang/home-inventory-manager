# 가계부·구독 — 범위 안내

> **2026-04-02 업데이트**: 가계부·투자 포트폴리오 도메인이 본 프로젝트 범위에 포함되었습니다. 모듈러 모놀리스 구조로 기존 재고 관리와 동일 백엔드에 통합합니다.

- **개념적 설계**: [docs/upcoming/entity-conceptual-design.md](../upcoming/entity-conceptual-design.md)
- **논리적 설계**: [docs/upcoming/entity-logical-design.md](../upcoming/entity-logical-design.md)
- **참고 내용**: [docs/upcoming/reference.md](../upcoming/reference.md)

## 포함 범위

- 개인/그룹 가계부 (수입·지출 관리)
- 정기 거래 (구독 결제, 급여, 배당금 등 반복 항목)
- 개인/그룹 투자 포트폴리오 (주식, ETF, 코인, 리츠 등)
- 그룹 실시간 협업 (가계부)
- 감사 로그 및 롤백

## 미포함 (향후 확장 후보)

- 예산 관리 (Budget)
- 가계부-재고 자동 연동
- 환율 관리

---

기존에 본 문서에 정리했던 엔티티(Account, AccountTransaction, RecurringIncome 등)는 새 설계로 대체되었습니다. 이전 상세 정리가 필요하면 git 히스토리에서 확인할 수 있습니다.
