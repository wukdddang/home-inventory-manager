import type { Transition, Variants } from "framer-motion";

const easeOutSoft: [number, number, number, number] = [0.22, 1, 0.36, 1];
const easeStandard: [number, number, number, number] = [0.4, 0, 0.2, 1];

/**
 * 로딩 ↔ 본문 전환 — opacity는 짧게 먼저 읽히게, y는 살짝 길게
 * (같은 duration에 묶이면 페이드가 덜 보일 때가 있어 분리)
 */
export const appViewPresenceTransition: Transition = {
  opacity: {
    duration: 0.28,
    ease: easeStandard,
  },
  y: {
    duration: 0.38,
    ease: easeOutSoft,
  },
};

/** 오류·가드 등 부드러운 전환 — y는 작게, opacity는 동일하게 */
export const appViewPresenceSoftTransition: Transition = {
  opacity: {
    duration: 0.26,
    ease: easeStandard,
  },
  y: {
    duration: 0.32,
    ease: easeOutSoft,
  },
};

export const appViewPresenceVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const appViewPresenceSoftVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};
