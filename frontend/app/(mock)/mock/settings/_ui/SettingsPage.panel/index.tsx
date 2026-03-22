"use client";

import { CatalogSettingsSection } from "../CatalogSettings.section";
import { HouseholdKindsSettingsSection } from "../HouseholdKindsSettings.section";
import { GroupSettingsSection } from "../GroupSettings.section";
import { NotificationSettingsSection } from "../NotificationSettings.section";
import { PasswordSettingsSection } from "../PasswordSettings.section";
import { useSettings } from "../../_hooks/useSettings";

export function SettingsPanel() {
  const { settings, loading, error } = useSettings();

  if (loading && !settings) {
    return <p className="text-sm text-zinc-500">설정을 불러오는 중…</p>;
  }

  if (error && !settings) {
    return (
      <p className="text-sm text-rose-400" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-white">사용자 설정</h1>
        <p className="mt-1 text-sm text-zinc-500">
          HouseholdMember·알림 정책 등은 API 연동 후 서버와 동기화합니다.
        </p>
      </div>
      <CatalogSettingsSection />
      <HouseholdKindsSettingsSection />
      <GroupSettingsSection />
      <PasswordSettingsSection />
      <NotificationSettingsSection />
    </div>
  );
}
