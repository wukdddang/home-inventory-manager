<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 도메인·ERD (Home Inventory)

화면·API·타입 설계 시 **최신 ERD·엔티티**는 [`docs/domain-data-model.md`](./docs/domain-data-model.md)를 보고, 링크된 루트 [`docs/`](../docs/) 문서를 따른다. (긴 스키마는 `AGENTS.md`가 아니라 공통 `docs/`에 둔다.)

페이지 단위 UI·상태는 [`.cursor/react-context-use-rule.mdc`](./.cursor/react-context-use-rule.mdc)에 맞춘다: `app/.../{페이지}/_context`, `_ui`(`*.panel` / `*.section` / `*.module` / `*.component`), `_hooks`, 공통 타입은 [`types/domain.ts`](./types/domain.ts).
