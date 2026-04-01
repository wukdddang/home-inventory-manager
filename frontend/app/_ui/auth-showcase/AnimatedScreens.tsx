"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── 1) 집 구조도 미니 화면 (실제 스크린샷 · 느린 자동 스크롤) ── */
function HouseStructureScreen() {
  return (
    <div className="relative flex h-full w-full flex-col p-2">
      <p className="mb-2 shrink-0 text-[10px] font-semibold text-teal-300">
        2D 집 구조도
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        className="relative min-h-0 flex-1 overflow-hidden rounded-lg"
      >
        <motion.img
          src="/showcase-structure.png"
          alt="집 구조도 예시 — 방, 직속 보관 장소, 가구 연결 구조"
          className="w-full object-cover object-left-top"
          draggable={false}
          initial={{ y: "0%" }}
          animate={{ y: "-25%" }}
          transition={{
            y: {
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.6,
            },
          }}
        />
        {/* 상·하단 그라데이션 페이드 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/50 to-transparent" />
      </motion.div>
    </div>
  );
}

/* ── 2) 재고 테이블 미니 화면 ── */
function InventoryTableScreen() {
  const rows = [
    { name: "우유 1L", loc: "냉장고", qty: 2, exp: "04/05", delay: 0.15 },
    { name: "계란 30구", loc: "냉장고", qty: 1, exp: "04/12", delay: 0.25 },
    { name: "식용유", loc: "싱크대 하단", qty: 1, exp: "06/30", delay: 0.35 },
    { name: "세제", loc: "욕실 선반", qty: 3, exp: "—", delay: 0.45 },
    { name: "휴지 12롤", loc: "창고", qty: 1, exp: "—", delay: 0.55 },
    { name: "샴푸 500ml", loc: "욕실 선반", qty: 2, exp: "—", delay: 0.65 },
    { name: "식빵", loc: "냉장고", qty: 1, exp: "04/03", delay: 0.75 },
    { name: "바나나", loc: "주방 선반", qty: 3, exp: "04/04", delay: 0.85 },
    { name: "참치캔", loc: "싱크대 하단", qty: 5, exp: "12/25", delay: 0.95 },
    { name: "물티슈", loc: "거실 서랍", qty: 2, exp: "—", delay: 1.05 },
    { name: "커피 원두", loc: "주방 선반", qty: 1, exp: "08/15", delay: 1.15 },
  ];

  return (
    <div className="flex h-full w-full flex-col p-2">
      <p className="mb-2 shrink-0 text-[10px] font-semibold text-teal-300">
        재고 스프레드시트
      </p>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10">
        {/* 헤더 */}
        <div className="grid shrink-0 grid-cols-4 gap-px border-b border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-semibold text-zinc-400">
          <span>품목</span>
          <span>위치</span>
          <span className="text-center">수량</span>
          <span className="text-right">유통기한</span>
        </div>
        {/* 행 */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map((r) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: r.delay, duration: 0.3 }}
              className="grid grid-cols-4 gap-px border-b border-white/5 px-2.5 py-1.5 text-[9px] text-zinc-300"
            >
              <span className="truncate font-medium text-white">{r.name}</span>
              <span className="truncate">{r.loc}</span>
              <span className="text-center">{r.qty}</span>
              <span className="text-right">{r.exp}</span>
            </motion.div>
          ))}
        </div>
        {/* 풋터 요약 */}
        <div className="shrink-0 border-t border-white/10 bg-white/5 px-2.5 py-1.5 text-[8px] text-zinc-500">
          총 {rows.length}건 · 유통기한 임박 <span className="text-amber-400">3건</span>
        </div>
      </div>
    </div>
  );
}

/* ── 3) 알림·장보기 미니 화면 ── */
function AlertsScreen() {
  const alerts = [
    {
      icon: "⏰",
      title: "우유 유통기한 임박",
      desc: "D-4 · 냉장고",
      sub: "4월 5일 만료 예정",
      color: "text-amber-300",
      border: "border-amber-500/20",
      delay: 0.15,
    },
    {
      icon: "⏰",
      title: "식빵 유통기한 임박",
      desc: "D-2 · 냉장고",
      sub: "4월 3일 만료 예정",
      color: "text-amber-300",
      border: "border-amber-500/20",
      delay: 0.3,
    },
    {
      icon: "🛒",
      title: "장보기 제안",
      desc: "계란, 식빵, 바나나 외 2건",
      sub: "최근 소비 패턴 기반 추천",
      color: "text-teal-300",
      border: "border-teal-500/20",
      delay: 0.45,
    },
    {
      icon: "📦",
      title: "재고 부족 알림",
      desc: "세제 · 현재 1개",
      sub: "평균 소비 주기: 2주",
      color: "text-rose-300",
      border: "border-rose-500/20",
      delay: 0.6,
    },
    {
      icon: "📦",
      title: "재고 부족 알림",
      desc: "커피 원두 · 현재 1개",
      sub: "평균 소비 주기: 3주",
      color: "text-rose-300",
      border: "border-rose-500/20",
      delay: 0.75,
    },
    {
      icon: "✅",
      title: "장보기 완료",
      desc: "4월 1일 구매 3건 등록됨",
      sub: "우유, 계란, 바나나",
      color: "text-emerald-300",
      border: "border-emerald-500/20",
      delay: 0.9,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col p-2">
      <p className="mb-2 shrink-0 text-[10px] font-semibold text-teal-300">
        알림 · 장보기 제안
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {alerts.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: a.delay, duration: 0.35, ease: "easeOut" }}
            className={`flex items-start gap-2.5 rounded-xl border ${a.border} bg-white/5 p-3 backdrop-blur-sm`}
          >
            <span className="mt-0.5 text-sm">{a.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-semibold ${a.color}`}>
                {a.title}
              </p>
              <p className="mt-0.5 text-[9px] text-zinc-300">{a.desc}</p>
              <p className="mt-0.5 text-[8px] text-zinc-500">{a.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 메인 순환 컴포넌트 ── */
const screens = [
  { key: "structure", label: "구조도", component: HouseStructureScreen },
  { key: "inventory", label: "재고표", component: InventoryTableScreen },
  { key: "alerts", label: "알림", component: AlertsScreen },
];

export function AnimatedScreens() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screens.length);
    }, 4500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(index);
      startTimer();
    },
    [startTimer],
  );

  const Screen = screens[current].component;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* 미니 모니터 프레임 */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
        {/* 탑 바 */}
        <div className="flex shrink-0 items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-[8px] text-zinc-500">
            집비치기 — {screens[current].label}
          </span>
        </div>
        {/* 스크린 영역 */}
        <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={screens[current].key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <Screen />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 인디케이터 + 라벨 */}
      <div className="flex items-center justify-center gap-3">
        {screens.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goTo(i)}
            className={`flex items-center gap-1.5 text-[10px] transition-colors ${
              i === current
                ? "text-teal-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span
              className={`inline-block h-1 rounded-full transition-all duration-300 ${
                i === current ? "w-4 bg-teal-400" : "w-1.5 bg-zinc-600"
              }`}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
