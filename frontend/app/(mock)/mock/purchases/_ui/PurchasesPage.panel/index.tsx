"use client";

import {
  appViewPresenceSoftTransition,
  appViewPresenceSoftVariants,
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { AppLoadingState } from "@/app/_ui/app-loading-state";
import { AnimatePresence, motion } from "framer-motion";
import { usePurchases } from "../../_hooks/usePurchases";
import { PurchaseLotsSection } from "../PurchaseLots.section";

export function PurchasesPanel() {
  const { loading, error, dataMode } = usePurchases();

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="purchases-loading"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center px-2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
          <AppLoadingState message="구매 데이터를 불러오는 중…" layout="standalone" />
        </motion.div>
      ) : error ? (
        <motion.div
          key="purchases-error"
          role="alert"
          className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceSoftVariants}
          transition={appViewPresenceSoftTransition}
        >
          <p className="text-sm text-rose-400">{error}</p>
        </motion.div>
      ) : (
        <motion.div
          key="purchases-main"
          className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 pb-16"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-semibold text-white">구매·로트</h1>
            <p className="mt-1 text-sm text-zinc-500">
              <span className="text-zinc-400">
                장만 하고 아직 어디 칸에 둘지 정리 전일 때
              </span>
              는 여기서 구매·유통기한 로트만 먼저 적어 두면 됩니다. 이미 칸에
              넣었다면{" "}
              <span className="text-zinc-400">메인</span>에서 방·보관 칸·물품을
              함께 등록하는 편이 한 번에 맞습니다. 데이터는 브라우저{" "}
              <span className="text-zinc-600">him-purchases</span>에 저장됩니다.
              API 연동 시 동일 필드를 서버 DTO에 매핑하면 됩니다.
              {dataMode === "mock" ? (
                <>
                  {" "}
                  <span className="text-teal-500/80">
                    `/mock`에서는 로컬에 거점·구매가 없을 때 대시보드와 같은
                    거점 시드·예시 구매 로트를 보여 줍니다.
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <PurchaseLotsSection />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
