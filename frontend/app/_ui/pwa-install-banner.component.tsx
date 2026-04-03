"use client";

import { usePwaInstall } from "@/hooks/usePwa";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";

export function PwaInstallBanner() {
  const { state, 설치를_요청한다, 나중에_설치한다 } = usePwaInstall();

  if (state !== "installable") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-16 z-50 mx-auto w-[calc(100%-2rem)] max-w-md"
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/40">
          {/* 상단 틸 그라데이션 바 */}
          <div className="h-1 bg-linear-to-r from-teal-500 via-teal-400 to-emerald-500" />

          <div className="flex items-start gap-3 p-4">
            {/* 아이콘 */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15">
              <Download className="size-5 text-teal-400" />
            </div>

            {/* 텍스트 */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">
                집비치기 앱 설치
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                홈 화면에 추가하면 더 빠르고 편리하게 이용할 수 있어요.
              </p>

              {/* 버튼 */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={설치를_요청한다}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-500 active:bg-teal-700"
                >
                  <Download className="size-3.5" />
                  설치하기
                </button>
                <button
                  type="button"
                  onClick={나중에_설치한다}
                  className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                  나중에
                </button>
              </div>
            </div>

            {/* 닫기 */}
            <button
              type="button"
              onClick={나중에_설치한다}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="닫기"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
