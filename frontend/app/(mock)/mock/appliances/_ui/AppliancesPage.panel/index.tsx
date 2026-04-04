"use client";

import {
  appViewPresenceSoftTransition,
  appViewPresenceSoftVariants,
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { AppLoadingState } from "@/app/_ui/app-loading-state";
import { AnimatePresence, motion } from "framer-motion";
import { useAppliances } from "../../_hooks/useAppliances";
import { ApplianceListSection } from "../ApplianceList.section";
import { ApplianceDetailSection } from "../ApplianceDetail.section";

export function AppliancesPanel() {
  const { loading, error, selectedAppliance, dataMode } = useAppliances();

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="appliances-loading"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center px-2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
          <AppLoadingState message="가전 데이터를 불러오는 중…" layout="standalone" />
        </motion.div>
      ) : error ? (
        <motion.div
          key="appliances-error"
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
          key="appliances-main"
          className="flex min-h-0 w-full min-w-0 max-w-none flex-1 flex-col gap-6 overflow-hidden pb-16"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-semibold text-white">가전·설비</h1>
            <p className="mt-1 text-sm text-zinc-400">
              가전·설비의 보증, 유지보수 스케줄, A/S 이력을 관리합니다.
              {dataMode === "mock" ? (
                <span className="text-teal-500/80">
                  {" "}`/mock`에서는 예시 가전 데이터를 보여 줍니다.
                </span>
              ) : null}
            </p>
          </div>

          {selectedAppliance ? (
            <ApplianceDetailSection />
          ) : (
            <ApplianceListSection />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
