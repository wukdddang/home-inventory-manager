import { AppShell } from "@/app/(current)/_ui/AppShell.component";

/** `/mock/settings` — AuthGuard 없음(비로그인 허용) */
export default function MockSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
