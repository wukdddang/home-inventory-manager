"use client";

import { AppLoadingState } from "@/app/_ui/app-loading-state";
import {
  appViewPresenceSoftTransition,
  appViewPresenceSoftVariants,
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { AnimatePresence, motion } from "framer-motion";
import { CatalogSettingsSection } from "../CatalogSettings.section";
import { HouseholdKindsSettingsSection } from "../HouseholdKindsSettings.section";
import { GroupSettingsSection } from "../GroupSettings.section";
import { NotificationSettingsSection } from "../NotificationSettings.section";
import { PasswordSettingsSection } from "../PasswordSettings.section";
import { useSettings } from "../../_hooks/useSettings";

export function SettingsPanel() {
  const { settings, loading, error } = useSettings();

  return (
    <AnimatePresence mode="wait">
      {loading && !settings ? (
        <motion.div
          key="settings-loading"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center px-2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
          <AppLoadingState message="설정을 불러오는 중…" layout="standalone" />
        </motion.div>
      ) : error && !settings ? (
        <motion.div
          key="settings-error"
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
          key="settings-main"
          className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8 pb-16"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
      <div className="min-w-0 shrink-0">
        <h1 className="text-2xl font-semibold text-white">사용자 설정</h1>
        <p className="mt-1 text-sm text-zinc-500">
          HouseholdMember·알림 정책 등은 API 연동 후 서버와 동기화합니다.
        </p>
      </div>

      {/*
        모바일: 1열 순서대로 스크롤
        lg+: 좌(카탈로그·거점·그룹) / 우(계정·알림) — 대시보드 2컬럼과 비슷한 리듬
      */}
      <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-x-0 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-8 lg:border-r lg:border-zinc-800/70 lg:pr-8">
          <CatalogSettingsSection />
          <HouseholdKindsSettingsSection />
          <GroupSettingsSection />
        </div>
        <div className="min-w-0 space-y-8 lg:pl-8">
          <PasswordSettingsSection />
          <NotificationSettingsSection />
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
