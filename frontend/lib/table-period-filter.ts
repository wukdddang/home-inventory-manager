/**
 * 테이블 기간(시작일~종료일) 필터 — 재고 이력(ISO 시각), 구매 로트(YYYY-MM-DD) 공통.
 */

/** ISO 시각을 달력 기준 YYYY-MM-DD(로컬)로 만든다 */
export function iso를_날짜키로_만든다(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** `start`·`end`는 HTML date input 값(YYYY-MM-DD). 둘 다 비어 있으면 항상 통과 */
export function 날짜키가_기간에_포함되는가(
  dateKey: string,
  start: string,
  end: string,
): boolean {
  if (!start && !end) return true;
  if (!dateKey) return false;
  let lo = start;
  let hi = end;
  if (start && end && start > end) {
    lo = end;
    hi = start;
  }
  if (lo && dateKey < lo) return false;
  if (hi && dateKey > hi) return false;
  return true;
}
